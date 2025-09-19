/**
 * 增强版卷服务
 * 使用ListService基类，展示重构后的架构
 */

import { ListService, ListItem } from '../base/ListService';
import { StorageAdapter } from '../../adapters/StorageInterfaces';
import { AppError } from '@/types';

export interface Volume extends ListItem {
  projectId: string;
  title: string;
  order: number;
  description: string;
  status: 'draft' | 'writing' | 'completed' | 'published';
  wordCount?: number;
  targetWords?: number;
  tags?: string[];
}

export interface CreateVolumeData {
  title: string;
  description?: string;
  order?: number;
  status?: Volume['status'];
  targetWords?: number;
  tags?: string[];
}

export interface UpdateVolumeData extends Partial<CreateVolumeData> {
  id: string;
  wordCount?: number;
}

export class EnhancedVolumeService extends ListService<Volume> {
  constructor(adapter: StorageAdapter) {
    super(adapter, {
      getFileName: (projectId?: string) => {
        if (!projectId) {
          throw new AppError('项目ID是必需的');
        }
        return `project_${projectId}_volumes.json`;
      },
      getCacheKey: (projectId?: string) => {
        if (!projectId) {
          throw new AppError('项目ID是必需的');
        }
        return `volumes_${projectId}`;
      },
      createDefaultItem: (data: Partial<Volume>, projectId?: string): Volume => {
        if (!projectId) {
          throw new AppError('项目ID是必需的');
        }
        
        return {
          id: `volume_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          projectId,
          title: data.title || '新卷',
          order: data.order || 1,
          description: data.description || '',
          status: data.status || 'draft',
          wordCount: data.wordCount || 0,
          targetWords: data.targetWords,
          tags: data.tags || [],
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          ...data
        };
      },
      sortItems: (items: Volume[]) => {
        return items.sort((a, b) => a.order - b.order);
      },
      validateItem: (item: Volume) => {
        if (!item.title.trim()) {
          throw new AppError('卷标题不能为空');
        }
        if (!item.projectId) {
          throw new AppError('项目ID不能为空');
        }
        if (item.order < 1) {
          throw new AppError('卷顺序必须大于0');
        }
      }
    });
  }

  /**
   * 获取项目的所有卷
   */
  async getProjectVolumes(projectId: string): Promise<Volume[]> {
    return this.getItems(projectId);
  }

  /**
   * 获取单个卷
   */
  async getVolume(projectId: string, volumeId: string): Promise<Volume | null> {
    return this.getItem(volumeId, projectId);
  }

  /**
   * 创建新卷
   */
  async createVolume(projectId: string, data: CreateVolumeData): Promise<Volume> {
    // 如果没有指定顺序，设置为最后一个
    if (!data.order) {
      const existingVolumes = await this.getProjectVolumes(projectId);
      data.order = existingVolumes.length + 1;
    }

    return this.createItem(data, projectId);
  }

  /**
   * 更新卷
   */
  async updateVolume(projectId: string, data: UpdateVolumeData): Promise<Volume> {
    return this.updateItem(data.id, data, projectId);
  }

  /**
   * 删除卷
   */
  async deleteVolume(projectId: string, volumeId: string): Promise<void> {
    await this.deleteItem(volumeId, projectId);
    
    // 重新调整其他卷的顺序
    await this.reorderAfterDeletion(projectId, volumeId);
  }

  /**
   * 重新排序卷
   */
  async reorderVolumes(projectId: string, volumeIds: string[]): Promise<void> {
    await this.reorderItems(volumeIds, projectId);
  }

  /**
   * 获取卷的统计信息
   */
  async getVolumeStats(projectId: string, volumeId: string): Promise<VolumeStats> {
    const volume = await this.getVolume(projectId, volumeId);
    if (!volume) {
      throw new AppError('卷不存在');
    }

    // 这里可以集成其他服务来获取更详细的统计信息
    // 比如章节数量、总字数等
    return {
      id: volume.id,
      title: volume.title,
      wordCount: volume.wordCount || 0,
      targetWords: volume.targetWords || 0,
      progress: this.calculateProgress(volume.wordCount || 0, volume.targetWords || 0),
      status: volume.status,
      chapterCount: 0, // 需要从ChapterService获取
      lastModified: volume.lastModified
    };
  }

  /**
   * 搜索卷
   */
  async searchVolumes(projectId: string, query: string): Promise<Volume[]> {
    return this.searchItems((volume) => {
      const searchText = `${volume.title} ${volume.description}`.toLowerCase();
      return searchText.includes(query.toLowerCase());
    }, projectId);
  }

  /**
   * 按状态筛选卷
   */
  async getVolumesByStatus(projectId: string, status: Volume['status']): Promise<Volume[]> {
    return this.searchItems((volume) => volume.status === status, projectId);
  }

  /**
   * 更新卷字数
   */
  async updateVolumeWordCount(projectId: string, volumeId: string, wordCount: number): Promise<void> {
    await this.updateVolume(projectId, { id: volumeId, wordCount });
  }

  /**
   * 批量更新卷状态
   */
  async batchUpdateStatus(projectId: string, volumeIds: string[], status: Volume['status']): Promise<void> {
    const volumes = await this.getProjectVolumes(projectId);
    const updates = volumes
      .filter(volume => volumeIds.includes(volume.id))
      .map(volume => ({ ...volume, status, lastModified: new Date().toISOString() }));

    await this.saveItems(updates, projectId);
  }

  /**
   * 删除后重新调整顺序
   */
  private async reorderAfterDeletion(projectId: string, _deletedVolumeId: string): Promise<void> {
    const volumes = await this.getProjectVolumes(projectId);
    let needsReorder = false;

    // 检查是否需要重新排序
    volumes.forEach((volume, index) => {
      const expectedOrder = index + 1;
      if (volume.order !== expectedOrder) {
        volume.order = expectedOrder;
        volume.lastModified = new Date().toISOString();
        needsReorder = true;
      }
    });

    if (needsReorder) {
      await this.saveItems(volumes, projectId);
    }
  }

  /**
   * 计算进度百分比
   */
  private calculateProgress(currentWords: number, targetWords: number): number {
    if (targetWords <= 0) return 0;
    return Math.min(100, Math.round((currentWords / targetWords) * 100));
  }
}

export interface VolumeStats {
  id: string;
  title: string;
  wordCount: number;
  targetWords: number;
  progress: number;
  status: Volume['status'];
  chapterCount: number;
  lastModified: string;
}