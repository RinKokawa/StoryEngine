// 存储适配器 - 提供统一的同步API接口
import fileStorageManager from './fileStorage.js'

class StorageAdapter {
  constructor() {
    this.fileStorage = fileStorageManager
    // 缓存，用于同步API
    this.cache = {
      projects: null,
      currentProject: null,
      settings: null,
      projectContents: {},
      writingStats: {},
      projectCharacters: {},
      projectChapters: {},
      currentChapters: {}
    }
    this.initialized = false
  }

  // 初始化缓存
  async initialize() {
    if (this.initialized) return
    
    try {
      this.cache.projects = await this.fileStorage.getProjects()
      this.cache.currentProject = await this.fileStorage.getCurrentProject()
      this.cache.settings = await this.fileStorage.getSettings()
      this.initialized = true
    } catch (error) {
      console.error('初始化存储适配器失败:', error)
    }
  }

  // 同步方法 - 兼容原有API
  getProjects() {
    return this.cache.projects || []
  }

  saveProjects(projects) {
    this.cache.projects = projects
    this.fileStorage.saveProjects(projects).catch(console.error)
    return true
  }

  getProject(projectId) {
    const projects = this.getProjects()
    return projects.find(p => p.id === projectId) || null
  }

  saveProject(project) {
    const projects = this.getProjects()
    const index = projects.findIndex(p => p.id === project.id)
    
    if (index >= 0) {
      projects[index] = { ...projects[index], ...project, lastModified: new Date().toISOString() }
    } else {
      projects.push({ ...project, id: project.id || Date.now(), lastModified: new Date().toISOString() })
    }
    
    return this.saveProjects(projects)
  }

  deleteProject(projectId) {
    const projects = this.getProjects()
    const filteredProjects = projects.filter(p => p.id !== projectId)
    
    // 清理缓存
    delete this.cache.projectContents[projectId]
    delete this.cache.writingStats[projectId]
    delete this.cache.projectCharacters[projectId]
    delete this.cache.projectChapters[projectId]
    delete this.cache.currentChapters[projectId]
    
    // 异步删除文件
    this.fileStorage.deleteProject(projectId).catch(console.error)
    
    return this.saveProjects(filteredProjects)
  }

  getCurrentProject() {
    return this.cache.currentProject
  }

  setCurrentProject(project) {
    this.cache.currentProject = project
    this.fileStorage.setCurrentProject(project).catch(console.error)
    return true
  }

  getProjectContent(projectId) {
    if (this.cache.projectContents[projectId] !== undefined) {
      return this.cache.projectContents[projectId]
    }
    
    // 异步加载内容
    this.fileStorage.getProjectContent(projectId).then(content => {
      this.cache.projectContents[projectId] = content
    }).catch(console.error)
    
    return '　　' // 默认内容
  }

  saveProjectContent(projectId, content) {
    this.cache.projectContents[projectId] = content
    
    // 异步保存
    this.fileStorage.saveProjectContent(projectId, content).catch(console.error)
    
    // 更新项目字数统计
    const wordCount = content.replace(/\s/g, '').length
    this.updateProjectWordCount(projectId, wordCount)
    
    return true
  }

  deleteProjectContent(projectId) {
    delete this.cache.projectContents[projectId]
    this.fileStorage.deleteProjectContent(projectId).catch(console.error)
    return true
  }

  updateProjectWordCount(projectId, wordCount) {
    const project = this.getProject(projectId)
    if (project) {
      project.wordCount = wordCount
      project.lastModified = new Date().toISOString()
      this.saveProject(project)
    }
  }

  getSettings() {
    return this.cache.settings || this.getDefaultSettings()
  }

  getDefaultSettings() {
    return {
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
      checkUpdates: true
    }
  }

  saveSettings(settings) {
    this.cache.settings = settings
    this.fileStorage.saveSettings(settings).catch(console.error)
    return true
  }

  // 角色管理方法
  getProjectCharacters(projectId) {
    if (this.cache.projectCharacters[projectId] !== undefined) {
      return this.cache.projectCharacters[projectId]
    }
    
    // 异步加载角色数据
    this.fileStorage.getProjectCharacters(projectId).then(characters => {
      this.cache.projectCharacters[projectId] = characters
    }).catch(console.error)
    
    return [] // 默认返回空数组
  }

  createCharacter(projectId, characterData) {
    const characters = this.getProjectCharacters(projectId)
    const newCharacter = {
      ...characterData,
      id: characterData.id || Date.now().toString(),
      projectId: projectId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    characters.push(newCharacter)
    this.cache.projectCharacters[projectId] = characters
    
    // 异步保存
    this.fileStorage.saveProjectCharacters(projectId, characters).catch(console.error)
    
    return true
  }

  updateCharacter(projectId, characterData) {
    const characters = this.getProjectCharacters(projectId)
    const index = characters.findIndex(c => c.id === characterData.id)
    
    if (index >= 0) {
      characters[index] = {
        ...characters[index],
        ...characterData,
        updatedAt: new Date().toISOString()
      }
      
      this.cache.projectCharacters[projectId] = characters
      
      // 异步保存
      this.fileStorage.saveProjectCharacters(projectId, characters).catch(console.error)
      
      return true
    }
    
    return false
  }

  deleteCharacter(projectId, characterId) {
    const characters = this.getProjectCharacters(projectId)
    const filteredCharacters = characters.filter(c => c.id !== characterId)
    
    this.cache.projectCharacters[projectId] = filteredCharacters
    
    // 异步保存
    this.fileStorage.saveProjectCharacters(projectId, filteredCharacters).catch(console.error)
    
    return true
  }

  // 世界设定管理方法
  getProjectWorldItems(projectId) {
    if (this.cache.projectWorldItems && this.cache.projectWorldItems[projectId] !== undefined) {
      return this.cache.projectWorldItems[projectId]
    }
    
    // 初始化缓存
    if (!this.cache.projectWorldItems) {
      this.cache.projectWorldItems = {}
    }
    
    // 异步加载世界设定数据
    this.fileStorage.getProjectWorldItems(projectId).then(worldItems => {
      this.cache.projectWorldItems[projectId] = worldItems
    }).catch(console.error)
    
    return [] // 默认返回空数组
  }

  createWorldItem(projectId, worldData) {
    const worldItems = this.getProjectWorldItems(projectId)
    const newWorldItem = {
      ...worldData,
      id: worldData.id || Date.now().toString(),
      projectId: projectId,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    }
    
    worldItems.push(newWorldItem)
    
    // 确保缓存存在
    if (!this.cache.projectWorldItems) {
      this.cache.projectWorldItems = {}
    }
    this.cache.projectWorldItems[projectId] = worldItems
    
    // 异步保存
    this.fileStorage.saveProjectWorldItems(projectId, worldItems).catch(console.error)
    
    return true
  }

  updateWorldItem(projectId, worldData) {
    const worldItems = this.getProjectWorldItems(projectId)
    const index = worldItems.findIndex(w => w.id === worldData.id)
    
    if (index >= 0) {
      worldItems[index] = {
        ...worldItems[index],
        ...worldData,
        lastModified: new Date().toISOString()
      }
      
      // 确保缓存存在
      if (!this.cache.projectWorldItems) {
        this.cache.projectWorldItems = {}
      }
      this.cache.projectWorldItems[projectId] = worldItems
      
      // 异步保存
      this.fileStorage.saveProjectWorldItems(projectId, worldItems).catch(console.error)
      
      return true
    }
    
    return false
  }

  deleteWorldItem(projectId, worldId) {
    const worldItems = this.getProjectWorldItems(projectId)
    const filteredWorldItems = worldItems.filter(w => w.id !== worldId)
    
    // 确保缓存存在
    if (!this.cache.projectWorldItems) {
      this.cache.projectWorldItems = {}
    }
    this.cache.projectWorldItems[projectId] = filteredWorldItems
    
    // 异步保存
    this.fileStorage.saveProjectWorldItems(projectId, filteredWorldItems).catch(console.error)
    
    return true
  }

  // ==================== 章节管理方法 ====================
  
  // 获取项目的所有章节
  getProjectChapters(projectId) {
    if (this.cache.projectChapters[projectId] !== undefined) {
      return this.cache.projectChapters[projectId]
    }
    
    // 异步加载章节数据
    this.fileStorage.getProjectChapters(projectId).then(chapters => {
      this.cache.projectChapters[projectId] = chapters
    }).catch(console.error)
    
    return [] // 默认返回空数组
  }

  // 获取单个章节
  getChapter(projectId, chapterId) {
    const chapters = this.getProjectChapters(projectId)
    return chapters.find(c => c.id === chapterId) || null
  }

  // 创建新章节
  createChapter(projectId, chapterData) {
    const chapters = this.getProjectChapters(projectId)
    const newChapter = {
      ...chapterData,
      id: chapterData.id || `chapter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      projectId: projectId,
      order: chapterData.order || chapters.length + 1,
      content: chapterData.content || '　　',
      wordCount: 0,
      status: chapterData.status || 'draft',
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    }
    
    // 计算字数
    newChapter.wordCount = newChapter.content.replace(/\s/g, '').length
    
    chapters.push(newChapter)
    this.cache.projectChapters[projectId] = chapters
    
    // 异步保存
    this.fileStorage.saveProjectChapters(projectId, chapters).catch(console.error)
    
    return newChapter
  }

  // 更新章节
  updateChapter(projectId, chapterData) {
    const chapters = this.getProjectChapters(projectId)
    const index = chapters.findIndex(c => c.id === chapterData.id)
    
    if (index >= 0) {
      chapters[index] = {
        ...chapters[index],
        ...chapterData,
        lastModified: new Date().toISOString()
      }
      
      // 重新计算字数
      if (chapterData.content !== undefined) {
        chapters[index].wordCount = chapterData.content.replace(/\s/g, '').length
      }
      
      this.cache.projectChapters[projectId] = chapters
      
      // 异步保存
      this.fileStorage.saveProjectChapters(projectId, chapters).catch(console.error)
      
      return chapters[index]
    }
    
    return null
  }

  // 删除章节
  deleteChapter(projectId, chapterId) {
    const chapters = this.getProjectChapters(projectId)
    const filteredChapters = chapters.filter(c => c.id !== chapterId)
    
    // 重新排序剩余章节
    filteredChapters.forEach((chapter, index) => {
      chapter.order = index + 1
    })
    
    this.cache.projectChapters[projectId] = filteredChapters
    
    // 异步保存
    this.fileStorage.saveProjectChapters(projectId, filteredChapters).catch(console.error)
    
    return true
  }

  // 获取章节内容
  getChapterContent(projectId, chapterId) {
    const chapter = this.getChapter(projectId, chapterId)
    return chapter ? chapter.content : '　　'
  }

  // 保存章节内容
  saveChapterContent(projectId, chapterId, content) {
    const chapters = this.getProjectChapters(projectId)
    const index = chapters.findIndex(c => c.id === chapterId)
    
    if (index >= 0) {
      chapters[index].content = content
      chapters[index].wordCount = content.replace(/\s/g, '').length
      chapters[index].lastModified = new Date().toISOString()
      
      this.cache.projectChapters[projectId] = chapters
      
      // 异步保存
      this.fileStorage.saveProjectChapters(projectId, chapters).catch(console.error)
      
      // 更新项目总字数
      this.updateProjectTotalWordCount(projectId)
      
      return true
    }
    
    return false
  }

  // 重新排序章节
  reorderChapters(projectId, chapterIds) {
    const chapters = this.getProjectChapters(projectId)
    const reorderedChapters = []
    
    // 按照新的顺序重新排列章节
    chapterIds.forEach((chapterId, index) => {
      const chapter = chapters.find(c => c.id === chapterId)
      if (chapter) {
        chapter.order = index + 1
        reorderedChapters.push(chapter)
      }
    })
    
    this.cache.projectChapters[projectId] = reorderedChapters
    
    // 异步保存
    this.fileStorage.saveProjectChapters(projectId, reorderedChapters).catch(console.error)
    
    return true
  }

  // 获取当前编辑的章节
  getCurrentChapter(projectId) {
    return this.cache.currentChapters[projectId] || null
  }

  // 设置当前编辑的章节
  setCurrentChapter(projectId, chapterId) {
    this.cache.currentChapters[projectId] = chapterId
    
    // 异步保存到文件
    this.fileStorage.setCurrentChapter(projectId, chapterId).catch(console.error)
    
    return true
  }

  // 更新项目总字数
  updateProjectTotalWordCount(projectId) {
    const chapters = this.getProjectChapters(projectId)
    const totalWordCount = chapters.reduce((sum, chapter) => sum + (chapter.wordCount || 0), 0)
    
    const project = this.getProject(projectId)
    if (project) {
      project.wordCount = totalWordCount
      project.chapters = chapters.length
      project.lastModified = new Date().toISOString()
      this.saveProject(project)
    }
  }

  // 异步方法 - 新的API
  async getProjectsAsync() {
    return await this.fileStorage.getProjects()
  }

  async saveProjectAsync(project) {
    const result = await this.fileStorage.saveProject(project)
    if (result) {
      // 更新缓存
      await this.initialize()
    }
    return result
  }

  async getProjectContentAsync(projectId) {
    const content = await this.fileStorage.getProjectContent(projectId)
    this.cache.projectContents[projectId] = content
    return content
  }

  async saveProjectContentAsync(projectId, content) {
    const result = await this.fileStorage.saveProjectContent(projectId, content)
    if (result) {
      this.cache.projectContents[projectId] = content
    }
    return result
  }

  async exportData() {
    return await this.fileStorage.exportData()
  }

  async importData(jsonData) {
    const result = await this.fileStorage.importData(jsonData)
    if (result) {
      // 重新初始化缓存
      this.initialized = false
      await this.initialize()
    }
    return result
  }

  async clearAll() {
    const result = await this.fileStorage.clearAll()
    if (result) {
      // 清空缓存
      this.cache = {
        projects: [],
        currentProject: null,
        settings: this.getDefaultSettings(),
        projectContents: {},
        writingStats: {},
        projectCharacters: {},
        projectChapters: {},
        currentChapters: {}
      }
    }
    return result
  }
}

// 创建单例实例
const storageAdapter = new StorageAdapter()

// 在应用启动时初始化
if (typeof window !== 'undefined') {
  storageAdapter.initialize().catch(console.error)
}

export default storageAdapter