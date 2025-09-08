/**
 * 大纲服务
 * 处理大纲相关的存储操作（兼容当前视图需求）
 */
import { BaseStorageService } from './BaseStorageService';
import type { StorageAdapter } from '../adapters/StorageInterfaces';

export type OutlineType = 'main' | 'detailed';
export type OutlineStatus = 'draft' | 'completed' | 'reviewing';

export interface OutlineItem {
  id: string;
  projectId: string;
  title: string;
  type: OutlineType;
  status: OutlineStatus;
  content?: string;
  notes?: string;
  parentId?: string | null;
  order: number;
  createdAt: string;
  lastModified: string;
}

export type CreateOutlineData = {
  title: string;
  type: OutlineType;
  content?: string;
  status?: OutlineStatus;
  notes?: string;
  parentId?: string | null;
};

export type UpdateOutlineData = {
  id: string;
  title?: string;
  type?: OutlineType;
  content?: string;
  status?: OutlineStatus;
  notes?: string;
  parentId?: string | null;
  order?: number;
};

export class OutlineService extends BaseStorageService {
  constructor(adapter: StorageAdapter) {
    super(adapter);
  }

  private file(projectId: string) {
    return `project_${projectId}_outlines.json`;
  }

  async getProjectOutlines(projectId: string): Promise<OutlineItem[]> {
    const cacheKey = this.getCacheKey('outlines', projectId);
    let list = this.getCache<OutlineItem[]>(cacheKey);
    if (!list) {
      list = await this.readJsonFile(this.file(projectId), []);
      // 兜底补全字段
      const now = new Date().toISOString();
      list = (list as any[]).map((o, idx) => ({
        id: o.id,
        projectId: o.projectId ?? projectId,
        title: o.title ?? '',
        type: (o.type as OutlineType) ?? 'main',
        status: (o.status as OutlineStatus) ?? 'draft',
        content: o.content ?? (o.summary ?? ''), // 兼容旧字段 summary
        notes: o.notes ?? '',
        parentId: o.parentId ?? null,
        order: typeof o.order === 'number' ? o.order : idx + 1,
        createdAt: o.createdAt ?? now,
        lastModified: o.lastModified ?? now
      }));
      this.setCache(cacheKey, list);
    }
    return list.sort((a, b) => a.order - b.order);
  }

  async createOutline(projectId: string, data: CreateOutlineData): Promise<OutlineItem> {
    const list = await this.getProjectOutlines(projectId);
    const now = new Date().toISOString();
    const item: OutlineItem = {
      id: `outline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      projectId,
      title: data.title,
      type: data.type,
      status: data.status ?? 'draft',
      content: data.content ?? '',
      notes: data.notes ?? '',
      parentId: data.parentId ?? null,
      order: list.length + 1,
      createdAt: now,
      lastModified: now
    };
    list.push(item);
    await this.writeJsonFile(this.file(projectId), list);
    this.clearCache(this.getCacheKey('outlines', projectId));
    return item;
  }

  async updateOutline(projectId: string, data: UpdateOutlineData): Promise<OutlineItem> {
    const list = await this.getProjectOutlines(projectId);
    const idx = list.findIndex(o => o.id === data.id);
    if (idx === -1) throw new Error('大纲不存在');
    const now = new Date().toISOString();
    const updated: OutlineItem = {
      ...list[idx],
      ...data,
      lastModified: now
    };
    list[idx] = updated;
    await this.writeJsonFile(this.file(projectId), list);
    this.clearCache(this.getCacheKey('outlines', projectId));
    return updated;
  }

  async deleteOutline(projectId: string, id: string): Promise<void> {
    const list = await this.getProjectOutlines(projectId);
    // 同时删除树的子节点
    const toDelete = new Set<string>([id]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const o of list) {
        if (o.parentId && toDelete.has(o.parentId) && !toDelete.has(o.id)) {
          toDelete.add(o.id);
          changed = true;
        }
      }
    }
    const filtered = list.filter(o => !toDelete.has(o.id));
    await this.writeJsonFile(this.file(projectId), filtered);
    this.clearCache(this.getCacheKey('outlines', projectId));
  }
}