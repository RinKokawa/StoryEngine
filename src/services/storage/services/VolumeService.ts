/**
 * 卷服务
 * 处理卷相关的存储操作
 */

import { BaseStorageService } from './BaseStorageService';
import { StorageAdapter } from '../adapters/StorageInterfaces';
import { AppError } from '@/types';
import type { Volume } from '@/types/project';

// 重新导出类型以保持兼容性
export type { Volume };

export class VolumeService extends BaseStorageService {
  /**
   * 构造函数
   * @param adapter 存储适配器
   */
  constructor(adapter: StorageAdapter) {
    super(adapter);
  }

  /**
   * 获取项目的所有卷
   * @param projectId 项目ID
   * @returns 卷列表
   */
  async getProjectVolumes(projectId: string): Promise<Volume[]> {
    const cacheKey = this.getCacheKey('volumes', projectId);
    let volumes = this.getCache<Volume[]>(cacheKey);
    
    if (!volumes) {
      volumes = await this.readJsonFile(`project_${projectId}_volumes.json`, []);
      this.setCache(cacheKey, volumes);
    }
    
    return volumes.sort((a, b) => a.order - b.order);
  }

  /**
   * 获取单个卷
   * @param projectId 项目ID
   * @param volumeId 卷ID
   * @returns 卷对象或null
   */
  async getVolume(projectId: string, volumeId: string): Promise<Volume | null> {
    const volumes = await this.getProjectVolumes(projectId);
    return volumes.find(v => v.id === volumeId) || null;
  }

  /**
   * 创建新卷
   * @param projectId 项目ID
   * @param volumeData 卷数据
   * @returns 创建的卷
   */
  async createVolume(projectId: string, volumeData: Partial<Volume>): Promise<Volume> {
    const volumes = await this.getProjectVolumes(projectId);
    
    const volume: Volume = {
      id: `volume_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      projectId,
      title: volumeData.title || '新卷',
      order: volumeData.order || volumes.length + 1,
      description: volumeData.description || '',
      status: volumeData.status || 'draft',
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      ...volumeData
    };
    
    volumes.push(volume);
    await this.writeJsonFile(`project_${projectId}_volumes.json`, volumes);
    this.clearCache(`volumes_${projectId}`);
    
    return volume;
  }

  /**
   * 更新卷
   * @param projectId 项目ID
   * @param volumeData 卷更新数据
   * @returns 更新后的卷
   */
  async updateVolume(projectId: string, volumeData: Partial<Volume>): Promise<Volume> {
    const volumes = await this.getProjectVolumes(projectId);
    const index = volumes.findIndex(v => v.id === volumeData.id);
    
    if (index === -1) {
      throw new AppError('卷不存在');
    }
    
    volumes[index] = { ...volumes[index], ...volumeData, lastModified: new Date().toISOString() };
    await this.writeJsonFile(`project_${projectId}_volumes.json`, volumes);
    this.clearCache(`volumes_${projectId}`);
    
    return volumes[index];
  }

  /**
   * 删除卷
   * @param projectId 项目ID
   * @param volumeId 卷ID
   */
  async deleteVolume(projectId: string, volumeId: string): Promise<void> {
    const volumes = await this.getProjectVolumes(projectId);
    const filteredVolumes = volumes.filter(v => v.id !== volumeId);
    
    await this.writeJsonFile(`project_${projectId}_volumes.json`, filteredVolumes);
    this.clearCache(`volumes_${projectId}`);
  }

  /**
   * 重新排序卷
   * @param projectId 项目ID
   * @param volumeIds 卷ID数组，按新顺序排列
   */
  async reorderVolumes(projectId: string, volumeIds: string[]): Promise<void> {
    const volumes = await this.getProjectVolumes(projectId);
    
    volumeIds.forEach((id, index) => {
      const volume = volumes.find(v => v.id === id);
      if (volume) {
        volume.order = index + 1;
        volume.lastModified = new Date().toISOString();
      }
    });
    
    await this.writeJsonFile(`project_${projectId}_volumes.json`, volumes);
    this.clearCache(`volumes_${projectId}`);
  }
}