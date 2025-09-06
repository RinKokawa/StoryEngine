// 组件 Props 和 Emits 类型定义

import type { 
  Project, 
  Chapter, 
  Volume, 
  Character, 
  WorldItem
} from './project'
import type { 
  AppSettings, 
  Notification, 
  PageName 
} from './app'
import type { AIMessage } from './services'

// 通用组件 Props
export interface BaseComponentProps {
  loading?: boolean
  disabled?: boolean
  size?: 'small' | 'medium' | 'large'
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
}

// 项目相关组件 Props
export interface ProjectCardProps extends BaseComponentProps {
  project: Project
  showActions?: boolean
  compact?: boolean
}

export interface ProjectSelectorProps extends BaseComponentProps {
  projects: Project[]
  currentProject?: Project | null
  placeholder?: string
}

export interface ProjectFormProps extends BaseComponentProps {
  project?: Project | null
  mode: 'create' | 'edit'
}

// 章节相关组件 Props
export interface ChapterListProps extends BaseComponentProps {
  chapters: Chapter[]
  currentChapter?: Chapter | null
  showVolumes?: boolean
  allowReorder?: boolean
}

export interface ChapterCardProps extends BaseComponentProps {
  chapter: Chapter
  showActions?: boolean
  showStatus?: boolean
}

export interface ChapterSelectorProps extends BaseComponentProps {
  chapters: Chapter[]
  currentChapter?: Chapter | null
  groupByVolume?: boolean
}

export interface VolumeChapterSelectorProps extends BaseComponentProps {
  volumes: Volume[]
  chapters: Chapter[]
  currentChapter?: Chapter | null
}

// 编辑器相关组件 Props
export interface EditorProps extends BaseComponentProps {
  content: string
  readonly?: boolean
  autoSave?: boolean
  showLineNumbers?: boolean
  fontSize?: number
  lineHeight?: number
}

export interface EditorHeaderProps extends BaseComponentProps {
  currentProject?: Project | null
  currentChapter?: Chapter | null
  isDirty?: boolean
  lastSaved?: Date | null
}

export interface EditorStatusBarProps extends BaseComponentProps {
  wordCount: number
  characterCount: number
  cursorPosition: { line: number; column: number }
  lastSaved?: Date | null
}

// AI 相关组件 Props
export interface AIChatPanelProps extends BaseComponentProps {
  currentProject?: Project | null
  currentChapter?: Chapter | null
  visible?: boolean
}

export interface AIMessageProps extends BaseComponentProps {
  message: AIMessage
  showTime?: boolean
}

export interface ApiKeyDialogProps extends BaseComponentProps {
  visible: boolean
  currentApiKey?: string
}

// 角色管理组件 Props
export interface CharacterCardProps extends BaseComponentProps {
  character: Character
  showActions?: boolean
}

export interface CharacterFormProps extends BaseComponentProps {
  character?: Character | null
  mode: 'create' | 'edit'
}

export interface CharacterSelectorProps extends BaseComponentProps {
  characters: Character[]
  selectedCharacter?: Character | null
  multiple?: boolean
}

// 世界设定组件 Props
export interface WorldItemCardProps extends BaseComponentProps {
  worldItem: WorldItem
  showActions?: boolean
}

export interface WorldItemFormProps extends BaseComponentProps {
  worldItem?: WorldItem | null
  mode: 'create' | 'edit'
  categories: string[]
}

// 设置相关组件 Props
export interface SettingsFormProps extends BaseComponentProps {
  settings: AppSettings
}

export interface SettingItemProps extends BaseComponentProps {
  label: string
  description?: string
  type: 'text' | 'number' | 'boolean' | 'select' | 'range'
  value: any
  options?: Array<{ label: string; value: any }>
  min?: number
  max?: number
  step?: number
}

// 通知组件 Props
export interface NotificationProps extends BaseComponentProps {
  notification: Notification
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

export interface NotificationContainerProps extends BaseComponentProps {
  notifications: Notification[]
  maxVisible?: number
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

// 侧边栏组件 Props
export interface SidebarProps extends BaseComponentProps {
  collapsed: boolean
  currentPage: PageName
}

export interface SidebarItemProps extends BaseComponentProps {
  icon: string
  label: string
  active?: boolean
  badge?: string | number
}

// 虚拟列表组件 Props
export interface VirtualListProps extends BaseComponentProps {
  items: any[]
  itemHeight: number
  containerHeight: number
  overscan?: number
}

// 搜索组件 Props
export interface SearchBoxProps extends BaseComponentProps {
  placeholder?: string
  value?: string
  showFilters?: boolean
}

export interface FilterPanelProps extends BaseComponentProps {
  filters: Record<string, any>
  schema: FilterSchema[]
}

export interface FilterSchema {
  key: string
  label: string
  type: 'text' | 'select' | 'date' | 'range'
  options?: Array<{ label: string; value: any }>
}

// 组件 Emits 类型定义
export interface ProjectCardEmits {
  select: [project: Project]
  edit: [project: Project]
  delete: [project: Project]
  duplicate: [project: Project]
}

export interface ChapterListEmits {
  select: [chapter: Chapter]
  create: [volumeId?: string]
  edit: [chapter: Chapter]
  delete: [chapter: Chapter]
  reorder: [chapterIds: string[]]
}

export interface EditorEmits {
  'update:content': [content: string]
  save: [content: string]
  'cursor-change': [position: { line: number; column: number }]
  'selection-change': [selection: { start: number; end: number }]
}

export interface AIChatPanelEmits {
  close: []
  'api-key-updated': [apiKey: string]
}

export interface ApiKeyDialogEmits {
  close: []
  save: [apiKey: string]
}

export interface SettingsFormEmits {
  'update:settings': [settings: AppSettings]
  save: [settings: AppSettings]
  reset: []
}

export interface SidebarEmits {
  navigate: [page: PageName]
  'toggle-collapse': [collapsed: boolean]
}

export interface SearchBoxEmits {
  search: [query: string]
  'update:value': [value: string]
  'filter-change': [filters: Record<string, any>]
}