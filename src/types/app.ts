// 应用全局类型定义

export type ThemeMode = 'light' | 'dark' | 'auto'
export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface AppSettings {
  // 编辑器设置
  autoSave: boolean
  autoSaveInterval: number
  fontSize: number
  lineHeight: number
  autoIndent: boolean
  
  // 界面设置
  theme: ThemeMode
  sidebarCollapsed: boolean
  windowSize: 'normal' | 'maximized' | 'fullscreen'
  
  // 应用行为
  openLastProject: boolean
  minimizeToTray: boolean
  checkUpdates: boolean
  
  // 备份设置
  autoBackup: boolean
  maxBackups: number
  backupInterval: number // 小时
}

export interface AppState {
  initialized: boolean
  loading: boolean
  error: string | null
  sidebarCollapsed: boolean
  currentPage: string
  notifications: Notification[]
}

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  duration?: number
  actions?: NotificationAction[]
  createdAt: Date
}

export interface NotificationAction {
  label: string
  action: () => void
  style?: 'primary' | 'secondary' | 'danger'
}

// 路由相关
export type PageName = 
  | 'dashboard' 
  | 'projects' 
  | 'editor' 
  | 'characters' 
  | 'worldview' 
  | 'settings'

export interface NavigationItem {
  name: PageName
  label: string
  icon: string
  path: string
  requiresProject?: boolean
}

// 编辑器相关
export interface EditorState {
  currentChapter: string | null
  content: string
  isDirty: boolean
  autoSaveEnabled: boolean
  lastSaved: Date | null
  cursorPosition: {
    line: number
    column: number
  }
  selection: {
    start: number
    end: number
  } | null
}

// 搜索和过滤
export interface AppSearchOptions {
  query: string
  caseSensitive: boolean
  wholeWord: boolean
  useRegex: boolean
}

export interface FilterOptions {
  status?: string[]
  type?: string[]
  dateRange?: {
    start: Date
    end: Date
  }
}

// 导入导出
export interface AppExportOptions {
  format: 'json' | 'txt' | 'docx' | 'pdf'
  includeMetadata: boolean
  includeCharacters: boolean
  includeWorldItems: boolean
}

export interface AppImportResult {
  success: boolean
  projectsImported: number
  chaptersImported: number
  charactersImported: number
  worldItemsImported: number
  errors: string[]
}

// 性能监控
export interface PerformanceMetrics {
  memoryUsage: number
  loadTime: number
  renderTime: number
  apiResponseTime: number
}

// 键盘快捷键
export interface KeyboardShortcut {
  key: string
  modifiers: string[]
  action: string
  description: string
}