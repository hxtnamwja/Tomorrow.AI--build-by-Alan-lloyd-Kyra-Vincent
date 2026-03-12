import { Demo, Category, Bounty, Community, User, UserStats, DemoPublication, Feedback, Layer, Announcement } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

// API请求缓存
const apiCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_EXPIRY = 5 * 60 * 1000; // 5分钟缓存

// Helper to get auth token
const getToken = (): string | null => {
  return localStorage.getItem('sci_demo_token');
};

// 生成缓存键
const generateCacheKey = (endpoint: string, options: RequestInit = {}): string => {
  const method = options.method || 'GET';
  const body = options.body ? JSON.stringify(options.body) : '';
  return `${method}:${endpoint}:${body}`;
};

// Helper for API requests with caching
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {},
  cacheEnabled: boolean = true
): Promise<{ code: number; message: string; data: T }> => {
  const method = options.method || 'GET';
  
  // 仅对 GET 请求使用缓存
  if (cacheEnabled && method === 'GET') {
    const cacheKey = generateCacheKey(endpoint, options);
    const cached = apiCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_EXPIRY) {
      return cached.data;
    }
  }

  const url = `${API_BASE_URL}${endpoint}`;
  const token = getToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
    cache: 'no-store', // 绕过浏览器缓存，确保获取最新数据
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  
  // 变更操作后自动清除缓存
  if (method !== 'GET') {
    clearCache();
  }
  
  const data = await response.json();
  
  // 缓存响应
  if (cacheEnabled && method === 'GET') {
    const cacheKey = generateCacheKey(endpoint, options);
    apiCache.set(cacheKey, { data, timestamp: Date.now() });
  }
  
  return data;
};

// 清除缓存
export const clearCache = () => {
  apiCache.clear();
};

// 特定接口清除缓存
export const invalidateCache = (prefix: string) => {
  const keysToDelete: string[] = [];
  apiCache.forEach((_, key) => {
    if (key.includes(prefix)) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach(key => apiCache.delete(key));
};

// Auth API
export const AuthAPI = {
  login: async (username: string, password: string) => {
    const result = await apiRequest<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }, false); // 登录请求不缓存
    if (result.data.token) {
      localStorage.setItem('sci_demo_token', result.data.token);
      localStorage.setItem('sci_demo_user', JSON.stringify(result.data.user));
      clearCache(); // 登录后清除缓存
    }
    return result.data;
  },
  
  register: async (username: string, password: string) => {
    const result = await apiRequest<{ token: string; user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
    }, false); // 注册请求不缓存
    if (result.data.token) {
        localStorage.setItem('sci_demo_token', result.data.token);
        localStorage.setItem('sci_demo_user', JSON.stringify(result.data.user));
        clearCache(); // 注册后清除缓存
    }
    return result.data;
  },
  
  getCurrentUser: async () => {
    const result = await apiRequest<User>('/auth/me');
    if (result.data) {
      localStorage.setItem('sci_demo_user', JSON.stringify(result.data));
    }
    return result.data;
  },
  
  logout: () => {
    localStorage.removeItem('sci_demo_token');
    localStorage.removeItem('sci_demo_user');
    clearCache(); // 登出后清除缓存
  },
  
  getStoredUser: () => {
    const userStr = localStorage.getItem('sci_demo_user');
    return userStr ? JSON.parse(userStr) : null;
  },
};

// Demos API
export const DemosAPI = {
  getAll: async (params?: {
    layer?: string;
    communityId?: string;
    categoryId?: string;
    search?: string;
    status?: string;
    authorId?: string;
  }): Promise<Demo[]> => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value);
        }
      });
    }
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const result = await apiRequest<Demo[]>(`/demos${query}`);
    return result.data;
  },
  
  getById: async (id: string): Promise<Demo> => {
    const result = await apiRequest<Demo>(`/demos/${id}`);
    return result.data;
  },
  
  create: async (demo: Omit<Demo, 'id' | 'createdAt'>): Promise<Demo> => {
    const result = await apiRequest<Demo>('/demos', {
      method: 'POST',
      body: JSON.stringify({
        title: demo.title,
        description: demo.description,
        categoryId: demo.categoryId,
        layer: demo.layer,
        communityId: demo.communityId,
        code: demo.code,
        originalCode: demo.originalCode,
        config: demo.config,
        bountyId: demo.bountyId,
        tags: demo.tags,
      }),
    });
    return result.data;
  },
  
  updateStatus: async (id: string, status: string, rejectionReason?: string): Promise<Demo> => {
    const result = await apiRequest<Demo>(`/demos/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, rejectionReason }),
    });
    return result.data;
  },
  
  // Update cover image
  updateCover: async (id: string, thumbnailUrl: string): Promise<Demo> => {
    const result = await apiRequest<Demo>(`/demos/${id}/cover`, {
      method: 'PATCH',
      body: JSON.stringify({ thumbnailUrl }),
    });
    return result.data;
  },

  // Update tags only (no approval needed)
  updateTags: async (id: string, tags: string[]): Promise<Demo> => {
    const result = await apiRequest<Demo>(`/demos/${id}/tags`, {
      method: 'PATCH',
      body: JSON.stringify({ tags }),
    });
    return result.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await apiRequest<void>(`/demos/${id}`, {
      method: 'DELETE',
    });
  },

  // Like methods
  getLikes: async (id: string): Promise<{ count: number; userLiked: boolean }> => {
    const result = await apiRequest<{ count: number; userLiked: boolean }>(`/demos/${id}/likes`);
    return result.data;
  },

  like: async (id: string): Promise<{ count: number; userLiked: boolean }> => {
    const result = await apiRequest<{ count: number; userLiked: boolean }>(`/demos/${id}/like`, {
      method: 'POST',
    });
    return result.data;
  },

  unlike: async (id: string): Promise<{ count: number; userLiked: boolean }> => {
    const result = await apiRequest<{ count: number; userLiked: boolean }>(`/demos/${id}/like`, {
      method: 'DELETE',
    });
    return result.data;
  },

  getLikedByUser: async (userId: string): Promise<Demo[]> => {
    const result = await apiRequest<Demo[]>(`/demos/liked/by/${userId}`);
    return result.data;
  },

  // Get demos sorted by likes
  getAllSortedByLikes: async (params?: {
    layer?: string;
    communityId?: string;
    categoryId?: string;
    search?: string;
    status?: string;
  }): Promise<Demo[]> => {
    const queryParams = new URLSearchParams();
    queryParams.append('sortBy', 'likes');
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value);
        }
      });
    }
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const result = await apiRequest<Demo[]>(`/demos${query}`);
    return result.data;
  },

  // Archive (soft delete) a demo
  archive: async (id: string): Promise<Demo> => {
    const result = await apiRequest<Demo>(`/demos/${id}`, {
      method: 'DELETE',
    });
    return result.data;
  },

  // Restore an archived demo
  restore: async (id: string): Promise<Demo> => {
    const result = await apiRequest<Demo>(`/demos/${id}/restore`, {
      method: 'POST',
    });
    return result.data;
  },

  // Permanently delete a demo
  deletePermanently: async (id: string): Promise<void> => {
    await apiRequest<void>(`/demos/${id}/permanent`, {
      method: 'DELETE',
    });
  },

  // Get archived demos by user
  getArchivedByUser: async (userId: string): Promise<Demo[]> => {
    const result = await apiRequest<Demo[]>(`/demos/archived/by/${userId}`);
    return result.data;
  },

  // Comments API
  getComments: async (demoId: string): Promise<any[]> => {
    const result = await apiRequest<any[]>(`/demos/${demoId}/comments`);
    return result.data;
  },

  addComment: async (demoId: string, content: string): Promise<any> => {
    const result = await apiRequest<any>(`/demos/${demoId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
    return result.data;
  },

  deleteComment: async (demoId: string, commentId: string): Promise<void> => {
    await apiRequest<void>(`/demos/${demoId}/comments/${commentId}`, {
      method: 'DELETE',
    });
  },
};

// Communities API
export const CommunitiesAPI = {
  getAll: async (params?: { status?: string; userId?: string; type?: string }): Promise<Community[]> => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value);
        }
      });
    }
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const result = await apiRequest<Community[]>(`/communities${query}`);
    return result.data;
  },
  
  create: async (name: string, description: string, type?: string): Promise<Community> => {
    const result = await apiRequest<Community>('/communities', {
      method: 'POST',
      body: JSON.stringify({ name, description, type }),
    });
    return result.data;
  },
  
  join: async (communityId: string): Promise<Community> => {
    const result = await apiRequest<Community>(`/communities/${communityId}/join`, {
      method: 'POST',
    });
    return result.data;
  },
  
  updateStatus: async (id: string, status: string): Promise<Community> => {
    const result = await apiRequest<Community>(`/communities/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return result.data;
  },
  
  joinByCode: async (code: string): Promise<Community> => {
    const result = await apiRequest<Community>('/communities/join-by-code', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
    return result.data;
  },
  
  requestJoin: async (communityId: string): Promise<void> => {
    await apiRequest<void>(`/communities/${communityId}/join-request`, {
      method: 'POST',
    });
  },
  
  manageMember: async (communityId: string, userId: string, action: 'accept' | 'kick' | 'reject_request'): Promise<void> => {
    await apiRequest<void>(`/communities/${communityId}/members/manage`, {
      method: 'POST',
      body: JSON.stringify({ userId, action }),
    });
  },
  
  getMembers: async (communityId: string): Promise<{ id: string; username: string; status: string; joined_at: number }[]> => {
    const result = await apiRequest<{ id: string; username: string; status: string; joined_at: number }[]>(`/communities/${communityId}/members`);
    return result.data;
  },
  
  updateCode: async (communityId: string): Promise<{ code: string }> => {
    const result = await apiRequest<{ code: string }>(`/communities/${communityId}/code`, {
      method: 'PATCH',
    });
    return result.data;
  },

  update: async (id: string, data: Partial<Community>): Promise<Community> => {
    const result = await apiRequest<Community>(`/communities/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return result.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await apiRequest<void>(`/communities/${id}`, {
      method: 'DELETE',
    });
  },
  
  banUser: async (communityId: string, userId: string, reason?: string): Promise<void> => {
    await apiRequest<void>(`/communities/${communityId}/ban`, {
      method: 'POST',
      body: JSON.stringify({ userId, reason }),
    });
  },
  
  unbanUser: async (communityId: string, userId: string): Promise<void> => {
    await apiRequest<void>(`/communities/${communityId}/unban`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  },
  
  getBans: async (communityId: string): Promise<any[]> => {
    const result = await apiRequest<any[]>(`/communities/${communityId}/bans`);
    return result.data;
  },

  leave: async (communityId: string): Promise<void> => {
    await apiRequest<void>(`/communities/${communityId}/leave`, {
      method: 'POST',
    });
  },

  setMemberRole: async (communityId: string, userId: string, role: 'admin' | 'member'): Promise<void> => {
    await apiRequest<void>(`/communities/${communityId}/members/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },
};

// Categories API
export const CategoriesAPI = {
  getAll: async (params?: { layer?: string; communityId?: string }): Promise<Category[]> => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value);
        }
      });
    }
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const result = await apiRequest<Category[]>(`/categories${query}`);
    return result.data;
  },
  
  create: async (name: string, parentId: string | null, communityId?: string): Promise<Category> => {
    const result = await apiRequest<Category>('/categories', {
      method: 'POST',
      body: JSON.stringify({ name, parentId, communityId }),
    });
    return result.data;
  },

  update: async (id: string, name: string): Promise<Category> => {
    const result = await apiRequest<Category>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name }),
    });
    return result.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await apiRequest<void>(`/categories/${id}`, {
      method: 'DELETE',
    });
  },
};

// Bounties API
export const BountiesAPI = {
  getAll: async (params?: { layer?: string; communityId?: string; status?: string; creatorId?: string }): Promise<Bounty[]> => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value);
        }
      });
    }
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const result = await apiRequest<Bounty[]>(`/bounties${query}`);
    return result.data;
  },

  getById: async (id: string): Promise<Bounty & { solutions?: any[] }> => {
    const result = await apiRequest<Bounty & { solutions?: any[] }>(`/bounties/${id}`);
    return result.data;
  },
  
  create: async (bounty: { 
    title: string;
    description: string;
    reward: string;
    rewardPoints: number;
    layer: Layer;
    communityId?: string;
    publishLayer?: Layer;
    publishCommunityId?: string;
    publishCategoryId?: string;
    programTitle?: string;
    programDescription?: string;
    programTags?: string[];
  }): Promise<Bounty> => {
    const result = await apiRequest<Bounty>('/bounties', {
      method: 'POST',
      body: JSON.stringify({
        title: bounty.title,
        description: bounty.description,
        reward: bounty.reward,
        rewardPoints: bounty.rewardPoints,
        layer: bounty.layer,
        communityId: bounty.communityId,
        publishLayer: bounty.publishLayer,
        publishCommunityId: bounty.publishCommunityId,
        publishCategoryId: bounty.publishCategoryId,
        programTitle: bounty.programTitle,
        programDescription: bounty.programDescription,
        programTags: bounty.programTags,
      }),
    });
    return result.data;
  },

  submitSolution: async (bountyId: string, demoId: string): Promise<any> => {
    const result = await apiRequest<any>(`/bounties/${bountyId}/solutions`, {
      method: 'POST',
      body: JSON.stringify({ demoId }),
    });
    return result.data;
  },

  reviewSolution: async (bountyId: string, solutionId: string, action: 'accept' | 'reject', rejectionReason?: string): Promise<Bounty> => {
    const result = await apiRequest<Bounty>(`/bounties/${bountyId}/solutions/${solutionId}`, {
      method: 'PATCH',
      body: JSON.stringify({ action, rejectionReason }),
    });
    return result.data;
  },
  
  updateStatus: async (id: string, status: string): Promise<Bounty> => {
    const result = await apiRequest<Bounty>(`/bounties/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return result.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await apiRequest<void>(`/bounties/${id}`, {
      method: 'DELETE',
    });
  },
};

// Users API
export const UsersAPI = {
  getAll: async (): Promise<User[]> => {
    const result = await apiRequest<User[]>('/users');
    return result.data;
  },

  getAllPublic: async (): Promise<User[]> => {
    const result = await apiRequest<User[]>('/users/public');
    return result.data;
  },

  getByCommunity: async (communityId: string): Promise<User[]> => {
    const result = await apiRequest<User[]>(`/users/community/${communityId}`);
    return result.data;
  },

  getById: async (id: string): Promise<User> => {
    const result = await apiRequest<User>(`/users/${id}`);
    return result.data;
  },

  ban: async (id: string, reason?: string): Promise<void> => {
    await apiRequest<void>(`/users/${id}/ban`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  },

  unban: async (id: string): Promise<void> => {
    await apiRequest<void>(`/users/${id}/unban`, {
      method: 'PUT',
    });
  },

  setRole: async (id: string, role: string): Promise<void> => {
    await apiRequest<void>(`/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },

  update: async (id: string, data: {
    username?: string;
    password?: string;
    contactInfo?: string;
    paymentQr?: string;
    bio?: string;
    contributionPoints?: number;
    points?: number;
    favorites?: string[];
    avatarBorder?: string;
    avatarAccessory?: string;
    avatarEffect?: string;
    profileTheme?: string;
    profileBackground?: string;
    usernameColor?: string;
    usernameEffect?: string;
    customTitle?: string;
    unlockedAchievements?: string[];
    ownedItems?: Array<{ type: string; id: string; purchasedAt: number }>;
  }): Promise<User> => {
    const result = await apiRequest<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    const storedUser = AuthAPI.getStoredUser();
    if (storedUser && storedUser.id === id) {
      localStorage.setItem('sci_demo_user', JSON.stringify(result.data));
    }
    return result.data;
  },

  getStats: async (id: string): Promise<UserStats> => {
    const result = await apiRequest<UserStats>(`/users/${id}/stats`);
    return result.data;
  },

  getDemos: async (id: string): Promise<Demo[]> => {
    const result = await apiRequest<Demo[]>(`/users/${id}/demos`);
    return result.data;
  },
};

// Publications API
export const PublicationsAPI = {
  create: async (data: { demoId: string, layer: string, categoryId: string, communityId?: string }): Promise<DemoPublication> => {
    const result = await apiRequest<DemoPublication>('/publications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.data;
  },

  getAll: async (params?: {
    demoId?: string;
    status?: string;
    layer?: string;
    communityId?: string;
    requestedBy?: string;
  }): Promise<DemoPublication[]> => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value);
        }
      });
    }
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const result = await apiRequest<DemoPublication[]>(`/publications${query}`);
    return result.data;
  },

  getPending: async (): Promise<DemoPublication[]> => {
    const result = await apiRequest<DemoPublication[]>('/publications/pending');
    return result.data;
  },

  updateStatus: async (
    id: string,
    status: string,
    rejectionReason?: string
  ): Promise<DemoPublication> => {
    const result = await apiRequest<DemoPublication>(`/publications/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, rejectionReason }),
    });
    return result.data;
  },

  approve: async (id: string): Promise<DemoPublication> => {
    return await PublicationsAPI.updateStatus(id, 'published');
  },

  reject: async (id: string, reason: string): Promise<DemoPublication> => {
    return await PublicationsAPI.updateStatus(id, 'rejected', reason);
  },
};

export const FeedbackAPI = {
  create: async (data: {
    type: string;
    title: string;
    content: string;
    layer: string;
    communityId?: string;
    demoId?: string;
    demoTitle?: string;
    communityName?: string;
  }): Promise<Feedback> => {
    const result = await apiRequest<Feedback>('/feedback', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.data;
  },

  getMy: async (): Promise<Feedback[]> => {
    const result = await apiRequest<Feedback[]>('/feedback/my');
    return result.data;
  },

  getPending: async (): Promise<Feedback[]> => {
    const result = await apiRequest<Feedback[]>('/feedback/pending');
    return result.data;
  },

  updateStatus: async (
    id: string,
    status: string,
    resolution?: string
  ): Promise<Feedback> => {
    const result = await apiRequest<Feedback>(`/feedback/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, resolution }),
    });
    return result.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiRequest<void>(`/feedback/${id}`, {
      method: 'DELETE',
    });
  },
};

export const AnnouncementsAPI = {
  getAll: async (params?: { layer?: string; communityId?: string }): Promise<Announcement[]> => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value);
        }
      });
    }
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const result = await apiRequest<Announcement[]>(`/announcements${query}`);
    return result.data;
  },

  getAllAdmin: async (): Promise<Announcement[]> => {
    const result = await apiRequest<Announcement[]>('/announcements/all');
    return result.data;
  },

  create: async (announcement: Omit<Announcement, 'id' | 'createdAt'>): Promise<Announcement> => {
    const result = await apiRequest<Announcement>('/announcements', {
      method: 'POST',
      body: JSON.stringify(announcement),
    });
    return result.data;
  },

  toggleActive: async (id: string, isActive: boolean): Promise<Announcement> => {
    const result = await apiRequest<Announcement>(`/announcements/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
    return result.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiRequest<void>(`/announcements/${id}`, {
      method: 'DELETE',
    });
  },
};

// Features API - Data Storage and Multiplayer
export const FeaturesAPI = {
  // Data Storage
  getData: async (demoId: string): Promise<Record<string, any>> => {
    const result = await apiRequest<Record<string, any>>(`/features/demos/${demoId}/data`);
    return result.data;
  },

  saveData: async (demoId: string, key: string, value: any, type?: string): Promise<void> => {
    await apiRequest<void>(`/features/demos/${demoId}/data`, {
      method: 'POST',
      body: JSON.stringify({ key, value, type }),
    });
  },

  deleteData: async (demoId: string, key: string): Promise<void> => {
    await apiRequest<void>(`/features/demos/${demoId}/data/${key}`, {
      method: 'DELETE',
    });
  },

  // Multiplayer Rooms
  getRooms: async (demoId: string): Promise<any[]> => {
    const result = await apiRequest<any[]>(`/features/demos/${demoId}/rooms`);
    return result.data;
  },

  createRoom: async (demoId: string, roomName: string, maxPlayers?: number): Promise<{ roomId: string }> => {
    const result = await apiRequest<{ roomId: string }>(`/features/demos/${demoId}/rooms`, {
      method: 'POST',
      body: JSON.stringify({ roomName, maxPlayers }),
    });
    return result.data;
  },

  joinRoom: async (roomId: string): Promise<{ members: any[] }> => {
    const result = await apiRequest<{ members: any[] }>(`/features/rooms/${roomId}/join`, {
      method: 'POST',
    });
    return result.data;
  },

  leaveRoom: async (roomId: string): Promise<void> => {
    await apiRequest<void>(`/features/rooms/${roomId}/leave`, {
      method: 'POST',
    });
  },

  getRoomMembers: async (roomId: string): Promise<any[]> => {
    const result = await apiRequest<any[]>(`/features/rooms/${roomId}/members`);
    return result.data;
  },
};
