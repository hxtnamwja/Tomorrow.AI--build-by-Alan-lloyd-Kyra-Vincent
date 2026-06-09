import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, ChevronDown, Folder, Plus, Trash2, Edit3, Image as ImageIcon, MoreHorizontal, X } from 'lucide-react';
import { Category, Language, UserRole } from '../types';
import { PUBLIC_CATEGORY_ICON_OPTIONS, PublicCategoryIcon } from './categoryIcons';

type CategoryTreeNodeProps = {
  category: Category;
  allCategories: Category[];
  activeId: string;
  onSelect: (id: string) => void;
  onAddSub: (parentId: string) => void;
  onEdit: (id: string, newName: string, icon?: string, translations?: { nameCn?: string | null; nameEn?: string | null }) => void;
  onDelete: (id: string) => void;
  role: UserRole | 'community_admin';
  enableIconEditing?: boolean;
  displayName?: string;
  language?: Language;
  t: any;
  key?: string | number;
};

export const CategoryTreeNode = ({ 
  category, 
  allCategories, 
  activeId, 
  onSelect, 
  onAddSub, 
  onEdit,
  onDelete,
  role,
  enableIconEditing = false,
  displayName,
  language = 'cn',
  t
}: CategoryTreeNodeProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const renderedName = displayName || (language === 'cn'
    ? (category.nameCn || category.name || category.nameEn || '')
    : (category.nameEn || category.name || category.nameCn || ''));
  const [editName, setEditName] = useState(category.name);
  const [editNameCn, setEditNameCn] = useState(category.nameCn || '');
  const [editNameEn, setEditNameEn] = useState(category.nameEn || '');
  const [editInputMode, setEditInputMode] = useState<'bilingual' | 'single'>('bilingual');
  const inputRef = useRef<HTMLInputElement>(null);
  const children = allCategories.filter(c => c.parentId === category.id);
  const isActive = activeId === category.id;
  const hasChildren = children.length > 0;
  
  // PERMISSIONS: General Admin and Community Admin can edit the Category Tree
  const canEdit = role === 'general_admin' || role === 'community_admin';

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditName(category.name);
    setEditNameCn(category.nameCn || '');
    setEditNameEn(category.nameEn || '');
    setEditInputMode('bilingual');
  }, [category.name, category.nameCn, category.nameEn]);

  const handleStopPropagation = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
  };

  const submitEdit = () => {
    const fallbackName = editName.trim() || editNameCn.trim() || editNameEn.trim();
    if (!fallbackName) return;
    onEdit(category.id, fallbackName, undefined, {
      nameCn: editNameCn.trim() || null,
      nameEn: editNameEn.trim() || null
    });
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      submitEdit();
    } else if (e.key === 'Escape') {
      setEditName(category.name);
      setIsEditing(false);
    }
  };

  const isBuiltInPublicCategory = !category.communityId && category.id.startsWith('cat-');
  const customIcon = category.icon && (!isBuiltInPublicCategory || category.icon !== 'sparkles') ? category.icon : undefined;
  const displayIcon = customIcon || (isBuiltInPublicCategory ? category.id : undefined);

  return (
    <div className="pl-2 select-none min-w-full">
      <div
        className={`flex items-center justify-between gap-2 py-1.5 px-2 rounded-xl transition-colors group relative cursor-pointer ${isActive ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50'}`}
        onClick={(e) => {
          if (isEditing) return;
          e.stopPropagation();
          onSelect(category.id);
          if (hasChildren) setIsExpanded(true);
        }}
      >
        {/* Navigation Area - Left Side */}
        <div className="flex items-center min-w-0 flex-1">
          {/* Expander Arrow */}
          <div 
            className={`p-1 mr-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer shrink-0 ${hasChildren ? 'visible' : 'invisible'}`}
            onClick={(e) => {
              if (isEditing) return;
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </div>
          
	          {enableIconEditing || category.icon ? (
	            <PublicCategoryIcon icon={displayIcon} className={`w-4 h-4 mr-2 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-500'}`} />
          ) : (
            <Folder className={`w-4 h-4 mr-2 shrink-0 ${isActive ? 'text-indigo-600 fill-indigo-200' : 'text-slate-500'}`} />
          )}
          <span className={`text-sm font-medium whitespace-normal break-words leading-5 ${isActive ? 'text-indigo-700' : 'text-slate-600'}`}>{renderedName}</span>
	        </div>

	        {canEdit && !isEditing && (
	          <div
	            className="shrink-0 z-30 relative"
	          >
              <button
                type="button"
                onClick={(e) => {
                  handleStopPropagation(e);
                  setIsActionMenuOpen(value => !value);
                }}
                title="分类管理"
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
                  isActionMenuOpen || isActive
                    ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100'
                    : 'text-slate-400 hover:bg-white hover:text-indigo-600'
                }`}
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {isActionMenuOpen && (
                <div className="absolute right-0 top-9 z-[60] w-36 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                  <button
                    type="button"
                    onClick={(e) => {
                      handleStopPropagation(e);
                      onAddSub(category.id);
                      setIsExpanded(true);
                      setIsActionMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    <Plus className="w-4 h-4" />
                    {t('addSubCategory') || '添加子分类'}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      handleStopPropagation(e);
                      setIsEditing(true);
                      setIsActionMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                  >
                    <Edit3 className="w-4 h-4" />
                    {t('edit') || '编辑'}
                  </button>
                  {enableIconEditing && (
                    <button
                      type="button"
                      onClick={(e) => {
                        handleStopPropagation(e);
                        setIsIconPickerOpen(true);
                        setIsActionMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
                    >
                      <ImageIcon className="w-4 h-4" />
                      {t('icon') || '图标'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      handleStopPropagation(e);
                      onDelete(category.id);
                      setIsActionMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t('delete') || '删除'}
                  </button>
                </div>
              )}
            </div>
          )}
	      </div>

        {isIconPickerOpen && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/35 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="font-bold text-slate-800">{t('icon') || '选择图标'}</h3>
	                  <p className="text-xs text-slate-500 mt-1">{category.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsIconPickerOpen(false)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-[420px] overflow-y-auto">
                {PUBLIC_CATEGORY_ICON_OPTIONS.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    title={label}
                    onClick={() => {
                      onEdit(category.id, category.name, id, {
                        nameCn: category.nameCn || null,
                        nameEn: category.nameEn || null
                      });
                      setIsIconPickerOpen(false);
                    }}
                    className={`aspect-square rounded-xl border flex items-center justify-center transition-all ${
                      category.icon === id || displayIcon === id
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-600 shadow-sm'
                        : 'border-slate-200 text-slate-500 hover:border-indigo-200 hover:bg-slate-50'
                    }`}
                  >
                    <PublicCategoryIcon icon={id} className="w-5 h-5" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {isEditing && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/35 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="font-bold text-slate-800">{t('edit') || '编辑'}</h3>
                  <p className="text-xs text-slate-500 mt-1">{renderedName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <label className="block text-sm font-bold text-slate-700">{t('enterCategoryName')}</label>
                    <button
                      type="button"
                      onClick={() => setEditInputMode(mode => mode === 'bilingual' ? 'single' : 'bilingual')}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                    >
                      {editInputMode === 'bilingual' ? '切换为单语输入' : '切换为双语输入'}
                    </button>
                  </div>
                  {editInputMode === 'bilingual' ? (
                    <div className="grid grid-cols-1 gap-3">
                      <input
                        value={editNameCn}
                        onChange={e => setEditNameCn(e.target.value)}
                        placeholder={t('chineseOptional')}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none focus:bg-white"
                        autoFocus
                      />
                      <input
                        value={editNameEn}
                        onChange={e => setEditNameEn(e.target.value)}
                        placeholder={t('englishOptional')}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none focus:bg-white"
                      />
                    </div>
                  ) : (
                    <input
                      ref={inputRef}
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      autoFocus
                    />
                  )}
                </div>
              </div>
              <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-sm font-bold text-slate-600 rounded-lg hover:bg-slate-200"
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  onClick={submitEdit}
                  disabled={!editName.trim() && !editNameCn.trim() && !editNameEn.trim()}
                  className="px-4 py-2 text-sm font-bold text-white rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                >
                  {t('save')}
                </button>
              </div>
            </div>
          </div>
        )}
      
      {/* Recursive Children */}
      {isExpanded && children.length > 0 && (
        <div className="border-l border-slate-200 ml-2.5 my-1">
          {children.map(child => (
            <CategoryTreeNode
              key={child.id}
              category={child}
              allCategories={allCategories}
              activeId={activeId}
              onSelect={onSelect}
              onAddSub={onAddSub}
              onEdit={onEdit}
              onDelete={onDelete}
              role={role}
              enableIconEditing={enableIconEditing}
              language={language}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
};
