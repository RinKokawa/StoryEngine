// 统一存储服务实现

import type {
  StorageService,
  StorageAdapter,
  Project,
  Chapter,
  Volume,
  Character,
  WorldItem,
  WritingStats,
  AppSettings,
  CreateProjectData,
  UpdateProjectData,
  CreateChapterData,
  UpdateChapterData
} from '@/types'
import { AppError } from '@/types'
import { createStorageAdapter } from './adapters'

export class UnifiedStorageService implements StorageService {
  private adapter: StorageAdapter
  private cache = new Map<string, any>()
  private cacheTimeout = 5 * 60 * 1000 // 5分钟缓存

  constructor(adapter?: StorageAdapter) {
    this.adapter = adapter || createStorageAdapter()
  }

  // 缓存管理
  private getCacheKey(type: string, id?: string): string {
    return id ? `${type}_${id}` : type
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  private getCache<T>(key: string): T | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    // 检查缓存是否过期
    if (Date.now() - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  private clearCache(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key)
        }
      }
    } else {
      this.cache.clear()
    }
  }

  // 通用文件操作
  private async readJsonFile<T>(filename: string, defaultValue: T): Promise<T> {
    try {
      const data = await this.adapter.readFile(filename)
      if (data === null) {
        return defaultValue
      }
      return JSON.parse(data)
    } catch (error) {
      console.error(`Failed to read ${filename}:`, error)
      return defaultValue
    }
  }

  private async writeJsonFile(filename: string, data: any): Promise<void> {
    try {
      await this.adapter.writeFile(filename, JSON.stringify(data, null, 2))
    } catch (error) {
      console.error(`Failed to write ${filename}:`, error)
      throw new AppError(`保存文件失败: ${filename}`, error)
    }
  }

  // 项目管理
  async getProjects(): Promise<Project[]> {
    const cacheKey = this.getCacheKey('projects')
    let projects = this.getCache<Project[]>(cacheKey)
    
    if (!projects) {
      projects = await this.readJsonFile('projects.json', [])
      this.setCache(cacheKey, projects)
    }
    
    return projects
  }

  async getProject(id: string): Promise<Project | null> {
    const projects = await this.getProjects()
    return projects.find(p => p.id === id) || null
  }

  async saveProject(project: Project): Promise<void> {
    const projects = await this.getProjects()
    const index = projects.findIndex(p => p.id === project.id)
    
    if (index >= 0) {
      projects[index] = { ...project, lastModified: new Date().toISOString() }
    } else {
      projects.push({ ...project, lastModified: new Date().toISOString() })
    }
    
    await this.writeJsonFile('projects.json', projects)
    this.clearCache('projects')
  }

  async createProject(data: CreateProjectData): Promise<Project> {
    const project: Project = {
      id: `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: data.name,
      type: data.type,
      description: data.description || '',
      targetWords: data.targetWords,
      wordCount: 0,
      status: 'draft',
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      settings: {
        autoSave: true,
        autoSaveInterval: 30000,
        fontSize: 16,
        lineHeight: 1.5,
        autoIndent: true
      }
    }
    
    await this.saveProject(project)
    return project
  }

  async updateProject(data: UpdateProjectData): Promise<Project> {
    const project = await this.getProject(data.id)
    if (!project) {
      throw new AppError('项目不存在')
    }
    
    const updatedProject = { ...project, ...data, lastModified: new Date().toISOString() }
    await this.saveProject(updatedProject)
    return updatedProject
  }

  async deleteProject(id: string): Promise<void> {
    const projects = await this.getProjects()
    const filteredProjects = projects.filter(p => p.id !== id)
    
    await this.writeJsonFile('projects.json', filteredProjects)
    
    // 删除相关文件
    try {
      await this.adapter.deleteFile(`project_${id}_chapters.json`)
      await this.adapter.deleteFile(`project_${id}_volumes.json`)
      await this.adapter.deleteFile(`project_${id}_characters.json`)
      await this.adapter.deleteFile(`project_${id}_world.json`)
      await this.adapter.deleteFile(`project_${id}_stats.json`)
      await this.adapter.deleteFile(`project_${id}_current.json`)
    } catch (error) {
      console.warn('Failed to delete some project files:', error)
    }
    
    this.clearCache()
  }

  // 当前项目
  async getCurrentProject(): Promise<Project | null> {
    const data = await this.readJsonFile('current_project.json', null)
    return data
  }

  async setCurrentProject(project: Project | null): Promise<void> {
    await this.writeJsonFile('current_project.json', project)
    this.clearCache('current_project')
  }

  // 卷管理
  async getProjectVolumes(projectId: string): Promise<Volume[]> {
    const cacheKey = this.getCacheKey('volumes', projectId)
    let volumes = this.getCache<Volume[]>(cacheKey)
    
    if (!volumes) {
      volumes = await this.readJsonFile(`project_${projectId}_volumes.json`, [])
      this.setCache(cacheKey, volumes)
    }
    
    return volumes.sort((a, b) => a.order - b.order)
  }

  async getVolume(projectId: string, volumeId: string): Promise<Volume | null> {
    const volumes = await this.getProjectVolumes(projectId)
    return volumes.find(v => v.id === volumeId) || null
  }

  async createVolume(projectId: string, volumeData: Partial<Volume>): Promise<Volume> {
    const volumes = await this.getProjectVolumes(projectId)
    
    const volume: Volume = {
      id: `volume_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      projectId,
      title: volumeData.title || '新卷',
      order: volumeData.order || volumes.length + 1,
      description: volumeData.description || '',
      status: volumeData.status || 'draft',
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      ...volumeData
    }
    
    volumes.push(volume)
    await this.writeJsonFile(`project_${projectId}_volumes.json`, volumes)
    this.clearCache(`volumes_${projectId}`)
    
    return volume
  }

  async updateVolume(projectId: string, volumeData: Partial<Volume>): Promise<Volume> {
    const volumes = await this.getProjectVolumes(projectId)
    const index = volumes.findIndex(v => v.id === volumeData.id)
    
    if (index === -1) {
      throw new AppError('卷不存在')
    }
    
    volumes[index] = { ...volumes[index], ...volumeData, lastModified: new Date().toISOString() }
    await this.writeJsonFile(`project_${projectId}_volumes.json`, volumes)
    this.clearCache(`volumes_${projectId}`)
    
    return volumes[index]
  }

  async deleteVolume(projectId: string, volumeId: string): Promise<void> {
    const volumes = await this.getProjectVolumes(projectId)
    const filteredVolumes = volumes.filter(v => v.id !== volumeId)
    
    await this.writeJsonFile(`project_${projectId}_volumes.json`, filteredVolumes)
    this.clearCache(`volumes_${projectId}`)
    
    // 删除该卷下的所有章节
    const chapters = await this.getProjectChapters(projectId)
    const filteredChapters = chapters.filter(c => c.volumeId !== volumeId)
    await this.writeJsonFile(`project_${projectId}_chapters.json`, filteredChapters)
    this.clearCache(`chapters_${projectId}`)
  }

  async reorderVolumes(projectId: string, volumeIds: string[]): Promise<void> {
    const volumes = await this.getProjectVolumes(projectId)
    
    volumeIds.forEach((id, index) => {
      const volume = volumes.find(v => v.id === id)
      if (volume) {
        volume.order = index + 1
        volume.lastModified = new Date().toISOString()
      }
    })
    
    await this.writeJsonFile(`project_${projectId}_volumes.json`, volumes)
    this.clearCache(`volumes_${projectId}`)
  }

  // 章节管理
  async getProjectChapters(projectId: string): Promise<Chapter[]> {
    const cacheKey = this.getCacheKey('chapters', projectId)
    let chapters = this.getCache<Chapter[]>(cacheKey)
    
    if (!chapters) {
      chapters = await this.readJsonFile(`project_${projectId}_chapters.json`, [])
      this.setCache(cacheKey, chapters)
    }
    
    return chapters.sort((a, b) => a.order - b.order)
  }

  async getVolumeChapters(projectId: string, volumeId: string): Promise<Chapter[]> {
    const chapters = await this.getProjectChapters(projectId)
    return chapters.filter(c => c.volumeId === volumeId).sort((a, b) => a.order - b.order)
  }

  async getChapter(projectId: string, chapterId: string): Promise<Chapter | null> {
    const chapters = await this.getProjectChapters(projectId)
    return chapters.find(c => c.id === chapterId) || null
  }

  async createChapter(projectId: string, volumeId: string | undefined, data: CreateChapterData): Promise<Chapter> {
    const chapters = await this.getProjectChapters(projectId)
    const volumeChapters = volumeId ? chapters.filter(c => c.volumeId === volumeId) : chapters.filter(c => !c.volumeId)
    
    const chapter: Chapter = {
      id: `chapter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      projectId,
      volumeId,
      title: data.title,
      order: volumeChapters.length + 1,
      content: data.content || '　　',
      wordCount: (data.content || '　　').replace(/\s/g, '').length,
      status: 'draft',
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    }
    
    chapters.push(chapter)
    await this.writeJsonFile(`project_${projectId}_chapters.json`, chapters)
    this.clearCache(`chapters_${projectId}`)
    
    // 更新项目字数统计
    await this.updateProjectWordCount(projectId)
    
    return chapter
  }

  async updateChapter(projectId: string, data: UpdateChapterData): Promise<Chapter> {
    const chapters = await this.getProjectChapters(projectId)
    const index = chapters.findIndex(c => c.id === data.id)
    
    if (index === -1) {
      throw new AppError('章节不存在')
    }
    
    const updatedChapter = { 
      ...chapters[index], 
      ...data, 
      lastModified: new Date().toISOString() 
    }
    
    // 重新计算字数
    if (data.content !== undefined) {
      updatedChapter.wordCount = data.content.replace(/\s/g, '').length
    }
    
    chapters[index] = updatedChapter
    await this.writeJsonFile(`project_${projectId}_chapters.json`, chapters)
    this.clearCache(`chapters_${projectId}`)
    
    // 更新项目字数统计
    await this.updateProjectWordCount(projectId)
    
    return updatedChapter
  }

  async deleteChapter(projectId: string, chapterId: string): Promise<void> {
    const chapters = await this.getProjectChapters(projectId)
    const filteredChapters = chapters.filter(c => c.id !== chapterId)
    
    await this.writeJsonFile(`project_${projectId}_chapters.json`, filteredChapters)
    this.clearCache(`chapters_${projectId}`)
    
    // 更新项目字数统计
    await this.updateProjectWordCount(projectId)
  }

  async reorderChapters(projectId: string, chapterIds: string[]): Promise<void> {
    const chapters = await this.getProjectChapters(projectId)
    
    chapterIds.forEach((id, index) => {
      const chapter = chapters.find(c => c.id === id)
      if (chapter) {
        chapter.order = index + 1
        chapter.lastModified = new Date().toISOString()
      }
    })
    
    await this.writeJsonFile(`project_${projectId}_chapters.json`, chapters)
    this.clearCache(`chapters_${projectId}`)
  }

  // 章节内容
  async getChapterContent(projectId: string, chapterId: string): Promise<string> {
    const chapter = await this.getChapter(projectId, chapterId)
    return chapter?.content || '　　'
  }

  async saveChapterContent(projectId: string, chapterId: string, content: string): Promise<void> {
    await this.updateChapter(projectId, { id: chapterId, content })
  }

  // 当前章节
  async getCurrentChapter(projectId: string): Promise<string | null> {
    const data = await this.readJsonFile(`project_${projectId}_current.json`, { chapterId: null })
    return data.chapterId
  }

  async setCurrentChapter(projectId: string, chapterId: string | null): Promise<void> {
    await this.writeJsonFile(`project_${projectId}_current.json`, { chapterId })
  }

  // 角色管理
  async getProjectCharacters(projectId: string): Promise<Character[]> {
    const cacheKey = this.getCacheKey('characters', projectId)
    let characters = this.getCache<Character[]>(cacheKey)
    
    if (!characters) {
      characters = await this.readJsonFile(`project_${projectId}_characters.json`, [])
      this.setCache(cacheKey, characters)
    }
    
    return characters
  }

  async createCharacter(projectId: string, data: Partial<Character>): Promise<Character> {
    const characters = await this.getProjectCharacters(projectId)
    
    const character: Character = {
      id: `character_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      projectId,
      name: data.name || '新角色',
      description: data.description || '',
      appearance: data.appearance || '',
      personality: data.personality || '',
      background: data.background || '',
      relationships: data.relationships || '',
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data
    }
    
    characters.push(character)
    await this.writeJsonFile(`project_${projectId}_characters.json`, characters)
    this.clearCache(`characters_${projectId}`)
    
    return character
  }

  async updateCharacter(projectId: string, data: Partial<Character>): Promise<Character> {
    const characters = await this.getProjectCharacters(projectId)
    const index = characters.findIndex(c => c.id === data.id)
    
    if (index === -1) {
      throw new AppError('角色不存在')
    }
    
    characters[index] = { ...characters[index], ...data, updatedAt: new Date().toISOString() }
    await this.writeJsonFile(`project_${projectId}_characters.json`, characters)
    this.clearCache(`characters_${projectId}`)
    
    return characters[index]
  }

  async deleteCharacter(projectId: string, characterId: string): Promise<void> {
    const characters = await this.getProjectCharacters(projectId)
    const filteredCharacters = characters.filter(c => c.id !== characterId)
    
    await this.writeJsonFile(`project_${projectId}_characters.json`, filteredCharacters)
    this.clearCache(`characters_${projectId}`)
  }

  // 世界设定管理
  async getProjectWorldItems(projectId: string): Promise<WorldItem[]> {
    const cacheKey = this.getCacheKey('world', projectId)
    let worldItems = this.getCache<WorldItem[]>(cacheKey)
    
    if (!worldItems) {
      worldItems = await this.readJsonFile(`project_${projectId}_world.json`, [])
      this.setCache(cacheKey, worldItems)
    }
    
    return worldItems
  }

  async createWorldItem(projectId: string, data: Partial<WorldItem>): Promise<WorldItem> {
    const worldItems = await this.getProjectWorldItems(projectId)
    
    const worldItem: WorldItem = {
      id: `world_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      projectId,
      title: data.title || '新设定',
      category: data.category || '其他',
      description: data.description || '',
      details: data.details || '',
      tags: data.tags || [],
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      ...data
    }
    
    worldItems.push(worldItem)
    await this.writeJsonFile(`project_${projectId}_world.json`, worldItems)
    this.clearCache(`world_${projectId}`)
    
    return worldItem
  }

  async updateWorldItem(projectId: string, data: Partial<WorldItem>): Promise<WorldItem> {
    const worldItems = await this.getProjectWorldItems(projectId)
    const index = worldItems.findIndex(w => w.id === data.id)
    
    if (index === -1) {
      throw new AppError('世界设定不存在')
    }
    
    worldItems[index] = { ...worldItems[index], ...data, lastModified: new Date().toISOString() }
    await this.writeJsonFile(`project_${projectId}_world.json`, worldItems)
    this.clearCache(`world_${projectId}`)
    
    return worldItems[index]
  }

  async deleteWorldItem(projectId: string, worldId: string): Promise<void> {
    const worldItems = await this.getProjectWorldItems(projectId)
    const filteredWorldItems = worldItems.filter(w => w.id !== worldId)
    
    await this.writeJsonFile(`project_${projectId}_world.json`, filteredWorldItems)
    this.clearCache(`world_${projectId}`)
  }

  // 写作统计
  async getWritingStats(projectId: string): Promise<WritingStats> {
    const defaultStats: WritingStats = {
      projectId,
      dailyWords: {},
      totalWords: 0,
      todayWords: 0,
      weekWords: 0,
      lastWriteDate: null
    }
    
    return await this.readJsonFile(`project_${projectId}_stats.json`, defaultStats)
  }

  async updateWritingStats(projectId: string, stats: WritingStats): Promise<void> {
    await this.writeJsonFile(`project_${projectId}_stats.json`, stats)
  }

  // 设置管理
  async getSettings(): Promise<AppSettings> {
    const defaultSettings: AppSettings = {
      autoSave: true,
      autoSaveInterval: 30000,
      fontSize: 16,
      lineHeight: 1.5,
      autoIndent: true,
      theme: 'light',
      sidebarCollapsed: true,
      windowSize: 'normal',
      openLastProject: true,
      minimizeToTray: false,
      checkUpdates: true,
      autoBackup: true,
      maxBackups: 10,
      backupInterval: 24
    }
    
    const cacheKey = this.getCacheKey('settings')
    let settings = this.getCache<AppSettings>(cacheKey)
    
    if (!settings) {
      settings = await this.readJsonFile('settings.json', defaultSettings)
      this.setCache(cacheKey, settings)
    }
    
    return settings
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    await this.writeJsonFile('settings.json', settings)
    this.clearCache('settings')
  }

  // 数据管理
  async exportData(): Promise<string> {
    const projects = await this.getProjects()
    const settings = await this.getSettings()
    const currentProject = await this.getCurrentProject()
    
    const exportData: any = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      projects,
      settings,
      currentProject,
      projectData: {}
    }
    
    // 导出每个项目的详细数据
    for (const project of projects) {
      const projectId = project.id
      exportData.projectData[projectId] = {
        chapters: await this.getProjectChapters(projectId),
        volumes: await this.getProjectVolumes(projectId),
        characters: await this.getProjectCharacters(projectId),
        worldItems: await this.getProjectWorldItems(projectId),
        stats: await this.getWritingStats(projectId),
        currentChapter: await this.getCurrentChapter(projectId)
      }
    }
    
    return JSON.stringify(exportData, null, 2)
  }

  async importData(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData)
      
      // 导入项目列表
      if (data.projects) {
        await this.writeJsonFile('projects.json', data.projects)
      }
      
      // 导入设置
      if (data.settings) {
        await this.writeJsonFile('settings.json', data.settings)
      }
      
      // 导入当前项目
      if (data.currentProject) {
        await this.writeJsonFile('current_project.json', data.currentProject)
      }
      
      // 导入项目数据
      if (data.projectData) {
        for (const [projectId, projectData] of Object.entries(data.projectData as Record<string, any>)) {
          const typedProjectData = projectData as any
          if (typedProjectData.chapters) {
            await this.writeJsonFile(`project_${projectId}_chapters.json`, typedProjectData.chapters)
          }
          if (typedProjectData.volumes) {
            await this.writeJsonFile(`project_${projectId}_volumes.json`, typedProjectData.volumes)
          }
          if (typedProjectData.characters) {
            await this.writeJsonFile(`project_${projectId}_characters.json`, typedProjectData.characters)
          }
          if (typedProjectData.worldItems) {
            await this.writeJsonFile(`project_${projectId}_world.json`, typedProjectData.worldItems)
          }
          if (typedProjectData.stats) {
            await this.writeJsonFile(`project_${projectId}_stats.json`, typedProjectData.stats)
          }
          if (typedProjectData.currentChapter) {
            await this.writeJsonFile(`project_${projectId}_current.json`, { chapterId: typedProjectData.currentChapter })
          }
        }
      }
      
      // 清空缓存
      this.clearCache()
      
    } catch (error) {
      throw new AppError('导入数据失败', error)
    }
  }

  async clearAll(): Promise<void> {
    try {
      const files = await this.adapter.listFiles()
      
      for (const file of files) {
        await this.adapter.deleteFile(file)
      }
      
      this.clearCache()
      
    } catch (error) {
      throw new AppError('清空数据失败', error)
    }
  }

  // 辅助方法
  private async updateProjectWordCount(projectId: string): Promise<void> {
    const chapters = await this.getProjectChapters(projectId)
    const totalWordCount = chapters.reduce((sum, chapter) => sum + (chapter.wordCount || 0), 0)
    
    const project = await this.getProject(projectId)
    if (project) {
      project.wordCount = totalWordCount
      project.chapters = chapters.length
      await this.saveProject(project)
    }
  }
}

// 创建单例实例
export const storageService = new UnifiedStorageService()