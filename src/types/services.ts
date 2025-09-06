// 服务层类型定义

import type { Project, Chapter, Volume, Character, WorldItem } from './project'

// 存储服务接口
export interface StorageService {
  // 项目操作
  getProjects(): Promise<Project[]>
  getProject(id: string): Promise<Project | null>
  saveProject(project: Project): Promise<void>
  deleteProject(id: string): Promise<void>
  
  // 章节操作
  getChapters(projectId: string): Promise<Chapter[]>
  getChapter(projectId: string, chapterId: string): Promise<Chapter | null>
  saveChapter(chapter: Chapter): Promise<void>
  deleteChapter(projectId: string, chapterId: string): Promise<void>
  
  // 卷操作
  getVolumes(projectId: string): Promise<Volume[]>
  getVolume(projectId: string, volumeId: string): Promise<Volume | null>
  saveVolume(volume: Volume): Promise<void>
  deleteVolume(projectId: string, volumeId: string): Promise<void>
  
  // 角色操作
  getCharacters(projectId: string): Promise<Character[]>
  getCharacter(projectId: string, characterId: string): Promise<Character | null>
  saveCharacter(character: Character): Promise<void>
  deleteCharacter(projectId: string, characterId: string): Promise<void>
  
  // 世界设定操作
  getWorldItems(projectId: string): Promise<WorldItem[]>
  getWorldItem(projectId: string, worldItemId: string): Promise<WorldItem | null>
  saveWorldItem(worldItem: WorldItem): Promise<void>
  deleteWorldItem(projectId: string, worldItemId: string): Promise<void>
  
  // 通用操作
  exists(path: string): Promise<boolean>
  backup(projectId: string): Promise<string>
  restore(backupPath: string): Promise<void>
}

// 存储适配器接口
export interface StorageAdapter {
  read(path: string): Promise<string>
  write(path: string, data: string): Promise<void>
  delete(path: string): Promise<void>
  exists(path: string): Promise<boolean>
  list(path: string): Promise<string[]>
  mkdir(path: string): Promise<void>
}

// AI 服务相关类型
export interface AIService {
  sendMessage(message: string, context?: AIContext): Promise<AIResponse>
  setApiKey(apiKey: string): void
  hasApiKey(): boolean
  clearHistory(): void
}

export interface AIContext {
  projectId?: string
  chapterId?: string
  characterIds?: string[]
  worldItemIds?: string[]
  previousMessages?: AIMessage[]
}

export interface AIMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  context?: AIContext
}

export interface AIResponse {
  message: AIMessage
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  error?: string
}

// 备份服务接口
export interface BackupService {
  createBackup(projectId: string): Promise<string>
  restoreBackup(backupPath: string): Promise<void>
  listBackups(projectId: string): Promise<BackupInfo[]>
  deleteBackup(backupPath: string): Promise<void>
  scheduleAutoBackup(projectId: string, intervalHours: number): void
  cancelAutoBackup(projectId: string): void
}

export interface BackupInfo {
  path: string
  projectId: string
  createdAt: Date
  size: number
  description?: string
}

// 重试机制配置
export interface RetryOptions {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffFactor: number
  retryCondition?: (error: unknown) => boolean
}

// 缓存服务接口
export interface CacheService {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttl?: number): Promise<void>
  delete(key: string): Promise<void>
  clear(): Promise<void>
  has(key: string): Promise<boolean>
}

// 文件监听服务
export interface FileWatchService {
  watch(path: string, callback: (event: FileChangeEvent) => void): void
  unwatch(path: string): void
  unwatchAll(): void
}

export interface FileChangeEvent {
  type: 'created' | 'modified' | 'deleted'
  path: string
  timestamp: Date
}

// 导入导出服务
export interface ImportExportService {
  exportProject(projectId: string, options: ExportOptions): Promise<string>
  importProject(filePath: string): Promise<ImportResult>
  exportChapter(chapterId: string, format: ExportFormat): Promise<string>
  importChapter(filePath: string, projectId: string): Promise<Chapter>
}

export type ExportFormat = 'json' | 'txt' | 'docx' | 'pdf' | 'epub'

export interface ExportOptions {
  format: ExportFormat
  includeMetadata: boolean
  includeCharacters: boolean
  includeWorldItems: boolean
  outputPath?: string
}

export interface ImportResult {
  success: boolean
  project?: Project
  chapters: Chapter[]
  characters: Character[]
  worldItems: WorldItem[]
  errors: string[]
}

// 搜索服务
export interface SearchService {
  searchProjects(query: string, options?: SearchOptions): Promise<SearchResult<Project>[]>
  searchChapters(query: string, projectId?: string, options?: SearchOptions): Promise<SearchResult<Chapter>[]>
  searchCharacters(query: string, projectId?: string, options?: SearchOptions): Promise<SearchResult<Character>[]>
  searchWorldItems(query: string, projectId?: string, options?: SearchOptions): Promise<SearchResult<WorldItem>[]>
  searchAll(query: string, projectId?: string, options?: SearchOptions): Promise<SearchResults>
}

export interface SearchOptions {
  caseSensitive?: boolean
  wholeWord?: boolean
  useRegex?: boolean
  maxResults?: number
}

export interface SearchResult<T> {
  item: T
  matches: SearchMatch[]
  score: number
}

export interface SearchMatch {
  field: string
  text: string
  start: number
  end: number
}

export interface SearchResults {
  projects: SearchResult<Project>[]
  chapters: SearchResult<Chapter>[]
  characters: SearchResult<Character>[]
  worldItems: SearchResult<WorldItem>[]
  totalResults: number
}