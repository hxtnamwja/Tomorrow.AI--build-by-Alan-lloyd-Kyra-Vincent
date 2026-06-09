import React, { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, Globe, Users, FolderOpen } from 'lucide-react';
import { Demo, Community, Category, DemoPublication } from '../types';
import { PUBLIC_CATEGORY_ICON_OPTIONS, PublicCategoryIcon } from './categoryIcons';

export const CreateBountyModal = ({
  isOpen,
  onClose,
  onSubmit,
  t
}: {
  isOpen: boolean,
  onClose: () => void,
  onSubmit: (data: {title: string, desc: string, reward: string}) => void,
  t: any
}) => {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [reward, setReward] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800">{t('createBounty')}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('bountyTitle')}</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="e.g. Optimize Physics Engine"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('bountyDesc')}</label>
            <textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              rows={3}
              placeholder="Describe the task requirements..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('reward')}</label>
            <input
              value={reward}
              onChange={e => setReward(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder={t('bountyRewardPlaceholder')}
            />
          </div>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
          <button
            onClick={() => {
              if (title && desc && reward) {
                onSubmit({ title, desc, reward });
                setTitle(''); setDesc(''); setReward('');
                onClose();
              }
            }}
            disabled={!title || !desc || !reward}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t('create')}
          </button>
        </div>
      </div>
    </div>
  );
};

export const PublishToCommunityModal = ({
  isOpen,
  onClose,
  onSubmit,
  demo,
  communities,
  categories,
  userCommunities
}: {
  isOpen: boolean,
  onClose: () => void,
  onSubmit: (layer: string, categoryId: string, communityId?: string) => void,
  demo: Demo | null,
  communities: Community[],
  categories: Category[],
  userCommunities: Community[]
}) => {
  const [selectedLayer, setSelectedLayer] = useState<'general' | 'community'>('general');
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedLayer('general');
      setSelectedCommunityId(null);
      setSelectedCategoryId(null);
    }
  }, [isOpen]);

  // Build a hierarchical flat list with depth-based indentation
  const buildHierarchicalOptions = (cats: Category[], parentId: string | null | undefined, depth: number): Category[] => {
    const children = cats.filter(c => (c.parentId || null) === (parentId || null));
    const result: Category[] = [];
    for (const child of children) {
      const prefix = depth > 0 ? '\u00A0\u00A0'.repeat(depth) + '└ ' : '';
      result.push({ ...child, name: prefix + child.name });
      result.push(...buildHierarchicalOptions(cats, child.id, depth + 1));
    }
    return result;
  };

  const filteredCategories = selectedLayer === 'community' && selectedCommunityId
    ? buildHierarchicalOptions(categories.filter(c => c.communityId === selectedCommunityId), null, 0)
    : buildHierarchicalOptions(categories.filter(c => !c.communityId), null, 0);

  if (!isOpen || !demo) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800">发布到其他平台</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
            <p className="text-sm text-indigo-800 font-medium">作品：{demo.title}</p>
            <p className="text-xs text-indigo-600 mt-1">选择要发布的平台和分类，无需重复填写内容</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">选择平台</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setSelectedLayer('general');
                  setSelectedCommunityId(null);
                  setSelectedCategoryId(null);
                }}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  selectedLayer === 'general'
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <Globe className={`w-5 h-5 mb-1 ${selectedLayer === 'general' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <div className="text-sm font-medium text-slate-800">通用知识库</div>
                <div className="text-xs text-slate-500">需要总管理员审批</div>
              </button>
              <button
                onClick={() => {
                  setSelectedLayer('community');
                  setSelectedCategoryId(null);
                }}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  selectedLayer === 'community'
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <Users className={`w-5 h-5 mb-1 ${selectedLayer === 'community' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <div className="text-sm font-medium text-slate-800">社区</div>
                <div className="text-xs text-slate-500">需要社区管理员审批</div>
              </button>
            </div>
          </div>

          {selectedLayer === 'community' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">选择社区</label>
              <select
                value={selectedCommunityId || ''}
                onChange={(e) => {
                  setSelectedCommunityId(e.target.value || null);
                  setSelectedCategoryId(null);
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="">请选择社区...</option>
                {userCommunities.map(comm => (
                  <option key={comm.id} value={comm.id}>{comm.name}</option>
                ))}
              </select>
            </div>
          )}

          {((selectedLayer === 'general') || (selectedLayer === 'community' && selectedCommunityId)) && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">选择分类</label>
              <select
                value={selectedCategoryId || ''}
                onChange={(e) => setSelectedCategoryId(e.target.value || null)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="">请选择分类...</option>
                {filteredCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">取消</button>
          <button
            onClick={() => {
              if (selectedCategoryId) {
                onSubmit(selectedLayer, selectedCategoryId, selectedCommunityId || undefined);
                onClose();
              }
            }}
            disabled={!selectedCategoryId}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            提交发布申请
          </button>
        </div>
      </div>
    </div>
  );
};

export const PublicationReviewPanel = ({
  isOpen,
  onClose,
  publications,
  demos,
  communities,
  categories,
  onApprove,
  onReject
}: {
  isOpen: boolean;
  onClose: () => void;
  publications: DemoPublication[];
  demos: Demo[];
  communities: Community[];
  categories: Category[];
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const getDemo = (publication: DemoPublication) => publication.demo || demos.find(d => d.id === publication.demoId);
  const getCommunity = (communityId?: string) => communityId ? communities.find(c => c.id === communityId) : null;
  const getCategory = (categoryId: string) => categories.find(c => c.id === categoryId);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800">发布审批</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {publications.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Clock className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>暂无待审批的发布</p>
            </div>
          ) : (
            <div className="space-y-3">
              {publications.map(pub => {
                const demo = getDemo(pub);
                const community = getCommunity(pub.communityId);
                const category = getCategory(pub.categoryId);
                const isExpanded = expandedId === pub.id;

                return (
                  <div key={pub.id} className="border border-slate-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : pub.id)}
                      className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <div className="text-left">
                          <div className="text-sm font-medium text-slate-800">{demo?.title || '未知作品'}</div>
                          <div className="text-xs text-slate-500">
                            发布到：{pub.layer === 'general' ? '通用知识库' : community?.name || '未知社区'}
                          </div>
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </button>
                    {isExpanded && (
                      <div className="p-4 bg-white border-t border-slate-200 space-y-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-slate-500">平台：</span>
                            <span className="text-slate-800 font-medium">{pub.layer === 'general' ? '通用知识库' : '社区'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">分类：</span>
                            <span className="text-slate-800 font-medium">{category?.name || '未知'}</span>
                          </div>
                          {community && (
                            <div className="col-span-2">
                              <span className="text-slate-500">社区：</span>
                              <span className="text-slate-800 font-medium">{community.name}</span>
                            </div>
                          )}
                          <div className="col-span-2">
                            <span className="text-slate-500">申请时间：</span>
                            <span className="text-slate-800">{new Date(pub.requestedAt).toLocaleString()}</span>
                          </div>
                        </div>

                        {rejectingId === pub.id ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              placeholder="请输入拒绝原因..."
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  onReject(pub.id, rejectReason);
                                  setRejectingId(null);
                                  setRejectReason('');
                                }}
                                disabled={!rejectReason.trim()}
                                className="px-3 py-1.5 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 transition-colors"
                              >
                                确认拒绝
                              </button>
                              <button
                                onClick={() => {
                                  setRejectingId(null);
                                  setRejectReason('');
                                }}
                                className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                              >
                                取消
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => onApprove(pub.id)}
                              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg flex items-center justify-center gap-2 transition-colors"
                            >
                              <CheckCircle className="w-4 h-4" />
                              批准
                            </button>
                            <button
                              onClick={() => setRejectingId(pub.id)}
                              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg flex items-center justify-center gap-2 transition-colors"
                            >
                              <XCircle className="w-4 h-4" />
                              拒绝
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const CreateCategoryModal = ({
  isOpen,
  parentId,
  showIconPicker = false,
  onClose,
  onSubmit,
  t
}: {
  isOpen: boolean,
  parentId: string | null,
  showIconPicker?: boolean,
  onClose: () => void,
  onSubmit: (name: string, parentId: string | null, icon?: string, translations?: { nameCn?: string; nameEn?: string }) => void,
  t: any
}) => {
  const [name, setName] = useState('');
  const [nameCn, setNameCn] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [nameInputMode, setNameInputMode] = useState<'bilingual' | 'single'>('bilingual');
  const [selectedIcon, setSelectedIcon] = useState('sparkles');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setNameCn('');
      setNameEn('');
      setNameInputMode('bilingual');
      setSelectedIcon('sparkles');
    }
  }, [isOpen]);

  const submitCategory = () => {
    const fallbackName = name.trim() || nameCn.trim() || nameEn.trim();
    if (!fallbackName) return;
    onSubmit(fallbackName, parentId, showIconPicker ? selectedIcon : undefined, {
      nameCn: nameCn.trim() || undefined,
      nameEn: nameEn.trim() || undefined
    });
    setName('');
    setNameCn('');
    setNameEn('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800">{parentId ? t('addSubCategory') : t('addCategory')}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <label className="block text-sm font-bold text-slate-700">{t('enterCategoryName')}</label>
              <button
                type="button"
                onClick={() => setNameInputMode(mode => mode === 'bilingual' ? 'single' : 'bilingual')}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
              >
                {nameInputMode === 'bilingual' ? '切换为单语输入' : '切换为双语输入'}
              </button>
            </div>
            {nameInputMode === 'bilingual' ? (
              <div className="grid grid-cols-1 gap-3">
                <input
                  value={nameCn}
                  onChange={e => setNameCn(e.target.value)}
                  placeholder={t('chineseOptional')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none focus:bg-white"
                  autoFocus
                />
                <input
                  value={nameEn}
                  onChange={e => setNameEn(e.target.value)}
                  placeholder={t('englishOptional')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none focus:bg-white"
                />
              </div>
            ) : (
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (name.trim() || nameCn.trim() || nameEn.trim())) {
                    submitCategory();
                  }
                }}
              />
            )}
          </div>
          {showIconPicker && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-slate-700">{t('chooseCategoryIcon')}</span>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <PublicCategoryIcon icon={selectedIcon} className="w-4 h-4 text-indigo-600" />
                  {PUBLIC_CATEGORY_ICON_OPTIONS.find(item => item.id === selectedIcon)?.label}
                </div>
              </div>
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-56 overflow-y-auto pr-1">
                {PUBLIC_CATEGORY_ICON_OPTIONS.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelectedIcon(id)}
                    title={label}
                    className={`aspect-square rounded-xl border flex items-center justify-center transition-all ${
                      selectedIcon === id
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-600 shadow-sm'
                        : 'border-slate-200 text-slate-500 hover:border-indigo-200 hover:bg-slate-50'
                    }`}
                  >
                    <PublicCategoryIcon icon={id} className="w-5 h-5" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
	          <button
	            onClick={submitCategory}
	            disabled={!name.trim() && !nameCn.trim() && !nameEn.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm disabled:opacity-50 transition-colors"
          >
            {t('create')}
          </button>
        </div>
      </div>
    </div>
	  );
	};
