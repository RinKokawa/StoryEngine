import { NovelService } from '../domain/services/NovelService'
import { ChapterService } from '../domain/services/ChapterService'
import { CharacterService } from '../domain/services/CharacterService'
import { StatsService } from '../domain/services/StatsService'

import { LocalStorageNovelRepository } from '../infrastructure/repositories/LocalStorageNovelRepository'
import { LocalStorageCharacterRepository } from '../infrastructure/repositories/LocalStorageCharacterRepository'
import { LocalStorageStatsRepository } from '../infrastructure/repositories/LocalStorageStatsRepository'

// 创建仓储实例
const novelRepository = new LocalStorageNovelRepository()
const characterRepository = new LocalStorageCharacterRepository()
const statsRepository = new LocalStorageStatsRepository()

// 创建服务实例
export const serviceContainer = {
  novelService: new NovelService(novelRepository, statsRepository),
  chapterService: new ChapterService(novelRepository),
  characterService: new CharacterService(characterRepository),
  statsService: new StatsService(statsRepository)
}

// 类型定义，便于在组件中使用
export type ServiceContainer = typeof serviceContainer