import { createPinia } from 'pinia'

export default createPinia()

// 导出所有 stores
export { useNovelStore } from './novelStore'
export { useChapterStore } from './chapterStore'
export { useCharacterStore } from './characterStore'
export { useStatsStore } from './statsStore'