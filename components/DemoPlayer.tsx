import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, RefreshCw, Sparkles, Heart, Maximize2, Minimize2, Smartphone, Send, RotateCcw, Trash2, FolderOpen, AlertTriangle, Monitor, UserCircle, Trash, Award, BookOpen, FlaskConical, Beaker, Trophy, Edit3, Hash } from 'lucide-react';
import { motion } from 'framer-motion';
import { Demo, Category, Subject } from '../types';
import { AiService } from '../services/aiService';
import { DemosAPI } from '../services/apiService';
import { AIMessageContent } from './AIMessageContent';
import { calculateLevel, getLevelInfo, LEVEL_CONFIG, COMMON_TAGS, getTagColor, getTagName, isLevelAtLeast } from '../constants';
import { TagSelector } from './TagSelector';

// Level icon component
const LevelIcon = ({ iconKey, className, color }: { iconKey: string, className?: string, color?: string }) => {
  const iconProps = { className, color: color || undefined };
  
  switch (iconKey) {
    case 'book-open':
      return <BookOpen {...iconProps} />;
    case 'flask-conical':
      return <FlaskConical {...iconProps} />;
    case 'beaker':
      return <Beaker {...iconProps} />;
    case 'award':
      return <Award {...iconProps} />;
    case 'trophy':
      return <Trophy {...iconProps} />;
    default:
      return <BookOpen {...iconProps} />;
  }
};

const CATEGORY_ID_TO_SUBJECT: Record<string, string> = {
  'cat-physics': Subject.Physics,
  'cat-chemistry': Subject.Chemistry,
  'cat-mathematics': Subject.Mathematics,
  'cat-biology': Subject.Biology,
  'cat-computer-science': Subject.ComputerScience,
  'cat-astronomy': Subject.Astronomy,
  'cat-earth-science': Subject.EarthScience,
  'cat-creative-tools': Subject.CreativeTools
};

const CATEGORY_ID_TO_TRANSLATION_KEY: Record<string, string> = {
  'cat-physics': 'physics',
  'cat-chemistry': 'chemistry',
  'cat-mathematics': 'mathematics',
  'cat-biology': 'biology',
  'cat-computer-science': 'computerScience',
  'cat-astronomy': 'astronomy',
  'cat-earth-science': 'earthScience',
  'cat-creative-tools': 'creativeTools'
};

export const DemoPlayer = ({ demo, currentUserId, currentUser, onClose, t, onOpenDemo, onLikeChange, onViewUserProfile, allUsers, onPublishToOther, onReportDemo, currentUserRole, categories }: { demo: Demo, currentUserId?: string, currentUser?: any, onClose: () => void, t: any, onOpenDemo?: (demoId: string) => void, onLikeChange?: (demoId: string, likeCount: number, userLiked: boolean) => void, onViewUserProfile?: (userId: string) => void, allUsers?: any[], onPublishToOther?: () => void, onReportDemo?: () => void, currentUserRole?: 'user' | 'general_admin', categories?: Category[] }) => {
  const [activeTab, setActiveTab] = useState<'basicInfo' | 'code' | 'ai'>('basicInfo');
  const [iframeKey, setIframeKey] = useState(0);
  const [aiMessages, setAiMessages] = useState<{role: 'user' | 'model', text: string}[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [codeViewMode, setCodeViewMode] = useState<'modified' | 'original'>('modified');
  const [comments, setComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commentActionLoading, setCommentActionLoading] = useState(false);

  // Check if this is a multi-file project
  const isMultiFile = demo.projectType === 'multi-file';
  
  // Build preview URL for multi-file projects
  // 始终使用相对路径，确保 Nginx 可以正确拦截并转发
  const previewUrl = useMemo(() => {
    if (isMultiFile && demo.entryFile) {
      // URL编码处理中文和特殊字符
      const encodedPath = demo.entryFile.split('/').map(encodeURIComponent).join('/');
      // 使用相对路径: /projects/demo-xxx/path/to/index.html
      // Nginx 会拦截 /projects/* 并转发到后端
      const url = `/projects/${demo.id}/${encodedPath}`;
      console.log('[DemoPlayer] Preview URL:', url);
      return url;
    }
    return undefined;
  }, [demo, isMultiFile]);

  // Mixed Content 防御：将 http:// 替换为 https://
  const sanitizeMixedContent = (code: string): string => {
    // 替换 script src 中的 http://
    let sanitized = code.replace(
      /<script([^>]*)src=["']http:\/\/([^"']+)["']/gi,
      '<script$1src="https://$2"'
    );
    // 替换 link href 中的 http://
    sanitized = sanitized.replace(
      /<link([^>]*)href=["']http:\/\/([^"']+)["']/gi,
      '<link$1href="https://$2"'
    );
    // 替换 CSS @import 中的 http://
    sanitized = sanitized.replace(
      /@import\s+["']http:\/\/([^"']+)["']/gi,
      '@import "https://$1"'
    );
    // 替换 url() 中的 http://
    sanitized = sanitized.replace(
      /url\(["']?http:\/\/([^"')]+)["']?\)/gi,
      'url(https://$1)'
    );
    return sanitized;
  };

  // Inject TomorrowAI script into single-file demo code
  const getDemoCodeWithInjection = useMemo(() => {
    if (isMultiFile || !demo.code) return undefined;
    
    // 使用相对路径
    const apiBase = '/api/v1';
    const baseUrl = '';
    const wsBase = window.location.protocol === 'https:' ? 'wss://' + window.location.host : 'ws://' + window.location.host;
    
    const injectionScript = `
<script>
(function() {
  const API_BASE = '${apiBase}';
  const WS_BASE = '${wsBase}';
  
  window.TomorrowAI = {
    demoId: '${demo.id}',
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
</script>`;
    
    // Inject the script before </body> or </html>
    let content = sanitizeMixedContent(demo.code);
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
    
    return content;
  }, [demo, isMultiFile]);

  // Multi-file project state
  const [projectStructure, setProjectStructure] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [loadingStructure, setLoadingStructure] = useState(false);
  const [hasOriginalVersion, setHasOriginalVersion] = useState(false);
  
  // 修改功能状态
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editZipFile, setEditZipFile] = useState<File | null>(null);
  const [editOriginalZipFile, setEditOriginalZipFile] = useState<File | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editTags, setEditTags] = useState<string[]>([]);
  const [isEditingTags, setIsEditingTags] = useState(false);

  // Load project structure for multi-file projects
  useEffect(() => {
    if (isMultiFile) {
      loadProjectStructure();
    }
  }, [demo.id, isMultiFile]);
  
  // 初始化编辑表单
  useEffect(() => {
    if (isEditModalOpen) {
      setEditTitle(demo.title);
      setEditDescription(demo.description || '');
      setEditTags(demo.tags || []);
    }
    if (isEditingTags) {
      setEditTags(demo.tags || []);
    }
  }, [isEditModalOpen, isEditingTags, demo]);
  
  const handleEditSubmit = async () => {
    if (!editTitle.trim()) {
      alert(t('pleaseEnterTitle'));
      return;
    }
    
    setEditLoading(true);
    try {
      // 使用相对路径
      const apiBase = '/api/v1';
      const formData = new FormData();
      
      formData.append('title', editTitle);
      formData.append('description', editDescription);
      formData.append('tags', JSON.stringify(editTags));
      
      if (editZipFile) {
        formData.append('zipFile', editZipFile);
      }
      if (editOriginalZipFile) {
        formData.append('originalZip', editOriginalZipFile);
      }
      
      const token = localStorage.getItem('sci_demo_token') || '';
      const response = await fetch(`${apiBase}/demos/${demo.id}/update`, {
        method: 'POST',
        headers: token ? {
          'Authorization': 'Bearer ' + token
        } : {},
        body: formData
      });
      
      const result = await response.json();
      
      if (result.code === 200) {
        alert(t('updateSubmitted'));
        setIsEditModalOpen(false);
        setEditZipFile(null);
        setEditOriginalZipFile(null);
        onClose();
      } else {
        alert(result.message || t('updateFailed'));
      }
    } catch (error) {
      console.error('Edit error:', error);
      alert(t('updateFailed'));
    } finally {
      setEditLoading(false);
    }
  };

  const handleSaveTags = async () => {
    try {
      await DemosAPI.updateTags(demo.id, editTags);
      setIsEditingTags(false);
      onClose();
    } catch (error) {
      console.error('Save tags error:', error);
      alert(t('updateTagsFailed'));
    }
  };

  // 辅助函数：将扁平的文件列表转换为树状结构
  const buildTreeStructure = (files: any[]): any[] => {
    const root: any[] = [];
    const pathMap: Record<string, any> = {};

    // 首先创建所有目录节点
    files.forEach(file => {
      if (file.type === 'directory') {
        pathMap[file.path] = {
          ...file,
          children: []
        };
      }
    });

    // 然后创建所有文件节点，并将它们添加到对应的目录中
    files.forEach(file => {
      if (file.type === 'file') {
        const pathParts = file.path.split('/');
        const dirPath = pathParts.slice(0, -1).join('/');

        if (dirPath === '') {
          // 根目录文件
          root.push(file);
        } else if (pathMap[dirPath]) {
          // 子目录文件
          if (!pathMap[dirPath].children) {
            pathMap[dirPath].children = [];
          }
          pathMap[dirPath].children!.push(file);
        }
      }
    });

    // 最后将所有目录节点添加到对应的父目录中
    Object.values(pathMap).forEach(dir => {
      const pathParts = dir.path.split('/');
      const parentPath = pathParts.slice(0, -1).join('/');

      if (parentPath === '') {
        // 根目录
        root.push(dir);
      } else if (pathMap[parentPath]) {
        // 子目录
        if (!pathMap[parentPath].children) {
          pathMap[parentPath].children = [];
        }
        pathMap[parentPath].children!.push(dir);
      }
    });

    // 排序：目录在前，文件在后，然后按名称排序
    const sortItems = (items: any[]) => {
      return items.sort((a, b) => {
        if (a.type === 'directory' && b.type !== 'directory') return -1;
        if (a.type !== 'directory' && b.type === 'directory') return 1;
        return a.name.localeCompare(b.name);
      });
    };

    // 递归排序所有子项
    const sortRecursive = (items: any[]) => {
      sortItems(items);
      items.forEach(item => {
        if (item.type === 'directory' && item.children) {
          sortRecursive(item.children);
        }
      });
    };

    sortRecursive(root);
    return root;
  };

  // 递归组件：显示树状结构
  const TreeView = ({ items, level = 0 }: { items: any[], level?: number }) => {
    return (
      <ul className="space-y-1">
        {items.map((item, index) => (
          <li key={index}>
            <button
              onClick={() => item.type === 'file' && loadFileContent(item.path, codeViewMode === 'original')}
              disabled={item.type === 'directory'}
              className={`w-full text-left p-2 rounded-lg text-xs transition-colors ${selectedFile === item.path
                ? 'bg-indigo-100 text-indigo-700'
                : 'hover:bg-slate-100 text-slate-600'
                } ${item.type === 'directory' ? 'cursor-default opacity-60' : 'cursor-pointer'}`}
            >
              <div className="flex items-center gap-2" style={{ marginLeft: `${level * 12}px` }}>
                {item.type === 'directory' ? (
                  <span className="w-3 h-3 rounded-full bg-indigo-300"></span>
                ) : (
                  <span className="w-3 h-3 rounded-full bg-slate-300"></span>
                )}
                <span className="truncate">{item.name}</span>
              </div>
            </button>
            {item.type === 'directory' && item.children && item.children.length > 0 && (
              <TreeView items={item.children} level={level + 1} />
            )}
          </li>
        ))}
      </ul>
    );
  };

  const loadProjectStructure = async () => {
    setLoadingStructure(true);
    try {
      // 使用相对路径，确保 Nginx 可以正确转发
      const apiBase = '/api/v1';
      const url = `${apiBase}/demos/${demo.id}/structure`;
      console.log('[DemoPlayer] Loading project structure:', url);
      const response = await fetch(url);
      console.log('[DemoPlayer] Structure response status:', response.status);
      
      if (!response.ok) {
        console.error('[DemoPlayer] Failed to load structure, HTTP status:', response.status);
        setLoadingStructure(false);
        return;
      }
      
      const result = await response.json();
      console.log('[DemoPlayer] Structure result:', result);
      if (result.code === 200) {
        setProjectStructure(result.data.structure || []);
        
        if (result.data.structure && result.data.structure.length > 0) {
          const firstFile = result.data.structure.find(f => f.type === 'file');
          if (firstFile) {
            try {
              const encodedPath = firstFile.path.split('/').map(encodeURIComponent).join('/');
              const testResponse = await fetch(`${apiBase}/demos/${demo.id}/files/${encodedPath}?original=true`);
              const testResult = await testResponse.json();
              setHasOriginalVersion(testResult.code === 200);
            } catch (e) {
              setHasOriginalVersion(false);
            }
          }
        }
      } else {
        console.error('[DemoPlayer] Failed to load structure:', result.message);
      }
    } catch (error) {
      console.error('[DemoPlayer] Error loading project structure:', error);
    } finally {
      setLoadingStructure(false);
    }
  };

  const loadFileContent = async (filepath: string, isOriginal = false) => {
    try {
      // 使用相对路径，确保 Nginx 可以正确转发
      const apiBase = '/api/v1';
      const encodedPath = filepath.split('/').map(encodeURIComponent).join('/');
      const url = `${apiBase}/demos/${demo.id}/files/${encodedPath}${isOriginal ? '?original=true' : ''}`;
      console.log('[DemoPlayer] Loading file content:', url);
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error('[DemoPlayer] Failed to load file:', response.status);
        return;
      }
      
      const result = await response.json();
      if (result.code === 200) {
        setFileContent(result.data.content);
        setSelectedFile(filepath);
      } else {
        console.error('[DemoPlayer] Error loading file:', result.message);
      }
    } catch (error) {
      console.error('[DemoPlayer] Error loading file content:', error);
    }
  };
  
  useEffect(() => {
    if (selectedFile) {
      loadFileContent(selectedFile, codeViewMode === 'original');
    }
  }, [codeViewMode, selectedFile]);

  // Resize State
  const [sidebarWidth, setSidebarWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  // Like state
  const [likeCount, setLikeCount] = useState(demo.likeCount || 0);
  const [userLiked, setUserLiked] = useState(demo.userLiked || false);
  const [likeLoading, setLikeLoading] = useState(false);

  // Check if user can like (researcher1 and above)
  const canLike = useMemo(() => {
    if (!currentUser) return false;
    const userLevel = calculateLevel(currentUser.contributionPoints || 0, currentUser.role === 'general_admin');
    return isLevelAtLeast(userLevel, 'researcher1');
  }, [currentUser]);

  // Mobile fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  
  // Control panel visibility
  const [showControls, setShowControls] = useState(true);
  
  // Zoom state
  const [zoomLevel, setZoomLevel] = useState(1);
  const minZoom = 0.5;
  const maxZoom = 2;
  
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, maxZoom));
  };
  
  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, minZoom));
  };
  
  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  // Handle window resize for responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sidebar Resize Logic
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      // Calculate width based on the right edge of the sidebar
      if (sidebarRef.current) {
        const rightEdge = sidebarRef.current.getBoundingClientRect().right;
        const newWidth = rightEdge - e.clientX;
        
        // Clamp width
        if (newWidth > 300 && newWidth < 800) {
          setSidebarWidth(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'ew-resize';
    } else {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isResizing]);

  // Handle mobile fullscreen toggle
  const toggleFullscreen = async () => {
    if (!isFullscreen) {
      try {
        if (previewContainerRef.current) {
          const element = previewContainerRef.current;
          
          // Try different fullscreen methods for better mobile compatibility
          const requestFullscreen = 
            element.requestFullscreen ||
            (element as any).webkitRequestFullscreen ||
            (element as any).msRequestFullscreen ||
            (element as any).mozRequestFullScreen;
          
          if (requestFullscreen) {
            try {
              await requestFullscreen.call(element);
              
              // Try to lock to landscape orientation on mobile after a short delay
              setTimeout(async () => {
                try {
                  const orientation = screen.orientation as any;
                  if (orientation && orientation.lock) {
                    await orientation.lock('landscape');
                  }
                } catch (orientationErr) {
                  console.warn('Orientation lock failed:', orientationErr);
                }
              }, 100);
              
              setIsFullscreen(true);
              return;
            } catch (fullscreenErr) {
              console.warn('Native fullscreen failed, using CSS fallback:', fullscreenErr);
            }
          }
          
          // Fallback: Use CSS to simulate fullscreen
          console.log('Using CSS fullscreen fallback');
          setIsFullscreen(true);
          
          // Try to suggest landscape orientation
          setTimeout(() => {
            const orientation = screen.orientation as any;
            if (orientation && orientation.lock) {
              orientation.lock('landscape').catch(() => {});
            }
          }, 100);
        }
      } catch (err) {
        console.warn('Fullscreen request failed:', err);
        // Still try CSS fallback
        setIsFullscreen(true);
      }
    } else {
      // Exit fullscreen
      try {
        const exitFullscreen = 
          document.exitFullscreen ||
          (document as any).webkitExitFullscreen ||
          (document as any).msExitFullscreen ||
          (document as any).mozCancelFullScreen;
        
        if (exitFullscreen && document.fullscreenElement) {
          await exitFullscreen.call(document);
        }
        
        // Unlock orientation
        try {
          const orientation = screen.orientation as any;
          if (orientation && orientation.unlock) {
            await orientation.unlock();
          }
        } catch (orientationErr) {
          console.warn('Orientation unlock failed:', orientationErr);
        }
        
        setIsFullscreen(false);
      } catch (err) {
        console.warn('Exit fullscreen failed:', err);
        setIsFullscreen(false);
      }
    }
  };

  // Listen for fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNativeFullscreen = !!document.fullscreenElement;
      // Only update if native fullscreen state changes
      if (!isNativeFullscreen && isFullscreen) {
        setIsFullscreen(false);
      }
      // Unlock orientation when exiting fullscreen
      const orientation = screen.orientation as any;
      if (!isNativeFullscreen && orientation && orientation.unlock) {
        orientation.unlock();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [isFullscreen]);

  // Handle orientation change to show/hide rotate hint
  useEffect(() => {
    const rotateHint = document.getElementById('rotate-hint');
    if (!rotateHint) return;

    const handleOrientationChange = () => {
      const isLandscape = window.innerWidth > window.innerHeight;
      if (isLandscape) {
        rotateHint.style.display = 'none';
      } else {
        rotateHint.style.display = 'flex';
      }
    };

    // Check initial orientation
    handleOrientationChange();

    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [isFullscreen]);

  // Load like status when component mounts
  useEffect(() => {
    const loadLikeStatus = async () => {
      try {
        const likeData = await DemosAPI.getLikes(demo.id);
        setLikeCount(likeData.count);
        setUserLiked(likeData.userLiked);
      } catch (error) {
        console.error('Error loading like status:', error);
      }
    };
    loadLikeStatus();
  }, [demo.id]);

  // Handle like/unlike
  const handleLike = async () => {
    if (!canLike || likeLoading) return;
    setLikeLoading(true);
    try {
      if (userLiked) {
        const result = await DemosAPI.unlike(demo.id);
        setLikeCount(result.count);
        setUserLiked(false);
        // Notify parent component
        onLikeChange?.(demo.id, result.count, false);
      } else {
        const result = await DemosAPI.like(demo.id);
        setLikeCount(result.count);
        setUserLiked(true);
        // Notify parent component
        onLikeChange?.(demo.id, result.count, true);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setLikeLoading(false);
    }
  };

  // Load comments
  const loadComments = async () => {
    setCommentsLoading(true);
    try {
      const data = await DemosAPI.getComments(demo.id);
      setComments(data);
    } catch (error) {
      console.error('Error loading comments:', error);
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  // Add comment
  const handleAddComment = async () => {
    if (!newComment.trim() || commentActionLoading) return;
    setCommentActionLoading(true);
    try {
      await DemosAPI.addComment(demo.id, newComment);
      setNewComment('');
      await loadComments();
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setCommentActionLoading(false);
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm(t('confirmDeleteComment'))) return;
    setCommentActionLoading(true);
    try {
      await DemosAPI.deleteComment(demo.id, commentId);
      await loadComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
    } finally {
      setCommentActionLoading(false);
    }
  };

  // Load comments when comments tab is active or demo changes
  useEffect(() => {
    loadComments();
  }, [demo.id]);

  // Load AI messages from localStorage when component mounts
  useEffect(() => {
    const savedMessages = localStorage.getItem(`demo_${demo.id}_ai_messages`);
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
          setAiMessages(parsedMessages);
          return;
        }
      } catch (error) {
        console.error('Error parsing saved messages:', error);
      }
    }
    // Initialize with welcome message if no saved messages
    setAiMessages([{ 
      role: 'model', 
      text: `👋 你好！我是你的学习向导！\n\n我可以帮你：\n• **理解概念** - 深入讲解这个演示展示的科学原理\n• **互动学习** - 引导你通过操作演示来探索知识\n• **联系实际** - 解释这些概念在现实世界中的应用\n• **启发思考** - 提出有趣的问题帮助你深入理解\n\n💡 **建议**：试着与演示程序互动（拖动滑块、点击按钮等），然后告诉我你观察到了什么现象？` 
    }]);
  }, [demo.id]);

  // Save AI messages to localStorage when they change
  useEffect(() => {
    if (aiMessages.length > 0) {
      localStorage.setItem(`demo_${demo.id}_ai_messages`, JSON.stringify(aiMessages));
    }
  }, [aiMessages, demo.id]);

  // Load KaTeX when AI tab is activated
  // useEffect(() => {
  //   if (activeTab === 'ai') {
  //     loadKatex();
  //   }
  // }, [activeTab]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages]);

  // Listen for messages from AI links
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'openDemo' && event.data?.demoId) {
        onOpenDemo?.(event.data.demoId);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onOpenDemo]);

  const handleDemoAiAsk = async (query: string) => {
      if (!query.trim()) return;

      // Add user message
      setAiMessages(prev => [...prev, { role: 'user', text: query }]);
      setAiLoading(true);

      // Add empty model message for streaming
      setAiMessages(prev => [...prev, { role: 'model', text: '' }]);

      // Use a ref to accumulate text to avoid React state batching issues
      let accumulatedText = '';

      try {
        // Use explain mode for demo page - sends full code to AI for analysis
        await AiService.explain(
          query,
          demo.id,
          `Title: ${demo.title}`,
          (chunk) => {
            accumulatedText += chunk;
            setAiMessages(prev => {
              const newMessages = [...prev];
              const lastMessage = newMessages[newMessages.length - 1];
              if (lastMessage.role === 'model') {
                lastMessage.text = accumulatedText;
              }
              return [...newMessages];
            });
          }
        );
      } catch (error) {
        setAiMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage.role === 'model' && lastMessage.text === '') {
            lastMessage.text = t('aiError');
          }
          return [...newMessages];
        });
      } finally {
        setAiLoading(false);
      }
  };

  const handleClearAiMessages = () => {
    if (window.confirm(t('clearChatHistory') || '确定要清除聊天历史吗？')) {
      localStorage.removeItem(`demo_${demo.id}_ai_messages`);
      setAiMessages([{ 
        role: 'model', 
        text: `👋 你好！我是你的学习向导！\n\n我可以帮你：\n• **理解概念** - 深入讲解这个演示展示的科学原理\n• **互动学习** - 引导你通过操作演示来探索知识\n• **联系实际** - 解释这些概念在现实世界中的应用\n• **启发思考** - 提出有趣的问题帮助你深入理解\n\n💡 **建议**：试着与演示程序互动（拖动滑块、点击按钮等），然后告诉我你观察到了什么现象？` 
      }]);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-0 md:p-6"
    >
      <div className={`w-full h-full bg-slate-900 md:rounded-2xl shadow-2xl relative flex flex-col md:flex-row overflow-hidden border border-slate-800 ${isFullscreen ? '!flex-col' : ''}`}>
        {/* Only show close button when NOT fullscreen */}
        {!isFullscreen && (
          <button 
            onClick={onClose} 
            className="absolute top-4 left-4 z-20 bg-black/30 hover:bg-black/50 backdrop-blur text-white p-2 rounded-lg transition-colors border border-white/20"
            title={t('close')}
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Left Side: Preview */}
        <div
          ref={previewContainerRef}
          className={`flex-1 bg-slate-900 relative flex flex-col ${isFullscreen ? 'h-full w-full fixed inset-0 z-[100] !max-w-none !rounded-none' : 'h-[50vh] md:h-full overflow-hidden md:rounded-l-2xl'}`}
        >
          {/* Main Preview Area */}
          <div className={`flex-1 relative w-full bg-white overflow-auto ${isFullscreen && showControls ? 'h-[calc(100vh-56px)]' : (isFullscreen ? 'h-full' : '')}`}>
            <div 
              className="w-full h-full origin-center transition-transform duration-200"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              <iframe
                key={iframeKey}
                src={isMultiFile ? previewUrl : undefined}
                srcDoc={!isMultiFile ? getDemoCodeWithInjection : undefined}
                className="border-0 block w-full h-full"
                title={demo.title}
                sandbox="allow-scripts allow-same-origin allow-popups allow-modals allow-forms allow-downloads allow-pointer-lock"
                allow="camera; microphone; geolocation; fullscreen; display-capture; autoplay; clipboard-read; clipboard-write; picture-in-picture"
                onLoad={() => setDemoLoading(false)}
                onError={() => setDemoLoading(false)}
              />
            </div>
            {demoLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10">
                <div className="text-center p-6">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"></div>
                  <p className="text-slate-600 font-medium">加载中...</p>
                </div>
              </div>
            )}
            {/* Mobile Fullscreen Hint */}
            {!isFullscreen && (
              <div className="md:hidden absolute top-4 right-4 bg-indigo-600/90 backdrop-blur-sm text-white px-3 py-2 rounded-lg shadow-lg animate-pulse">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  <span className="text-xs font-bold">{t('clickFullscreenToWatch')}</span>
                </div>
              </div>
            )}
            
            {/* Rotate Hint */}
            {isFullscreen && (
              <div 
                className="md:hidden fixed inset-0 flex items-center justify-center bg-black/90 z-[200]" 
                id="rotate-hint"
                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
              >
                <div className="text-center text-white p-6">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
                    <RotateCcw className="w-10 h-10 animate-spin" style={{ animationDuration: '3s' }} />
                  </div>
                  <p className="text-xl font-bold mb-2">{t('pleaseRotatePhone')}</p>
                  <p className="text-sm text-white/70 mb-6">{t('landscapeModeIsBetter')}</p>
                  <button
                    onClick={toggleFullscreen}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm transition-colors"
                  >
                    {t('exitFullscreen')}
                  </button>
                </div>
              </div>
            )}

            {/* Tap to show controls hint when controls are hidden in fullscreen - placed in bottom left corner */}
            {isFullscreen && !showControls && (
              <button 
                className="absolute bottom-4 left-4 z-[101] bg-black/40 backdrop-blur-sm p-3 rounded-full text-white hover:bg-black/60 transition-all animate-in fade-in duration-200 shadow-lg"
                onClick={() => setShowControls(true)}
                title={t('tapToShowControls')}
              >
                <Monitor className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Preview Controls */}
          {(showControls || !isFullscreen) && (
            <div className={`h-14 bg-slate-800 border-t border-slate-700 flex items-center justify-between px-4 md:px-6 shrink-0 z-10 ${isFullscreen ? 'fixed bottom-0 left-0 right-0 z-[102]' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <h3 className="text-white font-medium text-sm truncate max-w-[150px] md:max-w-[200px]">{demo.title}</h3>
                <span className="text-xs text-slate-400 bg-slate-700 px-2 py-0.5 rounded-full">{Math.round(zoomLevel * 100)}%</span>
              </div>
              <div className="flex items-center gap-1">
                {/* Toggle Controls Button (only in fullscreen) */}
                {isFullscreen && (
                  <button
                    onClick={() => setShowControls(!showControls)}
                    className="p-2 text-slate-400 hover:text-white transition-colors hover:bg-slate-700 rounded-lg mr-2"
                    title="Hide Controls"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                {/* Zoom Out */}
                <button
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= minZoom}
                  className="p-2 text-slate-400 hover:text-white transition-colors hover:bg-slate-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                  title={t('zoomOut')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                </button>
                {/* Reset Zoom */}
                <button
                  onClick={handleResetZoom}
                  className="p-2 text-slate-400 hover:text-white transition-colors hover:bg-slate-700 rounded-lg"
                  title={t('resetZoom')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                </button>
                {/* Zoom In */}
                <button
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= maxZoom}
                  className="p-2 text-slate-400 hover:text-white transition-colors hover:bg-slate-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                  title={t('zoomIn')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                </button>
                {/* Refresh */}
                <button
                  onClick={() => {
                    setIframeKey(k => k + 1);
                    setZoomLevel(1);
                  }}
                  className="p-2 text-slate-400 hover:text-white transition-colors hover:bg-slate-700 rounded-lg"
                  title={t('refresh')}
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                {/* Mobile Fullscreen Button */}
                <button
                  onClick={toggleFullscreen}
                  className="md:hidden px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white transition-all rounded-lg flex items-center gap-2 shadow-lg shadow-indigo-600/30 active:scale-95 ml-2"
                  title={isFullscreen ? t('exitFullscreen') : t('fullscreen')}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                  <span className="text-xs font-bold">{isFullscreen ? t('exitFullscreen') : t('fullscreen')}</span>
                </button>
                {/* Desktop Fullscreen Button */}
                <button
                  onClick={toggleFullscreen}
                  className="hidden md:flex p-2 text-slate-400 hover:text-white transition-colors hover:bg-slate-700 rounded-lg ml-2"
                  title={isFullscreen ? t('exitFullscreen') : t('fullscreen')}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Sidebar - Only show when NOT fullscreen */}
        {!isFullscreen && (
          <div 
            ref={sidebarRef}
            style={isDesktop ? { width: `${sidebarWidth}px` } : {}}
            className="w-full md:w-auto bg-white flex flex-col h-[50vh] md:h-full overflow-hidden relative border-l border-slate-200 md:rounded-r-2xl"
          >
          {/* Resize Handle - Only visible on desktop */}
          <div 
            className="hidden md:flex absolute left-0 top-0 bottom-0 w-4 -ml-2 cursor-ew-resize z-50 items-center justify-center group"
            onMouseDown={handleMouseDown}
          >
            {/* Visible Line on Hover/Active */}
            <div className={`w-1 h-full rounded-full transition-colors ${isResizing ? 'bg-indigo-500' : 'bg-transparent group-hover:bg-indigo-200'}`} />
          </div>

          {/* Global Resize Overlay - Handles iframe issues and ensures smooth resizing */}
          {isResizing && (
            <div 
              className="fixed inset-0 z-[60] cursor-ew-resize bg-transparent"
              style={{ userSelect: 'none' }}
            />
          )}

          {/* Tabs */}
          <div className="flex border-b border-slate-200 shrink-0 bg-white">
            {['basicInfo', 'code', 'ai'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                {t(tab === 'ai' ? 'aiHelper' : tab === 'code' ? 'code' : 'basicInfo')}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
            {activeTab === 'basicInfo' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                 <div>
                   <div className="flex items-start justify-between gap-4">
                     <h4 className="text-xl font-bold text-slate-800 mb-2">{demo.title}</h4>
                     {/* Like Button */}
                     <button
                       onClick={handleLike}
                       disabled={!canLike || likeLoading}
                       className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                         userLiked
                           ? 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100'
                           : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 hover:text-slate-700'
                       } ${(!canLike || likeLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                       title={!canLike ? t('requiresResearcher1') : (userLiked ? t('unlike') : t('like'))}
                     >
                       <Heart
                         className={`w-4 h-4 transition-all ${userLiked ? 'fill-current' : ''}`}
                       />
                       <span>{likeCount}</span>
                     </button>
                   </div>
                   <div className="flex items-center justify-between gap-4 text-xs text-slate-500 flex-wrap">
                     <div className="flex items-center gap-2 flex-wrap">
                       <span className="bg-white border border-slate-200 px-2 py-0.5 rounded font-medium text-indigo-600">
                         {demo.layer === 'general' 
                           ? (() => {
                               // 首先尝试通过CATEGORY_ID_TO_TRANSLATION_KEY获取翻译键
                               if (CATEGORY_ID_TO_TRANSLATION_KEY[demo.categoryId]) {
                                 return t(CATEGORY_ID_TO_TRANSLATION_KEY[demo.categoryId]);
                               }
                               
                               // 直接使用demo.categoryId作为主题名称获取翻译键
                               const translationKey = {
                                 'Physics': 'physics',
                                 'Chemistry': 'chemistry',
                                 'Mathematics': 'mathematics',
                                 'Biology': 'biology',
                                 'Computer Science': 'computerScience',
                                 'Astronomy': 'astronomy',
                                 'Earth Science': 'earthScience',
                                 'Creative Tools': 'creativeTools'
                               }[demo.categoryId];
                               if (translationKey) {
                                 return t(translationKey);
                               }
                               
                               // 如果demo.categoryId是分类ID，尝试获取对应的翻译键
                               const category = categories?.find(c => c.id === demo.categoryId);
                               if (category) {
                                 const translationKey = {
                                   'Physics': 'physics',
                                   'Chemistry': 'chemistry',
                                   'Mathematics': 'mathematics',
                                   'Biology': 'biology',
                                   'Computer Science': 'computerScience',
                                   'Astronomy': 'astronomy',
                                   'Earth Science': 'earthScience',
                                   'Creative Tools': 'creativeTools'
                                 }[category.name];
                                 if (translationKey) {
                                   return t(translationKey);
                                 }
                                 return category.name;
                               }
                               
                               // 最后返回原始值
                               return demo.categoryId;
                             })()
                           : t('communityRoot')}
                       </span>
                       <span>
                         {t('by')}{' '}
                         {onViewUserProfile ? (
                           <button 
                             onClick={() => {
                               if (demo.creatorId) {
                                 onViewUserProfile(demo.creatorId);
                               } else if (allUsers) {
                                 const user = allUsers.find(u => u.username === demo.author);
                                 if (user) {
                                   onViewUserProfile(user.id);
                                 }
                               }
                             }}
                             className="text-indigo-600 hover:text-indigo-800 font-medium hover:underline transition-colors"
                           >
                             {demo.author}
                           </button>
                         ) : (
                           <span>{demo.author}</span>
                         )}
                       </span>
                       <span>• {new Date(demo.createdAt).toLocaleDateString()}</span>
                     </div>
                     {/* User Level Badge */}
                     {(() => {
                       let authorUser = null;
                       if (demo.creatorId && allUsers) {
                         authorUser = allUsers.find(u => u.id === demo.creatorId);
                       } else if (allUsers) {
                         authorUser = allUsers.find(u => u.username === demo.author);
                       }
                       
                       if (authorUser) {
                         const isAdmin = authorUser.role === 'general_admin';
                         const levelInfo = getLevelInfo(calculateLevel(authorUser.contributionPoints || 0, isAdmin), 'cn');
                         const levelConfig = LEVEL_CONFIG[calculateLevel(authorUser.contributionPoints || 0, isAdmin)];
                         return (
                           <span 
                             className="px-2 py-0.5 rounded font-bold flex items-center gap-1"
                             style={{ 
                               backgroundColor: `${levelInfo.color}20`,
                               color: levelInfo.color
                             }}
                           >
                             <LevelIcon 
                               iconKey={levelConfig.iconKey} 
                               className="w-3.5 h-3.5"
                               color={levelInfo.color}
                             />
                             {levelInfo.displayName}
                           </span>
                         );
                       }
                       return null;
                     })()}
                   </div>
                 </div>
                 
                 <div className="prose prose-sm prose-slate text-slate-600">
                   <p className="leading-relaxed">{demo.description}</p>
                 </div>

                 {/* Tags Section */}
                 <div className="space-y-3">
                   <div className="flex items-center justify-between">
                     <h6 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                       <Hash className="w-4 h-4" />
                       {t('tags')}
                     </h6>
                     {((currentUserId && demo.creatorId === currentUserId) || currentUserRole === 'general_admin') && (
                       <button
                         onClick={() => setIsEditingTags(true)}
                         className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                       >
                         <Edit3 className="w-3.5 h-3.5" />
                         {t('editTags')}
                       </button>
                     )}
                   </div>
                   
                   {isEditingTags ? (
                     <div className="space-y-3 p-4 bg-white rounded-xl border border-slate-200">
                       <TagSelector
                         selectedTags={editTags}
                         onChange={setEditTags}
                         lang="cn"
                       />
                       <div className="flex gap-2">
                         <button
                           onClick={handleSaveTags}
                           className="flex-1 py-2 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-indigo-700 hover:to-purple-700 transition-all"
                         >
                           {t('saveTags')}
                         </button>
                         <button
                           onClick={() => setIsEditingTags(false)}
                           className="py-2 px-4 bg-white border border-slate-300 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all"
                         >
                           {t('cancel')}
                         </button>
                       </div>
                     </div>
                   ) : (
                     <div className="flex flex-wrap gap-2">
                       {(demo.tags && demo.tags.length > 0) ? (
                         demo.tags.map((tagId) => {
                           const color = getTagColor(tagId);
                           return (
                             <span
                               key={tagId}
                               className="px-3 py-1.5 rounded-full text-sm font-medium text-white"
                               style={{ backgroundColor: color }}
                             >
                               {getTagName(tagId, 'cn')}
                             </span>
                           );
                         })
                       ) : (
                         <span className="text-sm text-slate-400">{t('noTagsYet')}</span>
                       )}
                     </div>
                   )}
                 </div>

                 {onPublishToOther && (
                   <button
                     onClick={onPublishToOther}
                     className="w-full py-2 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2 shadow-sm"
                   >
                     <FolderOpen className="w-4 h-4" />
                     {t('publishToOther')}
                   </button>
                 )}
                 
                 {currentUserId && demo.creatorId === currentUserId && (
                   <button
                     onClick={() => setIsEditModalOpen(true)}
                     className="w-full py-2 px-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-sm font-medium hover:from-amber-600 hover:to-orange-600 transition-all flex items-center justify-center gap-2 shadow-sm mt-3"
                   >
                     <Sparkles className="w-4 h-4" />
                     {t('editDemo')}
                   </button>
                 )}
                 
                 {onReportDemo && (
                   <button
                     onClick={onReportDemo}
                     className="w-full py-2 px-4 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-all flex items-center justify-center gap-2 shadow-sm mt-3"
                   >
                     <AlertTriangle className="w-4 h-4" />
                     {t('reportDemo')}
                   </button>
                 )}
                 
                 {/* Comments Section */}
                 <div className="mt-8 pt-6 border-t border-slate-200">
                   <h5 className="text-lg font-bold text-slate-800 mb-4">{t('comments')}</h5>
                   
                   {/* Comment Input */}
                   {currentUserId && (
                     <div className="flex gap-3 mb-6">
                       <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                         <UserCircle className="w-5 h-5" />
                       </div>
                       <div className="flex-1 space-y-2">
                         <textarea
                           value={newComment}
                           onChange={(e) => setNewComment(e.target.value)}
                           placeholder={t('writeComment')}
                           className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none"
                           rows={3}
                         />
                         <button
                           onClick={handleAddComment}
                           disabled={!newComment.trim() || commentActionLoading}
                           className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50"
                         >
                           {t('sendComment')}
                         </button>
                       </div>
                     </div>
                   )}

                   {/* Comments List */}
                   <div className="space-y-4">
                     {commentsLoading ? (
                       <div className="flex items-center justify-center py-8">
                         <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                       </div>
                     ) : comments.length === 0 ? (
                       <div className="text-center py-12 text-slate-400">
                         {t('noComments')}
                       </div>
                     ) : (
                       comments.map((comment) => (
                         <div key={comment.id} className="flex gap-3 p-4 bg-white rounded-xl border border-slate-200">
                           <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                             <UserCircle className="w-5 h-5" />
                           </div>
                           <div className="flex-1">
                             <div className="flex items-start justify-between gap-2">
                               <div>
                                 <span className="font-semibold text-slate-800">{comment.username}</span>
                                 <p className="text-xs text-slate-400 mt-1">{new Date(comment.created_at).toLocaleString()}</p>
                               </div>
                               {(currentUserRole === 'general_admin' || comment.user_id === currentUserId) && (
                                 <button
                                   onClick={() => handleDeleteComment(comment.id)}
                                   disabled={commentActionLoading}
                                   className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                 >
                                   <Trash className="w-4 h-4" />
                                 </button>
                               )}
                             </div>
                             <p className="text-sm text-slate-600 mt-2">{comment.content}</p>
                           </div>
                         </div>
                       ))
                     )}
                   </div>
                 </div>
              </div>
            )}

            {activeTab === 'code' && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300 h-full flex flex-col">
                {(demo.originalCode && demo.originalCode !== 'has_original_files' || hasOriginalVersion) && (
                  <div className="mb-4 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-indigo-800 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        {t('aiConfiguredVersion')}
                      </span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => setCodeViewMode('modified')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          codeViewMode === 'modified'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        {t('modifiedCode')}
                      </button>
                      <button
                        onClick={() => setCodeViewMode('original')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          codeViewMode === 'original'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        {t('originalCode')}
                      </button>
                    </div>
                  </div>
                )}
                
                {isMultiFile ? (
                  <>
                    {(demo.originalCode && demo.originalCode !== 'has_original_files' || hasOriginalVersion) && (
                      <div className="mb-4 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-bold text-indigo-800 flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            {t('aiConfiguredVersion')}
                          </span>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => setCodeViewMode('modified')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              codeViewMode === 'modified'
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                            }`}
                          >
                            {t('modifiedCode')}
                          </button>
                          <button
                            onClick={() => setCodeViewMode('original')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              codeViewMode === 'original'
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                            }`}
                          >
                            {t('originalCode')}
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-500 uppercase">{t('projectStructure')}</span>
                      <span className="text-xs text-slate-400">{t('readOnly')}</span>
                    </div>
                    <div className="flex-1 flex gap-4 overflow-hidden">
                      <div className="w-1/3 border border-slate-200 rounded-xl overflow-hidden flex flex-col">
                        <div className="p-2 bg-slate-50 border-b border-slate-200">
                          <p className="text-xs font-medium text-slate-600">Files</p>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2">
                          {loadingStructure ? (
                            <div className="flex items-center justify-center py-8">
                              <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                            </div>
                          ) : projectStructure.length === 0 ? (
                            <p className="text-xs text-slate-400 text-center py-4">No files</p>
                          ) : (
                            <TreeView items={buildTreeStructure(projectStructure)} />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 border border-slate-200 rounded-xl overflow-hidden flex flex-col">
                        <div className="p-2 bg-slate-50 border-b border-slate-200">
                          <p className="text-xs font-medium text-slate-600 truncate">{selectedFile || 'Select a file'}</p>
                        </div>
                        <pre className="text-xs font-mono bg-slate-900 text-slate-300 p-4 rounded-xl overflow-x-auto flex-1 shadow-inner border border-slate-700">
                          {fileContent || '// Select a file to view its content'}
                        </pre>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-500 uppercase">index.html</span>
                      <span className="text-xs text-slate-400">{t('readOnly')}</span>
                    </div>
                    <pre className="text-xs font-mono bg-slate-900 text-slate-300 p-4 rounded-xl overflow-x-auto flex-1 shadow-inner border border-slate-700">
                      {codeViewMode === 'original' && demo.originalCode && demo.originalCode !== 'has_original_files' 
                        ? demo.originalCode 
                        : demo.code}
                    </pre>
                  </>
                )}
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
                 <div className="flex items-center justify-between mb-4">
                   <h5 className="text-sm font-bold text-slate-700">{t('aiHelper')}</h5>
                   <button 
                     onClick={handleClearAiMessages}
                     className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1"
                   >
                     <Trash2 className="w-3.5 h-3.5" />
                     <span className="hidden sm:inline">{t('clearHistory')}</span>
                   </button>
                 </div>
                 <div className="flex-1 space-y-4 mb-4 overflow-y-auto">
                   {aiMessages.map((msg, idx) => (
                     <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                       <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                         msg.role === 'user' ? 'bg-slate-700' : 'bg-indigo-600'
                       }`}>
                         {msg.role === 'user' ? (
                           <span className="text-white text-xs font-bold">{t('user').charAt(0).toUpperCase()}</span>
                         ) : (
                           <Sparkles className="w-4 h-4 text-white" />
                         )}
                       </div>
                       <div className={`p-4 rounded-2xl text-sm shadow-sm max-w-[80%] ${
                         msg.role === 'user'
                           ? 'bg-indigo-600 text-white rounded-tr-none'
                           : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'
                       }`}>
                         {msg.role === 'user' ? (
                           msg.text
                         ) : (
                           <AIMessageContent
                             text={msg.text}
                             onOpenDemo={onOpenDemo}
                           />
                         )}
                       </div>
                     </div>
                   ))}
                   <div ref={messagesEndRef} />
                 </div>
                 
                 <div className="mt-auto pt-4 border-t border-slate-200 bg-slate-50/50">
                   <div className="relative">
                     <input
                       type="text"
                       placeholder={t('aiChatPlaceholder')}
                       className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none pr-12"
                       onKeyDown={(e) => {
                         if (e.key === 'Enter') {
                           handleDemoAiAsk((e.target as HTMLInputElement).value);
                           (e.target as HTMLInputElement).value = '';
                         }
                       }}
                     />
                     <button
                       className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1.5"
                       onClick={(e) => {
                         const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                         if (input && input.value.trim()) {
                           handleDemoAiAsk(input.value);
                           input.value = '';
                         }
                       }}
                     >
                        <Send className="w-4 h-4" />
                        <span className="text-xs font-medium hidden sm:inline">{t('send')}</span>
                     </button>
                   </div>
                   {aiLoading && (
                     <div className="flex items-center gap-2 text-xs text-indigo-600 mt-3">
                       <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                       {t('analyzing')}
                     </div>
                   )}
                 </div>
              </div>
            )}
          </div>
        </div>
        )}
      </div>
      
      {/* 编辑弹窗 */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-800">{t('editDemoTitle')}</h3>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t('title')}</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t('description')}</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t('uploadNewFile')}</label>
                  <input
                    type="file"
                    accept=".zip,.html,.htm"
                    onChange={(e) => setEditZipFile(e.target.files?.[0] || null)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  {editZipFile && (
                    <p className="text-xs text-slate-500 mt-1">{t('selected')}: {editZipFile.name}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t('uploadOriginalFile')}</label>
                  <input
                    type="file"
                    accept=".zip"
                    onChange={(e) => setEditOriginalZipFile(e.target.files?.[0] || null)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  {editOriginalZipFile && (
                    <p className="text-xs text-slate-500 mt-1">{t('selected')}: {editOriginalZipFile.name}</p>
                  )}
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 py-2 px-4 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300 transition-colors"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={handleEditSubmit}
                    disabled={editLoading}
                    className="flex-1 py-2 px-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-medium hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50"
                  >
                    {editLoading ? t('submittingUpdate') : t('submitUpdate')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
