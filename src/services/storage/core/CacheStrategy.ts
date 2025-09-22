/**
 * 缓存策略接口和实现
 * 支持可配置的缓存时长和策略
 */

export interface CacheStrategy {
  /**
   * 获取缓存超时时间（毫秒）
   * @param key 缓存键
   * @returns 超时时间
   */
  getTimeout(key: string): number;
  
  /**
   * 是否应该缓存该键
   * @param key 缓存键
   * @returns 是否缓存
   */
  shouldCache(key: string): boolean;
}

/**
 * 默认缓存策略
 */
export class DefaultCacheStrategy implements CacheStrategy {
  private defaultTimeout: number;
  private keyTimeouts: Map<string, number>;

  constructor(defaultTimeout: number = 5 * 60 * 1000) {
    this.defaultTimeout = defaultTimeout;
    this.keyTimeouts = new Map();
  }

  getTimeout(key: string): number {
    return this.keyTimeouts.get(key) || this.defaultTimeout;
  }

  shouldCache(_key: string): boolean {
    return true;
  }

  /**
   * 设置特定键的缓存时间
   * @param key 缓存键
   * @param timeout 超时时间（毫秒）
   */
  setKeyTimeout(key: string, timeout: number): void {
    this.keyTimeouts.set(key, timeout);
  }
}

/**
 * 实时缓存策略 - 用于编辑场景
 */
export class RealtimeCacheStrategy implements CacheStrategy {
  private realtimeKeys: Set<string>;
  private defaultTimeout: number;

  constructor(realtimeKeys: string[] = [], defaultTimeout: number = 30 * 1000) {
    this.realtimeKeys = new Set(realtimeKeys);
    this.defaultTimeout = defaultTimeout;
  }

  getTimeout(key: string): number {
    // 实时键使用更短的缓存时间
    return this.realtimeKeys.has(key) ? 10 * 1000 : this.defaultTimeout;
  }

  shouldCache(_key: string): boolean {
    return true;
  }

  /**
   * 添加实时键
   * @param key 缓存键
   */
  addRealtimeKey(key: string): void {
    this.realtimeKeys.add(key);
  }

  /**
   * 移除实时键
   * @param key 缓存键
   */
  removeRealtimeKey(key: string): void {
    this.realtimeKeys.delete(key);
  }
}

/**
 * 无缓存策略 - 用于测试或特殊场景
 */
export class NoCacheStrategy implements CacheStrategy {
  getTimeout(_key: string): number {
    return 0;
  }

  shouldCache(_key: string): boolean {
    return false;
  }
}