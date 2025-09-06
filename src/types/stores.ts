// Pinia Store 状态类型定义

import type { 
  Project, 
  Chapter, 
  Volume, 
  Character, 
  WorldItem, 
  WritingStats
} from './project'
import type { 
  AppSettings, 
  AppState, 
  EditorState, 
  Notification,
  PageName 
} from './app'
import type { AIMessage } from './services'

// 项目 Store 状态
export interface ProjectStoreState {
  projects: Project[]
  currentProject: Project | null
  loading: boolean
  error: string | null
  lastUpdated: Date | null
}

// 编辑器 Store 状态
export interface EditorStoreState extends EditorState {
  chapters: Chapter[]
  volumes: Volume[]
  currentVolume: Volume | null
  searchResults: Chapter[]
  isSearching: boolean
}

// 应用 Store 状态
export interface AppStoreState extends AppState {
  settings: AppSettings
  currentPage: PageName
  isElectron: boolean
  version: string
}

// 角色管理 Store 状态
export interface CharacterStoreState {
  characters: Record<string, Character[]> // projectId -> characters
  loading: boolean
  error: string | null
  selectedCharacter: Character | null
}

// 世界设定 Store 状态
export interface WorldStoreState {
  worldItems: Record<string, WorldItem[]> // projectId -> worldItems
  loading: boolean
  error: string | null
  selectedWorldItem: WorldItem | null
  categories: string[]
}

// AI 助手 Store 状态
export interface AIStoreState {
  messages: AIMessage[]
  isTyping: boolean
  hasApiKey: boolean
  error: string | null
  conversationId: string | null
  lastMessageId: string | null
}

// 通知 Store 状态
export interface NotificationStoreState {
  notifications: Notification[]
  maxNotifications: number
}

// 统计 Store 状态
export interface StatsStoreState {
  writingStats: Record<string, WritingStats> // projectId -> stats
  loading: boolean
  error: string | null
  lastUpdated: Date | null
}

// 这些接口现在主要用于文档目的，实际的 store 会由 Pinia 自动推断类型