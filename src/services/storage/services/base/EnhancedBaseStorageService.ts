/**
 * 增强的基础存储服务
 * 集成缓存策略和更好的类型支持
 */

import { StorageAdapter } from '../../adapters/StorageInterfaces';
import { AppError } from '@/types';
import { CacheStrategy, CacheStrategyFactory } from './CacheStrategy';

export class EnhancedBaseStorageService {
  protected adapter: StorageAdapter;
  protected cache = new Map<string, CacheEntry>();
  protected cacheStrategy: CacheStrategy;

  constructor(adapter: StorageAdapter, cacheStrategy?: CacheStrategy) {
    this.adapter = adapter;
    this.cacheStrategy = cacheStrategy || CacheStrategyFactory.createStrategy('business');
  }

  /**
   * 生成缓存键
   */
  protected getCacheKey(type: string, id?: string): string {
    return id ? `${type}_${id}` : type;
  }

  /**
   * 设置缓存
   */
  protected setCache<T>(key: string, data: T): void {
    if (!this.cacheStrategy.shouldCache(key, data)) {
      return;
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * 获取缓存
   */
  protected getCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // 检查缓存是否过期
    if (this.cacheStrategy.shouldInvalidate(key, cached.timestamp)) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  /**
   * 清除缓存
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
   * 读取JSON文件（带类型支持）
   */
  protected async readJsonFile<T>(filename: string, defaultValue: T): Promise<T> {
    try {
      const raw = await this.readRawFile(filename);
      if (raw === null || raw === undefined) {
        return defaultValue;
      }
      return JSON.parse(raw) as T;
    } catch (error) {
      console.error(`Failed to read ${filename}:`, error);
      return defaultValue;
    }
  }

  /**
   * 写入JSON文件
   */
  protected async writeJsonFile<T>(filename: string, data: T): Promise<void> {
    try {
      const payload = JSON.stringify(data, null, 2);
      await this.writeRawFile(filename, payload);
    } catch (error) {
      console.error(`Failed to write ${filename}:`, error);
      throw new AppError(`保存文件失败: ${filename}`, error as any);
    }
  }

  /**
   * 读取原始文件内容
   */
  private async readRawFile(filename: string): Promise<string | null> {
    if (this.adapter.read) {
      return await this.adapter.read(filename);
    } else if (this.adapter.readFile) {
      return await this.adapter.readFile(filename);
    } else {
      throw new Error('No read method available on storage adapter');
    }
  }

  /**
   * 写入原始文件内容
   */
  private async writeRawFile(filename: string, content: string): Promise<void> {
    if (this.adapter.write) {
      await this.adapter.write(filename, content);
    } else if (this.adapter.writeFile) {
      await this.adapter.writeFile(filename, content);
    } else {
      throw new Error('No write method available on storage adapter');
    }
  }

  /**
   * 删除文件
   */
  protected async deleteFile(filename: string): Promise<void> {
    if (this.adapter.delete) {
      await this.adapter.delete(filename);
    } else if (this.adapter.deleteFile) {
      await this.adapter.deleteFile(filename);
    } else {
      throw new Error('No delete method available on storage adapter');
    }
  }

  /**
   * 检查文件是否存在
   */
  protected async fileExists(filename: string): Promise<boolean> {
    try {
      const content = await this.readRawFile(filename);
      return content !== null;
    } catch {
      return false;
    }
  }

  /**
   * 批量读取文件
   */
  protected async readMultipleFiles<T>(
    filenames: string[], 
    defaultValue: T
  ): Promise<Record<string, T>> {
    const results: Record<string, T> = {};
    
    await Promise.all(
      filenames.map(async (filename) => {
        try {
          results[filename] = await this.readJsonFile(filename, defaultValue);
        } catch (error) {
          console.error(`Failed to read ${filename}:`, error);
          results[filename] = defaultValue;
        }
      })
    );
    
    return results;
  }

  /**
   * 批量写入文件
   */
  protected async writeMultipleFiles<T>(
    files: Record<string, T>
  ): Promise<void> {
    await Promise.all(
      Object.entries(files).map(async ([filename, data]) => {
        try {
          await this.writeJsonFile(filename, data);
        } catch (error) {
          console.error(`Failed to write ${filename}:`, error);
          throw new AppError(`批量保存文件失败: ${filename}`, error as any);
        }
      })
    );
  }

  /**
   * 获取缓存统计信息
   */
  protected getCacheStats(): CacheStats {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      memoryUsage: this.estimateCacheMemoryUsage()
    };
  }

  /**
   * 估算缓存内存使用量
   */
  private estimateCacheMemoryUsage(): number {
    let totalSize = 0;
    for (const entry of this.cache.values()) {
      try {
        totalSize += JSON.stringify(entry.data).length * 2; // 粗略估算
      } catch {
        totalSize += 1024; // 默认1KB
      }
    }
    return totalSize;
  }

  /**
   * 清理过期缓存
   */
  protected cleanupExpiredCache(): number {
    let cleanedCount = 0;
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (this.cacheStrategy.shouldInvalidate(key, entry.timestamp)) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }
    
    return cleanedCount;
  }

  /**
   * 设置缓存策略
   */
  protected setCacheStrategy(strategy: CacheStrategy): void {
    this.cacheStrategy = strategy;
  }
}

interface CacheEntry {
  data: any;
  timestamp: number;
}

interface CacheStats {
  size: number;
  keys: string[];
  memoryUsage: number;
}