// 构建API基础URL - 使用相对路径
const getApiBase = () => {
  // 生产环境使用相对路径，开发环境使用代理
  return '/api/v1';
};

// 构建WebSocket基础URL
const getWsBase = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}`;
};

const API_BASE = getApiBase();
const WS_BASE = getWsBase();

export const DemoDataStorage = {
  async save(demoId: string, key: string, value: any) {
    const response = await fetch(`${API_BASE}/demo-features/${demoId}/data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('sci_demo_token') || ''}`
      },
      body: JSON.stringify({ key, value })
    });
    return response.json();
  },

  async get(demoId: string, key: string) {
    const response = await fetch(`${API_BASE}/demo-features/${demoId}/data/${key}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('sci_demo_token') || ''}`
      }
    });
    return response.json();
  },

  async getAll(demoId: string) {
    const response = await fetch(`${API_BASE}/demo-features/${demoId}/data`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('sci_demo_token') || ''}`
      }
    });
    return response.json();
  },

  async delete(demoId: string, key: string) {
    const response = await fetch(`${API_BASE}/demo-features/${demoId}/data/${key}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('sci_demo_token') || ''}`
      }
    });
    return response.json();
  }
};

export const DemoMultiplayer = {
  ws: null as WebSocket | null,
  
  connect(demoId: string, onMessage: (data: any) => void) {
    const wsUrl = `${WS_BASE}/demo-features/${demoId}/multiplayer`;
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onopen = () => {
      console.log('Multiplayer connected');
    };
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    };
    
    this.ws.onclose = () => {
      console.log('Multiplayer disconnected');
    };
    
    return this.ws;
  },
  
  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  },
  
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
};

export const DemoAIChat = {
  async sendMessage(demoId: string, message: string, context?: any) {
    const response = await fetch(`${API_BASE}/demo-features/${demoId}/ai-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('sci_demo_token') || ''}`
      },
      body: JSON.stringify({ message, context })
    });
    return response.json();
  },

  async getHistory(demoId: string) {
    const response = await fetch(`${API_BASE}/demo-features/${demoId}/ai-chat/history`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('sci_demo_token') || ''}`
      }
    });
    return response.json();
  }
};

export const DemoCodeExecution = {
  async execute(demoId: string, code: string, language: string = 'javascript') {
    const response = await fetch(`${API_BASE}/demo-features/${demoId}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('sci_demo_token') || ''}`
      },
      body: JSON.stringify({ code, language })
    });
    return response.json();
  }
};

export const DemoFileStorage = {
  async upload(demoId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE}/demo-features/${demoId}/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('sci_demo_token') || ''}`
      },
      body: formData
    });
    return response.json();
  },

  async list(demoId: string) {
    const response = await fetch(`${API_BASE}/demo-features/${demoId}/files`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('sci_demo_token') || ''}`
      }
    });
    return response.json();
  },

  async delete(demoId: string, fileId: string) {
    const response = await fetch(`${API_BASE}/demo-features/${demoId}/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('sci_demo_token') || ''}`
      }
    });
    return response.json();
  }
};
