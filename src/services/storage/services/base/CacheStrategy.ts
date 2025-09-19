/**
 * 缓存策略接口和实现
 * 提供灵活的缓存管理策略
 */

export interface CacheStrategy {
  /** 获取缓存超时时间 */
  getCacheTimeout(key: string): number;
  /** 是否应该缓存此数据 */
  shouldCache(key: string, data: any): boolean;
  /** 缓存失效策略 */
  shouldInvalidate(key: string, timestamp: number): boolean;
}

/**
 * 默认缓存策略
 */
export class DefaultCacheStrategy implements CacheStrategy {
  private defaultTimeout: number;

  constructor(defaultTimeout: number = 5 * 60 * 1000) {
    this.defaultTimeout = defaultTimeout;
  }

  getCacheTimeout(key: string): number {
    return this.defaultTimeout;
  }

  shouldCache(key: string, data: any): boolean {
    return data !== null && data !== undefined;
  }

  shouldInvalidate(key: string, timestamp: number): boolean {
    return Date.now() - timestamp > this.getCacheTimeout(key);
  }
}

/**
 * 业务场景缓存策略
 */
export class BusinessCacheStrategy implements CacheStrategy {
  private strategies: Map<string, CacheConfig>;
  private defaultTimeout: number;

  constructor(defaultTimeout: number = 5 * 60 * 1000) {
    this.defaultTimeout = defaultTimeout;
    this.strategies = new Map();
    this.initializeStrategies();
  }

  private initializeStrategies(): void {
    // 编辑页面需要实时更新，缓存时间较短
    this.strategies.set('current_', { timeout: 30 * 1000, priority: 'high' });
    this.strategies.set('chapter_content', { timeout: 60 * 1000, priority: 'high' });
    
    // 项目列表变化不频繁，可以缓存较长时间
    this.strategies.set('projects', { timeout: 10 * 60 * 1000, priority: 'medium' });
    this.strategies.set('volumes', { timeout: 10 * 60 * 1000, priority: 'medium' });
    
    // 统计数据可以缓存更长时间
    this.strategies.set('stats', { timeout: 15 * 60 * 1000, priority: 'low' });
    this.strategies.set('writing_stats', { timeout: 15 * 60 * 1000, priority: 'low' });
    
    // 设置数据很少变化
    this.strategies.set('settings', { timeout: 30 * 60 * 1000, priority: 'low' });
  }

  getCacheTimeout(key: string): number {
    for (const [pattern, config] of this.strategies.entries()) {
      if (key.includes(pattern)) {
        return config.timeout;
      }
    }
    return this.defaultTimeout;
  }

  shouldCache(key: string, data: any): boolean {
    if (data === null || data === undefined) {
      return false;
    }

    // 大数据量可能不适合缓存
    if (typeof data === 'object' && JSON.stringify(data).length > 1024 * 1024) {
      return false;
    }

    return true;
  }

  shouldInvalidate(key: string, timestamp: number): boolean {
    return Date.now() - timestamp > this.getCacheTimeout(key);
  }

  /**
   * 添加自定义缓存策略
   */
  addStrategy(pattern: string, config: CacheConfig): void {
    this.strategies.set(pattern, config);
  }

  /**
   * 获取缓存优先级
   */
  getCachePriority(key: string): CachePriority {
    for (const [pattern, config] of this.strategies.entries()) {
      if (key.includes(pattern)) {
        return config.priority;
      }
    }
    return 'medium';
  }
}

/**
 * 内存敏感缓存策略
 */
export class MemoryAwareCacheStrategy implements CacheStrategy {
  private maxCacheSize: number;
  private currentCacheSize: number = 0;
  private defaultTimeout: number;

  constructor(maxCacheSize: number = 50 * 1024 * 1024, defaultTimeout: number = 5 * 60 * 1000) {
    this.maxCacheSize = maxCacheSize;
    this.defaultTimeout = defaultTimeout;
  }

  getCacheTimeout(key: string): number {
    // 内存紧张时缩短缓存时间
    const memoryPressure = this.currentCacheSize / this.maxCacheSize;
    if (memoryPressure > 0.8) {
      return this.defaultTimeout * 0.5;
    } else if (memoryPressure > 0.6) {
      return this.defaultTimeout * 0.7;
    }
    return this.defaultTimeout;
  }

  shouldCache(key: string, data: any): boolean {
    if (data === null || data === undefined) {
      return false;
    }

    const dataSize = this.estimateDataSize(data);
    return this.currentCacheSize + dataSize <= this.maxCacheSize;
  }

  shouldInvalidate(key: string, timestamp: number): boolean {
    return Date.now() - timestamp > this.getCacheTimeout(key);
  }

  updateCacheSize(delta: number): void {
    this.currentCacheSize = Math.max(0, this.currentCacheSize + delta);
  }

  private estimateDataSize(data: any): number {
    try {
      return JSON.stringify(data).length * 2; // 粗略估算
    } catch {
      return 1024; // 默认1KB
    }
  }
}

export interface CacheConfig {
  timeout: number;
  priority: CachePriority;
}

export type CachePriority = 'high' | 'medium' | 'low';

/**
 * 缓存策略工厂
 */
export class CacheStrategyFactory {
  static createStrategy(type: 'default' | 'business' | 'memory-aware', options?: any): CacheStrategy {
    switch (type) {
      case 'business':
        return new BusinessCacheStrategy(options?.defaultTimeout);
      case 'memory-aware':
        return new MemoryAwareCacheStrategy(options?.maxCacheSize, options?.defaultTimeout);
      default:
        return new DefaultCacheStrategy(options?.defaultTimeout);
    }
  }
}