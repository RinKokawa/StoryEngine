/**
 * 泛型列表服务基类
 * 封装通用的增删改查逻辑，减少重复代码
 */

import { BaseStorageService } from '../BaseStorageService';
import { StorageAdapter } from '../../adapters/StorageInterfaces';
import { AppError } from '@/types';

export interface ListItem {
  id: string;
  createdAt: string;
  lastModified: string;
  [key: string]: any;
}

export interface ListServiceConfig<T extends ListItem> {
  /** 文件名生成函数 */
  getFileName: (projectId?: string) => string;
  /** 缓存键生成函数 */
  getCacheKey: (projectId?: string) => string;
  /** 创建默认项目函数 */
  createDefaultItem: (data: Partial<T>, projectId?: string) => T;
  /** 排序函数 */
  sortItems?: (items: T[]) => T[];
  /** 验证函数 */
  validateItem?: (item: T) => void;
}

export abstract class ListService<T extends ListItem> extends BaseStorageService {
  protected config: ListServiceConfig<T>;

  constructor(adapter: StorageAdapter, config: ListServiceConfig<T>) {
    super(adapter);
    this.config = config;
  }

  /**
   * 获取所有项目
   * @param projectId 可选的项目ID
   * @returns 项目列表
   */
  async getItems(projectId?: string): Promise<T[]> {
    const cacheKey = this.config.getCacheKey(projectId);
    let items = this.getCache<T[]>(cacheKey);
    
    if (!items) {
      const fileName = this.config.getFileName(projectId);
      items = await this.readJsonFile<T[]>(fileName, []);
      this.setCache(cacheKey, items);
    }
    
    return this.config.sortItems ? this.config.sortItems(items) : items;
  }

  /**
   * 获取单个项目
   * @param id 项目ID
   * @param projectId 可选的项目ID
   * @returns 项目对象或null
   */
  async getItem(id: string, projectId?: string): Promise<T | null> {
    const items = await this.getItems(projectId);
    return items.find(item => item.id === id) || null;
  }

  /**
   * 创建新项目
   * @param data 项目创建数据
   * @param projectId 可选的项目ID
   * @returns 创建的项目
   */
  async createItem(data: Partial<T>, projectId?: string): Promise<T> {
    const item = this.config.createDefaultItem(data, projectId);
    
    // 验证项目
    if (this.config.validateItem) {
      this.config.validateItem(item);
    }
    
    const items = await this.getItems(projectId);
    items.push(item);
    
    await this.saveItems(items, projectId);
    return item;
  }

  /**
   * 更新项目
   * @param id 项目ID
   * @param data 更新数据
   * @param projectId 可选的项目ID
   * @returns 更新后的项目
   */
  async updateItem(id: string, data: Partial<T>, projectId?: string): Promise<T> {
    const items = await this.getItems(projectId);
    const index = items.findIndex(item => item.id === id);
    
    if (index === -1) {
      throw new AppError('项目不存在');
    }
    
    const updatedItem = { 
      ...items[index], 
      ...data, 
      lastModified: new Date().toISOString() 
    } as T;
    
    // 验证更新后的项目
    if (this.config.validateItem) {
      this.config.validateItem(updatedItem);
    }
    
    items[index] = updatedItem;
    await this.saveItems(items, projectId);
    
    return updatedItem;
  }

  /**
   * 删除项目
   * @param id 项目ID
   * @param projectId 可选的项目ID
   */
  async deleteItem(id: string, projectId?: string): Promise<void> {
    const items = await this.getItems(projectId);
    const filteredItems = items.filter(item => item.id !== id);
    
    await this.saveItems(filteredItems, projectId);
  }

  /**
   * 批量删除项目
   * @param ids 项目ID数组
   * @param projectId 可选的项目ID
   */
  async deleteItems(ids: string[], projectId?: string): Promise<void> {
    const items = await this.getItems(projectId);
    const filteredItems = items.filter(item => !ids.includes(item.id));
    
    await this.saveItems(filteredItems, projectId);
  }

  /**
   * 保存项目列表
   * @param items 项目列表
   * @param projectId 可选的项目ID
   */
  protected async saveItems(items: T[], projectId?: string): Promise<void> {
    const fileName = this.config.getFileName(projectId);
    await this.writeJsonFile(fileName, items);
    
    const cacheKey = this.config.getCacheKey(projectId);
    this.clearCache(cacheKey);
  }

  /**
   * 检查项目是否存在
   * @param id 项目ID
   * @param projectId 可选的项目ID
   * @returns 是否存在
   */
  async itemExists(id: string, projectId?: string): Promise<boolean> {
    const item = await this.getItem(id, projectId);
    return item !== null;
  }

  /**
   * 获取项目数量
   * @param projectId 可选的项目ID
   * @returns 项目数量
   */
  async getItemCount(projectId?: string): Promise<number> {
    const items = await this.getItems(projectId);
    return items.length;
  }

  /**
   * 搜索项目
   * @param predicate 搜索条件函数
   * @param projectId 可选的项目ID
   * @returns 匹配的项目列表
   */
  async searchItems(predicate: (item: T) => boolean, projectId?: string): Promise<T[]> {
    const items = await this.getItems(projectId);
    return items.filter(predicate);
  }

  /**
   * 重新排序项目（如果项目有order字段）
   * @param itemIds 项目ID数组，按新顺序排列
   * @param projectId 可选的项目ID
   */
  async reorderItems(itemIds: string[], projectId?: string): Promise<void> {
    const items = await this.getItems(projectId);
    
    itemIds.forEach((id, index) => {
      const item = items.find(i => i.id === id);
      if (item && 'order' in item) {
        (item as any).order = index + 1;
        item.lastModified = new Date().toISOString();
      }
    });
    
    await this.saveItems(items, projectId);
  }
}