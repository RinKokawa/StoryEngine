/**
 * 基础存储服务
 * 提供缓存管理和通用文件操作
 */

import { StorageAdapter } from '../adapters/StorageInterfaces';
import { AppError } from '@/types';

export class BaseStorageService {
  protected adapter: StorageAdapter;
  protected cache = new Map<string, any>();
  protected cacheTimeout = 5 * 60 * 1000; // 5分钟缓存

  /**
   * 构造函数
   * @param adapter 存储适配器
   */
  constructor(adapter: StorageAdapter) {
    this.adapter = adapter;
  }

  /**
   * 生成缓存键
   * @param type 类型
   * @param id 可选ID
   * @returns 缓存键
   */
  protected getCacheKey(type: string, id?: string): string {
    return id ? `${type}_${id}` : type;
  }

  /**
   * 设置缓存
   * @param key 缓存键
   * @param data 缓存数据
   */
  protected setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * 获取缓存
   * @param key 缓存键
   * @returns 缓存数据或null
   */
  protected getCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // 检查缓存是否过期
    if (Date.now() - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * 清除缓存
   * @param pattern 可选的匹配模式
   */
  protected clearCache(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  /**
   * 读取JSON文件
   * @param filename 文件名
   * @param defaultValue 默认值
   * @returns 解析后的JSON对象
   */
  protected async readJsonFile<T>(filename: string, defaultValue: T): Promise<T> {
    try {
      const raw = (this.adapter.read
        ? await this.adapter.read(filename)
        : (this.adapter.readFile ? await this.adapter.readFile(filename) : null));
      if (raw === null || raw === undefined) {
        return defaultValue;
      }
      return JSON.parse(raw);
    } catch (error) {
      console.error(`Failed to read ${filename}:`, error);
      return defaultValue;
    }
  }

  /**
   * 写入JSON文件
   * @param filename 文件名
   * @param data 数据对象
   */
  protected async writeJsonFile(filename: string, data: any): Promise<void> {
    try {
      const payload = JSON.stringify(data, null, 2);
      if (this.adapter.write) {
        await this.adapter.write(filename, payload);
      } else if (this.adapter.writeFile) {
        await this.adapter.writeFile(filename, payload);
      } else {
        throw new Error('No write method on storage adapter');
      }
    } catch (error) {
      console.error(`Failed to write ${filename}:`, error);
      throw new AppError(`保存文件失败: ${filename}`, error as any);
    }
  }
}