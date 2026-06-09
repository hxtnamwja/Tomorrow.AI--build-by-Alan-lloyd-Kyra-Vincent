import { Demo, Category, Bounty, Community, User, UserStats, Announcement } from '../types';
import {
  DemosAPI,
  CommunitiesAPI,
  CategoriesAPI,
  BountiesAPI,
  AuthAPI,
  UsersAPI,
  AnnouncementsAPI
} from './apiService';

// Seed data for initial setup
const SEED_DEMOS: Demo[] = [
  {
    id: 'demo-001',
    title: 'Wave Interference Pattern',
    description: 'A visualization of wave interference patterns showing constructive and destructive interference.',
    categoryId: 'Physics',
    layer: 'general',
    code: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; overflow: hidden; background: #0f172a; }
    canvas { display: block; }
    .controls {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      padding: 15px 25px;
      border-radius: 30px;
      color: white;
      font-family: system-ui, sans-serif;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <canvas id="canvas"></canvas>
  <div class="controls">Wave Interference Simulation</div>
  <script>
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let time = 0;
    function animate() {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      for (let i = 0; i < 50; i++) {
        const angle = (i / 50) * Math.PI * 2;
        const r = 100 + Math.sin(time + i * 0.2) * 30;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;

        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = \`hsl(\${200 + i * 2}, 70%, 60%)\`;
        ctx.fill();
      }

      time += 0.05;
      requestAnimationFrame(animate);
    }
    animate();
  </script>
</body>
</html>`,
    author: 'Dr. Smith',
    creatorId: 'system',
    status: 'published',
    createdAt: Date.now(),
  }
];

const SEED_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'AP Physics C', parentId: null, createdAt: Date.now() },
];

const SEED_BOUNTIES: Bounty[] = [
  {
    id: 'b-1',
    title: 'Viscous Fluid Simulation',
    description: 'We need a high-performance visual of fluid dynamics with adjustable viscosity parameters.',
    reward: '$200 Grant',
    rewardPoints: 200,
    layer: 'general',
    status: 'open',
    creator: 'Admin',
    creatorId: 'admin-001',
    createdAt: Date.now()
  }
];

// Helper to generate community code
const generateCommunityCode = () => {
  return Math.random().toString().slice(2, 14);
};

// In-memory storage for announcements (for demo)
let announcementsStore: Announcement[] = [
  {
    id: 'ann-1',
    title: 'Welcome to Tomorrow!',
    content: 'Welcome to Tomorrow! We are excited to have you here. Explore our demos, join communities, and participate in bounties!',
    type: 'general',
    layer: 'general',
    createdBy: 'seed-admin',
    createdByUsername: 'Admin',
    createdAt: Date.now(),
    isActive: true,
  }
];

let nextAnnouncementId = 2;

export const StorageService = {
  // Initialize - check API connection
  initialize: async () => {
    try {
      // Check if we have a stored token and validate it
      const user = AuthAPI.getStoredUser();
      if (user) {
        try {
          await AuthAPI.getCurrentUser();
        } catch {
          // Token invalid, clear it
          AuthAPI.logout();
        }
      }
    } catch (error) {
      console.error('Storage initialization error:', error);
    }
  },

  // Auth methods
  login: async (username: string, password: string) => {
    return await AuthAPI.login(username, password);
  },

  register: async (username: string, password: string) => {
    return await AuthAPI.register(username, password);
  },


  logout: () => {
    AuthAPI.logout();
  },

  getCurrentUser: () => {
    return AuthAPI.getStoredUser();
  },

  // --- Communities ---
  getCommunities: async (params?: { type?: string }): Promise<Community[]> => {
    try {
      return await CommunitiesAPI.getAll(params);
    } catch (error) {
      console.error('Error fetching communities:', error);
      return [];
    }
  },

  createCommunity: async (
    name: string,
    description: string,
    creatorId: string,
    type?: string,
    translations?: { nameCn?: string; nameEn?: string; descriptionCn?: string; descriptionEn?: string }
  ): Promise<Community> => {
    return await CommunitiesAPI.create(name, description, type, translations);
  },

  joinOpenCommunity: async (communityId: string): Promise<Community> => {
    return await CommunitiesAPI.join(communityId);
  },

  joinCommunityRequest: async (communityId: string, userId: string) => {
    await CommunitiesAPI.requestJoin(communityId);
  },

  joinCommunityByCode: async (code: string, userId: string): Promise<boolean> => {
    try {
      await CommunitiesAPI.joinByCode(code);
      return true;
    } catch {
      return false;
    }
  },

  approveCommunity: async (id: string) => {
    await CommunitiesAPI.updateStatus(id, 'approved');
  },

  rejectCommunity: async (id: string) => {
    await CommunitiesAPI.updateStatus(id, 'rejected');
  },

  manageMember: async (communityId: string, memberId: string, action: 'accept' | 'kick' | 'reject_request') => {
    await CommunitiesAPI.manageMember(communityId, memberId, action);
  },

  updateCommunityCode: async (communityId: string, newCode: string) => {
    await CommunitiesAPI.updateCode(communityId);
  },

  saveCommunity: async (community: Community): Promise<Community> => {
    return await CommunitiesAPI.update(community.id, community);
  },

  deleteCommunity: async (communityId: string): Promise<void> => {
    await CommunitiesAPI.delete(communityId);
  },

  banCommunityUser: async (communityId: string, userId: string, reason?: string): Promise<void> => {
    await CommunitiesAPI.banUser(communityId, userId, reason);
  },

  unbanCommunityUser: async (communityId: string, userId: string): Promise<void> => {
    await CommunitiesAPI.unbanUser(communityId, userId);
  },

  getCommunityBans: async (communityId: string): Promise<any[]> => {
    try {
      return await CommunitiesAPI.getBans(communityId);
    } catch (error) {
      console.error('Error fetching community bans:', error);
      return [];
    }
  },

  // --- Demos ---
  getAllDemos: async (): Promise<Demo[]> => {
    try {
      // Get all demos regardless of status (for admin review)
      return await DemosAPI.getAll({});
    } catch (error) {
      console.error('Error fetching demos:', error);
      return SEED_DEMOS;
    }
  },

  getPublishedDemos: async (): Promise<Demo[]> => {
    try {
      return await DemosAPI.getAll({ status: 'published' });
    } catch (error) {
      console.error('Error fetching published demos:', error);
      return [];
    }
  },

  getDemosByLayer: async (layer: string, communityId?: string): Promise<Demo[]> => {
    try {
      // Get all demos for the layer (including pending for admin review)
      // Only pass communityId if it's a valid string
      const params: any = { layer };
      if (communityId && communityId.trim() !== '') {
        params.communityId = communityId;
      }
      return await DemosAPI.getAll(params);
    } catch (error) {
      console.error('Error fetching demos by layer:', error);
      return [];
    }
  },

  // Get demos sorted by likes
  getDemosSortedByLikes: async (params?: {
    layer?: string;
    communityId?: string;
    categoryId?: string;
    search?: string;
    status?: string;
  }): Promise<Demo[]> => {
    try {
      // Filter out undefined/null values from params
      const cleanParams: any = {};
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            cleanParams[key] = value;
          }
        });
      }
      return await DemosAPI.getAllSortedByLikes(cleanParams);
    } catch (error) {
      console.error('Error fetching demos sorted by likes:', error);
      return [];
    }
  },

  saveDemo: async (demo: Demo) => {
    return await DemosAPI.create(demo);
  },

  updateDemoStatus: async (id: string, status: string, rejectionReason?: string) => {
    await DemosAPI.updateStatus(id, status, rejectionReason);
  },

  updateDemoCover: async (id: string, thumbnailUrl: string) => {
    await DemosAPI.updateCover(id, thumbnailUrl);
  },

  deleteDemo: async (id: string, reason?: string) => {
    await DemosAPI.delete(id, reason);
  },

  // --- Categories ---
  getCategories: async (): Promise<Category[]> => {
    try {
      return await CategoriesAPI.getAll();
    } catch (error) {
      console.error('Error fetching categories:', error);
      return SEED_CATEGORIES;
    }
  },

  getCategoriesByLayer: async (layer: string, communityId?: string): Promise<Category[]> => {
    try {
      return await CategoriesAPI.getAll({ layer, communityId });
    } catch (error) {
      console.error('Error fetching categories by layer:', error);
      return [];
    }
  },

  saveCategory: async (category: Category) => {
    await CategoriesAPI.create(category.name, category.parentId, category.communityId, category.icon, {
      nameCn: category.nameCn,
      nameEn: category.nameEn
    });
  },

  addCategory: async (name: string, parentId: string | null, communityId?: string, icon?: string, translations?: { nameCn?: string; nameEn?: string }) => {
    await CategoriesAPI.create(name, parentId, communityId, icon, translations);
  },

  deleteCategory: async (id: string) => {
    await CategoriesAPI.delete(id);
  },

  updateCategory: async (id: string, updates: Partial<Category>) => {
    const payload: { name?: string; nameCn?: string | null; nameEn?: string | null; icon?: string | null } = {};
    if (updates.name !== undefined) {
      payload.name = updates.name;
    }
    if (updates.icon !== undefined) {
      payload.icon = updates.icon || null;
    }
    if (updates.nameCn !== undefined) {
      payload.nameCn = updates.nameCn || null;
    }
    if (updates.nameEn !== undefined) {
      payload.nameEn = updates.nameEn || null;
    }
    if (Object.keys(payload).length > 0) {
      await CategoriesAPI.update(id, payload);
    }
  },

  // --- Bounties ---
  getBounties: async (): Promise<Bounty[]> => {
    try {
      return await BountiesAPI.getAll();
    } catch (error) {
      console.error('Error fetching bounties:', error);
      return SEED_BOUNTIES;
    }
  },

  getBountiesByLayer: async (layer: string, communityId?: string): Promise<Bounty[]> => {
    try {
      return await BountiesAPI.getAll({ layer, communityId });
    } catch (error) {
      console.error('Error fetching bounties by layer:', error);
      return [];
    }
  },

  saveBounty: async (bounty: Bounty) => {
    await BountiesAPI.create({
      title: bounty.title,
      description: bounty.description,
      reward: bounty.reward,
      rewardPoints: bounty.rewardPoints,
      layer: bounty.layer,
      communityId: bounty.communityId,
      publishLayer: bounty.publishLayer,
      publishCommunityId: bounty.publishCommunityId,
      publishCategoryId: bounty.publishCategoryId
    });
  },

  addBounty: async (bounty: Bounty | Omit<Bounty, 'id' | 'createdAt'>) => {
    let rewardPoints: number;
    if ('rewardPoints' in bounty) {
      rewardPoints = bounty.rewardPoints;
    } else {
      rewardPoints = parseInt((bounty as any).reward) || 0;
    }
    await BountiesAPI.create({
      title: bounty.title,
      description: bounty.description,
      reward: bounty.reward,
      rewardPoints,
      layer: bounty.layer,
      communityId: bounty.communityId,
      publishLayer: bounty.publishLayer,
      publishCommunityId: bounty.publishCommunityId,
      publishCategoryId: bounty.publishCategoryId
    });
  },

  deleteBounty: async (id: string) => {
    await BountiesAPI.delete(id);
  },

  // --- Users ---
  getAllUsers: async (): Promise<User[]> => {
    try {
      return await UsersAPI.getAll();
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  },

  getAllPublicUsers: async (): Promise<User[]> => {
    try {
      return await UsersAPI.getAllPublic();
    } catch (error) {
      console.error('Error fetching public users:', error);
      return [];
    }
  },

  getUsersByCommunity: async (communityId: string): Promise<User[]> => {
    try {
      return await UsersAPI.getByCommunity(communityId);
    } catch (error) {
      console.error('Error fetching community users:', error);
      return [];
    }
  },

  getUserById: async (id: string): Promise<User | null> => {
    try {
      return await UsersAPI.getById(id);
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  },

  banUser: async (id: string, reason?: string) => {
    await UsersAPI.ban(id, reason);
  },

  unbanUser: async (id: string) => {
    await UsersAPI.unban(id);
  },

  updateUser: async (id: string, data: {
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
    return await UsersAPI.update(id, data);
  },

  updateContributionPoints: async (userId: string, points: number) => {
    return await UsersAPI.update(userId, { contributionPoints: points });
  },

  updatePoints: async (userId: string, points: number) => {
    return await UsersAPI.update(userId, { points });
  },

  addFavorite: async (userId: string, demoId: string) => {
    const user = await UsersAPI.getById(userId);
    if (user) {
      const favorites = user.favorites || [];
      if (!favorites.includes(demoId)) {
        return await UsersAPI.update(userId, { favorites: [...favorites, demoId] });
      }
    }
    return user;
  },

  removeFavorite: async (userId: string, demoId: string) => {
    const user = await UsersAPI.getById(userId);
    if (user) {
      const favorites = user.favorites || [];
      return await UsersAPI.update(userId, {
        favorites: favorites.filter(id => id !== demoId)
      });
    }
    return user;
  },

  getUserStats: async (id: string): Promise<UserStats | null> => {
    try {
      return await UsersAPI.getStats(id);
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return null;
    }
  },

  getUserDemos: async (id: string, params?: { search?: string }): Promise<Demo[]> => {
    try {
      return await UsersAPI.getDemos(id, params);
    } catch (error) {
      console.error('Error fetching user demos:', error);
      return [];
    }
  },

  // --- Announcements ---
  getAnnouncements: async (params?: {
    layer?: string;
    communityId?: string;
  }): Promise<Announcement[]> => {
    try {
      return await AnnouncementsAPI.getAll(params);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      return [];
    }
  },

  getAllAnnouncementsAdmin: async (): Promise<Announcement[]> => {
    try {
      return await AnnouncementsAPI.getAllAdmin();
    } catch (error) {
      console.error('Error fetching all announcements:', error);
      return [];
    }
  },

  createAnnouncement: async (announcement: Omit<Announcement, 'id' | 'createdAt'>): Promise<Announcement> => {
    try {
      return await AnnouncementsAPI.create(announcement);
    } catch (error) {
      console.error('Error creating announcement:', error);
      throw error;
    }
  },

  toggleAnnouncementActive: async (id: string, isActive: boolean): Promise<Announcement> => {
    try {
      return await AnnouncementsAPI.toggleActive(id, isActive);
    } catch (error) {
      console.error('Error toggling announcement active:', error);
      throw error;
    }
  },

  deleteAnnouncement: async (id: string): Promise<void> => {
    try {
      await AnnouncementsAPI.delete(id);
    } catch (error) {
      console.error('Error deleting announcement:', error);
      throw error;
    }
  },

  // --- Demo Tags ---
  updateDemoTags: async (demoId: string, tags: string[]): Promise<Demo> => {
    // This would call API in real implementation
    const demos = await DemosAPI.getAll({});
    const demo = demos.find(d => d.id === demoId);
    if (demo) {
      demo.tags = tags;
    }
    return demo as Demo;
  },

  // --- Search with tags ---
  searchDemos: async (query: string, params?: {
    layer?: string;
    communityId?: string;
    tags?: string[];
  }): Promise<Demo[]> => {
    try {
      const demos = await DemosAPI.getAll({
        layer: params?.layer,
        communityId: params?.communityId,
        status: 'published'
      });

      const lowerQuery = query.toLowerCase();
      return demos.filter(demo => {
        const matchesQuery = !query ||
          demo.title.toLowerCase().includes(lowerQuery) ||
          demo.description.toLowerCase().includes(lowerQuery) ||
          (demo.tags && demo.tags.some(tag => tag.toLowerCase().includes(lowerQuery)));

        const matchesTags = !params?.tags || params.tags.length === 0 ||
          (demo.tags && params.tags.some(tag => demo.tags!.includes(tag)));

        return matchesQuery && matchesTags;
      });
    } catch (error) {
      console.error('Error searching demos:', error);
      return [];
    }
  },
};
