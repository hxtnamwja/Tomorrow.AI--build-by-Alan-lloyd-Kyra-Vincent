import React, { useState, useEffect } from 'react';
import { User, UserRole, User as UserType, Community } from '../types';
import { UserCircle, ShieldCheck, Ban, CheckCircle, Edit3, X, Search, Award, Star, BookOpen, FlaskConical, Beaker, Trophy, Shield } from 'lucide-react';
import { StorageService } from '../services/storageService';
import { CommunitiesAPI, UsersAPI } from '../services/apiService';
import { calculateLevel, getLevelInfo, LEVEL_CONFIG } from '../constants';

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

interface UserManagementPanelProps {
  currentUserRole: UserRole;
  currentUserId: string;
  currentUser?: UserType;
  activeCommunity?: Community;
  onClose: () => void;
  onViewUserProfile?: (userId: string) => void;
}

export const UserManagementPanel: React.FC<UserManagementPanelProps> = ({
  currentUserRole,
  currentUserId,
  currentUser,
  activeCommunity,
  onClose,
  onViewUserProfile
}) => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [banReason, setBanReason] = useState('');
  const [isBanModalOpen, setIsBanModalOpen] = useState(false);
  const [isEditPointsModalOpen, setIsEditPointsModalOpen] = useState(false);
  const [editContributionPoints, setEditContributionPoints] = useState('');
  const [editPoints, setEditPoints] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      let userList: UserType[];
      if (activeCommunity) {
        userList = await StorageService.getUsersByCommunity(activeCommunity.id);
      } else {
        userList = await StorageService.getAllUsers();
      }
      setUsers(userList);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [activeCommunity]);

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBan = async (user: UserType) => {
    setSelectedUser(user);
    setBanReason('');
    setIsBanModalOpen(true);
  };

  const confirmBan = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await StorageService.banUser(selectedUser.id, banReason || undefined);
      await loadUsers();
      setIsBanModalOpen(false);
    } catch (error: any) {
      alert(`Failed to ban user: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnban = async (user: UserType) => {
    if (!confirm(`确定要解封 ${user.username} 吗？`)) return;
    setActionLoading(true);
    try {
      await StorageService.unbanUser(user.id);
      await loadUsers();
    } catch (error: any) {
      alert(`解封失败: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditPoints = (user: UserType) => {
    setSelectedUser(user);
    setEditContributionPoints(String(user.contributionPoints || 0));
    setEditPoints(String(user.points || 0));
    setIsEditPointsModalOpen(true);
  };

  const confirmEditPoints = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const newContributionPoints = parseInt(editContributionPoints) || 0;
      const newPoints = parseInt(editPoints) || 0;
      
      await StorageService.updateUser(selectedUser.id, {
        contributionPoints: newContributionPoints,
        points: newPoints
      });
      
      await loadUsers();
      setIsEditPointsModalOpen(false);
    } catch (error: any) {
      alert(`修改失败: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Permission checks
  // isFullAdmin: 总管理员或社区创始人 - 拥有完整权限
  // isSubAdmin: 社区分管理员 - 只有查看权限，不能操作
  const isFullAdmin = activeCommunity 
    ? (activeCommunity.creatorId === currentUserId || currentUserRole === 'general_admin')
    : currentUserRole === 'general_admin';
  
  const isSubAdmin = activeCommunity 
    ? (activeCommunity.adminMembers || []).includes(currentUserId)
    : false;
  
  // 分管理员只能查看，不能操作
  const canManageUsers = isFullAdmin;

  const handleToggleAdmin = async (user: UserType) => {
    // 权限检查
    if (!isFullAdmin) {
      alert('您没有权限执行此操作');
      return;
    }
    
    // 不能对自己操作
    if (user.id === currentUserId) {
      alert('不能对自己进行操作');
      return;
    }
    
    // 在社区视图中，不能对总管理员进行操作
    if (activeCommunity && user.role === 'general_admin' && activeCommunity.creatorId !== currentUserId) {
      alert('不能对总管理员进行操作');
      return;
    }
    
    setActionLoading(true);
    try {
      const isCurrentlyAdmin = (activeCommunity!.adminMembers || []).includes(user.id);
      const newRole = isCurrentlyAdmin ? 'member' : 'admin';
      await CommunitiesAPI.setMemberRole(activeCommunity!.id, user.id, newRole);
      alert(newRole === 'admin' ? `已将 ${user.username} 设为社区分管理员` : `已撤销 ${user.username} 的管理员权限`);
      await loadUsers();
    } catch (error: any) {
      alert(`操作失败: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // 全局视图：普通用户只能设置为分管理员或恢复为普通用户
  // 只有原始admin账号可以修改角色
  const handleSetUserRole = async (user: UserType, newRole: UserRole) => {
    // 只有admin账号可以设置角色
    if (currentUser?.username !== 'admin') {
      alert('只有原始admin账号可以修改用户角色');
      return;
    }
    
    // 不能对自己操作
    if (user.id === currentUserId) {
      alert('不能对自己进行操作');
      return;
    }
    
    setActionLoading(true);
    try {
      await UsersAPI.setRole(user.id, newRole);
      const roleName = newRole === 'site_sub_admin' ? '分管理员' : '普通用户';
      alert(`已将 ${user.username} 设为${roleName}`);
      await loadUsers();
    } catch (error: any) {
      alert(`操作失败: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {activeCommunity ? `${activeCommunity.name} - ` : ''}用户管理
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {activeCommunity ? '管理本社区的用户' : '管理平台所有用户'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="搜索用户..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  未找到用户
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onViewUserProfile && onViewUserProfile(user.id)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform hover:scale-110 cursor-pointer ${
                          user.role === 'general_admin' ? 'bg-purple-100 text-purple-600' : 
                          user.role === 'site_sub_admin' ? 'bg-amber-100 text-amber-600' :
                          (activeCommunity?.adminMembers || []).includes(user.id) ? 'bg-yellow-100 text-yellow-600' :
                          'bg-emerald-100 text-emerald-600'
                        }`}
                      >
                        {user.role === 'general_admin' ? (
                          <ShieldCheck className="w-5 h-5" />
                        ) : user.role === 'site_sub_admin' ? (
                          <Shield className="w-5 h-5" />
                        ) : (activeCommunity?.adminMembers || []).includes(user.id) ? (
                          <Shield className="w-5 h-5" />
                        ) : (
                          <UserCircle className="w-5 h-5" />
                        )}
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800">{user.username}</span>
                          {user.isBanned && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded-full">
                              已封禁
                            </span>
                          )}
                          {user.role === 'general_admin' && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-600 text-xs font-bold rounded-full">
                              总管理员
                            </span>
                          )}
                          {user.role === 'site_sub_admin' && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-600 text-xs font-bold rounded-full">
                              分管理员
                            </span>
                          )}
                          {(activeCommunity?.adminMembers || []).includes(user.id) && user.role !== 'general_admin' && (
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full">
                              社区分管理
                            </span>
                          )}
                          <span 
                            className="px-2 py-0.5 text-xs font-bold rounded-full flex items-center gap-1"
                            style={{ 
                              backgroundColor: `${getLevelInfo(calculateLevel(user.contributionPoints || 0, user.role === 'general_admin'), 'cn').color}20`,
                              color: getLevelInfo(calculateLevel(user.contributionPoints || 0, user.role === 'general_admin'), 'cn').color
                            }}
                          >
                            <LevelIcon 
                              iconKey={LEVEL_CONFIG[calculateLevel(user.contributionPoints || 0, user.role === 'general_admin')].iconKey} 
                              className="w-3 h-3"
                              color={getLevelInfo(calculateLevel(user.contributionPoints || 0, user.role === 'general_admin'), 'cn').color}
                            />
                            {getLevelInfo(calculateLevel(user.contributionPoints || 0, user.role === 'general_admin'), 'cn').displayName}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            贡献值: {user.contributionPoints || 0}
                          </span>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            积分: {user.points || 0}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {user.bio || '暂无简介'}
                          {user.banReason && <span className="text-red-500 ml-2">• 原因: {user.banReason}</span>}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* 
                        管理员设置说明：
                        - 在社区用户管理中：社区创始人可以设置社区分管理员
                        - 在全局用户管理中：只有admin账号可以设置或撤销分管理员
                      */}
                      {canManageUsers && user.id !== currentUserId && (
                        activeCommunity ? (
                          // 社区视图：社区创始人可以设置社区分管理员
                          <button
                            onClick={() => handleToggleAdmin(user)}
                            disabled={actionLoading}
                            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5 ${
                              (activeCommunity.adminMembers || []).includes(user.id)
                                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                            }`}
                            title={(activeCommunity.adminMembers || []).includes(user.id) ? '撤销社区分管理员' : '设为社区分管理员'}
                          >
                            <Shield className="w-4 h-4" />
                            {(activeCommunity.adminMembers || []).includes(user.id) ? '撤销分管理' : '设为分管理'}
                          </button>
                        ) : (
                          // 全局视图：只有admin账号可以设置角色
                          currentUser?.username === 'admin' && user.role !== 'general_admin' ? (
                            <select
                              value={user.role}
                              onChange={(e) => handleSetUserRole(user, e.target.value as UserRole)}
                              disabled={actionLoading}
                              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 border-0 cursor-pointer ${
                                user.role === 'general_admin'
                                  ? 'bg-purple-100 text-purple-700'
                                  : user.role === 'site_sub_admin'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                              title="点击修改角色"
                            >
                              <option value="user">普通用户</option>
                              <option value="site_sub_admin">分管理员</option>
                            </select>
                          ) : (
                            // 非admin用户只显示角色标签
                            <span className={`px-3 py-1.5 text-sm font-medium rounded-lg ${
                              user.role === 'general_admin'
                                ? 'bg-purple-100 text-purple-700'
                                : user.role === 'site_sub_admin'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {user.role === 'general_admin' ? '总管理员' : user.role === 'site_sub_admin' ? '分管理员' : '普通用户'}
                            </span>
                          )
                        )
                      )}
                      {/* Edit points button - available to general admin and community admins */}
                      {canManageUsers && user.role !== 'general_admin' && (
                        <button
                          onClick={() => handleEditPoints(user)}
                          disabled={actionLoading}
                          className="px-3 py-1.5 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
                        >
                          <Edit3 className="w-4 h-4" />
                          修改
                        </button>
                      )}
                      {/* Ban/unban buttons - only for general admin or community admin in community view */}
                      {canManageUsers && user.role !== 'general_admin' && (
                        <>
                          {user.isBanned ? (
                            <button
                              onClick={() => handleUnban(user)}
                              disabled={actionLoading}
                              className="px-3 py-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
                            >
                              <CheckCircle className="w-4 h-4" />
                              解封
                            </button>
                          ) : (
                            <button
                              onClick={() => handleBan(user)}
                              disabled={actionLoading}
                              className="px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
                            >
                              <Ban className="w-4 h-4" />
                              封禁
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {isBanModalOpen && selectedUser && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <h3 className="text-lg font-bold text-slate-800 mb-2">封禁用户</h3>
              <p className="text-sm text-slate-500 mb-4">
                您正在封禁 <span className="font-semibold">{selectedUser.username}</span>
              </p>
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">封禁原因（可选）</label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="请输入封禁原因..."
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all resize-none"
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsBanModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-medium transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={confirmBan}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  {actionLoading ? '封禁中...' : '确认封禁'}
                </button>
              </div>
            </div>
          </div>
        )}

        {isEditPointsModalOpen && selectedUser && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <h3 className="text-lg font-bold text-slate-800 mb-2">修改贡献值和积分</h3>
              <p className="text-sm text-slate-500 mb-4">
                您正在修改 <span className="font-semibold">{selectedUser.username}</span> 的数据
              </p>
              
              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1 flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    社区贡献值
                  </label>
                  <input
                    type="number"
                    value={editContributionPoints}
                    onChange={(e) => setEditContributionPoints(e.target.value)}
                    placeholder="输入贡献值"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1 flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    社区积分
                  </label>
                  <input
                    type="number"
                    value={editPoints}
                    onChange={(e) => setEditPoints(e.target.value)}
                    placeholder="输入积分"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setIsEditPointsModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-medium transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={confirmEditPoints}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  {actionLoading ? '保存中...' : '确认修改'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
