// 项目相关类型定义

export type ProjectType = 'novel' | 'script' | 'essay' | 'other'
export type ProjectStatus = 'draft' | 'writing' | 'completed' | 'archived'
export type ChapterStatus = 'draft' | 'writing' | 'completed'

export interface Project {
  id: string
  name: string
  type: ProjectType
  description?: string
  targetWords: number
  wordCount: number
  status: ProjectStatus
  createdAt: string
  lastModified: string
  settings: ProjectSettings
  chapters?: number // 章节数量
}

export interface ProjectSettings {
  autoSave: boolean
  autoSaveInterval: number
  fontSize: number
  lineHeight: number
  autoIndent: boolean
}

export interface CreateProjectData {
  name: string
  type: ProjectType
  description?: string
  targetWords: number
}

export interface UpdateProjectData extends Partial<Project> {
  id: string
}

export interface Volume {
  id: string
  projectId: string
  title: string
  order: number
  description?: string
  status: ProjectStatus
  createdAt: string
  lastModified: string
}

export interface Chapter {
  id: string
  projectId: string
  volumeId?: string
  title: string
  order: number
  content?: string
  wordCount: number
  status: ChapterStatus
  createdAt: string
  lastModified: string
}

export interface CreateChapterData {
  title: string
  volumeId?: string
  content?: string
}

export interface UpdateChapterData extends Partial<Chapter> {
  id: string
}

export interface Character {
  id: string
  projectId: string
  name: string
  description: string
  appearance?: string
  personality?: string
  background?: string
  relationships?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface WorldItem {
  id: string
  projectId: string
  title: string
  category: string
  description: string
  details?: string
  tags?: string[]
  createdAt: string
  lastModified: string
}

export interface WritingStats {
  projectId: string
  dailyWords: Record<string, number>
  totalWords: number
  todayWords: number
  weekWords: number
  lastWriteDate: string | null
}

// 大纲相关类型定义
export type OutlineType = 'main' | 'detailed'
export type OutlineStatus = 'draft' | 'completed' | 'reviewing'

export interface Outline {
  id: string
  projectId: string
  type: OutlineType
  title: string
  content: string
  order: number
  parentId?: string // 用于层级结构
  status: OutlineStatus
  notes?: string
  createdAt: string
  lastModified: string
}

export interface CreateOutlineData {
  type: OutlineType
  title: string
  content?: string
  parentId?: string
  notes?: string
}

export interface UpdateOutlineData extends Partial<Outline> {
  id: string
}

// 大纲节点，用于树形结构显示
export interface OutlineNode extends Outline {
  children?: OutlineNode[]
  level: number
}