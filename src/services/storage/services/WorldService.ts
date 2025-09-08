/**
 * 世界设定服务
 * 处理世界观/设定相关的存储操作（兼容当前视图需求）
 */
import { BaseStorageService } from './BaseStorageService';
import type { StorageAdapter } from '../adapters/StorageInterfaces';

export type WorldStatus = 'draft' | 'developing' | 'completed';

export interface WorldItem {
  id: string;
  projectId: string;
  name: string;
  category?: string;
  description?: string;
  content?: string;
  notes?: string;
  status?: WorldStatus;
  tags?: string[];
  createdAt: string;
  lastModified: string;
}

export interface CreateWorldItemData {
  name: string;
  category?: string;
  description?: string;
  content?: string;
  notes?: string;
  status?: WorldStatus;
  tags?: string[];
}

export interface UpdateWorldItemData {
  id: string;
  name?: string;
  category?: string;
  description?: string;
  content?: string;
  notes?: string;
  status?: WorldStatus;
  tags?: string[];
}

export class WorldService extends BaseStorageService {
  constructor(adapter: StorageAdapter) {
    super(adapter);
  }

  private file(projectId: string) {
    return `project_${projectId}_world.json`;
  }

  async getProjectWorldItems(projectId: string): Promise<WorldItem[]> {
    const cacheKey = this.getCacheKey('world', projectId);
    let list = this.getCache<WorldItem[]>(cacheKey);
    if (!list) {
      list = await this.readJsonFile(this.file(projectId), []);
      // 兜底补全字段
      const now = new Date().toISOString();
      list = (list as any[]).map(o => ({
        id: o.id,
        projectId: o.projectId ?? projectId,
        name: o.name ?? '',
        category: o.category ?? '',
        description: o.description ?? '',
        content: o.content ?? '',
        notes: o.notes ?? '',
        status: (o.status as WorldStatus) ?? 'draft',
        tags: Array.isArray(o.tags) ? o.tags : [],
        createdAt: o.createdAt ?? now,
        lastModified: o.lastModified ?? now
      }));
      this.setCache(cacheKey, list);
    }
    return list;
  }

  async createWorldItem(projectId: string, data: CreateWorldItemData): Promise<WorldItem> {
    const list = await this.getProjectWorldItems(projectId);
    const now = new Date().toISOString();
    const item: WorldItem = {
      id: `world_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      projectId,
      name: data.name,
      category: data.category ?? '',
      description: data.description ?? '',
      content: data.content ?? '',
      notes: data.notes ?? '',
      status: data.status ?? 'draft',
      tags: Array.isArray(data.tags) ? data.tags : [],
      createdAt: now,
      lastModified: now
    };
    list.push(item);
    await this.writeJsonFile(this.file(projectId), list);
    this.clearCache(this.getCacheKey('world', projectId));
    return item;
  }

  async updateWorldItem(projectId: string, data: UpdateWorldItemData): Promise<WorldItem> {
    const list = await this.getProjectWorldItems(projectId);
    const idx = list.findIndex(o => o.id === data.id);
    if (idx === -1) throw new Error('设定不存在');
    const now = new Date().toISOString();
    const updated: WorldItem = {
      ...list[idx],
      ...data,
      lastModified: now
    };
    list[idx] = updated;
    await this.writeJsonFile(this.file(projectId), list);
    this.clearCache(this.getCacheKey('world', projectId));
    return updated;
  }

  async deleteWorldItem(projectId: string, id: string): Promise<void> {
    const list = await this.getProjectWorldItems(projectId);
    const filtered = list.filter(o => o.id !== id);
    await this.writeJsonFile(this.file(projectId), filtered);
    this.clearCache(this.getCacheKey('world', projectId));
  }
}