/**
 * 存储服务统一导出
 * 使用新的分领域服务架构
 */

// 存储适配器
export { FileStorageAdapter, LocalStorageAdapter, createStorageAdapter } from './adapters'

// 服务工厂与分领域服务
export { ServiceFactory, projectService, chapterService, volumeService, settingsService, characterService, outlineService, worldService, statsService, dataService } from './ServiceFactory'

// 类型导出
export type { StorageAdapter } from './adapters/StorageInterfaces'

// 基础服务类（供扩展使用）
export { BaseStorageService } from './services/BaseStorageService'