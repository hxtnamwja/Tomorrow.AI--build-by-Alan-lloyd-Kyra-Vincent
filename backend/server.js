
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { initDatabase, getDatabase } from './database.js';
import { setupWebSocket } from './websocket.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Import routes
import authRoutes from './routes/auth.js';
import demoRoutes from './routes/demos.js';
import communityRoutes from './routes/communities.js';
import categoryRoutes from './routes/categories.js';
import bountyRoutes from './routes/bounties.js';
import aiRoutes from './routes/ai.js';
import usersRoutes from './routes/users.js';
import publicationsRoutes from './routes/publications.js';
import feedbackRoutes from './routes/feedback.js';
import featuresRoutes from './routes/features.js';
import demoFeaturesRoutes from './routes/demoFeatures.js';
import announcementsRoutes from './routes/announcements.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database
initDatabase();

// 使用环境变量或默认路径，确保目录位置正确
// 使用 path.resolve 确保路径是绝对路径，避免跨系统路径分隔符问题
const projectsDir = process.env.PROJECTS_PATH 
  ? path.resolve(process.env.PROJECTS_PATH) 
  : path.resolve(__dirname, 'projects');
const uploadsDir = path.resolve(__dirname, 'uploads', 'temp');
const uploadsRootDir = path.resolve(__dirname, 'uploads');

console.log('[Server] Projects directory:', projectsDir);
console.log('[Server] Uploads directory:', uploadsRootDir);

// 确保projects目录存在 - 使用 recursive: true 确保跨平台兼容
try {
  if (!fs.existsSync(projectsDir)) {
    fs.mkdirSync(projectsDir, { recursive: true });
    console.log('[Server] Created projects directory:', projectsDir);
  }
} catch (err) {
  console.error('[Server] Failed to create projects directory:', err);
  process.exit(1);
}

// 确保uploads目录存在
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('[Server] Created uploads directory:', uploadsDir);
  }
} catch (err) {
  console.error('[Server] Failed to create uploads directory:', err);
}

// Middleware
app.use(cors({
  origin: true, // Allow all origins (reflects request origin)
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// 静态文件服务 - uploads目录
app.use('/uploads', express.static(uploadsRootDir, {
  setHeaders: (res, filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
      '.bmp': 'image/bmp',
      '.ico': 'image/x-icon',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
      '.eot': 'application/vnd.ms-fontobject',
      '.html': 'text/html',
      '.htm': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.zip': 'application/zip'
    };
    
    if (mimeTypes[ext]) {
      res.setHeader('Content-Type', mimeTypes[ext]);
    }
    
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
}));

// 静态文件服务 - 用于多文件项目的资源，自动注入TomorrowAI脚本
app.use('/projects', async (req, res, next) => {
  try {
    // URL解码路径，处理中文和特殊字符
    let requestedPath = req.path;
    try {
      requestedPath = decodeURIComponent(req.path);
    } catch (decodeErr) {
      console.error('[Projects] Failed to decode path:', req.path, decodeErr);
      return res.status(400).json({ code: 400, message: 'Invalid path encoding', data: null });
    }
    
    // 使用 path.resolve 和 path.normalize 确保路径安全
    const fullPath = path.resolve(projectsDir, requestedPath.replace(/^\//, ''));
    const ext = path.extname(fullPath).toLowerCase();
    
    // 安全检查：确保路径在 projectsDir 内
    if (!fullPath.startsWith(projectsDir)) {
      console.error('[Projects] Path traversal attempt:', requestedPath);
      return res.status(403).json({ code: 403, message: 'Access denied', data: null });
    }
    
    // 检查文件是否存在
    if (!fs.existsSync(fullPath)) {
      console.warn('[Projects] File not found:', fullPath);
      return res.status(404).json({ code: 404, message: 'File not found', data: null });
    }
    
    if (ext === '.html' || ext === '.htm') {
      try {
        let content = fs.readFileSync(fullPath, 'utf-8');
        
        // 从URL中提取demoId（路径格式: /projects/demo-xxx/index.html）
        const pathParts = requestedPath.split('/').filter(Boolean);
        let demoId = '';
        if (pathParts.length >= 1) {
          demoId = pathParts[0];
        }
        
        // 注入TomorrowAI脚本
        const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
        const apiBase = baseUrl + '/api/v1';
        const wsBase = baseUrl.replace('http', 'ws').replace('https', 'wss');
        
        const injectionScript = `
<script>
(function() {
  const API_BASE = '${apiBase}';
  const WS_BASE = '${wsBase}';
  
  window.TomorrowAI = {
    demoId: '${demoId}',
    apiBase: API_BASE,
    getToken: function() {
      return localStorage.getItem('sci_demo_token') || '';
    },
    storage: {
      set: async function(key, value) {
        try {
          const token = window.TomorrowAI.getToken();
          const response = await fetch(API_BASE + '/demo-features/' + window.TomorrowAI.demoId + '/data', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ key, value })
          });
          return await response.json();
        } catch (e) {
          console.warn('Failed to save data:', e);
        }
      },
      get: async function(key) {
        try {
          const token = window.TomorrowAI.getToken();
          const response = await fetch(API_BASE + '/demo-features/' + window.TomorrowAI.demoId + '/data/' + key, {
            headers: { 'Authorization': 'Bearer ' + token }
          });
          const result = await response.json();
          return result.data;
        } catch (e) {
          console.warn('Failed to get data:', e);
          return null;
        }
      },
      getAll: async function() {
        try {
          const token = window.TomorrowAI.getToken();
          const response = await fetch(API_BASE + '/demo-features/' + window.TomorrowAI.demoId + '/data', {
            headers: { 'Authorization': 'Bearer ' + token }
          });
          const result = await response.json();
          return result.data;
        } catch (e) {
          console.warn('Failed to get all data:', e);
          return {};
        }
      }
    },
    rooms: {
      list: async function() {
        try {
          const response = await fetch(API_BASE + '/demo-features/' + window.TomorrowAI.demoId + '/rooms');
          const result = await response.json();
          return result.data || [];
        } catch (e) {
          console.warn('Failed to list rooms:', e);
          return [];
        }
      },
      create: async function(title, maxPlayers) {
        try {
          const token = window.TomorrowAI.getToken();
          const response = await fetch(API_BASE + '/demo-features/' + window.TomorrowAI.demoId + '/rooms', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ title, maxPlayers: maxPlayers || 4 })
          });
          const result = await response.json();
          return result.data;
        } catch (e) {
          console.warn('Failed to create room:', e);
          return null;
        }
      },
      join: async function(roomId) {
        try {
          const token = window.TomorrowAI.getToken();
          await fetch(API_BASE + '/demo-features/' + window.TomorrowAI.demoId + '/rooms/' + roomId + '/join', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token }
          });
          return true;
        } catch (e) {
          console.warn('Failed to join room:', e);
          return false;
        }
      },
      leave: async function(roomId) {
        try {
          const token = window.TomorrowAI.getToken();
          await fetch(API_BASE + '/demo-features/' + window.TomorrowAI.demoId + '/rooms/' + roomId + '/leave', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token }
          });
          return true;
        } catch (e) {
          console.warn('Failed to leave room:', e);
          return false;
        }
      },
      sendMessage: async function(roomId, type, data) {
        try {
          const token = window.TomorrowAI.getToken();
          await fetch(API_BASE + '/demo-features/' + window.TomorrowAI.demoId + '/rooms/' + roomId + '/message', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ type, data })
          });
        } catch (e) {
          console.warn('Failed to send message:', e);
        }
      },
      getMessages: async function(roomId, since) {
        try {
          let url = API_BASE + '/demo-features/' + window.TomorrowAI.demoId + '/rooms/' + roomId + '/messages';
          if (since) {
            url += '?since=' + encodeURIComponent(since);
          }
          const response = await fetch(url);
          const result = await response.json();
          return result.data || [];
        } catch (e) {
          console.warn('Failed to get messages:', e);
          return [];
        }
      }
    },
    WebSocket: class {
      constructor(demoId, roomId, userId) {
        this.ws = null;
        this.demoId = demoId;
        this.roomId = roomId;
        this.userId = userId;
        this.onMessage = null;
        this.onUserJoined = null;
        this.onUserLeft = null;
        this.onConnected = null;
      }
      connect() {
        const wsUrl = WS_BASE + '/ws?demoId=' + this.demoId + '&roomId=' + this.roomId + '&userId=' + this.userId;
        this.ws = new WebSocket(wsUrl);
        const self = this;
        this.ws.onopen = function() {
          console.log('WebSocket connected');
          if (self.onConnected) self.onConnected();
        };
        this.ws.onmessage = function(event) {
          try {
            const msg = JSON.parse(event.data);
            switch(msg.type) {
              case 'connected':
                break;
              case 'broadcast':
                if (self.onMessage) self.onMessage(msg.data);
                break;
              case 'userJoined':
                if (self.onUserJoined) self.onUserJoined(msg);
                break;
              case 'userLeft':
                if (self.onUserLeft) self.onUserLeft(msg);
                break;
            }
          } catch (e) {
            console.error('WebSocket message error:', e);
          }
        };
        this.ws.onclose = function() {
          console.log('WebSocket disconnected');
        };
        this.ws.onerror = function(error) {
          console.error('WebSocket error:', error);
        };
      }
      send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'broadcast', data: data }));
        }
      }
      disconnect() {
        if (this.ws) {
          this.ws.close();
          this.ws = null;
        }
      }
    }
  };
})();
</script>
`;
        
        // 在</head>或</body>结束前注入
        const bodyEndIndex = content.lastIndexOf('</body>');
        if (bodyEndIndex !== -1) {
          content = content.slice(0, bodyEndIndex) + injectionScript + content.slice(bodyEndIndex);
        } else {
          const htmlEndIndex = content.lastIndexOf('</html>');
          if (htmlEndIndex !== -1) {
            content = content.slice(0, htmlEndIndex) + injectionScript + content.slice(htmlEndIndex);
          } else {
            content = content + injectionScript;
          }
        }
        
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Cache-Control', 'no-cache');
        res.send(content);
        return;
      } catch (htmlErr) {
        console.error('[Projects] Error processing HTML file:', htmlErr);
        return res.status(500).json({ code: 500, message: 'Error processing HTML file', data: null });
      }
    }
    
    // 对于非HTML文件，继续使用静态服务
    next();
  } catch (err) {
    console.error('[Projects] Middleware error:', err);
    return res.status(500).json({ code: 500, message: 'Internal server error', data: null });
  }
}, express.static(projectsDir, {
  setHeaders: (res, filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
      '.bmp': 'image/bmp',
      '.ico': 'image/x-icon',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
      '.eot': 'application/vnd.ms-fontobject',
      '.html': 'text/html',
      '.htm': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json'
    };
    
    if (mimeTypes[ext]) {
      res.setHeader('Content-Type', mimeTypes[ext]);
    }
    
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('X-Content-Type-Options', 'nosniff');
  },
  fallthrough: false
}));

// 安全中间件 - 防止路径遍历攻击
app.use('/projects', (req, res, next) => {
  // URL解码路径，处理中文和特殊字符
  const requestedPath = path.normalize(decodeURIComponent(req.path));
  
  // 确保路径不以..开头
  if (requestedPath.startsWith('..') || requestedPath.includes('/../')) {
    return res.status(403).json({ code: 403, message: '访问被拒绝', data: null });
  }
  
  const fullPath = path.join(projectsDir, requestedPath);
  
  // 确保请求的路径在projects目录内
  if (!fullPath.startsWith(projectsDir)) {
    return res.status(403).json({ code: 403, message: '访问被拒绝', data: null });
  }
  
  next();
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/demos', demoRoutes);
app.use('/api/v1/communities', communityRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/bounties', bountyRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/publications', publicationsRoutes);
app.use('/api/v1/feedback', feedbackRoutes);
app.use('/api/v1/features', featuresRoutes);
app.use('/api/v1/demo-features', demoFeaturesRoutes);
app.use('/api/v1/announcements', announcementsRoutes);

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.json({ code: 200, message: 'OK', data: { timestamp: Date.now() } });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    code: 500,
    message: 'Internal Server Error',
    data: null
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: 'Not Found',
    data: null
  });
});

const server = http.createServer(app);

// 初始化WebSocket
setupWebSocket(server);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║   🧪 Tomorrow Backend Server                           ║
║                                                        ║
║   Status: Running                                      ║
║   Port: ${PORT}                                          ║
║   API Base: http://0.0.0.0:${PORT}/api/v1                ║
║   WebSocket: ws://0.0.0.0:${PORT}/ws                    ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
  `);
});

