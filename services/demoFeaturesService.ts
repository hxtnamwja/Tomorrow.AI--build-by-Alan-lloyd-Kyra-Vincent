
// 构建API基础URL
const getApiBase = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';
  // 如果配置的是相对路径，添加默认主机
  if (apiUrl.startsWith('/')) {
    return `http://localhost:3001${apiUrl}`;
  }
  return apiUrl;
};

// 构建WebSocket基础URL
const getWsBase = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';
  if (apiUrl.startsWith('/')) {
    return `ws://localhost:3001`;
  }
  return apiUrl.replace('http', 'ws').replace(/\/api\/v1$/, '');
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
  }
};

export const DemoRooms = {
  async create(demoId: string, title?: string, maxPlayers?: number) {
    const response = await fetch(`${API_BASE}/demo-features/${demoId}/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('sci_demo_token') || ''}`
      },
      body: JSON.stringify({ title, maxPlayers })
    });
    return response.json();
  },

  async list(demoId: string) {
    const response = await fetch(`${API_BASE}/demo-features/${demoId}/rooms`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('sci_demo_token') || ''}`
      }
    });
    return response.json();
  },

  async join(demoId: string, roomId: string) {
    const response = await fetch(`${API_BASE}/demo-features/${demoId}/rooms/${roomId}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('sci_demo_token') || ''}`
      }
    });
    return response.json();
  },

  async leave(demoId: string, roomId: string) {
    const response = await fetch(`${API_BASE}/demo-features/${demoId}/rooms/${roomId}/leave`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('sci_demo_token') || ''}`
      }
    });
    return response.json();
  },

  async sendMessage(demoId: string, roomId: string, type: string, data: any) {
    const response = await fetch(`${API_BASE}/demo-features/${demoId}/rooms/${roomId}/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('sci_demo_token') || ''}`
      },
      body: JSON.stringify({ type, data })
    });
    return response.json();
  },

  async getMessages(demoId: string, roomId: string, since?: string) {
    const url = new URL(`${API_BASE}/demo-features/${demoId}/rooms/${roomId}/messages`);
    if (since) {
      url.searchParams.set('since', since);
    }
    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('sci_demo_token') || ''}`
      }
    });
    return response.json();
  }
};

export class DemoWebSocket {
  ws: WebSocket | null = null;
  demoId: string;
  roomId: string;
  userId: string;
  onMessage: ((data: any) => void) | null = null;
  onUserJoined: ((data: any) => void) | null = null;
  onUserLeft: ((data: any) => void) | null = null;
  onConnected: (() => void) | null = null;

  constructor(demoId: string, roomId: string, userId: string) {
    this.demoId = demoId;
    this.roomId = roomId;
    this.userId = userId;
  }

  connect() {
    const wsUrl = `${WS_BASE}/ws?demoId=${this.demoId}&roomId=${this.roomId}&userId=${this.userId}`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      if (this.onConnected) this.onConnected();
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        switch(msg.type) {
          case 'connected':
            break;
          case 'broadcast':
            if (this.onMessage) this.onMessage(msg.data);
            break;
          case 'userJoined':
            if (this.onUserJoined) this.onUserJoined(msg);
            break;
          case 'userLeft':
            if (this.onUserLeft) this.onUserLeft(msg);
            break;
        }
      } catch (e) {
        console.error('WebSocket message error:', e);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'broadcast',
        data: data
      }));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

if (typeof window !== 'undefined') {
  (window as any).TomorrowAI = {
    storage: {
      set: async (key: string, value: any) => {
        const demoId = (window as any).TomorrowAI?.demoId || '';
        return DemoDataStorage.save(demoId, key, value);
      },
      get: async (key: string) => {
        const demoId = (window as any).TomorrowAI?.demoId || '';
        const result = await DemoDataStorage.get(demoId, key);
        return result.data;
      },
      getAll: async () => {
        const demoId = (window as any).TomorrowAI?.demoId || '';
        const result = await DemoDataStorage.getAll(demoId);
        return result.data;
      }
    },
    rooms: {
      list: async () => {
        const demoId = (window as any).TomorrowAI?.demoId || '';
        const result = await DemoRooms.list(demoId);
        return result.data;
      },
      create: async (title?: string, maxPlayers?: number) => {
        const demoId = (window as any).TomorrowAI?.demoId || '';
        const result = await DemoRooms.create(demoId, title, maxPlayers);
        return result.data;
      },
      join: async (roomId: string) => {
        const demoId = (window as any).TomorrowAI?.demoId || '';
        return DemoRooms.join(demoId, roomId);
      },
      leave: async (roomId: string) => {
        const demoId = (window as any).TomorrowAI?.demoId || '';
        return DemoRooms.leave(demoId, roomId);
      },
      sendMessage: async (roomId: string, type: string, data: any) => {
        const demoId = (window as any).TomorrowAI?.demoId || '';
        return DemoRooms.sendMessage(demoId, roomId, type, data);
      },
      getMessages: async (roomId: string, since?: string) => {
        const demoId = (window as any).TomorrowAI?.demoId || '';
        const result = await DemoRooms.getMessages(demoId, roomId, since);
        return result.data;
      }
    },
    WebSocket: DemoWebSocket,
    getToken: () => localStorage.getItem('sci_demo_token') || ''
  };
}

