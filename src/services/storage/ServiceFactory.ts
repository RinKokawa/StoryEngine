/**
 * 服务工厂（单例）
 * 统一创建并缓存各领域服务实例，便于逐步替换旧的 UnifiedStorageService 使用点
 */
import { createStorageAdapter } from './adapters'
import type { StorageAdapter as IStorageAdapter } from './adapters/StorageInterfaces'
import { ProjectService } from './services/ProjectService'
import { ChapterService } from './services/ChapterService'
import { VolumeService } from './services/VolumeService'
import { SettingsService } from './services/SettingsService'
import { CharacterService } from './services/CharacterService'
import { OutlineService } from './services/OutlineService'
import { WorldService } from './services/WorldService'
import { StatsService } from './services/StatsService'
import { DataService } from './services/DataService'

export class ServiceFactory {
  private static _adapter: IStorageAdapter | null = null

  private static _projectService: ProjectService | null = null
  private static _chapterService: ChapterService | null = null
  private static _volumeService: VolumeService | null = null
  private static _settingsService: SettingsService | null = null
  private static _characterService: CharacterService | null = null
  private static _outlineService: OutlineService | null = null
  private static _worldService: WorldService | null = null
  private static _statsService: StatsService | null = null
  private static _dataService: DataService | null = null

  private static get adapter(): IStorageAdapter {
    if (!this._adapter) {
      // 现有的 createStorageAdapter 返回的实例方法签名与新接口一致，这里做一次类型断言
      this._adapter = createStorageAdapter() as unknown as IStorageAdapter
    }
    return this._adapter
  }

  static getProjectService(): ProjectService {
    if (!this._projectService) {
      this._projectService = new ProjectService(this.adapter)
    }
    return this._projectService
  }

  static getChapterService(): ChapterService {
    if (!this._chapterService) {
      this._chapterService = new ChapterService(this.adapter)
    }
    return this._chapterService
  }

  static getVolumeService(): VolumeService {
    if (!this._volumeService) {
      this._volumeService = new VolumeService(this.adapter)
    }
    return this._volumeService
  }

  static getSettingsService(): SettingsService {
    if (!this._settingsService) {
      this._settingsService = new SettingsService(this.adapter)
    }
    return this._settingsService
  }

  static getCharacterService(): CharacterService {
    if (!this._characterService) {
      this._characterService = new CharacterService(this.adapter)
    }
    return this._characterService
  }

  static getOutlineService(): OutlineService {
    if (!this._outlineService) {
      this._outlineService = new OutlineService(this.adapter)
    }
    return this._outlineService
  }

  static getWorldService(): WorldService {
    if (!this._worldService) {
      this._worldService = new WorldService(this.adapter)
    }
    return this._worldService
  }

  static getStatsService(): StatsService {
    if (!this._statsService) {
      this._statsService = new StatsService(this.adapter)
    }
    return this._statsService
  }

  static getDataService(): DataService {
    if (!this._dataService) {
      this._dataService = new DataService(this.adapter)
    }
    return this._dataService
  }
}

// 便捷导出
export const projectService = () => ServiceFactory.getProjectService()
export const chapterService = () => ServiceFactory.getChapterService()
export const volumeService = () => ServiceFactory.getVolumeService()
export const settingsService = () => ServiceFactory.getSettingsService()
export const characterService = () => ServiceFactory.getCharacterService()
export const outlineService = () => ServiceFactory.getOutlineService()
export const worldService = () => ServiceFactory.getWorldService()
export const statsService = () => ServiceFactory.getStatsService()
export const dataService = () => ServiceFactory.getDataService()