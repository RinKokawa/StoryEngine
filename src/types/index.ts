// 类型定义统一导出

// 项目相关类型
export type {
  Project,
  ProjectType,
  ProjectStatus,
  ProjectSettings,
  CreateProjectData,
  UpdateProjectData,
  Volume,
  Chapter,
  ChapterStatus,
  CreateChapterData,
  UpdateChapterData,
  Character,
  WorldItem,
  WritingStats,
  Outline,
  OutlineType,
  OutlineStatus,
  CreateOutlineData,
  UpdateOutlineData,
  OutlineNode
} from './project'

// 应用相关类型
export type {
  AppSettings,
  AppState,
  EditorState,
  ThemeMode,
  NotificationType,
  Notification,
  NotificationAction,
  PageName,
  NavigationItem,
  AppSearchOptions,
  FilterOptions,
  AppExportOptions,
  AppImportResult,
  PerformanceMetrics,
  KeyboardShortcut
} from './app'

// 服务相关类型
export type {
  StorageService,
  StorageAdapter,
  AIService,
  AIContext,
  AIMessage,
  AIResponse,
  BackupService,
  BackupInfo,
  RetryOptions,
  CacheService,
  FileWatchService,
  FileChangeEvent,
  ImportExportService,
  ExportFormat,
  ExportOptions,
  ImportResult,
  SearchService,
  SearchOptions,
  SearchResult,
  SearchMatch,
  SearchResults
} from './services'

// Store 相关类型
export type {
  ProjectStoreState,
  EditorStoreState,
  AppStoreState,
  CharacterStoreState,
  WorldStoreState,
  AIStoreState,
  NotificationStoreState,
  StatsStoreState
} from './stores'

// 组件相关类型
export type {
  BaseComponentProps,
  ProjectCardProps,
  ProjectSelectorProps,
  ProjectFormProps,
  ChapterListProps,
  ChapterCardProps,
  ChapterSelectorProps,
  VolumeChapterSelectorProps,
  EditorProps,
  EditorHeaderProps,
  EditorStatusBarProps,
  AIChatPanelProps,
  AIMessageProps,
  ApiKeyDialogProps,
  CharacterCardProps,
  CharacterFormProps,
  CharacterSelectorProps,
  WorldItemCardProps,
  WorldItemFormProps,
  SettingsFormProps,
  SettingItemProps,
  NotificationProps,
  NotificationContainerProps,
  SidebarProps,
  SidebarItemProps,
  VirtualListProps,
  SearchBoxProps,
  FilterPanelProps,
  FilterSchema,
  ProjectCardEmits,
  ChapterListEmits,
  EditorEmits,
  AIChatPanelEmits,
  ApiKeyDialogEmits,
  SettingsFormEmits,
  SidebarEmits,
  SearchBoxEmits
} from './components'

// 错误类型 - 直接定义而不是从 services 导出
export class AppError extends Error {
  constructor(
    public userMessage: string,
    public originalError?: unknown,
    public context?: string
  ) {
    super(userMessage)
    this.name = 'AppError'
  }
}