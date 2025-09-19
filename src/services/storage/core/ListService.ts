/**
 * 泛型列表服务基类
 * 封装通用的增删改查逻辑，减少重复代码
 */

import { BaseStorageService } from '../services/BaseStorageService';
import { StorageAdapter } from '../adapters/StorageInterfaces';
import { AppError } from '@/types';

export interface ListItem {
  id: string;
  createdAt: string;
  lastModified: string;
}

export interface CreateData {
  [key: string]: any;
}

export interface UpdateData {
  id: string;
  [key: string]: any;
}

export abstract class ListService<T extends ListItem, C extends CreateData, U extends UpdateData> extends BaseStorageService {
  protected abstract readonly entityName: string;
  protected abstract readonly fileName: string;

  constructor(adapter: StorageAdapter) {
    super(adapter);
  }

  /**
   * 获取所有项目
   * @returns 项目列表
   */
  async getAll(): Promise<T[]> {
    const cacheKey = this.getCacheKey(this.entityName);
    let items = this.getCache<T[]>(cacheKey);
    
    if (!items) {
      items = await this.readJsonFile<T[]>(this.fileName, []);
      this.setCache(cacheKey, items);
    }
    
    return this.sortItems(items);
  }

  /**
   * 根据ID获取单个项目
   * @param id 项目ID
   * @returns 项目对象或null
   */
  async getById(id: string): Promise<T | null> {
    const items = await this.getAll();
    return items.find(item => item.id === id) || null;
  }

  /**
   * 创建新项目
   * @param data 创建数据
   * @returns 创建的项目
   */
  async create(data: C): Promise<T> {
    const item = this.createNewItem(data);
    await this.save(item);
    return item;
  }

  /**
   * 更新项目
   * @param data 更新数据
   * @returns 更新后的项目
   */
  async update(data: U): Promise<T> {
    const items = await this.getAll();
    const index = items.findIndex(item => item.id === data.id);
    
    if (index === -1) {
      throw new AppError(`${this.entityName}不存在`);
    }
    
    const updated = this.updateItem(items[index], data);
    items[index] = updated;
    
    await this.writeJsonFile(this.fileName, items);
    this.clearCache(this.entityName);
    
    return updated;
  }

  /**
   * 删除项目
   * @param id 项目ID
   */
  async delete(id: string): Promise<void> {
    const items = await this.getAll();
    const filteredItems = items.filter(item => item.id !== id);
    
    await this.writeJsonFile(this.fileName, filteredItems);
    this.clearCache(this.entityName);
    
    // 执行删除后的清理工作
    await this.onAfterDelete(id);
  }

  /**
   * 保存单个项目
   * @param item 项目对象
   */
  protected async save(item: T): Promise<void> {
    const items = await this.getAll();
    const index = items.findIndex(existing => existing.id === item.id);
    
    if (index >= 0) {
      items[index] = { ...item, lastModified: new Date().toISOString() };
    } else {
      items.push({ ...item, lastModified: new Date().toISOString() });
    }
    
    await this.writeJsonFile(this.fileName, items);
    this.clearCache(this.entityName);
  }

  /**
   * 创建新项目实例
   * @param data 创建数据
   * @returns 新项目实例
   */
  protected abstract createNewItem(data: C): T;

  /**
   * 更新项目实例
   * @param existing 现有项目
   * @param data 更新数据
   * @returns 更新后的项目
   */
  protected updateItem(existing: T, data: U): T {
    return { ...existing, ...data, lastModified: new Date().toISOString() };
  }

  /**
   * 排序项目列表
   * @param items 项目列表
   * @returns 排序后的列表
   */
  protected sortItems(items: T[]): T[] {
    return items.sort((a, b) => 
      new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
    );
  }

  /**
   * 删除后的清理工作
   * @param id 被删除项目的ID
   */
  protected async onAfterDelete(id: string): Promise<void> {
    // 子类可以重写此方法来执行特定的清理工作
  }

  /**
   * 生成唯一ID
   * @param prefix ID前缀
   * @returns 唯一ID
   */
  protected generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}