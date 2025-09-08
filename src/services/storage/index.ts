/**
 * 存储服务统一导出
 * 兼容旧导出，同时暴露新的分领域服务工厂，便于逐步迁移
 */
export { UnifiedStorageService, storageService } from './storage'
export { FileStorageAdapter, LocalStorageAdapter, createStorageAdapter } from './adapters'

// 新的服务工厂与分领域服务
export { ServiceFactory, projectService, chapterService, volumeService, settingsService, characterService, outlineService, worldService } from './ServiceFactory'

// 类型导出：逐步过渡到新的 StorageInterfaces
export type { StorageAdapter as NewStorageAdapter } from './adapters/StorageInterfaces'