import React, { useState, useEffect } from 'react';
import { UserRole, User as UserType, Community, Demo, Feedback, Language } from '../types';
import { UserCircle, ShieldCheck, Edit3, Save, X, Mail, QrCode, BookOpen, Building2, Heart, Image as ImageIcon, MessageSquare, Archive, RotateCcw, Trash2, Star, Trophy, Award, ChevronRight, BookMarked, FlaskConical, Beaker, ShoppingBag, Sparkles, Crown, Atom, Compass, Cat, Rabbit, Gem, Gift, Lightbulb, Flame, Wand2, Monitor, Gamepad2, Zap, Ghost, HelpCircle, Search, Loader2 } from 'lucide-react';
import { StorageService } from '../services/storageService';
import { FeedbackAPI, DemosAPI, CommunitiesAPI } from '../services/apiService';
import FeedbackList from './FeedbackList';
import { LEVEL_CONFIG, LEVEL_PRIVILEGES, calculateLevel, getLevelInfo, getPointsToNextLevel, AVATAR_BORDERS, USERNAME_COLORS, USERNAME_EFFECTS, PROFILE_THEMES, CUSTOM_TITLES, APP_THEMES, AVATAR_ACCESSORIES, AVATAR_EFFECTS, PROFILE_BACKGROUNDS, PROFILE_EFFECTS, hasExclusiveBadgeDisplay, hasExclusiveAvatarBorder, isOnContributorWall } from '../constants';

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

interface ProfilePageProps {
  userId: string;
  currentUserId: string;
  currentUserRole: UserRole;
  t: (key: string) => string;
  lang: Language;
  onBack: () => void;
  onOpenCommunity?: (communityId: string) => void;
  onOpenDemo?: (demo: Demo) => void;
  communities?: Community[];
  isBanned?: number;
  banReason?: string;
  onOpenBanAppeal?: () => void;
  onOpenPointsShop?: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  userId,
  currentUserId,
  currentUserRole,
  t,
  lang,
  onBack,
  onOpenCommunity,
  onOpenDemo,
  communities = [],
  isBanned,
  banReason,
  onOpenBanAppeal,
  onOpenPointsShop
}) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [userDemos, setUserDemos] = useState<Demo[]>([]);
  const [archivedDemos, setArchivedDemos] = useState<Demo[]>([]);
  const [favoriteDemos, setFavoriteDemos] = useState<Demo[]>([]);
  const [userFeedbacks, setUserFeedbacks] = useState<Feedback[]>([]);
	  const [userDemosLoaded, setUserDemosLoaded] = useState(false);
	  const [archivedDemosLoaded, setArchivedDemosLoaded] = useState(false);
	  const [userDemosVisible, setUserDemosVisible] = useState(false);
	  const [archivedDemosVisible, setArchivedDemosVisible] = useState(false);
  const [userDemosLoading, setUserDemosLoading] = useState(false);
  const [archivedDemosLoading, setArchivedDemosLoading] = useState(false);
  const [userDemosSearch, setUserDemosSearch] = useState('');
  const [archivedDemosSearch, setArchivedDemosSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
	    contactInfo: '',
	    paymentQr: '',
	    avatarImage: '',
	    bio: ''
	  });
  const [saving, setSaving] = useState(false);
  const [showPaymentQrUpload, setShowPaymentQrUpload] = useState(false);
  const [showPointsInfo, setShowPointsInfo] = useState(false);
  const [personalCommunityAccess, setPersonalCommunityAccess] = useState<'member' | 'pending' | 'none' | null>(null);
  const [personalCommunity, setPersonalCommunity] = useState<Community | null>(null);
  const [personalCommunityLoading, setPersonalCommunityLoading] = useState(false);

  const isOwnProfile = userId === currentUserId;

  const canAccessDemo = (demo: Demo): boolean => {
    if (demo.layer !== 'community' || !demo.communityId) {
      return true;
    }
    const community = communities.find(c => c.id === demo.communityId);
    if (!community) {
      return false;
    }
    const isMember = community.members.includes(currentUserId);
    const isAdmin = currentUserRole === 'general_admin';
    return isMember || isAdmin;
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const userData = await StorageService.getUserById(userId);
      const statsData = await StorageService.getUserStats(userId);
      
      setUser(userData);
      setStats(statsData);
      setUserDemos([]);
      setArchivedDemos([]);
	      setUserDemosLoaded(false);
	      setArchivedDemosLoaded(false);
	      setUserDemosVisible(false);
	      setArchivedDemosVisible(false);
      setUserDemosSearch('');
      setArchivedDemosSearch('');
      
      // Load favorite demos
      if (userData?.favorites && userData.favorites.length > 0) {
        const allDemos = await StorageService.getPublishedDemos();
        const favorites = allDemos.filter(demo => userData.favorites.includes(demo.id));
        setFavoriteDemos(favorites);
      }
      
      if (isOwnProfile) {
        try {
          const feedbacksData = await FeedbackAPI.getMy();
          setUserFeedbacks(feedbacksData);
        } catch (error) {
          console.error('Failed to load feedback:', error);
        }
      }

      if (!isOwnProfile && currentUserId) {
        try {
          const personalResult = await CommunitiesAPI.getPersonalByUser(userId);
          setPersonalCommunity(personalResult.community);
          setPersonalCommunityAccess(personalResult.access);
        } catch (error) {
          setPersonalCommunity(null);
          setPersonalCommunityAccess(null);
        }
      } else {
        setPersonalCommunity(null);
        setPersonalCommunityAccess(null);
      }
      
      if (userData && isOwnProfile) {
        setEditForm({
          username: userData.username,
          password: '',
          confirmPassword: '',
	          contactInfo: userData.contactInfo || '',
	          paymentQr: userData.paymentQr || '',
	          avatarImage: userData.avatarImage || '',
	          bio: userData.bio || ''
	        });
      }
    } catch (error) {
      console.error('Failed to load profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshData = () => {
    loadData();
  };

  const handlePersonalCommunityAction = async () => {
    if (!personalCommunity) return;
    if (personalCommunityAccess === 'member') {
      onOpenCommunity?.(personalCommunity.id);
      return;
    }
    if (personalCommunityAccess === 'pending') return;
    setPersonalCommunityLoading(true);
    try {
      await CommunitiesAPI.requestJoin(personalCommunity.id);
      setPersonalCommunityAccess('pending');
      alert(lang === 'cn' ? '访问申请已提交，等待对方通过。' : 'Access request submitted.');
    } catch (error: any) {
      alert(error?.message || (lang === 'cn' ? '申请失败' : 'Request failed'));
    } finally {
      setPersonalCommunityLoading(false);
    }
  };

  const loadUserDemos = async (search = userDemosSearch) => {
    setUserDemosLoading(true);
    try {
      const demosData = await StorageService.getUserDemos(userId, { search: search.trim() || undefined });
	      setUserDemos(demosData);
	      setUserDemosLoaded(true);
	      setUserDemosVisible(true);
    } catch (error) {
      console.error('Failed to load user demos:', error);
      alert(lang === 'cn' ? '发布作品加载失败' : 'Failed to load published works');
    } finally {
      setUserDemosLoading(false);
    }
  };

  const loadArchivedDemos = async (search = archivedDemosSearch) => {
    if (!isOwnProfile) return;
    setArchivedDemosLoading(true);
    try {
      const archivedDemosData = await DemosAPI.getArchivedByUser(userId, { search: search.trim() || undefined });
	      setArchivedDemos(archivedDemosData);
	      setArchivedDemosLoaded(true);
	      setArchivedDemosVisible(true);
    } catch (error) {
      console.error('Failed to load archived demos:', error);
      alert(lang === 'cn' ? '留档加载失败' : 'Failed to load archive');
    } finally {
      setArchivedDemosLoading(false);
    }
  };

  const handleRestoreDemo = async (demoId: string) => {
    if (!confirm(t('confirmRestoreDemo'))) {
      return;
    }
    try {
      await DemosAPI.restore(demoId);
      setArchivedDemos(prev => prev.filter(d => d.id !== demoId));
      if (userDemosLoaded) {
        loadUserDemos();
      }
    } catch (error) {
      console.error('Failed to restore demo:', error);
      alert(t('restoreFailed'));
    }
  };

  const handleDeletePermanently = async (demoId: string) => {
    if (!confirm(t('confirmPermanentlyDeleteDemo'))) {
      return;
    }
    try {
      await DemosAPI.deletePermanently(demoId);
      setArchivedDemos(prev => prev.filter(d => d.id !== demoId));
    } catch (error) {
      console.error('Failed to delete demo permanently:', error);
      alert(t('permanentlyDeleteFailed'));
    }
  };

  const handleClearArchive = async () => {
    if (!isOwnProfile || archivedDemosLoading) return;
    const firstConfirm = confirm(lang === 'cn'
      ? '确定要永久清空留档区吗？这里的所有留档程序都会从存储中删除。'
      : 'Permanently clear the archive? All archived programs will be removed from storage.');
    if (!firstConfirm) return;
    const secondConfirm = confirm(lang === 'cn'
      ? '请再次确认：此操作不可撤销。'
      : 'Please confirm again: this action cannot be undone.');
    if (!secondConfirm) return;

    setArchivedDemosLoading(true);
    try {
      await DemosAPI.clearArchivedByUser(userId);
	      setArchivedDemos([]);
	      setArchivedDemosLoaded(true);
	      setArchivedDemosVisible(true);
    } catch (error) {
      console.error('Failed to clear archive:', error);
      alert(lang === 'cn' ? '清空留档失败' : 'Failed to clear archive');
    } finally {
      setArchivedDemosLoading(false);
    }
  };

  const handleDeleteDemo = async (demoId: string) => {
    if (!confirm(t('confirmDeleteDemoToArchive'))) {
      return;
    }
    try {
      await DemosAPI.delete(demoId);
      setUserDemos(prev => prev.filter(d => d.id !== demoId));
      if (archivedDemosLoaded) {
        loadArchivedDemos();
      }
    } catch (error) {
      console.error('Failed to delete demo:', error);
      alert(t('deleteFailed'));
    }
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  const handleSave = async () => {
    if (editForm.password && editForm.password !== editForm.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setSaving(true);
    try {
	      const updateData: any = {
	        username: editForm.username,
	        contactInfo: editForm.contactInfo || null,
	        avatarImage: editForm.avatarImage || null,
	        bio: editForm.bio || null
	      };
      if (editForm.password) {
        updateData.password = editForm.password;
      }
      if (editForm.paymentQr) {
        updateData.paymentQr = editForm.paymentQr;
      }

      const updatedUser = await StorageService.updateUser(userId, updateData);
      setUser(updatedUser);
      setIsEditing(false);
      setEditForm(prev => ({
        ...prev,
        password: '',
        confirmPassword: ''
      }));
    } catch (error: any) {
      alert(`Failed to save changes: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handlePaymentQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm(prev => ({ ...prev, paymentQr: reader.result as string }));
        setShowPaymentQrUpload(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert(lang === 'cn' ? '请选择图片文件' : 'Please choose an image file');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditForm(prev => ({ ...prev, avatarImage: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
          {t('back')}
        </button>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        {(() => {
          const profileTheme = user?.profileTheme;
          const themeData = profileTheme ? PROFILE_THEMES.find(t => t.id === profileTheme) : null;
          const profileBg = user?.profileBackground;
          const bgData = profileBg ? PROFILE_BACKGROUNDS.find(b => b.id === profileBg) : null;
          let bannerStyle = {};
          let cardStyle = {};
          
          if (themeData) {
            cardStyle = { 
              borderColor: `${themeData.colors.primary}30`,
              boxShadow: `0 0 40px ${themeData.colors.primary}10`
            };
            bannerStyle = { background: themeData.colors.background };
          } else {
            bannerStyle = { background: 'linear-gradient(to right, #6366f1, #8b5cf6)' };
          }
          
          const renderPattern = () => {
            if (!bgData) return null;
            const pattern = bgData.pattern;
            const color = bgData.colors?.accent1 || '#8b5cf6';
            const color2 = bgData.colors?.accent2 || '#6d28d9';
            const color3 = bgData.colors?.accent3 || '#5b21b6';
            
            switch(pattern) {
              case 'mosaic-diamond':
                return (
                  <div className="absolute inset-0 overflow-hidden">
                    {[
                      { x: 25, y: 25, size: 80, rotate: 45, c: color, delay: 0 },
                      { x: 75, y: 25, size: 64, rotate: 12, c: color2, delay: 0.3 },
                      { x: 33, y: 75, size: 96, rotate: -12, c: color, delay: 0.6 },
                      { x: 80, y: 75, size: 72, rotate: 45, c: color2, delay: 0.9 },
                      { x: 50, y: 50, size: 128, rotate: 0, c: color, delay: 1.2 }
                    ].map((d, i) => (
                      <div
                        key={i}
                        className="absolute"
                        style={{
                          left: `${d.x}%`,
                          top: `${d.y}%`,
                          width: `${d.size}px`,
                          height: `${d.size}px`,
                          backgroundColor: `${d.c}${i % 2 === 0 ? '33' : '26'}`,
                          transform: `translate(-50%, -50%) rotate(${d.rotate}deg)`,
                          animation: 'mosaicPulse 2s ease-in-out infinite',
                          animationDelay: `${d.delay}s`
                        }}
                      />
                    ))}
                  </div>
                );
              case 'herringbone':
                return (
                  <div className="absolute inset-0 overflow-hidden">
                    {[...Array(6)].map((_, i) => (
                      <div 
                        key={i}
                        className="absolute"
                        style={{
                          left: `${10 + i * 15}%`,
                          top: '10%',
                          width: '40px',
                          height: '80%',
                          background: `repeating-linear-gradient(
                            45deg,
                            ${color}40 0px,
                            ${color}40 15px,
                            transparent 15px,
                            transparent 30px
                          )`,
                          transform: `translateY(${i % 2 === 0 ? '0' : '15'}px)`,
                          opacity: 0.7,
                          animation: 'herringboneSlide 2s ease-in-out infinite',
                          animationDelay: `${i * 0.2}s`
                        }}
                      />
                    ))}
                  </div>
                );
              case 'greek':
                return (
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-1/4 left-1/4 right-1/4" style={{ borderTop: `4px solid ${color}59`, borderBottom: `4px solid ${color}59`, height: '60px', animation: 'greekPulse 2s ease-in-out infinite' }} />
                    <div className="absolute top-1/2 left-1/4 right-1/4" style={{ borderTop: `3px solid ${color2}4d`, borderBottom: `3px solid ${color2}4d`, height: '40px', transform: 'translateY(40px)', animation: 'greekPulse 2s ease-in-out infinite', animationDelay: '0.3s' }} />
                    <div className="absolute top-1/4 left-1/4 w-4 h-full" style={{ borderLeft: `3px solid ${color}4d`, borderRight: `3px solid ${color}4d`, animation: 'greekPulse 2s ease-in-out infinite', animationDelay: '0.6s' }} />
                    <div className="absolute top-1/4 right-1/4 w-4 h-full" style={{ borderLeft: `3px solid ${color2}40`, borderRight: `3px solid ${color2}40`, animation: 'greekPulse 2s ease-in-out infinite', animationDelay: '0.9s' }} />
                    <div className="absolute top-8 left-8 w-24 h-24" style={{ border: `3px solid ${color}33`, animation: 'greekRotate 10s linear infinite' }} />
                    <div className="absolute bottom-8 right-8 w-20 h-20" style={{ border: `3px solid ${color2}2e`, animation: 'greekRotate 8s linear infinite reverse' }} />
                  </div>
                );
              case 'modern-grid':
                return (
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute left-1/4 top-0 bottom-0 w-0.5" style={{ backgroundColor: `${color}4d`, animation: 'gridPulse 2s ease-in-out infinite' }} />
                    <div className="absolute left-1/2 top-0 bottom-0 w-0.5" style={{ backgroundColor: `${color2}40`, animation: 'gridPulse 2s ease-in-out infinite', animationDelay: '0.3s' }} />
                    <div className="absolute left-3/4 top-0 bottom-0 w-0.5" style={{ backgroundColor: `${color}4d`, animation: 'gridPulse 2s ease-in-out infinite', animationDelay: '0.6s' }} />
                    <div className="absolute top-1/4 left-0 right-0 h-0.5" style={{ backgroundColor: `${color2}40`, animation: 'gridPulse 2s ease-in-out infinite', animationDelay: '0.9s' }} />
                    <div className="absolute top-1/2 left-0 right-0 h-0.5" style={{ backgroundColor: `${color}4d`, animation: 'gridPulse 2s ease-in-out infinite', animationDelay: '1.2s' }} />
                    <div className="absolute top-3/4 left-0 right-0 h-0.5" style={{ backgroundColor: `${color2}40`, animation: 'gridPulse 2s ease-in-out infinite', animationDelay: '1.5s' }} />
                    <div className="absolute top-1/8 left-1/8 w-20 h-20" style={{ border: `2px solid ${color}33`, animation: 'gridRotate 15s linear infinite' }} />
                    <div className="absolute top-5/8 left-5/8 w-16 h-16" style={{ border: `2px solid ${color2}2e`, animation: 'gridRotate 12s linear infinite reverse' }} />
                  </div>
                );
              case 'sacred':
                return (
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 opacity-20 rounded-full" style={{ border: `4px solid ${color}`, animation: 'sacredPulse 3s ease-in-out infinite' }} />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 opacity-25 rounded-full" style={{ border: `4px solid ${color2}`, transform: 'translate(-50%, -50%) rotate(45deg)', animation: 'sacredPulse 3s ease-in-out infinite', animationDelay: '0.5s' }} />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 opacity-30" style={{ backgroundColor: color, clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)', animation: 'sacredPulse 3s ease-in-out infinite', animationDelay: '1s' }} />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 opacity-15" style={{ border: `2px dashed ${color}`, borderRadius: '50%', animation: 'sacredRotate 20s linear infinite' }} />
                  </div>
                );
              case 'art-deco-fan':
                return (
                  <div className="absolute inset-0 overflow-hidden">
                    {[...Array(12)].map((_, i) => (
                      <div 
                        key={i} 
                        className="absolute top-1/2 left-1/2 w-2 origin-top"
                        style={{ 
                          background: i % 3 === 0 ? `${color}59` : i % 3 === 1 ? `${color2}40` : `${color}33`,
                          height: '60%',
                          transform: `translate(-50%, -100%) rotate(${(i * 15) - 90}deg)`,
                          transformOrigin: 'bottom center',
                          animation: 'artDecoWave 2s ease-in-out infinite',
                          animationDelay: `${i * 0.1}s`
                        }} 
                      />
                    ))}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24" style={{ border: `3px solid ${color}4d`, borderRadius: '50%', animation: 'artDecoPulse 2s ease-in-out infinite' }} />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16" style={{ backgroundColor: `${color2}33`, borderRadius: '50%', animation: 'artDecoPulse 2s ease-in-out infinite', animationDelay: '0.5s' }} />
                  </div>
                );
              case 'hexagonal':
                return (
                  <div className="absolute inset-0 overflow-hidden">
                    {[
                      { x: 20, y: 25, size: 60 },
                      { x: 60, y: 35, size: 50 },
                      { x: 40, y: 55, size: 70 },
                      { x: 75, y: 65, size: 55 },
                      { x: 25, y: 70, size: 45 }
                    ].map((hex, i) => (
                      <div
                        key={i}
                        className="absolute"
                        style={{
                          left: `${hex.x}%`,
                          top: `${hex.y}%`,
                          width: `${hex.size}px`,
                          height: `${hex.size}px`,
                          backgroundColor: i % 2 === 0 ? `${color}33` : `${color2}26`,
                          clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                          transform: 'translate(-50%, -50%)',
                          animation: 'hexagonPulse 2s ease-in-out infinite',
                          animationDelay: `${i * 0.3}s`
                        }}
                      />
                    ))}
                  </div>
                );
              case 'moroccan':
                return (
                  <div className="absolute inset-0 overflow-hidden">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute"
                        style={{
                          left: `${15 + i * 22}%`,
                          top: '20%',
                          width: '60px',
                          height: '60%',
                          background: `repeating-linear-gradient(
                            90deg,
                            ${color}40 0px,
                            ${color}40 8px,
                            transparent 8px,
                            transparent 20px
                          )`,
                          opacity: 0.6,
                          animation: 'moroccanSlide 2s ease-in-out infinite',
                          animationDelay: `${i * 0.2}s`
                        }}
                      />
                    ))}
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={`v-${i}`}
                        className="absolute"
                        style={{
                          top: `${15 + i * 25}%`,
                          left: '10%',
                          width: '80%',
                          height: '30px',
                          background: `repeating-linear-gradient(
                            0deg,
                            ${color2}33 0px,
                            ${color2}33 6px,
                            transparent 6px,
                            transparent 15px
                          )`,
                          opacity: 0.5,
                          animation: 'moroccanSlide 2s ease-in-out infinite',
                          animationDelay: `${i * 0.3 + 0.1}s`
                        }}
                      />
                    ))}
                  </div>
                );
              case 'checkerboard':
                return (
                  <div className="absolute inset-0 overflow-hidden">
                    {[
                      { x: 17, y: 17, size: 128, c: color },
                      { x: 83, y: 17, size: 112, c: color2 },
                      { x: 17, y: 83, size: 112, c: color2 },
                      { x: 83, y: 83, size: 128, c: color },
                      { x: 50, y: 50, size: 160, c: color },
                      { x: 25, y: 25, size: 80, c: color2 },
                      { x: 75, y: 75, size: 80, c: color }
                    ].map((d, i) => (
                      <div
                        key={i}
                        className="absolute"
                        style={{
                          left: `${d.x}%`,
                          top: `${d.y}%`,
                          width: `${d.size}px`,
                          height: `${d.size}px`,
                          backgroundColor: `${d.c}${i < 4 ? '33' : '26'}`,
                          transform: 'translate(-50%, -50%)',
                          animation: 'checkerPulse 2s ease-in-out infinite',
                          animationDelay: `${i * 0.2}s`
                        }}
                      />
                    ))}
                  </div>
                );
              case 'solar':
                return (
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full" style={{ 
                      backgroundColor: color, 
                      boxShadow: `0 0 40px ${color}80, 0 0 80px ${color}60, 0 0 120px ${color}40`,
                      animation: 'solarPulse 3s ease-in-out infinite'
                    }} />
                    
                    {[
                      { distance: 45, size: 3, color: color2, duration: 4 },
                      { distance: 65, size: 4, color: color3, duration: 6 },
                      { distance: 85, size: 3.5, color: color2, duration: 8 },
                      { distance: 105, size: 5, color: color3, duration: 10 },
                      { distance: 125, size: 3, color: color2, duration: 12 },
                      { distance: 145, size: 4.5, color: color3, duration: 14 },
                      { distance: 165, size: 4, color: color2, duration: 16 },
                      { distance: 185, size: 3.5, color: color3, duration: 18 }
                    ].map((planet, i) => (
                      <div key={i} className="absolute top-1/2 left-1/2" style={{
                        animation: `orbit ${planet.duration}s linear infinite`
                      }}>
                        <div 
                          className="absolute w-1 h-1 rounded-full"
                          style={{ 
                            border: `1px solid ${i % 2 === 0 ? color2 : color3}66`,
                            width: `${planet.distance * 2}px`,
                            height: `${planet.distance * 2}px`,
                            transform: 'translate(-50%, -50%)',
                            borderRadius: '50%'
                          }}
                        />
                        <div 
                          className="absolute w-2 h-2 rounded-full"
                          style={{ 
                            backgroundColor: planet.color,
                            boxShadow: `0 0 ${planet.size * 2}px ${planet.color}99`,
                            width: `${planet.size}px`,
                            height: `${planet.size}px`,
                            transform: `translate(-50%, -50%) translateY(-${planet.distance}px)`,
                            opacity: 0.8
                          }}
                        />
                      </div>
                    ))}
                    
                    {[...Array(25)].map((_, i) => (
                      <div
                        key={`star-${i}`}
                        className="absolute w-0.5 h-0.5 rounded-full"
                        style={{
                          backgroundColor: i % 3 === 0 ? color : color2,
                          top: `${Math.random() * 100}%`,
                          left: `${Math.random() * 100}%`,
                          opacity: 0.3 + Math.random() * 0.5,
                          boxShadow: `0 0 2px currentColor`,
                          animation: `starTwinkle ${1 + Math.random() * 2}s ease-in-out infinite`,
                          animationDelay: `${Math.random() * 2}s`
                        }}
                      />
                    ))}
                  </div>
                );
              default:
                return null;
            }
          };
          
          const renderProfileEffect = () => {
            const effectId = user?.profileEffect;
            if (!effectId) return null;
            const effectData = PROFILE_EFFECTS.find(e => e.id === effectId);
            if (!effectData) return null;
            
            const { animation, color } = effectData;
            
            switch(animation) {
              case 'star-twinkle':
                return (
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(30)].map((_, i) => {
                      const size = 1 + Math.random() * 2;
                      const x = Math.random() * 100;
                      const y = Math.random() * 100;
                      const delay = Math.random() * 3;
                      const duration = 1 + Math.random() * 2;
                      
                      return (
                        <div
                          key={i}
                          className="absolute rounded-full"
                          style={{
                            width: `${size}px`,
                            height: `${size}px`,
                            backgroundColor: color,
                            boxShadow: `0 0 ${4 + size * 2}px ${color}, 0 0 ${8 + size * 3}px ${color}60`,
                            top: `${y}%`,
                            left: `${x}%`,
                            animation: `twinkle ${duration}s ease-in-out infinite`,
                            animationDelay: `${delay}s`
                          }}
                        />
                      );
                    })}
                    {[...Array(5)].map((_, i) => {
                      const x = 10 + Math.random() * 80;
                      const y = 10 + Math.random() * 80;
                      return (
                        <div
                          key={`star-${i}`}
                          className="absolute"
                          style={{
                            top: `${y}%`,
                            left: `${x}%`,
                            animation: `starRotate ${4 + i}s linear infinite`
                          }}
                        >
                          {[0, 90].map((angle, j) => (
                            <div
                              key={j}
                              className="absolute top-1/2 left-1/2"
                              style={{
                                width: '12px',
                                height: '2px',
                                backgroundColor: color,
                                boxShadow: `0 0 6px ${color}`,
                                transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                                animation: `starGlow 1.5s ease-in-out infinite`,
                                animationDelay: `${i * 0.2}s`
                              }}
                            />
                          ))}
                        </div>
                      );
                    })}
                    <style>{`
                      @keyframes twinkle {
                        0%, 100% { opacity: 0.2; transform: scale(0.6); }
                        50% { opacity: 1; transform: scale(1.5); }
                      }
                      @keyframes starRotate {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                      }
                      @keyframes starGlow {
                        0%, 100% { opacity: 0.5; }
                        50% { opacity: 1; }
                      }
                    `}</style>
                  </div>
                );
                
              case 'floating-particles':
                return (
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(25)].map((_, i) => {
                      const size = 2 + Math.random() * 4;
                      const x = Math.random() * 100;
                      const y = 100 + Math.random() * 20;
                      const duration = 4 + Math.random() * 4;
                      const delay = Math.random() * 4;
                      const hue = color;
                      
                      return (
                        <div
                          key={i}
                          className="absolute rounded-full"
                          style={{
                            width: `${size}px`,
                            height: `${size}px`,
                            backgroundColor: `${hue}${Math.floor(40 + Math.random() * 40).toString(16).padStart(2, '0')}`,
                            boxShadow: `0 0 ${size * 2}px ${hue}40`,
                            bottom: '-20px',
                            left: `${x}%`,
                            animation: `particleFloat ${duration}s ease-in infinite`,
                            animationDelay: `${delay}s`
                          }}
                        />
                      );
                    })}
                    <style>{`
                      @keyframes particleFloat {
                        0% { 
                          transform: translateY(0) translateX(0) scale(0.5); 
                          opacity: 0; 
                        }
                        10% { 
                          opacity: 1; 
                        }
                        90% { 
                          opacity: 1; 
                        }
                        100% { 
                          transform: translateY(-150px) translateX(${Math.random() > 0.5 ? '30px' : '-30px'}) scale(1.2); 
                          opacity: 0; 
                        }
                      }
                    `}</style>
                  </div>
                );
                
              case 'aurora-wave':
                return (
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div 
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(
                          180deg,
                          transparent 0%,
                          ${color}10 20%,
                          ${color}30 35%,
                          ${color}20 50%,
                          ${color}15 65%,
                          transparent 80%
                        )`,
                        filter: 'blur(20px)',
                        animation: 'auroraWave 8s ease-in-out infinite'
                      }}
                    />
                    <div 
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(
                          -180deg,
                          transparent 0%,
                          ${color}15 25%,
                          ${color}25 40%,
                          ${color}15 55%,
                          transparent 75%
                        )`,
                        filter: 'blur(15px)',
                        animation: 'auroraWave2 10s ease-in-out infinite',
                        animationDelay: '-2s'
                      }}
                    />
                    <style>{`
                      @keyframes auroraWave {
                        0%, 100% { 
                          transform: translateY(-10%) scaleY(1); 
                          opacity: 0.6; 
                        }
                        33% { 
                          transform: translateY(0%) scaleY(1.2); 
                          opacity: 0.8; 
                        }
                        66% { 
                          transform: translateY(10%) scaleY(0.9); 
                          opacity: 0.5; 
                        }
                      }
                      @keyframes auroraWave2 {
                        0%, 100% { 
                          transform: translateY(10%) scaleY(0.9); 
                          opacity: 0.4; 
                        }
                        33% { 
                          transform: translateY(-5%) scaleY(1.1); 
                          opacity: 0.7; 
                        }
                        66% { 
                          transform: translateY(5%) scaleY(1); 
                          opacity: 0.5; 
                        }
                      }
                    `}</style>
                  </div>
                );
                
              case 'glow-pulse':
                return (
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(3)].map((_, i) => (
                      <div 
                        key={i}
                        className="absolute inset-0"
                        style={{
                          background: `radial-gradient(circle at 50% 50%, ${color}${30 - i * 10} 0%, transparent ${50 + i * 10}%)`,
                          animation: `glowPulse ${1.5 + i * 0.5}s ease-in-out infinite`,
                          animationDelay: `${i * 0.3}s`
                        }}
                      />
                    ))}
                    <div 
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full"
                      style={{
                        boxShadow: `0 0 30px ${color}60, 0 0 60px ${color}40, 0 0 90px ${color}20`,
                        animation: 'centerGlow 2s ease-in-out infinite'
                      }}
                    />
                    <style>{`
                      @keyframes glowPulse {
                        0%, 100% { 
                          transform: scale(0.8); 
                          opacity: 0.4; 
                        }
                        50% { 
                          transform: scale(1.1); 
                          opacity: 0.8; 
                        }
                      }
                      @keyframes centerGlow {
                        0%, 100% { 
                          box-shadow: 0 0 30px ${color}60, 0 0 60px ${color}40, 0 0 90px ${color}20; 
                        }
                        50% { 
                          boxShadow: 0 0 50px ${color}80, 0 0 100px ${color}60, 0 0 150px ${color}40; 
                        }
                      }
                    `}</style>
                  </div>
                );
                
              case 'rain-shimmer':
                return (
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(20)].map((_, i) => {
                      const x = Math.random() * 100;
                      const width = 1 + Math.random() * 2;
                      const height = 20 + Math.random() * 30;
                      const duration = 1.5 + Math.random() * 1.5;
                      const delay = Math.random() * 2;
                      
                      return (
                        <div
                          key={i}
                          className="absolute"
                          style={{
                            width: `${width}px`,
                            height: `${height}px`,
                            background: `linear-gradient(180deg, transparent 0%, ${color}60 30%, ${color}80 50%, ${color}60 70%, transparent 100%)`,
                            top: '-40%',
                            left: `${x}%`,
                            animation: `rainFall ${duration}s linear infinite`,
                            animationDelay: `${delay}s`,
                            opacity: 0.7
                          }}
                        />
                      );
                    })}
                    {[...Array(10)].map((_, i) => (
                      <div
                        key={`shimmer-${i}`}
                        className="absolute w-full h-1"
                        style={{
                          background: `linear-gradient(90deg, transparent, ${color}40, transparent)`,
                          top: `${10 + i * 10}%`,
                          animation: `shimmer 2s ease-in-out infinite`,
                          animationDelay: `${i * 0.2}s`
                        }}
                      />
                    ))}
                    <style>{`
                      @keyframes rainFall {
                        0% { 
                          transform: translateY(0); 
                          opacity: 0; 
                        }
                        10% { 
                          opacity: 1; 
                        }
                        90% { 
                          opacity: 1; 
                        }
                        100% { 
                          transform: translateY(500px); 
                          opacity: 0; 
                        }
                      }
                      @keyframes shimmer {
                        0%, 100% { 
                          transform: translateX(-100%); 
                          opacity: 0; 
                        }
                        50% { 
                          transform: translateX(0); 
                          opacity: 0.6; 
                        }
                      }
                    `}</style>
                  </div>
                );
                
              case 'firefly-dance':
                return (
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(18)].map((_, i) => {
                      const size = 2 + Math.random() * 3;
                      const x = 10 + Math.random() * 80;
                      const y = 15 + Math.random() * 70;
                      const duration = 3 + Math.random() * 3;
                      const delay = Math.random() * 3;
                      
                      return (
                        <div
                          key={i}
                          className="absolute rounded-full"
                          style={{
                            width: `${size}px`,
                            height: `${size}px`,
                            backgroundColor: color,
                            boxShadow: `0 0 ${size * 3}px ${color}, 0 0 ${size * 6}px ${color}60`,
                            top: `${y}%`,
                            left: `${x}%`,
                            animation: `fireflyDance ${duration}s ease-in-out infinite`,
                            animationDelay: `${delay}s`
                          }}
                        />
                      );
                    })}
                    <style>{`
                      @keyframes fireflyDance {
                        0% { 
                          opacity: 0.2; 
                          transform: translate(0, 0) scale(0.8); 
                        }
                        15% { 
                          opacity: 1; 
                          transform: translate(15px, -10px) scale(1.2); 
                        }
                        30% { 
                          opacity: 0.6; 
                          transform: translate(-10px, -20px) scale(1); 
                        }
                        45% { 
                          opacity: 1; 
                          transform: translate(-20px, 5px) scale(1.1); 
                        }
                        60% { 
                          opacity: 0.4; 
                          transform: translate(5px, 15px) scale(0.9); 
                        }
                        75% { 
                          opacity: 1; 
                          transform: translate(20px, 0) scale(1.2); 
                        }
                        100% { 
                          opacity: 0.2; 
                          transform: translate(0, 0) scale(0.8); 
                        }
                      }
                    `}</style>
                  </div>
                );
                
              case 'nebula-swirl':
                return (
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div 
                      className="absolute inset-0"
                      style={{
                        background: `radial-gradient(ellipse at 20% 30%, ${color}40 0%, transparent 45%), radial-gradient(ellipse at 80% 70%, ${color}35 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, ${color}25 0%, transparent 60%)`,
                        filter: 'blur(25px)',
                        animation: 'nebulaRotate 20s linear infinite'
                      }}
                    />
                    <div 
                      className="absolute inset-0"
                      style={{
                        background: `radial-gradient(ellipse at 70% 20%, ${color}30 0%, transparent 40%), radial-gradient(ellipse at 30% 80%, ${color}25 0%, transparent 45%)`,
                        filter: 'blur(20px)',
                        animation: 'nebulaRotate2 25s linear infinite reverse',
                        animationDelay: '-5s'
                      }}
                    />
                    {[...Array(8)].map((_, i) => (
                      <div 
                        key={i}
                        className="absolute top-1/2 left-1/2 w-1 h-1 rounded-full"
                        style={{
                          backgroundColor: color,
                          boxShadow: `0 0 8px ${color}, 0 0 16px ${color}60`,
                          transform: `translate(-50%, -50%) rotate(${i * 45}deg) translateY(-30px)`,
                          animation: `orbit ${5 + i}s linear infinite`
                        }}
                      />
                    ))}
                    <style>{`
                      @keyframes nebulaRotate {
                        from { transform: rotate(0deg) scale(1); }
                        to { transform: rotate(360deg) scale(1); }
                      }
                      @keyframes nebulaRotate2 {
                        from { transform: rotate(0deg) scale(1.1); }
                        to { transform: rotate(360deg) scale(1.1); }
                      }
                      @keyframes orbit {
                        from { transform: translate(-50%, -50%) rotate(0deg) translateY(-30px); }
                        to { transform: translate(-50%, -50%) rotate(360deg) translateY(-30px); }
                      }
                    `}</style>
                  </div>
                );
                
              case 'gradient-flow':
                return (
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div 
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(
                          45deg,
                          ${color}15,
                          transparent,
                          ${color}25,
                          transparent,
                          ${color}20,
                          transparent,
                          ${color}30
                        )`,
                        backgroundSize: '300% 300%',
                        animation: 'gradientShift 8s ease infinite'
                      }}
                    />
                    <div 
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(
                          -45deg,
                          transparent,
                          ${color}20,
                          transparent,
                          ${color}15,
                          transparent,
                          ${color}25
                        )`,
                        backgroundSize: '400% 400%',
                        animation: 'gradientShift 12s ease infinite reverse',
                        animationDelay: '-3s',
                        mixBlendMode: 'screen'
                      }}
                    />
                    <style>{`
                      @keyframes gradientShift {
                        0% { background-position: 0% 50%; }
                        25% { background-position: 50% 100%; }
                        50% { background-position: 100% 50%; }
                        75% { background-position: 50% 0%; }
                        100% { background-position: 0% 50%; }
                      }
                    `}</style>
                  </div>
                );
                
              default:
                return null;
            }
          };
          
          return (
            <>
              <div 
                className="h-32 relative overflow-hidden"
                style={bannerStyle}
              >
                {renderPattern()}
                {renderProfileEffect()}
              </div>
              <style>{`
                @keyframes mosaicPulse {
                  0%, 100% { transform: scale(1) rotate(var(--rotate, 0deg)); opacity: 0.7; }
                  50% { transform: scale(1.1) rotate(var(--rotate, 0deg)); opacity: 1; }
                }
                @keyframes herringboneSlide {
                  0%, 100% { transform: translateY(0); }
                  50% { transform: translateY(-10px); }
                }
                @keyframes greekPulse {
                  0%, 100% { opacity: 0.6; }
                  50% { opacity: 1; }
                }
                @keyframes greekRotate {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
                @keyframes gridPulse {
                  0%, 100% { opacity: 0.5; }
                  50% { opacity: 1; }
                }
                @keyframes gridRotate {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
                @keyframes sacredPulse {
                  0%, 100% { transform: translate(-50%, -50%) scale(1) rotate(var(--rotate, 0deg)); }
                  50% { transform: translate(-50%, -50%) scale(1.1) rotate(var(--rotate, 0deg)); }
                }
                @keyframes sacredRotate {
                  from { transform: translate(-50%, -50%) rotate(0deg); }
                  to { transform: translate(-50%, -50%) rotate(360deg); }
                }
                @keyframes artDecoWave {
                  0%, 100% { transform: translate(-50%, -100%) rotate(var(--rotate, 0deg)) scaleY(1); }
                  50% { transform: translate(-50%, -100%) rotate(var(--rotate, 0deg)) scaleY(0.9); }
                }
                @keyframes artDecoPulse {
                  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.7; }
                  50% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
                }
                @keyframes hexagonPulse {
                  0%, 100% { transform: translate(-50%, -50%) scale(1); }
                  50% { transform: translate(-50%, -50%) scale(1.15); }
                }
                @keyframes moroccanSlide {
                  0%, 100% { opacity: 0.5; transform: translateX(0); }
                  50% { opacity: 0.8; transform: translateX(5px); }
                }
                @keyframes checkerPulse {
                  0%, 100% { transform: scale(1); }
                  50% { transform: scale(1.1); }
                }
                @keyframes solarPulse {
                  0%, 100% { transform: translate(-50%, -50%) scale(1); }
                  50% { transform: translate(-50%, -50%) scale(1.1); }
                }
                @keyframes orbit {
                  from { transform: translate(-50%, -50%) rotate(0deg); }
                  to { transform: translate(-50%, -50%) rotate(360deg); }
                }
                @keyframes starTwinkle {
                  0%, 100% { opacity: 0.3; }
                  50% { opacity: 0.8; }
                }
              `}</style>
            </>
          );
        })()}
        
        <div className="px-6 pb-6">
          <div className="flex items-start justify-between -mt-12 mb-6">
            {(() => {
              const avatarBorder = user?.avatarBorder;
              const borderData = avatarBorder ? AVATAR_BORDERS.find(b => b.id === avatarBorder) : null;
              const avatarAccessory = user?.avatarAccessory;
              const accessoryData = avatarAccessory ? AVATAR_ACCESSORIES.find(a => a.id === avatarAccessory) : null;
              const avatarEffect = user?.avatarEffect;
              const effectData = avatarEffect ? AVATAR_EFFECTS.find(e => e.id === avatarEffect) : null;
              const usernameColor = user?.usernameColor;
              const colorData = usernameColor ? USERNAME_COLORS.find(c => c.id === usernameColor) : null;
              
              const renderAccessoryWithEffect = () => {
                if (!accessoryData) return null;
                
                const renderEffect = () => {
                  if (!effectData) return null;
                  
                  switch(effectData.animation) {
                    case 'glow':
                      return (
                        <>
                          <div 
                            className="absolute inset-0 animate-pulse rounded-full"
                            style={{ 
                              background: `radial-gradient(circle, ${effectData.color}60 0%, ${effectData.color}30 40%, transparent 70%)`,
                              boxShadow: `0 0 50px ${effectData.color}80, 0 0 100px ${effectData.color}60`
                            }} 
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            {[...Array(8)].map((_, i) => (
                              <div 
                                key={i}
                                className="absolute w-2 h-2 rounded-full animate-ping"
                                style={{ 
                                  backgroundColor: effectData.color,
                                  opacity: 0.8,
                                  transform: `rotate(${i * 45}deg) translateY(-15px)`,
                                  animationDelay: `${i * 0.1}s`
                                }}
                              />
                            ))}
                          </div>
                        </>
                      );
                    case 'pulse':
                      return (
                        <>
                          <div 
                            className="absolute -inset-4 rounded-full animate-ping"
                            style={{ 
                              background: `radial-gradient(circle, ${effectData.color}50, transparent)`,
                              animationDuration: '1.5s'
                            }}
                          />
                          <div 
                            className="absolute -inset-3 rounded-full animate-ping"
                            style={{ 
                              background: `radial-gradient(circle, ${effectData.color}40, transparent)`,
                              animationDuration: '1.5s',
                              animationDelay: '0.3s'
                            }}
                          />
                          <div 
                            className="absolute -inset-2 rounded-full animate-pulse"
                            style={{ 
                              background: `radial-gradient(circle, ${effectData.color}60, transparent)`,
                              animationDuration: '1s'
                            }}
                          />
                        </>
                      );
                    case 'aura':
                      return (
                        <>
                          <div 
                            className="absolute -inset-4 rounded-full animate-spin"
                            style={{ 
                              background: `conic-gradient(from 0deg, transparent, ${effectData.color}, ${effectData.color}80, transparent)`,
                              filter: 'blur(6px)',
                              animationDuration: '4s'
                            }}
                          />
                          <div 
                            className="absolute -inset-3 rounded-full animate-spin"
                            style={{ 
                              background: `conic-gradient(from 180deg, transparent, ${effectData.color}80, ${effectData.color}, transparent)`,
                              filter: 'blur(4px)',
                              animationDuration: '3s',
                              animationDirection: 'reverse'
                            }}
                          />
                          <div 
                            className="absolute -inset-2 rounded-full animate-spin"
                            style={{ 
                              background: `conic-gradient(from 90deg, transparent, ${effectData.color}60, transparent)`,
                              filter: 'blur(2px)',
                              animationDuration: '2s'
                            }}
                          />
                        </>
                      );
                    case 'fire':
                      return (
                        <>
                          <div 
                            className="absolute -inset-4 rounded-full animate-pulse"
                            style={{ 
                              background: `radial-gradient(ellipse at 50% 80%, #f9731660 0%, transparent 60%)`
                            }}
                          />
                          <div className="absolute -inset-2 overflow-hidden">
                            {[...Array(6)].map((_, i) => (
                              <div 
                                key={i}
                                className="absolute w-4 rounded-t-full"
                                style={{
                                  background: i % 2 === 0 ? '#fbbf24' : '#f97316',
                                  bottom: '-5px',
                                  left: `${20 + i * 12}%`,
                                  height: `${20 + Math.random() * 15}px`,
                                  opacity: 0.8,
                                  animation: `fireFlicker 0.5s ease-in-out infinite`,
                                  animationDelay: `${i * 0.1}s`
                                }}
                              />
                            ))}
                            <style>{`
                              @keyframes fireFlicker {
                                0%, 100% { transform: scaleY(1) scaleX(1); opacity: 0.8; }
                                50% { transform: scaleY(1.3) scaleX(0.9); opacity: 1; }
                              }
                            `}</style>
                          </div>
                        </>
                      );
                    case 'water':
                      return (
                        <>
                          <div 
                            className="absolute -inset-4 rounded-full overflow-hidden"
                          >
                            <div 
                              className="absolute inset-0"
                              style={{
                                background: `linear-gradient(180deg, transparent, ${effectData.color}30, transparent)`,
                                animation: 'waterWave 3s ease-in-out infinite',
                                animationDuration: '2s'
                              }}
                            />
                            {[...Array(4)].map((_, i) => (
                              <div 
                                key={i}
                                className="absolute w-2 h-2 rounded-full"
                                style={{
                                  backgroundColor: `${effectData.color}60`,
                                  top: `${30 + i * 15}%`,
                                  left: `${25 + i * 15}%`,
                                  animation: `waterBubble 2s ease-in-out infinite`,
                                  animationDelay: `${i * 0.3}s`
                                }}
                              />
                            ))}
                            <style>{`
                              @keyframes waterWave {
                                0%, 100% { transform: translateY(0); }
                                50% { transform: translateY(-10px); }
                              }
                              @keyframes waterBubble {
                                0%, 100% { transform: translateY(0) scale(1); opacity: 0.4; }
                                50% { transform: translateY(-15px) scale(1.5); opacity: 1; }
                              }
                            `}</style>
                          </div>
                        </>
                      );
                    case 'wind':
                      return (
                        <>
                          <div className="absolute -inset-4 overflow-hidden">
                            {[...Array(12)].map((_, i) => (
                              <div 
                                key={i}
                                className="absolute w-1 rounded-full"
                                style={{
                                  background: `linear-gradient(180deg, transparent, ${effectData.color}60, transparent)`,
                                  top: `${10 + Math.random() * 80}%`,
                                  left: '-10%',
                                  width: '2px',
                                  height: `${30 + Math.random() * 40}px`,
                                  animation: `windSweep 1.5s linear infinite`,
                                  animationDelay: `${i * 0.12}s`,
                                  opacity: 0.7
                                }}
                              />
                            ))}
                            <style>{`
                              @keyframes windSweep {
                                0% { transform: translateX(0) rotate(15deg); opacity: 0; }
                                20% { opacity: 1; }
                                80% { opacity: 1; }
                                100% { transform: translateX(150px) rotate(15deg); opacity: 0; }
                              }
                            `}</style>
                          </div>
                        </>
                      );
                    case 'aurora':
                      return (
                        <>
                          <div 
                            className="absolute -inset-4 rounded-full overflow-hidden"
                          >
                            <div 
                              className="absolute inset-0"
                              style={{
                                background: 'linear-gradient(45deg, #10b98150, #06b6d450, #8b5cf650, #ec489950)',
                                backgroundSize: '400% 400%',
                                animation: 'auroraShift 8s ease infinite',
                                filter: 'blur(8px)'
                              }}
                            />
                            <div 
                              className="absolute inset-0"
                              style={{
                                background: 'linear-gradient(-45deg, transparent 40%, #ffffff20 50%, transparent 60%)',
                                animation: 'shimmer 3s ease-in-out infinite'
                              }}
                            />
                            <style>{`
                              @keyframes auroraShift {
                                0% { background-position: 0% 50%; }
                                50% { background-position: 100% 50%; }
                                100% { background-position: 0% 50%; }
                              }
                              @keyframes shimmer {
                                0%, 100% { transform: translateX(-30%) rotate(45deg); }
                                50% { transform: translateX(30%) rotate(45deg); }
                              }
                            `}</style>
                          </div>
                        </>
                      );
                    case 'supernova':
                      return (
                        <>
                          <div 
                            className="absolute -inset-5 rounded-full animate-ping"
                            style={{ 
                              background: 'radial-gradient(circle, #fbbf2470 0%, #f9731650 30%, transparent 70%)',
                              animationDuration: '2s'
                            }}
                          />
                          <div 
                            className="absolute -inset-4 rounded-full animate-ping"
                            style={{ 
                              background: 'radial-gradient(circle, #f9731660 0%, #ef444440 40%, transparent 70%)',
                              animationDuration: '2s',
                              animationDelay: '0.5s'
                            }}
                          />
                          <div 
                            className="absolute -inset-3 rounded-full animate-pulse"
                            style={{ 
                              background: 'radial-gradient(circle, #facc1580 0%, #f9731660 50%, transparent 70%)',
                              animationDuration: '1s'
                            }}
                          />
                          {[...Array(12)].map((_, i) => (
                            <div 
                              key={i}
                              className="absolute w-1.5 h-1.5 rounded-full"
                              style={{
                                backgroundColor: i % 3 === 0 ? '#fbbf24' : i % 3 === 1 ? '#f97316' : '#ef4444',
                                boxShadow: `0 0 10px currentColor`,
                                transform: `translate(-50%, -50%) rotate(${i * 30}deg) translateY(-20px)`,
                                top: '50%',
                                left: '50%',
                                animation: `supernovaParticle 1s ease-out infinite`,
                                animationDelay: `${i * 0.08}s`
                              }}
                            />
                          ))}
                          <style>{`
                            @keyframes supernovaParticle {
                              0% { transform: translate(-50%, -50%) rotate(0deg) translateY(-20px) scale(1); opacity: 1; }
                              100% { transform: translate(-50%, -50%) rotate(${Math.random() * 360}deg) translateY(-50px) scale(0); opacity: 0; }
                            }
                          `}</style>
                        </>
                      );
                    case 'quantum':
                      return (
                        <>
                          <div className="absolute -inset-4 rounded-full animate-spin" style={{ 
                            border: '3px dashed #22d3ee80',
                            animationDuration: '2s'
                          }} />
                          <div className="absolute -inset-3 rounded-full animate-spin" style={{ 
                            border: '3px solid #22d3ee60',
                            animationDuration: '2.5s',
                            animationDirection: 'reverse'
                          }} />
                          <div className="absolute -inset-2 rounded-full animate-spin" style={{ 
                            border: '2px dotted #22d3ee40',
                            animationDuration: '1.5s'
                          }} />
                          {[...Array(6)].map((_, i) => (
                            <div 
                              key={i}
                              className="absolute w-2 h-2 rounded-full"
                              style={{
                                backgroundColor: '#22d3ee',
                                boxShadow: '0 0 10px #22d3ee, 0 0 20px #22d3ee80',
                                top: '50%',
                                left: '50%',
                                transform: `translate(-50%, -50%) rotate(${i * 60}deg) translateY(-12px)`,
                                animation: `quantumJump 0.8s ease-in-out infinite`,
                                animationDelay: `${i * 0.13}s`
                              }}
                            />
                          ))}
                          <style>{`
                            @keyframes quantumJump {
                              0%, 100% { opacity: 1; transform: translate(-50%, -50%) rotate(0deg) translateY(-12px) scale(1); }
                              50% { opacity: 0.3; transform: translate(-50%, -50%) rotate(180deg) translateY(-8px) scale(0.5); }
                            }
                          `}</style>
                        </>
                      );
                    case 'flash':
                      return (
                        <>
                          <div className="absolute -inset-4 overflow-hidden">
                            <div 
                              className="absolute inset-0 animate-pulse"
                              style={{ 
                                background: `radial-gradient(circle at 50% 50%, ${effectData.color}40 0%, transparent 50%)`,
                                animationDuration: '0.5s'
                              }}
                            />
                            {[...Array(4)].map((_, i) => (
                              <div 
                                key={i}
                                className="absolute"
                                style={{
                                  width: '3px',
                                  height: '20px',
                                  backgroundColor: effectData.color,
                                  boxShadow: `0 0 10px ${effectData.color}`,
                                  top: '50%',
                                  left: '50%',
                                  transformOrigin: '50% 0',
                                  transform: `translate(-50%, -50%) rotate(${i * 90}deg) translateY(-10px)`,
                                  animation: `lightningFlash 0.4s ease-in-out infinite`,
                                  animationDelay: `${i * 0.1}s`
                                }}
                              />
                            ))}
                            <style>{`
                              @keyframes lightningFlash {
                                0%, 40%, 80% { opacity: 1; }
                                20%, 60%, 100% { opacity: 0; }
                              }
                            `}</style>
                          </div>
                        </>
                      );
                    default:
                      return (
                        <>
                          <div className="absolute -inset-2 rounded-full animate-pulse" style={{ 
                            background: `radial-gradient(circle, ${effectData.color}40 0%, transparent 70%)`
                          }} />
                        </>
                      );
                  }
                };
                
                return (
                  <div 
                    className="absolute -top-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
                    style={{ background: accessoryData.bg || 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}
                  >
                    {renderEffect()}
                    {(() => {
                      switch(accessoryData.icon) {
                        case 'crown':
                        case 'emperor':
                          return <Crown className="w-5 h-5 text-white relative z-10" />;
                        case 'atom':
                          return <Atom className="w-5 h-5 text-white relative z-10" />;
                        case 'flask':
                          return <FlaskConical className="w-5 h-5 text-white relative z-10" />;
                        case 'compass':
                          return <Compass className="w-5 h-5 text-white relative z-10" />;
                        case 'cat':
                          return <Cat className="w-5 h-5 text-white relative z-10" />;
                        case 'bunny':
                        case 'rabbit':
                          return <Rabbit className="w-5 h-5 text-white relative z-10" />;
                        case 'star':
                          return <Star className="w-5 h-5 text-white relative z-10" />;
                        case 'trophy':
                          return <Trophy className="w-5 h-5 text-white relative z-10" />;
                        case 'diamond':
                        case 'gem':
                          return <Gem className="w-5 h-5 text-white relative z-10" />;
                        case 'santa':
                        case 'gift':
                          return <Gift className="w-5 h-5 text-white relative z-10" />;
                        case 'pumpkin':
                          return <Ghost className="w-5 h-5 text-white relative z-10" />;
                        case 'lantern':
                        case 'lightbulb':
                          return <Lightbulb className="w-5 h-5 text-white relative z-10" />;
                        case 'sparkles':
                          return <Sparkles className="w-5 h-5 text-white relative z-10" />;
                        case 'flame':
                          return <Flame className="w-5 h-5 text-white relative z-10" />;
                        case 'wand2':
                          return <Wand2 className="w-5 h-5 text-white relative z-10" />;
                        default:
                          return <Sparkles className="w-5 h-5 text-white relative z-10" />;
                      }
                    })()}
                  </div>
                );
              };
              
              return (
                <div className="relative">
	                  <div
	                    className="w-24 h-24 rounded-2xl relative overflow-hidden"
	                  >
	                    <div
	                      className={`absolute inset-0 flex items-center justify-center ${
	                        user?.role === 'general_admin' ? 'bg-purple-500' : 'bg-emerald-500'
	                      }`}
	                    >
	                      {user?.avatarImage ? (
	                        <img src={user.avatarImage} alt={user.username} className="w-full h-full object-cover" />
	                      ) : user?.role === 'general_admin' ? (
	                        <ShieldCheck className="w-12 h-12 text-white" />
	                      ) : (
	                        <UserCircle className="w-12 h-12 text-white" />
                      )}
                    </div>
                    {borderData && (
                      <div 
                        className="absolute inset-0 rounded-2xl pointer-events-none"
                        style={{
                          border: `6px solid transparent`,
                          background: borderData.color,
                          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                          WebkitMaskComposite: 'xor',
                          maskComposite: 'exclude',
                          padding: '6px',
                          boxShadow: `0 0 30px ${borderData.color}50`
                        }}
                      />
                    )}
                    {!borderData && (
                      <div className="absolute inset-0 rounded-2xl border-4 border-white pointer-events-none" />
                    )}
                  </div>
                  {renderAccessoryWithEffect()}
                </div>
              );
            })()}
            {isOwnProfile && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="mt-14 flex items-center gap-2 px-4 py-2 bg-white shadow-lg rounded-xl text-slate-700 hover:bg-slate-50 transition-colors font-medium"
              >
                {isEditing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                {isEditing ? t('cancel') : t('editProfile')}
              </button>
            )}
            {!isOwnProfile && personalCommunity && onOpenCommunity && (
              <button
                type="button"
                onClick={handlePersonalCommunityAction}
                disabled={personalCommunityLoading || personalCommunityAccess === 'pending'}
                className="mt-14 flex items-center gap-2 px-4 py-2 bg-violet-600 shadow-lg rounded-xl text-white hover:bg-violet-700 disabled:bg-slate-300 disabled:text-slate-500 transition-colors font-medium"
              >
                {personalCommunityLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />}
                {personalCommunityAccess === 'member'
                  ? (lang === 'cn' ? '进入个人社区' : 'Open personal community')
                  : personalCommunityAccess === 'pending'
                    ? (lang === 'cn' ? '申请待通过' : 'Request pending')
                    : (lang === 'cn' ? '申请访问个人社区' : 'Request personal community access')}
              </button>
            )}
          </div>

	          {isEditing && isOwnProfile ? (
	            <div className="space-y-4">
	              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
	                <label className="block text-xs font-bold text-slate-600 uppercase mb-3">{lang === 'cn' ? '个人头像' : 'Profile photo'}</label>
	                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
	                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white border border-slate-200 flex items-center justify-center shrink-0">
	                    {editForm.avatarImage ? (
	                      <img src={editForm.avatarImage} alt="Avatar preview" className="w-full h-full object-cover" />
	                    ) : (
	                      <UserCircle className="w-10 h-10 text-slate-300" />
	                    )}
	                  </div>
	                  <div className="flex flex-wrap gap-2">
	                    <input
	                      id="avatar-image-upload"
	                      type="file"
	                      accept="image/*"
	                      onChange={handleAvatarUpload}
	                      className="hidden"
	                    />
	                    <label
	                      htmlFor="avatar-image-upload"
	                      className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors text-sm font-bold text-slate-700"
	                    >
	                      <ImageIcon className="w-4 h-4" />
	                      {lang === 'cn' ? '上传头像' : 'Upload photo'}
	                    </label>
	                    {editForm.avatarImage && (
	                      <button
	                        type="button"
	                        onClick={() => setEditForm(prev => ({ ...prev, avatarImage: '' }))}
	                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 transition-colors text-sm font-bold"
	                      >
	                        <X className="w-4 h-4" />
	                        {lang === 'cn' ? '移除头像' : 'Remove'}
	                      </button>
	                    )}
	                  </div>
	                </div>
	              </div>
	              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">{t('username')}</label>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">{t('newPasswordOptional')}</label>
                  <input
                    type="password"
                    value={editForm.password}
                    onChange={(e) => setEditForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="••••••••"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">{t('confirmPassword')}</label>
                  <input
                    type="password"
                    value={editForm.confirmPassword}
                    onChange={(e) => setEditForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="••••••••"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1 flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5" />
                  {t('contactInfoOptional')}
                </label>
                <input
                  type="text"
                  value={editForm.contactInfo}
                  onChange={(e) => setEditForm(prev => ({ ...prev, contactInfo: e.target.value }))}
                  placeholder={t('emailWeChatEtc')}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1 flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5" />
                  {t('bioOptional')}
                </label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder={t('tellUsAboutYourself')}
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1 flex items-center gap-2">
                  <QrCode className="w-3.5 h-3.5" />
                  {t('paymentQrCodeOptional')}
                </label>
                {editForm.paymentQr ? (
                  <div className="flex items-start gap-4">
                    <img src={editForm.paymentQr} alt="Payment QR" className="w-32 h-32 object-cover rounded-xl border border-slate-200" />
                    <button
                      onClick={() => setEditForm(prev => ({ ...prev, paymentQr: '' }))}
                      className="px-3 py-1.5 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg text-sm font-medium transition-colors"
                    >
                      {t('remove')}
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      id="payment-qr-upload"
                      accept="image/*"
                      onChange={handlePaymentQrUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="payment-qr-upload"
                      className="flex items-center gap-2 px-4 py-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <ImageIcon className="w-5 h-5 text-slate-400" />
                      <span className="text-slate-500">{t('clickToUploadPaymentQrCode')}</span>
                    </label>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    if (user) {
                      setEditForm({
                        username: user.username,
                        password: '',
	                        confirmPassword: '',
	                        contactInfo: user.contactInfo || '',
	                        paymentQr: user.paymentQr || '',
	                        avatarImage: user.avatarImage || '',
	                        bio: user.bio || ''
	                      });
                    }
                  }}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-medium transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-90 rounded-xl font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {t('saveChanges')}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {(() => {
                    const usernameColor = user?.usernameColor;
                    const colorData = usernameColor ? USERNAME_COLORS.find(c => c.id === usernameColor) : null;
                    const usernameEffect = user?.usernameEffect;
                    const effectData = usernameEffect ? USERNAME_EFFECTS.find(e => e.id === usernameEffect) : null;
                    
                    let usernameStyle: React.CSSProperties = {
                      color: colorData ? colorData.color : '#1e293b'
                    };
                    
                    const renderUsernameEffect = () => {
                      if (!effectData) return null;
                      
                      switch(effectData.animation) {
                        case 'sparkle':
                          return (
                            <div className="absolute -inset-8 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
                              {[...Array(20)].map((_, i) => (
                                <div
                                  key={i}
                                  className="absolute rounded-full"
                                  style={{
                                    width: `${1 + Math.random() * 2}px`,
                                    height: `${1 + Math.random() * 2}px`,
                                    backgroundColor: effectData.color,
                                    boxShadow: `0 0 ${4 + Math.random() * 4}px ${effectData.color}`,
                                    top: `${Math.random() * 100}%`,
                                    left: `${Math.random() * 100}%`,
                                    animation: `sparkleFloat ${1.5 + Math.random() * 2}s ease-in-out infinite`,
                                    animationDelay: `${Math.random() * 2}s`
                                  }}
                                />
                              ))}
                              {[...Array(5)].map((_, i) => (
                                <div
                                  key={`star-${i}`}
                                  className="absolute"
                                  style={{
                                    top: `${15 + Math.random() * 70}%`,
                                    left: `${15 + Math.random() * 70}%`,
                                    animation: `sparkleStarRotate ${3 + i}s linear infinite`
                                  }}
                                >
                                  {[0, 45, 90, 135].map((angle, j) => (
                                    <div
                                      key={j}
                                      className="absolute top-1/2 left-1/2"
                                      style={{
                                        width: `${8 + Math.random() * 4}px`,
                                        height: '2px',
                                        backgroundColor: effectData.color,
                                        boxShadow: `0 0 4px ${effectData.color}`,
                                        transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                                        animation: `sparkleStarGlow 1.5s ease-in-out infinite`,
                                        animationDelay: `${i * 0.3}s`
                                      }}
                                    />
                                  ))}
                                </div>
                              ))}
                              <style>{`
                                @keyframes sparkleFloat {
                                  0%, 100% { 
                                    opacity: 0.2; 
                                    transform: translate(0, 0) scale(0.6); 
                                  }
                                  50% { 
                                    opacity: 1; 
                                    transform: translate(5px, 5px) scale(1.3); 
                                  }
                                }
                                @keyframes sparkleStarRotate {
                                  from { transform: rotate(0deg); }
                                  to { transform: rotate(360deg); }
                                }
                                @keyframes sparkleStarGlow {
                                  0%, 100% { opacity: 0.4; }
                                  50% { opacity: 1; }
                                }
                              `}</style>
                            </div>
                          );
                        case 'neon':
                          return (
                            <div className="absolute -inset-8 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
                              <div 
                                className="absolute inset-0"
                                style={{ 
                                  background: `radial-gradient(ellipse at 50% 50%, ${effectData.color}40 0%, transparent 60%)`,
                                  animation: 'neonPulse 2s ease-in-out infinite'
                                }} 
                              />
                              <div 
                                className="absolute inset-0"
                                style={{ 
                                  boxShadow: `inset 0 0 40px ${effectData.color}66`,
                                  animation: 'neonGlow 1.5s ease-in-out infinite'
                                }} 
                              />
                              <style>{`
                                @keyframes neonPulse {
                                  0%, 100% { opacity: 0.5; transform: scale(0.95); }
                                  50% { opacity: 1; transform: scale(1.05); }
                                }
                                @keyframes neonGlow {
                                  0%, 100% { box-shadow: inset 0 0 40px ${effectData.color}66; }
                                  50% { box-shadow: inset 0 0 60px ${effectData.color}99; }
                                }
                              `}</style>
                            </div>
                          );
                        case 'fire':
                          return (
                            <div className="absolute -inset-8 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
                              {[...Array(8)].map((_, i) => {
                                const height = 20 + Math.random() * 30;
                                const left = 10 + i * 12;
                                const delay = Math.random() * 0.5;
                                return (
                                  <div
                                    key={i}
                                    className="absolute bottom-0"
                                    style={{
                                      left: `${left}%`,
                                      width: `${8 + Math.random() * 8}px`,
                                      height: `${height}px`,
                                      background: `linear-gradient(
                                        180deg,
                                        ${effectData.color}00 0%,
                                        ${effectData.color}66 30%,
                                        ${effectData.color}cc 60%,
                                        ${effectData.color}ff 100%
                                      )`,
                                      borderRadius: '50% 50% 20% 20% / 40% 40% 20% 20%',
                                      transformOrigin: 'bottom center',
                                      animation: `fireFlicker ${0.8 + Math.random() * 0.5}s ease-in-out infinite`,
                                      animationDelay: `${delay}s`
                                    }}
                                  />
                                );
                              })}
                              {[...Array(12)].map((_, i) => (
                                <div
                                  key={`ember-${i}`}
                                  className="absolute w-1.5 h-1.5 rounded-full"
                                  style={{
                                    backgroundColor: effectData.color,
                                    boxShadow: `0 0 6px ${effectData.color}`,
                                    bottom: '10%',
                                    left: `${10 + Math.random() * 80}%`,
                                    animation: `emberRise ${2 + Math.random() * 2}s ease-in infinite`,
                                    animationDelay: `${Math.random() * 2}s`
                                  }}
                                />
                              ))}
                              <style>{`
                                @keyframes fireFlicker {
                                  0%, 100% { 
                                    transform: scaleY(1) scaleX(1); 
                                    opacity: 0.8; 
                                  }
                                  25% { 
                                    transform: scaleY(1.15) scaleX(0.9); 
                                    opacity: 1; 
                                  }
                                  50% { 
                                    transform: scaleY(0.9) scaleX(1.1); 
                                    opacity: 0.7; 
                                  }
                                  75% { 
                                    transform: scaleY(1.1) scaleX(0.95); 
                                    opacity: 0.9; 
                                  }
                                }
                                @keyframes emberRise {
                                  0% { 
                                    transform: translateY(0) scale(0.5); 
                                    opacity: 0; 
                                  }
                                  10% { 
                                    opacity: 1; 
                                  }
                                  90% { 
                                    opacity: 1; 
                                  }
                                  100% { 
                                    transform: translateY(-80px) scale(1.2); 
                                    opacity: 0; 
                                  }
                                }
                              `}</style>
                            </div>
                          );
                        case 'water':
                          return (
                            <div className="absolute -inset-4 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
                              <div 
                                className="absolute bottom-0 left-0 right-0"
                                style={{
                                  height: '50%',
                                  background: `linear-gradient(180deg, transparent, ${effectData.color}33 30%, ${effectData.color}66 100%)`,
                                  animation: 'waterWave 3s ease-in-out infinite'
                                }}
                              />
                              {[...Array(6)].map((_, i) => (
                                <div
                                  key={i}
                                  className="absolute bottom-8"
                                  style={{
                                    left: `${10 + i * 15}%`,
                                    width: `${30 + Math.random() * 20}px`,
                                    height: `${15 + Math.random() * 10}px`,
                                    border: `2px solid ${effectData.color}66`,
                                    borderRadius: '50%',
                                    animation: `waterRipple ${2 + Math.random()}s ease-out infinite`,
                                    animationDelay: `${i * 0.3}s`
                                  }}
                                />
                              ))}
                              {[...Array(10)].map((_, i) => (
                                <div
                                  key={`bubble-${i}`}
                                  className="absolute rounded-full"
                                  style={{
                                    width: `${3 + Math.random() * 4}px`,
                                    height: `${3 + Math.random() * 4}px`,
                                    backgroundColor: `${effectData.color}80`,
                                    bottom: '0',
                                    left: `${10 + Math.random() * 80}%`,
                                    animation: `bubbleRise ${3 + Math.random() * 2}s ease-in infinite`,
                                    animationDelay: `${Math.random() * 2}s`
                                  }}
                                />
                              ))}
                              <style>{`
                                @keyframes waterWave {
                                  0%, 100% { transform: translateY(0); }
                                  50% { transform: translateY(-5px); }
                                }
                                @keyframes waterRipple {
                                  0% { 
                                    transform: scale(0.3); 
                                    opacity: 0.8; 
                                  }
                                  100% { 
                                    transform: scale(2); 
                                    opacity: 0; 
                                  }
                                }
                                @keyframes bubbleRise {
                                  0% { 
                                    transform: translateY(0) scale(0.5); 
                                    opacity: 0; 
                                  }
                                  20% { 
                                    opacity: 1; 
                                  }
                                  80% { 
                                    opacity: 1; 
                                  }
                                  100% { 
                                    transform: translateY(-70px) scale(1.3); 
                                    opacity: 0; 
                                  }
                                }
                              `}</style>
                            </div>
                          );
                        case 'lightning':
                          return (
                            <div className="absolute -inset-8 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
                              <div 
                                className="absolute inset-0"
                                style={{
                                  background: `radial-gradient(ellipse at 50% 30%, ${effectData.color}33 0%, transparent 60%)`,
                                  animation: 'lightningFlash 1.5s ease-in-out infinite'
                                }}
                              />
                              {[...Array(3)].map((_, i) => (
                                <div
                                  key={i}
                                  className="absolute top-0 left-1/2 -translate-x-1/2"
                                  style={{
                                    width: '3px',
                                    height: '70%',
                                    background: `linear-gradient(
                                      180deg,
                                      ${effectData.color}ff 0%,
                                      ${effectData.color}cc 30%,
                                      ${effectData.color}99 60%,
                                      ${effectData.color}00 100%
                                    )`,
                                    clipPath: 'polygon(40% 0%, 60% 0%, 55% 40%, 70% 40%, 45% 70%, 55% 70%, 35% 100%, 50% 60%, 30% 60%, 50% 30%, 40% 30%)',
                                    filter: `drop-shadow(0 0 8px ${effectData.color})`,
                                    animation: `lightningStrike ${0.8 + i * 0.5}s ease-in-out infinite`,
                                    animationDelay: `${i * 0.5}s`,
                                    opacity: 0
                                  }}
                                />
                              ))}
                              {[...Array(8)].map((_, i) => (
                                <div
                                  key={`spark-${i}`}
                                  className="absolute w-1 h-1 rounded-full"
                                  style={{
                                    backgroundColor: effectData.color,
                                    boxShadow: `0 0 6px ${effectData.color}`,
                                    top: `${20 + Math.random() * 60}%`,
                                    left: `${20 + Math.random() * 60}%`,
                                    animation: `lightningSpark ${0.5 + Math.random() * 0.5}s ease-in-out infinite`,
                                    animationDelay: `${Math.random() * 1}s`
                                  }}
                                />
                              ))}
                              <style>{`
                                @keyframes lightningFlash {
                                  0%, 45%, 55%, 100% { opacity: 0.3; }
                                  48%, 52% { opacity: 1; }
                                }
                                @keyframes lightningStrike {
                                  0%, 85%, 100% { opacity: 0; }
                                  90%, 95% { opacity: 1; }
                                }
                                @keyframes lightningSpark {
                                  0%, 70%, 100% { opacity: 0; transform: scale(0.5); }
                                  75%, 85% { opacity: 1; transform: scale(1.5); }
                                }
                              `}</style>
                            </div>
                          );
                        case 'glitter':
                          return (
                            <div className="absolute -inset-8 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
                              {[...Array(30)].map((_, i) => (
                                <div
                                  key={i}
                                  className="absolute"
                                  style={{
                                    top: `${Math.random() * 100}%`,
                                    left: `${Math.random() * 100}%`,
                                    animation: `glitterFall ${2 + Math.random() * 3}s linear infinite`,
                                    animationDelay: `${Math.random() * 3}s`
                                  }}
                                >
                                  <div
                                    style={{
                                      width: `${2 + Math.random() * 3}px`,
                                      height: `${2 + Math.random() * 3}px`,
                                      backgroundColor: effectData.color,
                                      boxShadow: `0 0 ${4 + Math.random() * 4}px ${effectData.color}`,
                                      transform: `rotate(${Math.random() * 360}deg)`,
                                      borderRadius: Math.random() > 0.5 ? '50%' : '0',
                                      clipPath: Math.random() > 0.7 ? 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' : 'none'
                                    }}
                                  />
                                </div>
                              ))}
                              {[...Array(10)].map((_, i) => (
                                <div
                                  key={`burst-${i}`}
                                  className="absolute"
                                  style={{
                                    top: `${20 + Math.random() * 60}%`,
                                    left: `${20 + Math.random() * 60}%`,
                                    animation: `glitterBurst ${2.5 + Math.random()}s ease-out infinite`,
                                    animationDelay: `${Math.random() * 2}s`
                                  }}
                                >
                                  {[...Array(6)].map((_, j) => (
                                    <div
                                      key={j}
                                      className="absolute w-1 h-1 rounded-full"
                                      style={{
                                        backgroundColor: effectData.color,
                                        boxShadow: `0 0 4px ${effectData.color}`,
                                        transform: `rotate(${j * 60}deg) translateY(-10px)`,
                                        animation: `glitterParticle 1s ease-out infinite`,
                                        animationDelay: `${j * 0.1}s`
                                      }}
                                    />
                                  ))}
                                </div>
                              ))}
                              <style>{`
                                @keyframes glitterFall {
                                  0% { 
                                    transform: translateY(-20px) rotate(0deg); 
                                    opacity: 0; 
                                  }
                                  10% { 
                                    opacity: 1; 
                                  }
                                  90% { 
                                    opacity: 1; 
                                  }
                                  100% { 
                                    transform: translateY(100px) rotate(360deg); 
                                    opacity: 0; 
                                  }
                                }
                                @keyframes glitterBurst {
                                  0%, 100% { 
                                    transform: scale(0); 
                                    opacity: 0; 
                                  }
                                  10% { 
                                    opacity: 1; 
                                  }
                                  50% { 
                                    opacity: 0.8; 
                                  }
                                  100% { 
                                    transform: scale(2); 
                                    opacity: 0; 
                                  }
                                }
                                @keyframes glitterParticle {
                                  0% { 
                                    transform: rotate(0deg) translateY(-10px) scale(0.5); 
                                    opacity: 1; 
                                  }
                                  100% { 
                                    transform: rotate(0deg) translateY(-25px) scale(1.5); 
                                    opacity: 0; 
                                  }
                                }
                              `}</style>
                            </div>
                          );
                        case 'aurora':
                          return (
                            <div className="absolute -inset-8 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
                              <div 
                                className="absolute inset-0"
                                style={{
                                  background: `linear-gradient(
                                    180deg,
                                    transparent 0%,
                                    ${effectData.color}20 20%,
                                    ${effectData.color}40 35%,
                                    ${effectData.color}30 50%,
                                    ${effectData.color}20 65%,
                                    transparent 80%
                                  )`,
                                  filter: 'blur(15px)',
                                  animation: 'auroraWave1 6s ease-in-out infinite'
                                }}
                              />
                              <div 
                                className="absolute inset-0"
                                style={{
                                  background: `linear-gradient(
                                    -180deg,
                                    transparent 0%,
                                    ${effectData.color}15 25%,
                                    ${effectData.color}35 40%,
                                    ${effectData.color}25 55%,
                                    transparent 75%
                                  )`,
                                  filter: 'blur(12px)',
                                  animation: 'auroraWave2 8s ease-in-out infinite',
                                  animationDelay: '-2s'
                                }}
                              />
                              {[...Array(15)].map((_, i) => (
                                <div
                                  key={i}
                                  className="absolute w-1 h-1 rounded-full"
                                  style={{
                                    backgroundColor: i % 3 === 0 ? effectData.color : (i % 3 === 1 ? '#10b981' : '#06b6d4'),
                                    boxShadow: `0 0 4px currentColor`,
                                    top: `${Math.random() * 100}%`,
                                    left: `${Math.random() * 100}%`,
                                    animation: `auroraParticle ${2 + Math.random() * 3}s ease-in-out infinite`,
                                    animationDelay: `${Math.random() * 2}s`
                                  }}
                                />
                              ))}
                              <style>{`
                                @keyframes auroraWave1 {
                                  0%, 100% { 
                                    transform: translateY(-10%) scaleY(1); 
                                    opacity: 0.6; 
                                  }
                                  33% { 
                                    transform: translateY(0%) scaleY(1.2); 
                                    opacity: 0.8; 
                                  }
                                  66% { 
                                    transform: translateY(10%) scaleY(0.9); 
                                    opacity: 0.5; 
                                  }
                                }
                                @keyframes auroraWave2 {
                                  0%, 100% { 
                                    transform: translateY(10%) scaleY(0.9); 
                                    opacity: 0.4; 
                                  }
                                  33% { 
                                    transform: translateY(-5%) scaleY(1.1); 
                                    opacity: 0.7; 
                                  }
                                  66% { 
                                    transform: translateY(5%) scaleY(0.95); 
                                    opacity: 0.5; 
                                  }
                                }
                                @keyframes auroraParticle {
                                  0%, 100% { 
                                    opacity: 0.3; 
                                    transform: scale(0.5); 
                                  }
                                  50% { 
                                    opacity: 1; 
                                    transform: scale(1.5); 
                                  }
                                }
                              `}</style>
                            </div>
                          );
                        case 'glitch':
                          return (
                            <div className="absolute -inset-8 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
                              {[...Array(8)].map((_, i) => (
                                <div
                                  key={i}
                                  className="absolute w-full h-0.5"
                                  style={{
                                    backgroundColor: `${effectData.color}${Math.floor(30 + Math.random() * 40).toString(16).padStart(2, '0')}`,
                                    top: `${10 + i * 12}%`,
                                    animation: `glitchScanline ${2 + Math.random()}s linear infinite`,
                                    animationDelay: `${Math.random() * 2}s`
                                  }}
                                />
                              ))}
                              <style>{`
                                @keyframes glitchScanline {
                                  0%, 100% { 
                                    transform: translateX(-100%); 
                                    opacity: 0; 
                                  }
                                  10% { 
                                    opacity: 0.8; 
                                  }
                                  50% { 
                                    opacity: 0.6; 
                                  }
                                  90% { 
                                    opacity: 0.8; 
                                  }
                                  100% { 
                                    transform: translateX(100%); 
                                    opacity: 0; 
                                  }
                                }
                              `}</style>
                            </div>
                          );
                        default:
                          return null;
                      }
                    };
                    
                    if (effectData) {
                      switch(effectData.animation) {
                        case 'sparkle':
                          usernameStyle.textShadow = `0 0 10px ${effectData.color}cc, 0 0 20px ${effectData.color}99`;
                          break;
                        case 'neon':
                          usernameStyle.textShadow = `
                            0 0 5px ${effectData.color},
                            0 0 10px ${effectData.color},
                            0 0 20px ${effectData.color},
                            0 0 40px ${effectData.color},
                            0 0 80px ${effectData.color}
                          `;
                          break;
                        case 'fire':
                          usernameStyle.color = '#fef3c7';
                          usernameStyle.textShadow = `
                            0 0 10px ${effectData.color},
                            0 0 20px ${effectData.color},
                            0 0 30px ${effectData.color}
                          `;
                          break;
                        case 'water':
                          usernameStyle.textShadow = `0 0 8px ${effectData.color}99, 0 0 16px ${effectData.color}66`;
                          break;
                        case 'lightning':
                          usernameStyle.color = '#fef9c3';
                          usernameStyle.textShadow = `0 0 10px ${effectData.color}, 0 0 20px ${effectData.color}, 0 0 40px ${effectData.color}`;
                          break;
                        case 'glitter':
                          usernameStyle.textShadow = `0 0 8px ${effectData.color}80, 0 0 16px ${effectData.color}60`;
                          break;
                        case 'aurora':
                          usernameStyle.textShadow = `0 0 10px ${effectData.color}, 0 0 20px #10b981, 0 0 30px #06b6d4`;
                          break;
                        case 'glitch':
                          usernameStyle.textShadow = `2px 2px 0 #ff0000, -2px -2px 0 #00ffff`;
                          break;
                      }
                    }
                    
                    return (
                      <div className="relative">
                        {renderUsernameEffect()}
                        <h1 
                          className="text-2xl font-bold relative z-10"
                          style={usernameStyle}
                        >
                          {user?.username}
                        </h1>
                      </div>
                    );
                  })()}
                  {user?.role === 'general_admin' && (
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-600 text-xs font-bold rounded-full">
                      Admin
                    </span>
                  )}
                  {user?.customTitle && (
                    (() => {
                      const titleData = CUSTOM_TITLES.find(t => t.id === user.customTitle);
                      return (
                        <span className="px-2.5 py-1 bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-900 text-xs font-bold rounded-full shadow-sm">
                          {titleData?.name || user.customTitle}
                        </span>
                      );
                    })()
                  )}
                </div>
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      {t('bio')}
                    </h3>
                    <p className="text-slate-600">{user?.bio || <span className="text-slate-400 italic">{t('notProvided')}</span>}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {t('contactInfo')}
                    </h3>
                    <p className="text-slate-600">{user?.contactInfo || <span className="text-slate-400 italic">{t('notProvided')}</span>}</p>
                  </div>
                </div>
              </div>

              {isOwnProfile && isBanned && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-red-800 flex items-center gap-2 mb-1">
                        <MessageSquare className="w-5 h-5" />
                        {t('accountBanned')}
                      </h3>
                      {banReason && (
                        <p className="text-red-700 text-sm">{t('banReason')}：{banReason}</p>
                      )}
                    </div>
                    {onOpenBanAppeal && (
                      <button
                        onClick={onOpenBanAppeal}
                        className="px-4 py-2 bg-white border border-red-300 text-red-700 font-bold rounded-lg hover:bg-red-100 transition-colors text-sm"
                      >
                        {t('submitAppeal')}
                      </button>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex flex-wrap items-center gap-6 pt-2">
                <div className="flex items-center gap-2 text-slate-600">
                  <Building2 className="w-4 h-4" />
                  <span>{stats?.communitiesCount || 0} {t('communitiesManaged')}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <BookOpen className="w-4 h-4" />
                  <span>{stats?.demosCount || 0} {t('worksPublished')}</span>
                </div>
              </div>

              <div className="pt-2">
                <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-500" />
                  {t('supportMe')}
                </h3>
                {user?.paymentQr ? (
                  <img src={user.paymentQr} alt="Payment QR" className="w-40 h-40 object-cover rounded-xl border border-slate-200" />
                ) : (
                  <p className="text-slate-400 italic">{t('noPaymentQrCodeProvided')}</p>
                )}
              </div>

              {/* Points Shop Button */}
              {isOwnProfile && onOpenPointsShop && (
                <button
                  onClick={onOpenPointsShop}
                  className="w-full mt-6 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative flex items-center justify-center gap-3 px-6 py-5 bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl border border-slate-200 hover:border-slate-300 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-cyan-500/20">
                    <div className="relative">
                      <ShoppingBag className="w-6 h-6 text-emerald-400 group-hover:text-white transition-colors duration-300" />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-slate-100 group-hover:text-white transition-colors duration-300 text-lg">
                        {t('exploreShop')}
                      </p>
                      <p className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors duration-300">
                        {t('unlockExclusiveCustomizations')}
                      </p>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-yellow-400/20 to-amber-400/20 rounded-full border border-yellow-400/30">
                        <Star className="w-3.5 h-3.5 text-yellow-400" />
                        <span className="text-xs font-bold text-yellow-300">{user?.role === 'general_admin' ? 5000 : (user?.points || 0)}</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
                    </div>
                  </div>
                </button>
              )}





              {/* Level, Points & Contribution Section */}
              {user && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      {t('pointsAndContribution')}
                    </h3>
                    <button
                      onClick={() => setShowPointsInfo(true)}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors group"
                    >
                      <HelpCircle className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {/* Contribution Points Card */}
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-xl border border-indigo-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center">
                          <Award className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-indigo-600 font-bold uppercase">{t('contributionPoints')}</p>
                          <p className="text-2xl font-bold text-indigo-800">{user.contributionPoints || 0}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Points Card */}
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-4 rounded-xl border border-emerald-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
                          <Star className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-emerald-600 font-bold uppercase">{t('points')}</p>
                          <p className="text-2xl font-bold text-emerald-800">
                            {user.role === 'general_admin' ? 5000 : (user.points || 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Level Card */}
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
                          <Trophy className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-amber-600 font-bold uppercase">{t('level')}</p>
                          <p className="text-2xl font-bold text-amber-800">
                            {getLevelInfo(calculateLevel(user.contributionPoints || 0, user.role === 'general_admin'), lang).displayName}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-slate-700">{t('nextLevel')}</span>
                      <span className="text-sm text-slate-600">
                        {getPointsToNextLevel(user.contributionPoints || 0) > 0 
                          ? `${t('pointsNeeded')}: ${getPointsToNextLevel(user.contributionPoints || 0)}`
                          : 'Max level!'}
                      </span>
                    </div>
                    
                    {/* Level Progress */}
                    <div className="relative">
                      {/* Background track with level markers */}
                      <div className="h-4 bg-slate-200 rounded-full overflow-hidden relative">
                        {(() => {
                          const currentPoints = user.contributionPoints || 0;
                          const isAdmin = user.role === 'general_admin';
                          const currentLevel = calculateLevel(currentPoints, isAdmin);
                          const levelKeys = Object.keys(LEVEL_CONFIG) as Array<keyof typeof LEVEL_CONFIG>;
                          const currentLevelIndex = levelKeys.indexOf(currentLevel);
                          
                          // Admin gets full progress
                          if (isAdmin) {
                            return (
                              <div 
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                                style={{ width: '100%' }}
                              />
                            );
                          }
                          
                          // Define the level breakpoints with new position weights
                          const levelBreakpoints = [
                            { level: 'learner', start: 0, end: 9, startPos: 0, endPos: 10 },
                            { level: 'researcher1', start: 10, end: 99, startPos: 10, endPos: 40 },
                            { level: 'researcher2', start: 100, end: 199, startPos: 40, endPos: 70 },
                            { level: 'researcher3', start: 200, end: 299, startPos: 70, endPos: 100 },
                            { level: 'co_creator', start: 300, end: Infinity, startPos: 100, endPos: 100 }
                          ];
                          
                          let progressPercent = 0;
                          
                          for (let i = 0; i < levelBreakpoints.length; i++) {
                            const bp = levelBreakpoints[i];
                            if (currentPoints >= bp.start) {
                              if (currentPoints <= bp.end || bp.end === Infinity) {
                                // Current level - calculate progress within this level
                                if (bp.end === Infinity) {
                                  progressPercent = bp.startPos;
                                } else {
                                    const levelProgress = (currentPoints - bp.start) / (bp.end - bp.start + 1);
                                    progressPercent = bp.startPos + (bp.endPos - bp.startPos) * levelProgress;
                                  }
                                  break;
                              } else {
                                // Past this level
                                progressPercent = bp.endPos;
                              }
                            }
                          }
                          
                          return (
                            <div 
                              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                              style={{ width: `${progressPercent}%` }}
                            />
                          );
                        })()}
                      </div>
                      
                      {/* Level markers */}
                      <div className="relative mt-2 text-xs h-20">
                        {(() => {
                          const levelKeys = Object.keys(LEVEL_CONFIG) as Array<keyof typeof LEVEL_CONFIG>;
                          const isAdmin = user.role === 'general_admin';
                          
                          return levelKeys.map((key, index) => {
                            const config = LEVEL_CONFIG[key];
                            const currentLevel = calculateLevel(user.contributionPoints || 0, isAdmin);
                            const currentLevelIndex = levelKeys.indexOf(currentLevel);
                            const isActive = currentLevelIndex >= index;
                            const levelInfo = getLevelInfo(key, lang);
                            
                            // Calculate position: 
                            // - Learner (index 0): 0%
                            // - Researcher 1 (index 1): 10%
                            // - Researcher 2 (index 2): 40%
                            // - Researcher 3 (index 3): 70%
                            // - Co-creator (index 4): 100%
                            let leftPercent;
                            if (index === 0) {
                              leftPercent = 0;
                            } else if (index === 1) {
                              leftPercent = 10;
                            } else if (index === 2) {
                              leftPercent = 40;
                            } else if (index === 3) {
                              leftPercent = 70;
                            } else if (index === 4) {
                              leftPercent = 100;
                            } else {
                              leftPercent = 100;
                            }
                            
                            return (
                              <div 
                                key={key}
                                className={`absolute flex flex-col items-center transition-colors ${
                                  isActive 
                                    ? 'text-indigo-600' 
                                    : 'text-slate-400'
                                }`}
                                style={{ 
                                  left: `${leftPercent}%`,
                                  transform: index === 0 ? 'translateX(0)' : 
                                             index === 4 ? 'translateX(-100%)' : 'translateX(-50%)'
                                }}
                              >
                                <div 
                                  className="flex items-center justify-center w-8 h-8 rounded-full mb-1"
                                  style={{ 
                                    backgroundColor: isActive ? `${levelInfo.color}20` : 'transparent'
                                  }}
                                >
                                  <LevelIcon 
                                    iconKey={config.iconKey} 
                                    className="w-4 h-4" 
                                    color={isActive ? levelInfo.color : '#94a3b8'} 
                                  />
                                </div>
                                <span className="text-[10px] font-semibold">{levelInfo.displayName}</span>
                                <span className="text-[9px]">{config.min}+</span>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </div>
                  
                  {/* Privileges Section */}
                  <div className="mt-6">
                    <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      {t('privileges')}
                    </h3>
                    <div className="space-y-2">
                      {(() => {
                        const currentPoints = user.contributionPoints || 0;
                        const isAdmin = user.role === 'general_admin';
                        const currentLevel = calculateLevel(currentPoints, isAdmin);
                        
                        const levelKeys = Object.keys(LEVEL_CONFIG) as Array<keyof typeof LEVEL_CONFIG>;
                        const currentLevelIndex = isAdmin ? 4 : levelKeys.indexOf(currentLevel);
                        
                        return levelKeys.map((level, index) => {
                          const isUnlocked = currentLevelIndex >= index;
                          const levelInfo = getLevelInfo(level, lang);
                          const privileges = LEVEL_PRIVILEGES[level];
                          
                          return (
                            <div 
                              key={level}
                              className={`p-3 rounded-xl border transition-all ${
                                isUnlocked 
                                  ? 'bg-slate-50 border-slate-200' 
                                  : 'bg-slate-50/50 border-slate-100 opacity-60'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <div 
                                  className="w-6 h-6 rounded-full flex items-center justify-center"
                                  style={{ 
                                    backgroundColor: isUnlocked ? `${levelInfo.color}20` : '#e2e8f0',
                                    color: isUnlocked ? levelInfo.color : '#94a3b8'
                                  }}
                                >
                                  <LevelIcon iconKey={LEVEL_CONFIG[level].iconKey} className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-sm font-semibold" style={{ color: isUnlocked ? levelInfo.color : '#94a3b8' }}>
                                  {levelInfo.displayName}
                                </span>
                                <span className="text-xs text-slate-400">
                                  {LEVEL_CONFIG[level].min}+
                                </span>
                                {isUnlocked && (
                                  <span className="ml-auto text-xs text-emerald-600 font-bold">
                                    {t('unlocked')}
                                  </span>
                                )}
                              </div>
                              <ul className="ml-8 text-xs text-slate-600 space-y-1">
                                {(lang === 'cn' ? privileges.cn : privileges.en).map((item, i) => (
                                  <li key={i} className="flex items-center gap-1">
                                    <span className="text-slate-400">•</span>
                                    {item}
                                    {item.includes(t('points')) && privileges.bonusPoints > 0 && (
                                      <span className="text-emerald-600 font-medium ml-1">
                                        (+{privileges.bonusPoints})
                                      </span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                  
                  {/* Exclusive Features Display */}
                  {(() => {
                    const currentPoints = user.contributionPoints || 0;
                    const isAdmin = user.role === 'general_admin';
                    const hasBadge = hasExclusiveBadgeDisplay(currentPoints, isAdmin);
                    const hasBorder = hasExclusiveAvatarBorder(currentPoints, isAdmin);
                    const onWall = isOnContributorWall(currentPoints, isAdmin);
                    
                    if (!hasBadge && !hasBorder && !onWall) return null;
                    
                    return (
                      <div className="mt-6">
                        <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                          <Crown className="w-4 h-4" />
                          {t('exclusiveFeatures')}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {hasBorder && user.avatarBorder && (
                            <div className="p-3 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}>
                                  <Sparkles className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-sm font-semibold text-slate-700">{t('avatarBorder')}</span>
                              </div>
                              <div className="flex justify-center">
                                <div className="relative">
                                  <div 
                                    className="w-16 h-16 rounded-full flex items-center justify-center bg-slate-200"
                                  >
                                    <UserCircle className="w-8 h-8 text-slate-400" />
                                  </div>
                                  <div 
                                    className="absolute inset-0 rounded-full pointer-events-none"
                                    style={{ 
                                      border: '3px solid transparent',
                                      background: `linear-gradient(white, white) padding-box, ${AVATAR_BORDERS.find(b => b.id === user.avatarBorder)?.color || '#3b82f6'} border-box`
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                          {hasBadge && (
                            <div className="p-3 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-amber-500">
                                  <Trophy className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-sm font-semibold text-amber-800">{t('exclusiveBadge')}</span>
                              </div>
                              <div className="text-xs text-amber-700">
                                {t('yourLevelBadgeWillBeHighlighted')}
                              </div>
                            </div>
                          )}
                          {onWall && (
                            <div className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-500">
                                  <Star className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-sm font-semibold text-purple-800">{t('contributorWall')}</span>
                              </div>
                              <div className="text-xs text-purple-700">
                                {t('yourNameIsOnTheContributorWall')}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {stats?.communitiesManaged && stats.communitiesManaged.length > 0 && (
        <div className="mt-6 glass-card rounded-2xl p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Communities I Manage
          </h2>
          <div className="grid gap-3">
            {stats.communitiesManaged.map((community: Community) => (
              <div 
                key={community.id} 
                className={`flex items-center justify-between p-4 bg-slate-50 rounded-xl ${onOpenCommunity ? 'cursor-pointer hover:bg-slate-100 transition-colors' : ''}`}
                onClick={() => onOpenCommunity && onOpenCommunity(community.id)}
              >
                <div>
                  <h3 className="font-semibold text-slate-800">{community.name}</h3>
                  <p className="text-sm text-slate-500">{community.description}</p>
                </div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                  {community.members?.length || 0} members
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 glass-card rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            {t('myPublishedWorks')}
          </h2>
          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={userDemosSearch}
                onChange={(event) => setUserDemosSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') loadUserDemos();
                }}
                placeholder={lang === 'cn' ? '搜索发布作品' : 'Search published works'}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
	            <button
	              type="button"
	              onClick={() => loadUserDemos()}
	              disabled={userDemosLoading}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
            >
              {userDemosLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {userDemosSearch.trim()
                ? (lang === 'cn' ? '搜索' : 'Search')
	                : (userDemosLoaded ? (lang === 'cn' ? '重新加载' : 'Reload') : (lang === 'cn' ? '加载作品' : 'Load works'))}
	            </button>
	            {userDemosLoaded && userDemosVisible && (
	              <button
	                type="button"
	                onClick={() => setUserDemosVisible(false)}
	                className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold hover:bg-slate-200 transition-colors"
	              >
	                {lang === 'cn' ? '隐藏' : 'Hide'}
	              </button>
	            )}
	          </div>
	        </div>

	        {!userDemosLoaded ? (
	          <div className="rounded-xl bg-slate-50 border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
	            {lang === 'cn' ? '发布作品暂未加载。可以直接搜索，或点击加载作品查看全部。' : 'Published works are not loaded yet. Search directly or load all works.'}
	          </div>
	        ) : !userDemosVisible ? (
	          <div className="rounded-xl bg-slate-50 border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
	            {lang === 'cn' ? '发布作品已隐藏。点击加载或搜索可重新展开。' : 'Published works are hidden. Load or search to show them again.'}
	          </div>
	        ) : userDemos.length === 0 ? (
          <div className="rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">
            {lang === 'cn' ? '没有找到发布作品。' : 'No published works found.'}
          </div>
        ) : (
          <div className="grid gap-3">
            {userDemos.map((demo) => {
              const canAccess = true;
              
              const getLocationDisplay = (loc: any) => {
                if (loc.layer === 'general') {
                  return t('generalLibrary');
                } else if (loc.layer === 'community' && loc.communityId) {
                  const community = communities.find(c => c.id === loc.communityId);
                  if (community) {
                    return community.name;
                  }
                  return t('noCommunity');
                }
                return t('generalLibrary');
              };
              
              const locations = demo.locations || [];
              const locationDisplay = locations.length > 0 
                ? locations.map(getLocationDisplay).join(lang === 'en' ? ', ' : '、') 
                : (demo.communityId 
                    ? (communities.find(c => c.id === demo.communityId)?.name || t('noCommunity'))
                    : t('generalLibrary'));
              
              const canDelete = isOwnProfile || currentUserRole === 'general_admin';
              
              return (
                <div 
                  key={demo.id} 
                  className={`flex items-center justify-between p-4 rounded-xl transition-colors ${
                    canAccess && onOpenDemo 
                      ? 'bg-slate-50 cursor-pointer hover:bg-slate-100' 
                      : 'bg-slate-100 opacity-75'
                  }`}
                  onClick={() => canAccess && onOpenDemo && onOpenDemo(demo)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-800">{demo.title}</h3>
                    </div>
                    <p className="text-sm text-slate-500 line-clamp-1 mb-1">{demo.description}</p>
                    <p className="text-xs text-indigo-600 font-medium">
                      {t('publishedIn')}{locationDisplay}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-slate-400">
                      {new Date(demo.createdAt).toLocaleDateString()}
                    </div>
                    {canDelete && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteDemo(demo.id); }}
                        className="px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                      >
                        <Archive className="w-3.5 h-3.5" />
                        {t('delete')}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Favorites Section */}
      {isOwnProfile && favoriteDemos.length > 0 && (
        <div className="mt-6 glass-card rounded-2xl p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <BookMarked className="w-5 h-5" />
            {t('favorites')}
          </h2>
          <div className="grid gap-3">
            {favoriteDemos.map((demo) => {
              const canAccess = canAccessDemo(demo);
              
              const getLocationDisplay = (loc: any) => {
                if (loc.layer === 'general') {
                  return t('generalLibrary');
                } else if (loc.layer === 'community' && loc.communityId) {
                  const community = communities.find(c => c.id === loc.communityId);
                  if (community) {
                    return community.name;
                  }
                  return t('noCommunity');
                }
                return t('generalLibrary');
              };
              
              const locations = demo.locations || [];
              const locationDisplay = locations.length > 0 
                ? locations.map(getLocationDisplay).join(lang === 'en' ? ', ' : '、') 
                : (demo.communityId 
                    ? (communities.find(c => c.id === demo.communityId)?.name || t('noCommunity'))
                    : t('generalLibrary'));
              
              const handleRemoveFavorite = async (e: React.MouseEvent) => {
                e.stopPropagation();
                if (!confirm(t('confirmRemoveFromFavorites'))) return;
                try {
                  await StorageService.removeFavorite(userId, demo.id);
                  loadData();
                } catch (error) {
                  console.error('Failed to remove favorite:', error);
                  alert(t('removeFromFavoritesFailed'));
                }
              };
              
              return (
                <div 
                  key={demo.id} 
                  className={`flex items-center justify-between p-4 rounded-xl transition-colors ${
                    canAccess && onOpenDemo 
                      ? 'bg-slate-50 cursor-pointer hover:bg-slate-100' 
                      : 'bg-slate-100 opacity-75'
                  }`}
                  onClick={() => canAccess && onOpenDemo && onOpenDemo(demo)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-800">{demo.title}</h3>
                    </div>
                    <p className="text-sm text-slate-500 line-clamp-1 mb-1">{demo.description}</p>
                    <p className="text-xs text-indigo-600 font-medium">
                      {t('publishedIn')}{locationDisplay}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-slate-400">
                      {new Date(demo.createdAt).toLocaleDateString()}
                    </div>
                    <button
                      onClick={handleRemoveFavorite}
                      className="px-3 py-1.5 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      {t('remove')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isOwnProfile && (
        <div className="mt-6 glass-card rounded-2xl p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            {t('myFeedbacks')}
          </h2>
          <FeedbackList
            feedback={userFeedbacks}
            isAdmin={false}
            currentUserRole={currentUserRole}
            onUpdate={handleRefreshData}
            lang={lang}
          />
        </div>
      )}

      {isOwnProfile && (
        <div className="mt-6 glass-card rounded-2xl p-6">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Archive className="w-5 h-5" />
                {t('archiveArea')}
              </h2>
              <p className="text-sm text-slate-500 mt-2">
                {t('archivedDemosDesc')}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={archivedDemosSearch}
                  onChange={(event) => setArchivedDemosSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') loadArchivedDemos();
                  }}
                  placeholder={lang === 'cn' ? '搜索留档程序' : 'Search archive'}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
              <button
                type="button"
                onClick={() => loadArchivedDemos()}
                disabled={archivedDemosLoading}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-white text-sm font-bold hover:bg-slate-900 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
              >
                {archivedDemosLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                {archivedDemosSearch.trim()
                  ? (lang === 'cn' ? '搜索' : 'Search')
                  : (archivedDemosLoaded ? (lang === 'cn' ? '重新加载' : 'Reload') : (lang === 'cn' ? '加载留档' : 'Load archive'))}
              </button>
	              <button
	                type="button"
	                onClick={handleClearArchive}
                disabled={archivedDemosLoading}
                className="px-4 py-2.5 rounded-xl bg-red-50 text-red-700 text-sm font-bold hover:bg-red-100 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
	                {lang === 'cn' ? '清空留档' : 'Clear archive'}
	              </button>
	              {archivedDemosLoaded && archivedDemosVisible && (
	                <button
	                  type="button"
	                  onClick={() => setArchivedDemosVisible(false)}
	                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold hover:bg-slate-200 transition-colors"
	                >
	                  {lang === 'cn' ? '隐藏' : 'Hide'}
	                </button>
	              )}
	            </div>
	          </div>

	          {!archivedDemosLoaded ? (
	            <div className="rounded-xl bg-slate-50 border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
	              {lang === 'cn' ? '留档暂未加载。可以直接搜索，或点击加载留档查看全部。' : 'Archive is not loaded yet. Search directly or load all archived programs.'}
	            </div>
	          ) : !archivedDemosVisible ? (
	            <div className="rounded-xl bg-slate-50 border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
	              {lang === 'cn' ? '留档区域已隐藏。点击加载或搜索可重新展开。' : 'Archive is hidden. Load or search to show it again.'}
	            </div>
	          ) : archivedDemos.length === 0 ? (
            <div className="rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">
              {lang === 'cn' ? '没有找到留档程序。' : 'No archived programs found.'}
            </div>
          ) : (
            <div className="grid gap-3">
              {archivedDemos.map((demo) => {
              const canAccess = canAccessDemo(demo);
              const communityName = demo.communityId 
                ? communities.find(c => c.id === demo.communityId)?.name 
                : null;
              
              return (
                <div key={demo.id} className="p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-800">{demo.title}</h3>
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                          {t('archived')}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 line-clamp-1 mb-2">{demo.description}</p>
                      <p className="text-xs text-slate-400">
                        {t('archivedAt')} {demo.archivedAt ? new Date(demo.archivedAt).toLocaleString() : t('unknownTime')}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {canAccess && onOpenDemo && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onOpenDemo(demo); }}
                          className="px-3 py-1.5 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-lg text-sm font-medium transition-colors"
                        >
                          {t('view')}
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeletePermanently(demo.id); }}
                        className="px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {t('permanentDelete')}
                      </button>
                    </div>
                  </div>
                </div>
              );
              })}
            </div>
          )}
        </div>
      )}


      {/* Points & Contribution Info Modal */}
      {showPointsInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {t('pointsAndContributionGuide')}
                  </h3>
                  <p className="text-indigo-100 mt-1 text-sm">
                    {t('completelyNonProfit')}
                  </p>
                </div>
                <button
                  onClick={() => setShowPointsInfo(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Contribution Points */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Award className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">
                      {t('contributionPoints')}
                    </h4>
                    <p className="text-sm text-slate-500">
                      {t('forLevelingUpAndUnlockingPrivileges')}
                    </p>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="text-sm text-slate-700">
                    <span className="font-bold text-indigo-600">+10</span> {t('uploadAnApprovedDemoProgram')}
                  </p>
                </div>
              </div>
              
              {/* Points */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Star className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">
                      {t('points')}
                    </h4>
                    <p className="text-sm text-slate-500">
                      {t('forRedeemingItemsInThePointsShop')}
                    </p>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
                  <p className="text-sm text-slate-700">
                    <span className="font-bold text-emerald-600">+10</span> {t('uploadAnApprovedDemoProgram')}
                  </p>
                  <p className="text-sm text-slate-700">
                    <span className="font-bold text-emerald-600">{t('rewardTasks')}</span>
                  </p>
                </div>
              </div>
              
              {/* Note */}
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                <p className="text-sm text-amber-700">
                  {t('platformIsCompletelyNonProfit')}
                </p>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => setShowPointsInfo(false)}
                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl hover:opacity-90 transition-opacity"
              >
                {t('gotIt')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
