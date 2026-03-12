
export type Language = 'en' | 'cn';

export type UserRole = 'user' | 'general_admin';

export type Layer = 'general' | 'community';

export type DemoStatus = 'published' | 'pending' | 'rejected';

// General Layer fixed subjects
export enum Subject {
  Physics = 'Physics',
  Chemistry = 'Chemistry',
  Mathematics = 'Mathematics',
  Biology = 'Biology',
  ComputerScience = 'Computer Science',
  Astronomy = 'Astronomy',
  EarthScience = 'Earth Science',
  CreativeTools = 'Creative Tools'
}

// Community Layer dynamic categories
export interface Category {
  id: string;
  name: string;
  parentId: string | null; // null means root level in community layer
  communityId?: string; // If null, it might be a general layer category (future proofing)
  createdAt: number;
}

export interface Bounty {
  id: string;
  title: string;
  description: string;
  reward: string;
  rewardPoints: number;
  layer: Layer;
  communityId?: string;
  status: 'open' | 'in_review' | 'closed';
  creator: string;
  creatorId: string;
  createdAt: number;
  acceptedSolutionId?: string;
  acceptedUserId?: string;
  solutions?: Array<{
    id: string;
    bountyId: string;
    demoId: string;
    userId: string;
    username: string;
    submittedAt: number;
    status: 'pending' | 'accepted' | 'rejected';
    rejectionReason?: string;
    reviewedAt?: number;
  }>;
  publishLayer?: Layer;
  publishCommunityId?: string;
  publishCategoryId?: string;
  programTitle?: string;
  programDescription?: string;
  programTags?: string[];
}

// Announcement type
export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'general' | 'community'; // General for all users, Community for specific community
  layer: Layer;
  communityId?: string; // Only for community announcements
  createdBy: string; // User ID
  createdByUsername?: string;
  createdAt: number;
  expiresAt?: number; // Optional expiration time
  isActive: boolean;
}

export interface DemoComment {
  id: string;
  demoId: string;
  userId: string;
  username: string;
  content: string;
  createdAt: number;
}

export type CommunityType = 'open' | 'closed';

export interface Community {
  id: string;
  name: string;
  description: string;
  creatorId: string; // The user who created it (and is the admin)
  code: string; // 12-digit random code
  status: 'pending' | 'approved' | 'rejected';
  members: string[]; // List of User IDs who are members
  pendingMembers: string[]; // List of User IDs asking to join
  adminMembers: string[]; // List of User IDs who are sub-admins
  type: CommunityType; // 'open' or 'closed'
  createdAt: number;
}

export interface DemoConfig {
  dataStorage?: {
    enabled: boolean;
    autoSave?: boolean;
    saveKeys?: Array<{ key: string; type: string }>;
  };
  multiplayer?: {
    enabled: boolean;
    maxPlayers?: number;
    syncEvents?: Array<{ name: string; reliable?: boolean; throttle?: number }>;
  };
}

export interface DemoLocation {
  layer: Layer;
  communityId?: string;
  communityName?: string;
  categoryId: string;
}

export interface Demo {
  id: string;
  title: string;
  // For General layer, categoryId is the Subject enum value. 
  // For Community layer, it's the Category.id.
  categoryId: string; 
  layer: Layer;
  communityId?: string; // Crucial for isolating community content
  description: string;
  code: string; // The HTML/JS source or entry file path for multi-file projects
  originalCode?: string; // Original code before AI configuration
  author: string;
  creatorId?: string; // User ID of the creator
  thumbnailUrl?: string; // Base64 or URL
  status: DemoStatus;
  createdAt: number;
  rejectionReason?: string;
  bountyId?: string; // Optional link to a bounty task
  likeCount?: number; // Number of likes (optional, populated on demand)
  userLiked?: boolean; // Whether current user has liked this demo
  projectType?: 'single-file' | 'multi-file'; // Project type
  entryFile?: string; // Entry file path for multi-file projects
  projectSize?: number; // Project total size in bytes
  config?: DemoConfig; // AI-generated configuration
  archived?: boolean; // Whether the demo is archived (soft deleted)
  archivedAt?: number; // When the demo was archived
  locations?: DemoLocation[]; // All locations where this demo is published
  tags?: string[]; // Tags for the demo
}

export type UserLevel = 'learner' | 'researcher1' | 'researcher2' | 'researcher3' | 'co_creator';

export interface AvatarBorder {
  id: string;
  name: string;
  category: string;
  color: string;
  price: number;
}

export interface AvatarAccessory {
  id: string;
  name: string;
  category: string;
  price: number;
  icon?: string;
  color?: string;
  bg?: string;
}

export interface AvatarEffect {
  id: string;
  name: string;
  category: string;
  price: number;
  color?: string;
  animation?: string;
  bg?: string;
}

export interface ProfileTheme {
  id: string;
  name: string;
  price: number;
  colors: {
    primary: string;
    secondary: string;
    background: string;
  };
}

export interface ProfileBackground {
  id: string;
  name: string;
  price: number;
  pattern?: string;
  colors?: {
    accent1: string;
    accent2: string;
    accent3: string;
  };
  imageUrl?: string;
}

export interface UsernameColor {
  id: string;
  name: string;
  category: string;
  color: string;
  price: number;
}

export interface UsernameEffect {
  id: string;
  name: string;
  price: number;
}

export interface CustomTitle {
  id: string;
  name: string;
  category: string;
  price: number;
}



export interface Achievement {
  id: string;
  name: string;
  description: string;
  price: number;
  unlocked: boolean;
}

export interface ProfileEffect {
  id: string;
  name: string;
  category: string;
  price: number;
  animation: string;
  color: string;
  bg?: string;
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  createdAt: number;
  isBanned: number;
  banReason?: string;
  contactInfo?: string;
  paymentQr?: string;
  bio?: string;
  contributionPoints: number;
  points: number;
  communityPoints: number;
  level: UserLevel;
  favorites: string[];
  avatarBorder?: string;
  usernameColor?: string;
  profileTheme?: string;
  avatarAccessory?: string;
  avatarEffect?: string;
  profileBackground?: string;
  usernameEffect?: string;
  customTitle?: string;
  profileEffect?: string;
  achievementWallStyle?: string;
  unlockedAchievements: string[];
  ownedItems: Array<{ type: string; id: string; purchasedAt: number }>;
}

export interface UserStats {
  demosCount: number;
  communitiesCount: number;
  communitiesManaged: Community[];
  likedDemos: Demo[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface DemoPublication {
  id: string;
  demoId: string;
  layer: Layer;
  communityId?: string;
  categoryId: string;
  status: 'pending' | 'published' | 'rejected';
  rejectionReason?: string;
  requestedBy: string;
  requestedAt: number;
  reviewedBy?: string;
  reviewedAt?: number;
}

export type FeedbackType = 'demo_complaint' | 'community_feedback' | 'website_feedback' | 'ban_appeal';

export interface Feedback {
  id: string;
  type: FeedbackType;
  title: string;
  content: string;
  layer: Layer;
  communityId?: string;
  demoId?: string;
  demoTitle?: string;
  communityName?: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'dismissed';
  resolution?: string;
  createdBy: string;
  createdAt: number;
  reviewedBy?: string;
  reviewedAt?: number;
}

export interface CommunityBan {
  id: string;
  communityId: string;
  userId: string;
  reason?: string;
  bannedBy: string;
  createdAt: number;
}

export interface DemoComment {
  id: string;
  demoId: string;
  userId: string;
  username: string;
  content: string;
  createdAt: number;
}
