
import React, { useState, useEffect } from 'react';
import { Target, Globe, Users, Check, Upload, FileCode, Play, Image, X, FolderOpen, FileText, Sparkles, CheckCircle2, Database, Users2, RefreshCw, Zap, Bot, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Demo, Category, Subject, Bounty, Layer, Community } from '../types';
import { AiService, GeneratedProject } from '../services/aiService';
import { TagSelector } from './TagSelector';

interface ProjectFile {
  type: 'file' | 'directory';
  path: string;
  name: string;
  size?: number;
  extension?: string;
  children?: ProjectFile[];
}

interface SelectedFeatures {
  dataStorage: boolean;
  multiplayer: boolean;
}

const CategorySelector = ({ categories, value, onChange, t, layer, communityId }: { 
  categories: Category[], 
  value: string, 
  onChange: (id: string) => void, 
  t: any,
  layer: string,
  communityId?: string
}) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const filteredCategories = React.useMemo(() => {
    let base = categories;
    if (layer === 'general') {
      base = base.filter(c => !c.communityId);
    } else {
      base = base.filter(c => c.communityId === communityId);
    }
    return base;
  }, [categories, layer, communityId]);

  const searchResults = React.useMemo(() => {
    if (!searchTerm.trim()) return [];
    const lowerTerm = searchTerm.toLowerCase();
    return filteredCategories.filter(c => c.name.toLowerCase().includes(lowerTerm));
  }, [filteredCategories, searchTerm]);

  const renderCategory = (cat: Category, depth: number) => {
    const children = filteredCategories.filter(c => c.parentId === cat.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedIds.has(cat.id);
    const isSelected = value === cat.id;

    return (
      <React.Fragment key={cat.id}>
        <div 
          onClick={() => onChange(cat.id)}
          className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all hover:bg-slate-50 mb-1 ${isSelected ? 'bg-indigo-50 border-indigo-200 border text-indigo-700' : 'border border-transparent'}`}
          style={{ marginLeft: `${depth * 20}px` }}
        >
          {hasChildren ? (
            <button 
              onClick={(e) => toggleExpand(cat.id, e)}
              className="p-1 hover:bg-slate-200 rounded transition-colors"
            >
              <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
            </button>
          ) : (
            <div className="w-5.5" />
          )}
          <span className="text-sm font-medium flex-1 truncate">{cat.name}</span>
          {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
        </div>
        {hasChildren && isExpanded && children.map(child => renderCategory(child, depth + 1))}
      </React.Fragment>
    );
  };

  const rootCategories = filteredCategories.filter(c => !c.parentId);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder={t('searchCategory') || '搜索分类...'}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all focus:bg-white"
        />
        {searchTerm && (
          <button 
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="max-h-[300px] overflow-y-auto pr-1 py-1 custom-scrollbar">
        {searchTerm ? (
          searchResults.map(cat => renderCategory(cat, 0))
        ) : (
          rootCategories.map(cat => renderCategory(cat, 0))
        )}
        {(searchTerm ? searchResults : rootCategories).length === 0 && (
           <div className="py-10 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
             <p className="text-slate-400 text-sm italic">{t('noCategoriesFound') || '暂无符合条件的分类'}</p>
          </div>
        )}
      </div>
      
      {value && (
        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-lg text-xs text-emerald-700 border border-emerald-100 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span className="font-medium">当前选中: {categories.find(c => c.id === value)?.name}</span>
          <button 
            onClick={() => onChange('')}
            className="ml-auto text-emerald-400 hover:text-emerald-600 font-bold"
          >
            {t('clearSelection') || '清除'}
          </button>
        </div>
      )}
    </div>
  );
};

export const UploadWizard = ({ t, categories, communities, currentUserId, role, onSubmit, onCancel, bountyContext, initialContext }: { 
  t: any, 
  categories: Category[], 
  communities: Community[],
  currentUserId: string,
  role: string,
  onSubmit: (d: Demo) => void, 
  onCancel: () => void,
  bountyContext: Bounty | null,
  initialContext?: { layer: Layer; communityId?: string; categoryId?: string } | null;
}) => {
  const [step, setStep] = useState(bountyContext ? 2 : (initialContext ? 1 : 0));
  const [isPlayground, setIsPlayground] = useState(false);
  const [editorMode, setEditorMode] = useState('upload' as 'upload' | 'paste');
  const [projectMode, setProjectMode] = useState('single' as 'single' | 'multi');
  const [zipFile, setZipFile] = useState(null as File | null);
  const [projectStructure, setProjectStructure] = useState([] as ProjectFile[]);
  const [isAnalyzingZip, setIsAnalyzingZip] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [entryFile, setEntryFile] = useState('');
  const [formData, setFormData] = useState({
    title: bountyContext?.programTitle || '',
    description: bountyContext?.programDescription || '',
    author: '',
    categoryId: bountyContext?.publishCategoryId || initialContext?.categoryId || '',
    layer: (bountyContext ? bountyContext.publishLayer : (initialContext ? initialContext.layer : 'general')) as Layer,
    communityId: bountyContext?.publishCommunityId || initialContext?.communityId,
    code: '',
    thumbnailUrl: '',
    tags: bountyContext?.programTags || [] as string[]
  });
  const [thumbnailPreview, setThumbnailPreview] = useState(null as string | null);

  const [configPhase, setConfigPhase] = useState('none' as 'select' | 'generating' | 'review' | 'none');
  const [selectedFeatures, setSelectedFeatures] = useState({ dataStorage: false, multiplayer: false } as SelectedFeatures);
  const [generatedProject, setGeneratedProject] = useState(null as GeneratedProject | null);
  const [configProgress, setConfigProgress] = useState(0);
  const [configProgressText, setConfigProgressText] = useState('');
  const [aiActionLog, setAiActionLog] = useState([] as string[]);
  const [liveCodePreview, setLiveCodePreview] = useState('');
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [userRequirements, setUserRequirements] = useState('');
  const [aiGeneratedFiles, setAiGeneratedFiles] = useState([] as { path: string; content: string }[]);
  const [aiGeneratedEntryFile, setAiGeneratedEntryFile] = useState('');
  const [originalCode, setOriginalCode] = useState('');
  const [originalZipFile, setOriginalZipFile] = useState<File | null>(null);
  const [allOriginalFiles, setAllOriginalFiles] = useState([] as { path: string; content: string }[]);
  const [allOriginalFilesRaw, setAllOriginalFilesRaw] = useState<Map<string, { type: 'text' | 'binary', content: string | Blob }>>(new Map());

  useEffect(() => {
    if (bountyContext) {
      setStep(2);
      setFormData({
        title: bountyContext.programTitle || '',
        description: bountyContext.programDescription || '',
        author: '',
        categoryId: bountyContext.publishCategoryId || '',
        layer: (bountyContext.publishLayer || 'general') as Layer,
        communityId: bountyContext.publishCommunityId || undefined,
        code: '',
        thumbnailUrl: '',
        tags: bountyContext.programTags || [] as string[]
      });
    } else if (initialContext) {
      setStep(1);
      setFormData(prev => ({
        ...prev,
        layer: initialContext.layer,
        communityId: initialContext.communityId,
        categoryId: initialContext.categoryId || ''
      }));
    }
  }, [bountyContext, initialContext]);


  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setThumbnailPreview(base64);
        setFormData(prev => ({ ...prev, thumbnailUrl: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveThumbnail = () => {
    setThumbnailPreview(null);
    setFormData(prev => ({ ...prev, thumbnailUrl: '' }));
  };

  const handleZipUpload = async (file: File) => {
    setIsAnalyzingZip(true);
    try {
      const JSZip = await import('jszip');
      const zip = await JSZip.loadAsync(file);
      
      setOriginalZipFile(file);
      
      const structure: ProjectFile[] = [];
      const htmlFiles: { path: string; content: string }[] = [];
      const allFiles: { path: string; content: string }[] = [];
      const allFilesRaw: Map<string, { type: 'text' | 'binary', content: string | Blob }> = new Map();
      const imageFiles: Map<string, string> = new Map();
      
      for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
        if (relativePath.includes('__MACOSX') || relativePath.startsWith('.') || relativePath.includes('.DS_Store')) {
          continue;
        }
        
        if (zipEntry.dir) {
          structure.push({
            type: 'directory',
            path: relativePath,
            name: relativePath.split('/').filter(Boolean).pop() || relativePath
          });
        } else {
          const ext = relativePath.split('.').pop()?.toLowerCase();
          structure.push({
            type: 'file',
            path: relativePath,
            name: relativePath.split('/').pop() || relativePath,
            extension: ext ? `.${ext}` : '',
            size: 0
          });
          
          const isImage = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.bmp', '.ico'].includes(ext ? `.${ext}` : '');
          const isCodeFile = ['.html', '.htm', '.css', '.js', '.json', '.txt', '.md'].includes(ext ? `.${ext}` : '');
          
          if (isImage) {
            try {
              const binaryContent = await zipEntry.async('blob');
              allFilesRaw.set(relativePath, { type: 'binary', content: binaryContent });
              
              const dataUrl = await zipEntry.async('base64');
              const mimeType = getImageMimeType(ext || '');
              imageFiles.set(relativePath, `data:${mimeType};base64,${dataUrl}`);
            } catch (error) {
              console.warn('Error processing image:', relativePath, error);
            }
          }
          
          if (isCodeFile) {
            let content = await zipEntry.async('string');
            allFiles.push({ path: relativePath, content });
            allFilesRaw.set(relativePath, { type: 'text', content });
            
            if (['.html', '.htm'].includes(ext ? `.${ext}` : '')) {
              content = replaceImagePaths(content, imageFiles);
              htmlFiles.push({ path: relativePath, content });
            }
          }
          
          if (!isImage && !isCodeFile) {
            try {
              const binaryContent = await zipEntry.async('blob');
              allFilesRaw.set(relativePath, { type: 'binary', content: binaryContent });
            } catch (error) {
              console.warn('Error processing file:', relativePath, error);
            }
          }
        }
      }
      
      setAllOriginalFiles(allFiles);
      setAllOriginalFilesRaw(allFilesRaw);
      
      let selectedHtml = htmlFiles.find(file => file.path.split('/').length === 1);
      if (!selectedHtml && htmlFiles.length > 0) {
        selectedHtml = htmlFiles[0];
      }
      
      setProjectStructure(structure);
      setZipFile(file);
      setPreviewContent(selectedHtml?.content || '');
      setEntryFile(selectedHtml?.path || '');
      setIsAnalyzingZip(false);
    } catch (error) {
      console.error('Error analyzing ZIP:', error);
      setIsAnalyzingZip(false);
      alert('ZIP文件解析失败');
    }
  };

  const getImageMimeType = (ext: string): string => {
    const mimeTypes: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
      '.bmp': 'image/bmp',
      '.ico': 'image/x-icon'
    };
    return mimeTypes[ext] || 'image/unknown';
  };

  const replaceImagePaths = (html: string, imageFiles: Map<string, string>): string => {
    let modifiedHtml = html;
    
    modifiedHtml = modifiedHtml.replace(/<img\s+[^>]*src="([^"]+)"[^>]*>/gi, (match, src) => {
      const normalizedSrc = src.replace(/^\/+/, '');
      if (imageFiles.has(normalizedSrc)) {
        const dataUrl = imageFiles.get(normalizedSrc);
        return match.replace(src, dataUrl || src);
      }
      return match;
    });
    
    modifiedHtml = modifiedHtml.replace(/background-image:\s*url\(['"]([^'"]+)['"]\)/gi, (match, url) => {
      const normalizedUrl = url.replace(/^\/+/, '');
      if (imageFiles.has(normalizedUrl)) {
        const dataUrl = imageFiles.get(normalizedUrl);
        return match.replace(url, dataUrl || url);
      }
      return match;
    });
    
    return modifiedHtml;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getFileIcon = (extension?: string) => {
    if (!extension) return <FileText className="w-4 h-4 text-slate-400" />;
    if (['.html', '.htm'].includes(extension)) return <FileCode className="w-4 h-4 text-orange-500" />;
    if (['.css'].includes(extension)) return <FileText className="w-4 h-4 text-blue-500" />;
    if (['.js', '.ts'].includes(extension)) return <FileText className="w-4 h-4 text-yellow-500" />;
    if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'].includes(extension)) return <Image className="w-4 h-4 text-purple-500" />;
    return <FileText className="w-4 h-4 text-slate-400" />;
  };

  const handleStartConfig = () => {
    const codeToSave = projectMode === 'single' ? formData.code : previewContent || '';
    setOriginalCode(codeToSave);
    setConfigPhase('select');
    setSelectedFeatures({ dataStorage: false, multiplayer: false });
  };

  const handleGenerateConfig = async () => {
    if (!selectedFeatures.dataStorage && !selectedFeatures.multiplayer) {
      alert('请至少选择一个功能');
      return;
    }

    setConfigPhase('generating');
    setConfigProgress(0);
    setConfigProgressText('初始化...');
    setAiActionLog(['开始配置...']);

    try {
      const originalCode = projectMode === 'single' ? formData.code : previewContent || '';
      
      setAiActionLog(prev => [...prev, '分析原代码结构...']);
      
      const project = await AiService.generateEnhancedProject(
        originalCode,
        selectedFeatures,
        userRequirements,
        (step, progress, codePreview) => {
          setConfigProgressText(step);
          setConfigProgress(progress);
          
          setAiActionLog(prev => {
            const newLog = [...prev, step];
            if (newLog.length > 15) return newLog.slice(-15);
            return newLog;
          });
          
          if (codePreview) {
            setLiveCodePreview(codePreview);
          }
        },
        projectMode === 'multi' ? allOriginalFiles : undefined
      );

      setAiActionLog(prev => [...prev, '生成完成！', '准备预览...']);
      setGeneratedProject(project);
      setConfigPhase('review');
    } catch (error) {
      console.error('Failed to generate config:', error);
      setConfigPhase('select');
      setAiActionLog(prev => [...prev, '生成失败，请重试']);
      alert('生成失败，请重试');
    }
  };

  const handleAcceptConfig = () => {
    console.log('=== handleAcceptConfig ===');
    console.log('generatedProject:', generatedProject);
    if (generatedProject) {
      if (generatedProject.type === 'single-file' && generatedProject.code) {
        console.log('Accepting single-file config, code length:', generatedProject.code.length);
        setFormData(prev => ({ ...prev, code: generatedProject.code }));
        setAiGeneratedFiles([]);
        setAiGeneratedEntryFile('');
      } else if (generatedProject.type === 'multi-file' && generatedProject.files) {
        console.log('Accepting multi-file config, files count:', generatedProject.files.length);
        console.log('Files:', generatedProject.files.map(f => ({ path: f.path, length: f.content.length })));
        setAiGeneratedFiles(generatedProject.files);
        setAiGeneratedEntryFile(generatedProject.entryFile || generatedProject.files[0].path);
        const entryFile = generatedProject.files.find(f => f.path === generatedProject.entryFile) || generatedProject.files[0];
        if (entryFile) {
          console.log('Setting preview content from:', entryFile.path);
          setPreviewContent(entryFile.content);
        }
        setProjectMode('multi');
      }
    }
    setConfigPhase('none');
  };

  const handleRejectConfig = () => {
    setConfigPhase('none');
    setGeneratedProject(null);
  };

  const handleRegenerateConfig = () => {
    handleGenerateConfig();
  };

  const handleSubmit = async () => {
    console.log('=== handleSubmit ===');
    console.log('aiGeneratedFiles.length:', aiGeneratedFiles.length);
    console.log('aiGeneratedFiles:', aiGeneratedFiles.map(f => ({ path: f.path, length: f.content.length })));
    console.log('allOriginalFilesRaw.size:', allOriginalFilesRaw.size);
    console.log('generatedProject:', generatedProject);
    
    const token = localStorage.getItem('sci_demo_token');
    const apiBase = import.meta.env.VITE_API_URL || '/api/v1';
    
    let filesToUse = aiGeneratedFiles;
    
    if (generatedProject && generatedProject.type === 'multi-file' && generatedProject.files) {
      console.log('Using generatedProject.files (backup mechanism)');
      filesToUse = generatedProject.files;
    }
    
    if (filesToUse.length > 0 || (generatedProject && generatedProject.type === 'multi-file')) {
      try {
        console.log('Creating ZIP from modified files + all original files...');
        console.log('Using files from:', filesToUse.length > 0 ? 'aiGeneratedFiles' : 'generatedProject');
        const JSZip = await import('jszip');
        const zip = new JSZip.default();
        
        const modifiedFilesMap = new Map(filesToUse.map(f => [f.path, f.content]));
        
        allOriginalFilesRaw.forEach((fileData, path) => {
          if (modifiedFilesMap.has(path)) {
            zip.file(path, modifiedFilesMap.get(path)!);
            console.log('Adding modified file to ZIP:', path);
          } else {
            zip.file(path, fileData.content);
            console.log('Adding original file to ZIP:', path);
          }
        });
        
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        console.log('ZIP created, size:', zipBlob.size);
        const zipFile = new File([zipBlob], 'enhanced-project.zip', { type: 'application/zip' });
        
        const formDataToSend = new FormData();
        formDataToSend.append('zipFile', zipFile);
        formDataToSend.append('title', formData.title);
        formDataToSend.append('description', formData.description);
        formDataToSend.append('categoryId', formData.categoryId);
        formDataToSend.append('layer', formData.layer);
        if (formData.communityId) {
          formDataToSend.append('communityId', formData.communityId);
        }
        if (bountyContext) {
          formDataToSend.append('bountyId', bountyContext.id);
        }
        if (originalZipFile) {
          formDataToSend.append('originalZip', originalZipFile);
          console.log('Adding originalZip:', originalZipFile.name, originalZipFile.size);
        }
        
        console.log('Sending upload request...');
        const response = await fetch(`${apiBase}/demos/upload-zip`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formDataToSend
        });
        
        // 处理 HTTP 错误状态
        if (!response.ok) {
          if (response.status === 413) {
            alert('文件体积过大，请联系管理员调整服务器限制（Nginx client_max_body_size 或 Node.js body size limit）');
            return;
          }
          if (response.status === 401) {
            alert('登录已过期，请重新登录');
            return;
          }
          if (response.status === 500) {
            const errorData = await response.json().catch(() => ({}));
            alert(`服务器错误: ${errorData.message || '请稍后重试'}`);
            return;
          }
          alert(`上传失败: HTTP ${response.status}`);
          return;
        }
        
        const result = await response.json();
        console.log('Upload result:', result);
        
        if (result.code === 200) {
          onSubmit({
            id: result.data.id,
            title: formData.title,
            description: formData.description,
            author: currentUserId,
            categoryId: formData.categoryId,
            layer: formData.layer,
            communityId: formData.communityId,
            code: result.data.entryFile,
            originalCode: originalCode || undefined,
            thumbnailUrl: formData.thumbnailUrl || undefined,
            status: 'pending',
            createdAt: Date.now(),
            bountyId: bountyContext?.id,
            projectType: 'multi-file',
            entryFile: result.data.entryFile,
            projectSize: result.data.size,
            tags: formData.tags
          });
        } else {
          alert(`上传失败: ${result.message || '未知错误'}`);
        }
      } catch (error) {
        console.error('Upload error:', error);
        if (error instanceof TypeError && error.message.includes('fetch')) {
          alert('网络连接失败，请检查网络后重试');
        } else {
          alert(`上传失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
      }
    } else if (projectMode === 'multi' && zipFile) {
      const formDataToSend = new FormData();
      formDataToSend.append('zipFile', zipFile);
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('categoryId', formData.categoryId);
      formDataToSend.append('layer', formData.layer);
      if (formData.communityId) {
        formDataToSend.append('communityId', formData.communityId);
      }
      if (bountyContext) {
        formDataToSend.append('bountyId', bountyContext.id);
      }
      if (originalZipFile) {
        formDataToSend.append('originalZip', originalZipFile);
      }
      
      try {
        const response = await fetch(`${apiBase}/demos/upload-zip`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formDataToSend
        });
        
        // 处理 HTTP 错误状态
        if (!response.ok) {
          if (response.status === 413) {
            alert('文件体积过大，请联系管理员调整服务器限制');
            return;
          }
          if (response.status === 401) {
            alert('登录已过期，请重新登录');
            return;
          }
          if (response.status === 500) {
            const errorData = await response.json().catch(() => ({}));
            alert(`服务器错误: ${errorData.message || '请稍后重试'}`);
            return;
          }
          alert(`上传失败: HTTP ${response.status}`);
          return;
        }
        
        const result = await response.json();
        
        if (result.code === 200) {
          onSubmit({
            id: result.data.id,
            title: formData.title,
            description: formData.description,
            author: currentUserId,
            categoryId: formData.categoryId,
            layer: formData.layer,
            communityId: formData.communityId,
            code: result.data.entryFile,
            originalCode: originalCode || undefined,
            thumbnailUrl: formData.thumbnailUrl || undefined,
            status: 'pending',
            createdAt: Date.now(),
            bountyId: bountyContext?.id,
            projectType: 'multi-file',
            entryFile: result.data.entryFile,
            projectSize: result.data.size,
            tags: formData.tags
          });
        } else {
          alert(`上传失败: ${result.message || '未知错误'}`);
        }
      } catch (error) {
        console.error('Upload error:', error);
        if (error instanceof TypeError && error.message.includes('fetch')) {
          alert('网络连接失败，请检查网络后重试');
        } else {
          alert(`上传失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
      }
    } else {
      console.log('Submitting single-file demo, code length:', formData.code.length);
      console.log('Original code length:', originalCode.length);
      const newDemo: Demo = {
        id: `demo-${Date.now()}`,
        title: formData.title,
        description: formData.description,
        author: currentUserId,
        categoryId: formData.categoryId,
        layer: formData.layer,
        communityId: formData.communityId,
        code: formData.code,
        originalCode: originalCode || undefined,
        thumbnailUrl: formData.thumbnailUrl || undefined,
        status: 'pending',
        createdAt: Date.now(),
        bountyId: bountyContext?.id,
        projectType: 'single-file',
        tags: formData.tags
      };
      console.log('Demo to submit:', { codeLength: newDemo.code?.length, originalCodeLength: newDemo.originalCode?.length });
      onSubmit(newDemo);
    }
  };
  


  const myCommunities = communities.filter(c => c.members.includes(currentUserId) && c.status === 'approved');

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden min-h-[600px] flex flex-col">
       <div className="px-8 py-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
         <div>
           <h2 className="text-xl font-bold text-slate-800">{t('uploadTitle')}</h2>
           {bountyContext && (
             <div className="flex items-center gap-2 mt-1 text-sm text-amber-600">
               <Target className="w-4 h-4" />
               <span>{t('submittingFor')} <strong>{bountyContext.title}</strong></span>
             </div>
           )}
         </div>
         <div className="flex gap-2">
            {bountyContext ? [0, 1].map(s => (
              <div key={s} className={`w-2.5 h-2.5 rounded-full ${step >= (s === 0 ? 2 : 3) ? 'bg-indigo-600' : 'bg-slate-300'}`} />
            )) : [0, 1, 2, 3].map(s => (
              <div key={s} className={`w-2.5 h-2.5 rounded-full ${step >= s ? 'bg-indigo-600' : 'bg-slate-300'}`} />
            ))}
         </div>
       </div>

       <div className="flex-1 p-8 overflow-y-auto">
         
         {step === 0 && (
             <div className="max-w-4xl mx-auto animate-in slide-in-from-right-8 duration-300">
                 <h3 className="text-lg font-bold text-slate-800 mb-6 text-center">{t('selectLayer')}</h3>
                 
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <div 
                        onClick={() => setFormData({...formData, layer: 'general', communityId: undefined})}
                        className={`p-6 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center text-center gap-4 ${formData.layer === 'general' && !isPlayground ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300'}`}
                     >
                         <div className={`w-16 h-16 rounded-full flex items-center justify-center ${formData.layer === 'general' && !isPlayground ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                             <Globe className="w-8 h-8" />
                         </div>
                         <div>
                             <h4 className="font-bold text-slate-800">{t('layerGeneral')}</h4>
                             <p className="text-xs text-slate-500 mt-1">{t('publiclyAvailable')}</p>
                         </div>
                         {formData.layer === 'general' && !isPlayground && <div className="absolute top-4 right-4 text-indigo-600"><Check className="w-5 h-5" /></div>}
                     </div>

                     <div 
                        onClick={() => setFormData({...formData, layer: 'community', communityId: myCommunities[0]?.id || ''})}
                        className={`p-6 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center text-center gap-4 ${formData.layer === 'community' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300'}`}
                     >
                         <div className={`w-16 h-16 rounded-full flex items-center justify-center ${formData.layer === 'community' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                             <Users className="w-8 h-8" />
                         </div>
                         <div>
                             <h4 className="font-bold text-slate-800">{t('layerCommunity')}</h4>
                             <p className="text-xs text-slate-500 mt-1">{t('exclusiveToCommunity')}</p>
                         </div>
                         {formData.layer === 'community' && <div className="absolute top-4 right-4 text-indigo-600"><Check className="w-5 h-5" /></div>}
                     </div>

                     <div
                        onClick={() => {
                            setIsPlayground(true);
                            setEditorMode('paste');
                            setFormData({...formData, layer: 'general', code: ''});
                            setStep(2);
                        }}
                        className={`p-6 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center text-center gap-4 border-slate-200 hover:border-indigo-300 hover:bg-slate-50`}
                     >
                         <div className={`w-16 h-16 rounded-full flex items-center justify-center bg-slate-100 text-slate-500`}>
                             <Play className="w-8 h-8 ml-1" />
                         </div>
                         <div>
                             <h4 className="font-bold text-slate-800">{t('onlinePreview')}</h4>
                             <p className="text-xs text-slate-500 mt-1">{t('playgroundDesc')}</p>
                         </div>
                     </div>
                 </div>

                 {formData.layer === 'community' && (
                     <div className="mt-8 animate-in fade-in slide-in-from-top-2">
                         <label className="block text-sm font-bold text-slate-700 mb-2">{t('selectCommunity')}</label>
                         {myCommunities.length > 0 ? (
                             <select 
                                value={formData.communityId || ''}
                                onChange={e => setFormData({...formData, communityId: e.target.value})}
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                             >
                                 {myCommunities.map(c => (
                                     <option key={c.id} value={c.id}>{c.name}</option>
                                 ))}
                             </select>
                         ) : (
                             <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm border border-yellow-200">
                                 {t('noCommunitiesJoin')}
                             </div>
                         )}
                     </div>
                 )}
             </div>
         )}

         {step === 1 && (
           <div className="space-y-6 max-w-lg mx-auto animate-in slide-in-from-right-8 duration-300">
             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">{t('titleLabel')}</label>
               <input 
                 value={formData.title} 
                 onChange={e => setFormData({...formData, title: e.target.value})}
                 className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
               />
             </div>
                          <div>
                 <label className="block text-sm font-bold text-slate-700 mb-2">{t('subjectLabel')}</label>
                 <CategorySelector
                   categories={categories}
                   value={formData.categoryId}
                   onChange={(id) => setFormData({...formData, categoryId: id})}
                   t={t}
                   layer={formData.layer}
                   communityId={formData.communityId}
                 />
              </div>

             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">{t('descLabel')}</label>
               <textarea 
                 value={formData.description} 
                 onChange={e => setFormData({...formData, description: e.target.value})}
                 rows={4}
                 className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
               />
             </div>

             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">选择标签</label>
               <TagSelector
                 selectedTags={formData.tags}
                 onChange={(tags) => setFormData({...formData, tags})}
                 lang={t('lang') || 'cn'}
               />
             </div>
           </div>
         )}

         {step === 2 && (
           <div className="h-full flex flex-col animate-in slide-in-from-right-8 duration-300">
             {!isPlayground && configPhase === 'none' && role === 'general_admin' && (
               <button
                 onClick={handleStartConfig}
                 className="mb-4 w-full py-4 px-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
               >
                 <Bot className="w-6 h-6" />
                 <span>🤖 AI 智能配置 - 让AI帮你添加功能</span>
                 <Sparkles className="w-6 h-6" />
               </button>
             )}

             {configPhase === 'select' && (
               <div className="mb-4 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
                 <div className="flex justify-between items-center mb-4">
                   <h3 className="text-lg font-bold text-indigo-800 flex items-center gap-2">
                     <Bot className="w-5 h-5" />
                     AI智能配置
                   </h3>
                   <button
                     onClick={() => setConfigPhase('none')}
                     className="text-slate-400 hover:text-slate-600"
                   >
                     <X className="w-5 h-5" />
                   </button>
                 </div>
                 
                 <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                   <div className="flex items-start gap-3">
                     <div className="text-amber-600 mt-0.5">
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                       </svg>
                     </div>
                     <div>
                       <div className="font-medium text-amber-800">AI增强功能说明</div>
                       <div className="text-sm text-amber-700 space-y-2">
                         <div>这是附加的增强功能，AI会尽力实现但可能存在局限性。建议先预览结果后再决定是否使用。</div>
                         <div className="font-medium mt-2">💡 AI增强原理：</div>
                         <ul className="text-xs space-y-1 ml-2 list-disc list-inside">
                           <li><strong>长期数据存储</strong>：通过集成平台提供的后端数据API，实现用户数据、进度、分数的持久化存储，支持跨设备同步</li>
                           <li><strong>多人在线使用</strong>：利用平台的WebSocket实时通信服务，实现房间管理、联机对战、协作学习等功能</li>
                           <li><strong>无缝集成</strong>：AI会调用window.TomorrowAI.xxx等封装好的API，确保与平台生态系统完美兼容</li>
                         </ul>
                       </div>
                     </div>
                   </div>
                 </div>

                 <p className="text-sm text-slate-600 mb-4">选择你需要的功能，AI会自动帮你修改代码：</p>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                   <button
                     onClick={() => setSelectedFeatures(prev => ({ ...prev, dataStorage: !prev.dataStorage }))}
                     className={`p-4 rounded-xl border-2 transition-all ${selectedFeatures.dataStorage ? 'border-green-500 bg-green-50' : 'border-slate-200 bg-white hover:border-green-300'}`}
                   >
                     <div className="flex items-center gap-3">
                       <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedFeatures.dataStorage ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                         <Database className="w-5 h-5" />
                       </div>
                       <div className="text-left">
                         <div className="font-bold text-slate-800">长期数据存储</div>
                         <div className="text-xs text-slate-500">保存用户数据、进度、分数等</div>
                       </div>
                       {selectedFeatures.dataStorage && <CheckCircle2 className="w-5 h-5 text-green-500 ml-auto" />}
                     </div>
                   </button>

                   <button
                     onClick={() => setSelectedFeatures(prev => ({ ...prev, multiplayer: !prev.multiplayer }))}
                     className={`p-4 rounded-xl border-2 transition-all ${selectedFeatures.multiplayer ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-blue-300'}`}
                   >
                     <div className="flex items-center gap-3">
                       <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedFeatures.multiplayer ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                         <Users2 className="w-5 h-5" />
                       </div>
                       <div className="text-left">
                         <div className="font-bold text-slate-800">多人在线使用</div>
                         <div className="text-xs text-slate-500">支持房间、联机对战、协作学习</div>
                       </div>
                       {selectedFeatures.multiplayer && <CheckCircle2 className="w-5 h-5 text-blue-500 ml-auto" />}
                     </div>
                   </button>
                 </div>

                 {(selectedFeatures.dataStorage || selectedFeatures.multiplayer) && (
                   <div className="mb-4">
                     <label className="block text-sm font-medium text-slate-700 mb-2">
                       具体需求描述 <span className="text-slate-400">（可选但推荐）</span>
                     </label>
                     <textarea
                       value={userRequirements}
                       onChange={(e) => setUserRequirements(e.target.value)}
                       placeholder="例如：帮我实现联机功能，使得赛车比赛可以由多人在不同的电脑通过同一个房间进行，请同步修改相关的操作规则..."
                       className="w-full h-32 px-4 py-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                     />
                     <p className="text-xs text-slate-500 mt-1">
                       描述得越具体，AI实现得越好！
                     </p>
                   </div>
                 )}

                 <div className="flex gap-3">
                   <button
                     onClick={() => setConfigPhase('none')}
                     className="flex-1 py-2 px-4 border border-slate-300 text-slate-600 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                   >
                     取消
                   </button>
                   <button
                     onClick={handleGenerateConfig}
                     disabled={!selectedFeatures.dataStorage && !selectedFeatures.multiplayer}
                     className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                   >
                     <Zap className="w-4 h-4" />
                     开始配置
                   </button>
                 </div>
               </div>
             )}

             {configPhase === 'generating' && (
               <div className="mb-4 p-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-slate-700">
                 <div className="flex items-center gap-3 mb-4">
                   <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center animate-pulse">
                     <Bot className="w-5 h-5 text-white" />
                   </div>
                   <div>
                     <div className="font-bold text-white">AI正在配置中...</div>
                     <div className="text-sm text-slate-400">{configProgressText}</div>
                   </div>
                 </div>

                 <div className="mb-4">
                   <div className="flex justify-between text-xs text-slate-400 mb-1">
                     <span>进度</span>
                     <span>{Math.round(configProgress)}%</span>
                   </div>
                   <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                     <div 
                       className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                       style={{ width: `${configProgress}%` }}
                     />
                   </div>
                 </div>

                 <div className="bg-slate-800/50 rounded-lg p-3 max-h-48 overflow-y-auto">
                   <div className="space-y-1">
                     {aiActionLog.map((action, index) => (
                       <div key={index} className="text-sm text-slate-300 flex items-center gap-2">
                         <span className="text-indigo-400">→</span>
                         {action}
                       </div>
                     ))}
                   </div>
                 </div>

                 {liveCodePreview && (
                   <div className="mt-4">
                     <div className="flex items-center gap-2 mb-2">
                       <div className="text-sm font-medium text-slate-300">实时代码预览</div>
                       <span className="text-xs text-slate-500">（{liveCodePreview.length} 字符）</span>
                     </div>
                     <div className="bg-slate-900 rounded-lg p-3 max-h-64 overflow-y-auto">
                       <pre className="text-xs text-slate-400 font-mono whitespace-pre-wrap">
                         {liveCodePreview.substring(0, 3000)}
                         {liveCodePreview.length > 3000 && '\n...'}
                       </pre>
                     </div>
                   </div>
                 )}
               </div>
             )}

             {configPhase === 'review' && generatedProject && (
               <div className="mb-4 p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                 <div className="flex items-center gap-3 mb-4">
                   <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                     <CheckCircle2 className="w-5 h-5 text-white" />
                   </div>
                   <div>
                     <div className="font-bold text-green-800">配置完成！</div>
                     <div className="text-sm text-green-600">{generatedProject.explanation}</div>
                   </div>
                 </div>

                 {generatedProject.changes && generatedProject.changes.length > 0 && (
                   <div className="mb-4">
                     <div className="text-sm font-medium text-green-800 mb-2">改进点：</div>
                     <ul className="space-y-1">
                       {generatedProject.changes.map((change, index) => (
                         <li key={index} className="text-sm text-green-700 flex items-center gap-2">
                           <Check className="w-4 h-4" />
                           {change}
                         </li>
                       ))}
                     </ul>
                   </div>
                 )}

                 {generatedProject.type === 'multi-file' && generatedProject.files && (
                   <div className="mb-4">
                     <div className="text-sm font-medium text-green-800 mb-2">文件结构：</div>
                     <div className="flex gap-4">
                       <div className="w-1/3">
                         <div className="bg-white rounded-lg border border-green-200 overflow-hidden">
                           {generatedProject.files.map((file, index) => (
                             <button
                               key={index}
                               onClick={() => setSelectedFileIndex(index)}
                               className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                                 selectedFileIndex === index
                                   ? 'bg-green-100 text-green-800 font-medium'
                                   : 'text-slate-600 hover:bg-slate-50'
                               }`}
                             >
                               <div className="flex items-center justify-between">
                                 <span className="truncate">{file.path}</span>
                                 <span className="text-xs text-slate-400 ml-2">
                                   {(file.content.length / 1024).toFixed(1)} KB
                                 </span>
                               </div>
                             </button>
                           ))}
                         </div>
                       </div>
                       <div className="flex-1">
                         <div className="bg-slate-900 rounded-lg overflow-hidden">
                           <div className="bg-slate-800 px-4 py-2 text-xs text-slate-400 border-b border-slate-700">
                             {generatedProject.files[selectedFileIndex]?.path}
                           </div>
                           <div className="p-4 max-h-96 overflow-y-auto">
                             <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap">
                               {generatedProject.files[selectedFileIndex]?.content}
                             </pre>
                           </div>
                         </div>
                       </div>
                     </div>
                   </div>
                 )}

                 {generatedProject.type === 'single-file' && generatedProject.code && (
                   <div className="mb-4">
                     <div className="text-sm font-medium text-green-800 mb-2">完整代码：</div>
                     <div className="bg-slate-900 rounded-lg overflow-hidden">
                       <div className="bg-slate-800 px-4 py-2 text-xs text-slate-400 border-b border-slate-700">
                         index.html
                       </div>
                       <div className="p-4 max-h-96 overflow-y-auto">
                         <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap">
                           {generatedProject.code}
                         </pre>
                       </div>
                     </div>
                   </div>
                 )}

                 <div className="flex gap-3">
                   <button
                     onClick={handleRejectConfig}
                     className="flex-1 py-2 px-4 border border-slate-300 text-slate-600 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                   >
                     拒绝配置
                   </button>
                   <button
                     onClick={handleRegenerateConfig}
                     className="flex-1 py-2 px-4 border border-indigo-300 text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
                   >
                     <RefreshCw className="w-4 h-4" />
                     重新生成
                   </button>
                   <button
                     onClick={handleAcceptConfig}
                     className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                   >
                     <CheckCircle2 className="w-4 h-4" />
                     接受配置
                   </button>
                 </div>
               </div>
             )}

             <div className="flex gap-4 mb-4">
               <button 
                 onClick={() => {
                   setProjectMode('single');
                   setEditorMode('upload');
                 }}
                 className={`flex-1 py-3 rounded-xl border-2 text-sm font-bold transition-all ${projectMode === 'single' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500'}`}
               >
                 {t('singleFile')}
               </button>
               <button 
                 onClick={() => {
                   setProjectMode('multi');
                   setEditorMode('upload');
                 }}
                 className={`flex-1 py-3 rounded-xl border-2 text-sm font-bold transition-all ${projectMode === 'multi' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500'}`}
               >
                 {t('multiFile')}
               </button>
             </div>

             {projectMode === 'single' && (
               <>
                 <div className="flex gap-4 mb-4">
                   <button 
                     onClick={() => {
                       setEditorMode('upload');
                       const fileInput = document.getElementById('code-upload') as HTMLInputElement;
                       if (fileInput) fileInput.value = '';
                     }}
                     className={`flex-1 py-3 rounded-xl border-2 text-sm font-bold transition-all ${editorMode === 'upload' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500'}`}
                   >
                     {t('uploadFile')}
                   </button>
                   <button 
                     onClick={() => setEditorMode('paste')}
                     className={`flex-1 py-3 rounded-xl border-2 text-sm font-bold transition-all ${editorMode === 'paste' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                   >
                     {t('pasteCode')}
                   </button>
                 </div>

                 <div className="flex-1 relative min-h-[300px]">
                    <div className={`absolute inset-0 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 transition-all ${editorMode === 'upload' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'}`}>
                        <div className="text-center p-8 w-full flex flex-col items-center justify-center">
                            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4 text-indigo-600">
                                <Upload className="w-8 h-8" />
                            </div>
                            <h4 className="text-lg font-bold text-slate-700 mb-2">{t('uploadCodeFile')}</h4>
                            <p className="text-sm text-slate-500 mb-6">{t('selectHtmlFile')}</p>
                            
                            <input 
                              id="code-upload"
                              type="file" 
                              accept=".html,.htm"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (ev) => {
                                        setFormData({...formData, code: ev.target?.result as string});
                                        setEditorMode('paste');
                                    };
                                    reader.readAsText(file);
                                }
                              }}
                            />
                            
                            <button 
                                type="button"
                                onClick={() => document.getElementById('code-upload')?.click()}
                                className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium shadow-sm hover:bg-indigo-700 transition-colors"
                            >
                                {t('selectFile')}
                            </button>
                        </div>
                    </div>

                    <textarea 
                      value={formData.code} 
                      onChange={e => setFormData({...formData, code: e.target.value})}
                      className={`absolute inset-0 w-full h-full p-4 font-mono text-sm bg-slate-900 text-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-all ${editorMode === 'paste' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'}`}
                      spellCheck={false}
                      placeholder={t('pasteCodePlaceholder')}
                    />
                 </div>
               </>
             )}

             {projectMode === 'multi' && (
               <div className="flex-1 flex flex-col gap-4">
                 {!zipFile ? (
                   <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 transition-all hover:border-indigo-300">
                     <div className="text-center p-8 w-full flex flex-col items-center justify-center">
                       <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4 text-indigo-600">
                         <FolderOpen className="w-8 h-8" />
                       </div>
                       <h4 className="text-lg font-bold text-slate-700 mb-2">{t('uploadZipFile')}</h4>
                       <p className="text-sm text-slate-500 mb-6">{t('zipFileDesc')}</p>
                       
                       <input 
                         id="zip-upload"
                         type="file" 
                         accept=".zip"
                         className="hidden"
                         onChange={(e) => {
                           const file = e.target.files?.[0];
                           if (file) {
                             handleZipUpload(file);
                           }
                         }}
                       />
                       
                       <button 
                         type="button"
                         onClick={() => document.getElementById('zip-upload')?.click()}
                         className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium shadow-sm hover:bg-indigo-700 transition-colors"
                       >
                         {t('selectZipFile')}
                       </button>
                     </div>
                   </div>
                 ) : (
                   <div className="flex-1 flex flex-col gap-4">
                     <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                       <div className="flex items-center gap-3">
                         <FolderOpen className="w-8 h-8 text-indigo-600" />
                         <div>
                           <p className="font-medium text-slate-800">{zipFile.name}</p>
                           <p className="text-sm text-slate-500">{formatFileSize(zipFile.size)}</p>
                         </div>
                       </div>
                       <button 
                         onClick={() => {
                           setZipFile(null);
                           setProjectStructure([]);
                           const fileInput = document.getElementById('zip-upload') as HTMLInputElement;
                           if (fileInput) fileInput.value = '';
                         }}
                         className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                       >
                         <X className="w-5 h-5" />
                       </button>
                     </div>

                     {isAnalyzingZip ? (
                       <div className="flex-1 flex items-center justify-center">
                         <div className="text-center">
                           <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                           <p className="text-slate-600">{t('analyzingZip')}</p>
                         </div>
                       </div>
                     ) : (
                       <div className="flex-1 border border-slate-200 rounded-xl bg-white overflow-hidden">
                         <div className="p-3 bg-slate-50 border-b border-slate-200">
                           <p className="text-sm font-medium text-slate-700">{t('projectStructure')}</p>
                         </div>
                         <div className="p-4 max-h-[300px] overflow-y-auto">
                           {projectStructure.length === 0 ? (
                             <p className="text-sm text-slate-500 text-center py-8">{t('emptyZip')}</p>
                           ) : (
                             <div className="space-y-1">
                               {projectStructure
                                 .sort((a, b) => {
                                   if (a.type === 'directory' && b.type !== 'directory') return -1;
                                   if (a.type !== 'directory' && b.type === 'directory') return 1;
                                   return a.path.localeCompare(b.path);
                                 })
                                 .map((file, index) => (
                                   <div key={index} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg">
                                     {file.type === 'directory' ? (
                                       <FolderOpen className="w-4 h-4 text-indigo-400" />
                                     ) : (
                                       getFileIcon(file.extension)
                                     )}
                                     <span className="text-sm text-slate-700 flex-1 truncate">{file.path}</span>
                                     {file.size && file.size > 0 && (
                                       <span className="text-xs text-slate-400">{formatFileSize(file.size)}</span>
                                     )}
                                   </div>
                                 ))}
                             </div>
                           )}
                         </div>
                       </div>
                     )}
                   </div>
                 )}
               </div>
             )}
             
             <div className="mt-4 flex justify-between items-center text-sm text-slate-500">
                <div className="flex gap-4">
                    <button 
                        onClick={() => setFormData({...formData, code: ''})}
                        className={`text-slate-400 hover:text-slate-600 font-medium ${formData.code.length < 50 ? 'hidden' : ''}`}
                    >
                        {t('clear')}
                    </button>
                    <span className={`text-slate-400 text-xs ${formData.code.length > 0 ? 'hidden' : ''}`}>
                        {t('pleaseEnterCode')}
                    </span>
                </div>
                {formData.code.length > 100 && (
                    <div className="flex items-center gap-2 text-emerald-600">
                        <Check className="w-4 h-4" />
                        <span>{formData.code.length} {t('chars')}</span>
                    </div>
                )}
             </div>
             
             <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
               <div className="flex items-center gap-2 mb-3">
                 <Image className="w-4 h-4 text-slate-500" />
                 <span className="text-sm font-medium text-slate-700">{t('thumbnail')}（{t('thumbnailOptional')}）</span>
               </div>
               
               {thumbnailPreview ? (
                 <div className="relative inline-block">
                   <img 
                     src={thumbnailPreview} 
                     alt={t('thumbnail')}
                     className="w-32 h-24 object-cover rounded-lg border border-slate-200"
                   />
                   <button
                     onClick={handleRemoveThumbnail}
                     className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm"
                     title={t('removeThumbnail')}
                   >
                     <X className="w-3 h-3" />
                   </button>
                 </div>
               ) : (
                 <div className="flex items-center gap-4">
                   <label className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors text-sm text-slate-600">
                     <Upload className="w-4 h-4" />
                     <span>{t('uploadThumbnail')}</span>
                     <input
                       type="file"
                       accept="image/*"
                       onChange={handleThumbnailUpload}
                       className="hidden"
                     />
                   </label>
                   <span className="text-xs text-slate-400">{t('thumbnailFormats')}</span>
                 </div>
               )}
             </div>
           </div>
         )}

         {step === 3 && (
            <div className="h-full flex flex-col animate-in slide-in-from-right-8 duration-300">
              <label className="block text-sm font-medium text-slate-700 mb-3">{t('stepPreview')}</label>
              <div className="flex-1 min-h-[400px] border-2 border-slate-200 border-dashed rounded-xl bg-white overflow-hidden relative">
                 {projectMode === 'single' ? (
                   <iframe 
                     key={`single-${formData.code.length}-${Date.now()}`}
                     srcDoc={formData.code} 
                     className="w-full h-full absolute inset-0 border-0" 
                     title={t('stepPreview')} 
                     sandbox="allow-scripts allow-popups allow-modals allow-same-origin"
                   />
                 ) : previewContent ? (
                   <iframe 
                     key={`multi-${previewContent.length}-${Date.now()}`}
                     srcDoc={previewContent} 
                     className="w-full h-full absolute inset-0 border-0" 
                     title={t('stepPreview')} 
                     sandbox="allow-scripts allow-popups allow-modals allow-same-origin"
                   />
                 ) : (
                   <div className="flex items-center justify-center h-full bg-slate-50">
                     <div className="text-center">
                       <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4 text-indigo-600">
                         <FolderOpen className="w-8 h-8" />
                       </div>
                       <h4 className="text-lg font-bold text-slate-700 mb-2">{t('multiFile')} {t('project')}</h4>
                       <p className="text-sm text-slate-500 mb-4">{t('multiFilePreviewDesc')}</p>
                       <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm max-w-md mx-auto">
                         <p className="text-xs text-slate-600 mb-2 font-medium">{t('projectDetails')}:</p>
                         <p className="text-xs text-slate-500 mb-1">• {t('fileName')}: {zipFile?.name || '-'}</p>
                         <p className="text-xs text-slate-500 mb-1">• {t('fileSize')}: {zipFile ? formatFileSize(zipFile.size) : '-'}</p>
                         <p className="text-xs text-slate-500 mb-1">• {t('fileCount')}: {projectStructure.length}</p>
                       </div>
                     </div>
                   </div>
                 )}
              </div>
              
              <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
                <div className="flex items-center gap-2 text-sm text-amber-700">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  <span>{t('submitForReview')}</span>
                </div>
              </div>
            </div>
         )}
       </div>

       <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
         <button 
           onClick={() => {
             if (bountyContext && step === 2) onCancel();
             else if (step === 0) onCancel();
             else if (step === 2 && isPlayground) { setIsPlayground(false); setStep(0); }
             else if (bountyContext) {
               if (step === 3) setStep(2);
             } else {
               setStep(s => s - 1);
             }
           }}
           className="px-6 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
         >
           {bountyContext && step === 2 ? t('cancel') : 
            bountyContext && step === 3 ? t('back') :
            step === 0 ? t('cancel') : t('back')}
         </button>
         
         <div className="flex gap-2">
            {isPlayground && step === 3 && (
                <button 
                    onClick={onCancel}
                    className="px-6 py-2 border border-slate-300 text-slate-600 font-medium rounded-lg hover:bg-slate-100 transition-colors"
                >
                    {t('exit')}
                </button>
            )}

            {(!isPlayground || step !== 3) && (
                <button 
                onClick={() => step === 3 ? handleSubmit() : (bountyContext ? setStep(3) : setStep(s => s + 1))}
                disabled={
                    (bountyContext ? 
                      (step === 2 && (!formData.code || formData.code.trim().length === 0) && !zipFile) :
                      (step === 0 && formData.layer === 'community' && !formData.communityId) ||
                      (step === 1 && (!formData.title || !formData.categoryId)) ||
                      (step === 2 && (!formData.code || formData.code.trim().length === 0) && !zipFile))
                }
                className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                {step === 3 ? t('submit') : t('next')}
                </button>
            )}
         </div>
       </div>
    </div>
  );
};

