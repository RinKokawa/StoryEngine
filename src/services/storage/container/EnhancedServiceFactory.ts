/**
 * 增强版服务工厂
 * 集成依赖注入容器，提供更好的测试性和灵活性
 */

import { DIContainer } from './DIContainer';
import { createStorageAdapter } from '../adapters';
import type { StorageAdapter } from '../adapters/StorageInterfaces';

// 导入所有服务
import { ProjectService } from '../services/ProjectService';
import { VolumeService } from '../services/VolumeService';
import { StatsService } from '../services/StatsService';
import { ExportService } from '../services/ExportService';
import { ImportService } from '../services/ImportService';
import { CleanupService } from '../services/CleanupService';
// import { EnhancedBaseStorageService } from '../services/base/EnhancedBaseStorageService';
import { CacheStrategyFactory } from '../services/base/CacheStrategy';

// 导入其他可能存在的服务
import { ChapterService } from '../services/ChapterService';
import { SettingsService } from '../services/SettingsService';
import { CharacterService } from '../services/CharacterService';
import { OutlineService } from '../services/OutlineService';
import { WorldService } from '../services/WorldService';

export class EnhancedServiceFactory {
  private static container: DIContainer;
  private static initialized = false;

  /**
   * 初始化服务容器
   */
  static initialize(customContainer?: DIContainer): void {
    if (this.initialized && !customContainer) {
      return;
    }

    this.container = customContainer || new DIContainer();
    this.registerServices();
    this.initialized = true;
  }

  /**
   * 注册所有服务
   */
  private static registerServices(): void {
    // 注册存储适配器
    this.container.registerFactory('StorageAdapter', () => {
      return createStorageAdapter() as unknown as StorageAdapter;
    });

    // 注册缓存策略
    this.container.registerFactory('CacheStrategy', () => {
      return CacheStrategyFactory.createStrategy('business');
    });

    // 注册基础服务
    this.container.registerSingleton('ProjectService', ProjectService, ['StorageAdapter']);
    this.container.registerSingleton('VolumeService', VolumeService, ['StorageAdapter']);
    this.container.registerSingleton('StatsService', StatsService, ['StorageAdapter']);
    
    // 注册新的拆分服务
    this.container.registerSingleton('ExportService', ExportService, ['StorageAdapter']);
    this.container.registerSingleton('ImportService', ImportService, ['StorageAdapter']);
    this.container.registerSingleton('CleanupService', CleanupService, ['StorageAdapter']);

    // 注册其他服务（如果存在）
    try {
      this.container.registerSingleton('ChapterService', ChapterService, ['StorageAdapter']);
      this.container.registerSingleton('SettingsService', SettingsService, ['StorageAdapter']);
      this.container.registerSingleton('CharacterService', CharacterService, ['StorageAdapter']);
      this.container.registerSingleton('OutlineService', OutlineService, ['StorageAdapter']);
      this.container.registerSingleton('WorldService', WorldService, ['StorageAdapter']);
    } catch (error) {
      console.warn('Some services may not be available:', error);
    }
  }

  /**
   * 获取服务实例
   */
  static getService<T>(serviceName: string): T {
    if (!this.initialized) {
      this.initialize();
    }
    return this.container.resolve<T>(serviceName);
  }

  /**
   * 获取项目服务
   */
  static getProjectService(): ProjectService {
    return this.getService<ProjectService>('ProjectService');
  }

  /**
   * 获取卷服务
   */
  static getVolumeService(): VolumeService {
    return this.getService<VolumeService>('VolumeService');
  }

  /**
   * 获取统计服务
   */
  static getStatsService(): StatsService {
    return this.getService<StatsService>('StatsService');
  }

  /**
   * 获取导出服务
   */
  static getExportService(): ExportService {
    return this.getService<ExportService>('ExportService');
  }

  /**
   * 获取导入服务
   */
  static getImportService(): ImportService {
    return this.getService<ImportService>('ImportService');
  }

  /**
   * 获取清理服务
   */
  static getCleanupService(): CleanupService {
    return this.getService<CleanupService>('CleanupService');
  }

  /**
   * 获取章节服务
   */
  static getChapterService(): ChapterService {
    return this.getService<ChapterService>('ChapterService');
  }

  /**
   * 获取设置服务
   */
  static getSettingsService(): SettingsService {
    return this.getService<SettingsService>('SettingsService');
  }

  /**
   * 获取角色服务
   */
  static getCharacterService(): CharacterService {
    return this.getService<CharacterService>('CharacterService');
  }

  /**
   * 获取大纲服务
   */
  static getOutlineService(): OutlineService {
    return this.getService<OutlineService>('OutlineService');
  }

  /**
   * 获取世界设定服务
   */
  static getWorldService(): WorldService {
    return this.getService<WorldService>('WorldService');
  }

  /**
   * 替换服务实现（用于测试）
   */
  static replaceService<T>(serviceName: string, implementation: T): void {
    if (!this.initialized) {
      this.initialize();
    }
    this.container.registerInstance(serviceName, implementation);
  }

  /**
   * 创建测试容器
   */
  static createTestContainer(): DIContainer {
    const testContainer = new DIContainer();
    
    // 注册测试用的mock服务
    testContainer.registerFactory('StorageAdapter', () => {
      return createMockStorageAdapter();
    });

    return testContainer;
  }

  /**
   * 重置容器（用于测试）
   */
  static reset(): void {
    this.initialized = false;
    this.container = new DIContainer();
  }

  /**
   * 获取容器实例（用于高级用法）
   */
  static getContainer(): DIContainer {
    if (!this.initialized) {
      this.initialize();
    }
    return this.container;
  }
}

/**
 * 创建Mock存储适配器（用于测试）
 */
function createMockStorageAdapter(): StorageAdapter {
  const storage = new Map<string, string>();
  const directories = new Set<string>();

  return {
    read: async (filename: string) => {
      return storage.get(filename) || '';
    },
    write: async (filename: string, content: string) => {
      storage.set(filename, content);
    },
    delete: async (filename: string) => {
      storage.delete(filename);
    },
    exists: async (filename: string) => {
      return storage.has(filename);
    },
    list: async (path?: string) => {
      const prefix = path ? `${path}/` : '';
      return Array.from(storage.keys())
        .filter(key => key.startsWith(prefix))
        .map(key => key.substring(prefix.length));
    },
    mkdir: async (path: string) => {
      directories.add(path);
    },
    // 兼容旧接口
    readFile: async (filename: string) => {
      return storage.get(filename) || null;
    },
    writeFile: async (filename: string, data: string) => {
      storage.set(filename, data);
    },
    deleteFile: async (filename: string) => {
      storage.delete(filename);
    },
    listFiles: async () => {
      return Array.from(storage.keys());
    }
  };
}

// 便捷导出函数
export const projectService = () => EnhancedServiceFactory.getProjectService();
export const volumeService = () => EnhancedServiceFactory.getVolumeService();
export const statsService = () => EnhancedServiceFactory.getStatsService();
export const exportService = () => EnhancedServiceFactory.getExportService();
export const importService = () => EnhancedServiceFactory.getImportService();
export const cleanupService = () => EnhancedServiceFactory.getCleanupService();
export const chapterService = () => EnhancedServiceFactory.getChapterService();
export const settingsService = () => EnhancedServiceFactory.getSettingsService();
export const characterService = () => EnhancedServiceFactory.getCharacterService();
export const outlineService = () => EnhancedServiceFactory.getOutlineService();
export const worldService = () => EnhancedServiceFactory.getWorldService();