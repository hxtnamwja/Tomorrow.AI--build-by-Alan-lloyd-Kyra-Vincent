// 懒加载服务 - 按需加载演示程序详情
import { Demo } from '../types';

// 缓存已加载的演示程序详情
const demoDetailsCache = new Map<string, Demo>();

/**
 * 获取演示程序列表（基础信息）
 * 只加载id、title、thumbnail、author等基本信息
 */
export async function fetchDemoList(): Promise<Demo[]> {
  const apiBase = import.meta.env.VITE_API_URL || '/api/v1';
  
  try {
    const response = await fetch(`${apiBase}/demos?fields=basic`);
    if (!response.ok) throw new Error('Failed to fetch demo list');
    
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching demo list:', error);
    return [];
  }
}

/**
 * 获取演示程序详情（完整信息）
 * 包括code、comments、likes等
 */
export async function fetchDemoDetail(demoId: string): Promise<Demo | null> {
  // 检查缓存
  if (demoDetailsCache.has(demoId)) {
    console.log(`[LazyLoad] Using cached detail for ${demoId}`);
    return demoDetailsCache.get(demoId)!;
  }
  
  const apiBase = import.meta.env.VITE_API_URL || '/api/v1';
  
  try {
    const response = await fetch(`${apiBase}/demos/${demoId}`);
    if (!response.ok) throw new Error('Failed to fetch demo detail');
    
    const result = await response.json();
    const demo = result.data;
    
    // 缓存结果
    if (demo) {
      demoDetailsCache.set(demoId, demo);
    }
    
    return demo;
  } catch (error) {
    console.error(`Error fetching demo detail for ${demoId}:`, error);
    return null;
  }
}

/**
 * 预加载演示程序详情（在后台加载）
 */
export function prefetchDemoDetail(demoId: string): void {
  if (demoDetailsCache.has(demoId)) return;
  
  // 使用requestIdleCallback在浏览器空闲时加载
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      fetchDemoDetail(demoId);
    }, { timeout: 2000 });
  } else {
    // 降级方案：使用setTimeout
    setTimeout(() => fetchDemoDetail(demoId), 100);
  }
}

/**
 * 清除缓存
 */
export function clearDemoCache(demoId?: string): void {
  if (demoId) {
    demoDetailsCache.delete(demoId);
  } else {
    demoDetailsCache.clear();
  }
}

/**
 * 获取缓存大小
 */
export function getCacheSize(): number {
  return demoDetailsCache.size;
}
