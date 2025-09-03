/**
 * 增强型存储管理器
 * 基于新的数据模型提供更可靠的持久化解决方案
 */

import {
  ProjectModel,
  ChapterModel,
  CharacterModel,
  WritingStatsModel,
  AppSettingsModel,
  DataValidator,
  DataConverter,
  DataFactory
} from './dataModels.js'

/**
 * 增强型存储管理器
 * 解决原有存储系统的问题：
 * 1. 数据结构不统一
 * 2. 缺乏数据验证
 * 3. 异步/同步API混乱
 * 4. 缺乏错误处理
 * 5. 数据完整性问题
 */
class EnhancedStorageManager {
  constructor() {
    this.isElectron = window.electronAPI && window.electronAPI.readFile
    this.cache = new Map()
    this.initialized = false
    this.eventListeners = new Map()
    
    // 文件名配置
    this.fileNames = {
      PROJECTS: 'projects.json',
      CURRENT_PROJECT: 'current-project.json',
      SETTINGS: 'app-settings.json',
      PROJECT_CONTENT: (id) => `project-content-${id}.json`,
      PROJECT_CHAPTERS: (id) => `project-chapters-${id}.json`,
      PROJECT_CHARACTERS: (id) => `project-characters-${id}.json`,
      WRITING_STATS: (id) => `writing-stats-${id}.json`,
      BACKUP_INDEX: 'backup-index.json'
    }
    
    // 缓存键配置
    this.cacheKeys = {
      PROJECTS: 'projects',
      CURRENT_PROJECT: 'currentProject',
      SETTINGS: 'settings',
      PROJECT_CONTENT: (id) => `projectContent_${id}`,
      PROJECT_CHAPTERS: (id) => `projectChapters_${id}`,
      PROJECT_CHARACTERS: (id) => `projectCharacters_${id}`,
      WRITING_STATS: (id) => `writingStats_${id}`
    }
  }

  // ==================== 初始化和事件系统 ====================

  /**
   * 初始化存储管理器
   */
  async initialize() {
    if (this.initialized) return true

    try {
      // 预加载核心数据
      await this.preloadCoreData()
      
      // 验证数据完整性
      await this.validateDataIntegrity()
      
      // 设置自动保存
      this.setupAutoSave()
      
      this.initialized = true
      this.emit('initialized')
      return true
    } catch (error) {
      console.error('存储管理器初始化失败:', error)
      this.emit('error', { type: 'initialization', error })
      return false
    }
  }

  /**
   * 预加载核心数据到缓存
   */
  async preloadCoreData() {
    try {
      // 加载项目列表
      const projects = await this.loadProjects()
      this.cache.set(this.cacheKeys.PROJECTS, projects)
      
      // 加载当前项目
      const currentProject = await this.loadCurrentProject()
      this.cache.set(this.cacheKeys.CURRENT_PROJECT, currentProject)
      
      // 加载应用设置
      const settings = await this.loadSettings()
      this.cache.set(this.cacheKeys.SETTINGS, settings)
      
    } catch (error) {
      console.error('预加载核心数据失败:', error)
      throw error
    }
  }

  /**
   * 验证数据完整性
   */
  async validateDataIntegrity() {
    const projects = this.cache.get(this.cacheKeys.PROJECTS) || []
    const issues = []

    for (const project of projects) {
      const validation = DataValidator.validateProject(project)
      if (!validation.isValid) {
        issues.push({
          type: 'project',
          id: project.id,
          errors: validation.errors
        })
      }
    }

    if (issues.length > 0) {
      console.warn('发现数据完整性问题:', issues)
      this.emit('dataIntegrityIssues', issues)
    }
  }

  /**
   * 设置自动保存
   */
  setupAutoSave() {
    const settings = this.cache.get(this.cacheKeys.SETTINGS)
    if (settings?.general?.autoSave) {
      const interval = settings.general.autoSaveInterval || 30000
      setInterval(() => {
        this.performAutoSave()
      }, interval)
    }
  }

  /**
   * 执行自动保存
   */
  async performAutoSave() {
    try {
      // 保存所有缓存中的脏数据
      const promises = []
      
      for (const [key, value] of this.cache.entries()) {
        if (value && value._dirty) {
          if (key === this.cacheKeys.PROJECTS) {
            promises.push(this.saveProjects(value))
          } else if (key === this.cacheKeys.CURRENT_PROJECT) {
            promises.push(this.saveCurrentProject(value))
          } else if (key === this.cacheKeys.SETTINGS) {
            promises.push(this.saveSettings(value))
          } else if (key.startsWith('projectContent_')) {
            const projectId = key.replace('projectContent_', '')
            promises.push(this.saveProjectContent(projectId, value))
          }
        }
      }
      
      await Promise.all(promises)
      this.emit('autoSaved')
    } catch (error) {
      console.error('自动保存失败:', error)
      this.emit('error', { type: 'autoSave', error })
    }
  }

  // ==================== 事件系统 ====================

  /**
   * 添加事件监听器
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event).push(callback)
  }

  /**
   * 移除事件监听器
   */
  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event)
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  /**
   * 触发事件
   */
  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error('事件回调执行失败:', error)
        }
      })
    }
  }

  // ==================== 底层文件操作 ====================

  /**
   * 读取JSON文件
   */
  async readJsonFile(fileName) {
    try {
      if (this.isElectron) {
        const result = await window.electronAPI.readFile(fileName)
        if (result.success && result.data) {
          return JSON.parse(result.data)
        }
      } else {
        // 浏览器环境回退到localStorage
        const key = `story_engine_${fileName.replace('.json', '')}`
        const data = localStorage.getItem(key)
        if (data) {
          return JSON.parse(data)
        }
      }
      return null
    } catch (error) {
      console.error(`读取文件 ${fileName} 失败:`, error)
      throw new Error(`读取文件失败: ${error.message}`)
    }
  }

  /**
   * 写入JSON文件
   */
  async writeJsonFile(fileName, data) {
    try {
      const jsonData = JSON.stringify(data, null, 2)
      
      if (this.isElectron) {
        const result = await window.electronAPI.writeFile(fileName, jsonData)
        return result.success
      } else {
        // 浏览器环境回退到localStorage
        const key = `story_engine_${fileName.replace('.json', '')}`
        localStorage.setItem(key, jsonData)
        return true
      }
    } catch (error) {
      console.error(`写入文件 ${fileName} 失败:`, error)
      throw new Error(`写入文件失败: ${error.message}`)
    }
  }

  /**
   * 删除文件
   */
  async deleteFile(fileName) {
    try {
      if (this.isElectron) {
        const result = await window.electronAPI.deleteFile(fileName)
        return result.success
      } else {
        const key = `story_engine_${fileName.replace('.json', '')}`
        localStorage.removeItem(key)
        return true
      }
    } catch (error) {
      console.error(`删除文件 ${fileName} 失败:`, error)
      return false
    }
  }

  // ==================== 项目管理 ====================

  /**
   * 加载所有项目
   */
  async loadProjects() {
    try {
      const data = await this.readJsonFile(this.fileNames.PROJECTS)
      if (!data) return []
      
      // 转换为项目模型
      return data.map(projectData => {
        try {
          return ProjectModel.fromStorageFormat(projectData)
        } catch (error) {
          console.warn('项目数据转换失败:', error, projectData)
          // 尝试使用数据转换器修复
          return DataConverter.convertLegacyProject(projectData)
        }
      })
    } catch (error) {
      console.error('加载项目列表失败:', error)
      return []
    }
  }

  /**
   * 保存项目列表
   */
  async saveProjects(projects) {
    try {
      const data = projects.map(project => {
        if (project instanceof ProjectModel) {
          return project.toStorageFormat()
        }
        return project
      })
      
      const success = await this.writeJsonFile(this.fileNames.PROJECTS, data)
      if (success) {
        this.cache.set(this.cacheKeys.PROJECTS, projects)
        this.emit('projectsSaved', projects)
      }
      return success
    } catch (error) {
      console.error('保存项目列表失败:', error)
      this.emit('error', { type: 'saveProjects', error })
      return false
    }
  }

  /**
   * 获取所有项目（同步）
   */
  getProjects() {
    return this.cache.get(this.cacheKeys.PROJECTS) || []
  }

  /**
   * 获取单个项目
   */
  getProject(projectId) {
    const projects = this.getProjects()
    return projects.find(p => p.id === projectId) || null
  }

  /**
   * 创建新项目
   */
  async createProject(projectData) {
    try {
      // 验证项目数据
      const validation = DataValidator.validateProject(projectData)
      if (!validation.isValid) {
        throw new Error(`项目数据验证失败: ${validation.errors.join(', ')}`)
      }

      // 创建项目模型
      const project = new ProjectModel(projectData)
      
      // 添加到项目列表
      const projects = this.getProjects()
      projects.push(project)
      
      // 保存项目列表
      const success = await this.saveProjects(projects)
      if (success) {
        // 创建项目相关的默认数据
        await this.initializeProjectData(project.id)
        this.emit('projectCreated', project)
        return project
      }
      
      return null
    } catch (error) {
      console.error('创建项目失败:', error)
      this.emit('error', { type: 'createProject', error })
      return null
    }
  }

  /**
   * 更新项目
   */
  async updateProject(projectId, updates) {
    try {
      const projects = this.getProjects()
      const index = projects.findIndex(p => p.id === projectId)
      
      if (index === -1) {
        throw new Error('项目不存在')
      }

      // 更新项目数据
      const updatedProject = new ProjectModel({
        ...projects[index].toStorageFormat(),
        ...updates,
        lastModified: new Date().toISOString()
      })

      // 验证更新后的数据
      const validation = DataValidator.validateProject(updatedProject)
      if (!validation.isValid) {
        throw new Error(`项目数据验证失败: ${validation.errors.join(', ')}`)
      }

      projects[index] = updatedProject
      
      const success = await this.saveProjects(projects)
      if (success) {
        this.emit('projectUpdated', updatedProject)
        return updatedProject
      }
      
      return null
    } catch (error) {
      console.error('更新项目失败:', error)
      this.emit('error', { type: 'updateProject', error })
      return null
    }
  }

  /**
   * 删除项目
   */
  async deleteProject(projectId) {
    try {
      const projects = this.getProjects()
      const project = projects.find(p => p.id === projectId)
      
      if (!project) {
        throw new Error('项目不存在')
      }

      // 删除项目相关的所有数据
      await this.deleteProjectData(projectId)
      
      // 从项目列表中移除
      const filteredProjects = projects.filter(p => p.id !== projectId)
      
      const success = await this.saveProjects(filteredProjects)
      if (success) {
        // 清理缓存
        this.clearProjectCache(projectId)
        this.emit('projectDeleted', project)
        return true
      }
      
      return false
    } catch (error) {
      console.error('删除项目失败:', error)
      this.emit('error', { type: 'deleteProject', error })
      return false
    }
  }

  /**
   * 初始化项目数据
   */
  async initializeProjectData(projectId) {
    try {
      // 创建默认章节
      const defaultChapter = DataFactory.createDefaultChapter(projectId, '第一章')
      await this.saveProjectChapters(projectId, [defaultChapter])
      
      // 创建空的角色列表
      await this.saveProjectCharacters(projectId, [])
      
      // 创建写作统计
      const stats = DataFactory.createDefaultWritingStats(projectId)
      await this.saveWritingStats(projectId, stats)
      
    } catch (error) {
      console.error('初始化项目数据失败:', error)
      throw error
    }
  }

  /**
   * 删除项目数据
   */
  async deleteProjectData(projectId) {
    const deletePromises = [
      this.deleteFile(this.fileNames.PROJECT_CONTENT(projectId)),
      this.deleteFile(this.fileNames.PROJECT_CHAPTERS(projectId)),
      this.deleteFile(this.fileNames.PROJECT_CHARACTERS(projectId)),
      this.deleteFile(this.fileNames.WRITING_STATS(projectId))
    ]
    
    await Promise.allSettled(deletePromises)
  }

  /**
   * 清理项目缓存
   */
  clearProjectCache(projectId) {
    this.cache.delete(this.cacheKeys.PROJECT_CONTENT(projectId))
    this.cache.delete(this.cacheKeys.PROJECT_CHAPTERS(projectId))
    this.cache.delete(this.cacheKeys.PROJECT_CHARACTERS(projectId))
    this.cache.delete(this.cacheKeys.WRITING_STATS(projectId))
  }

  // ==================== 当前项目管理 ====================

  /**
   * 加载当前项目
   */
  async loadCurrentProject() {
    try {
      const data = await this.readJsonFile(this.fileNames.CURRENT_PROJECT)
      if (data) {
        return ProjectModel.fromStorageFormat(data)
      }
      return null
    } catch (error) {
      console.error('加载当前项目失败:', error)
      return null
    }
  }

  /**
   * 保存当前项目
   */
  async saveCurrentProject(project) {
    try {
      const data = project ? project.toStorageFormat() : null
      const success = await this.writeJsonFile(this.fileNames.CURRENT_PROJECT, data)
      if (success) {
        this.cache.set(this.cacheKeys.CURRENT_PROJECT, project)
        this.emit('currentProjectChanged', project)
      }
      return success
    } catch (error) {
      console.error('保存当前项目失败:', error)
      this.emit('error', { type: 'saveCurrentProject', error })
      return false
    }
  }

  /**
   * 获取当前项目（同步）
   */
  getCurrentProject() {
    return this.cache.get(this.cacheKeys.CURRENT_PROJECT)
  }

  /**
   * 设置当前项目
   */
  async setCurrentProject(project) {
    return await this.saveCurrentProject(project)
  }

  // ==================== 项目内容管理 ====================

  /**
   * 获取项目内容
   */
  async getProjectContent(projectId) {
    try {
      const cacheKey = this.cacheKeys.PROJECT_CONTENT(projectId)
      
      // 先检查缓存
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey)
      }
      
      // 从文件加载
      const fileName = this.fileNames.PROJECT_CONTENT(projectId)
      let content = '　　' // 默认内容
      
      if (this.isElectron) {
        const result = await window.electronAPI.readFile(fileName.replace('.json', '.txt'))
        if (result.success && result.data !== null) {
          content = result.data
        }
      } else {
        const key = `story_engine_project_content_${projectId}`
        content = localStorage.getItem(key) || '　　'
      }
      
      // 缓存内容
      this.cache.set(cacheKey, content)
      return content
      
    } catch (error) {
      console.error('获取项目内容失败:', error)
      return '　　'
    }
  }

  /**
   * 保存项目内容
   */
  async saveProjectContent(projectId, content) {
    try {
      const fileName = this.fileNames.PROJECT_CONTENT(projectId).replace('.json', '.txt')
      let success = false
      
      if (this.isElectron) {
        const result = await window.electronAPI.writeFile(fileName, content)
        success = result.success
      } else {
        const key = `story_engine_project_content_${projectId}`
        localStorage.setItem(key, content)
        success = true
      }
      
      if (success) {
        // 更新缓存
        const cacheKey = this.cacheKeys.PROJECT_CONTENT(projectId)
        this.cache.set(cacheKey, content)
        
        // 更新项目字数统计
        const wordCount = content.replace(/\s/g, '').length
        await this.updateProjectWordCount(projectId, wordCount)
        
        this.emit('projectContentSaved', { projectId, content, wordCount })
      }
      
      return success
    } catch (error) {
      console.error('保存项目内容失败:', error)
      this.emit('error', { type: 'saveProjectContent', error })
      return false
    }
  }

  /**
   * 更新项目字数统计
   */
  async updateProjectWordCount(projectId, wordCount) {
    try {
      const project = this.getProject(projectId)
      if (project) {
        await this.updateProject(projectId, { wordCount })
        
        // 更新写作统计
        const stats = await this.getWritingStats(projectId)
        if (stats) {
          stats.addWritingSession(wordCount - stats.totalWords)
          await this.saveWritingStats(projectId, stats)
        }
      }
    } catch (error) {
      console.error('更新项目字数统计失败:', error)
    }
  }

  // ==================== 章节管理 ====================

  /**
   * 获取项目章节
   */
  async getProjectChapters(projectId) {
    try {
      const cacheKey = this.cacheKeys.PROJECT_CHAPTERS(projectId)
      
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey)
      }
      
      const data = await this.readJsonFile(this.fileNames.PROJECT_CHAPTERS(projectId))
      const chapters = data ? data.map(chapterData => ChapterModel.fromStorageFormat(chapterData)) : []
      
      this.cache.set(cacheKey, chapters)
      return chapters
    } catch (error) {
      console.error('获取项目章节失败:', error)
      return []
    }
  }

  /**
   * 保存项目章节
   */
  async saveProjectChapters(projectId, chapters) {
    try {
      const data = chapters.map(chapter => {
        if (chapter instanceof ChapterModel) {
          return chapter.toStorageFormat()
        }
        return chapter
      })
      
      const success = await this.writeJsonFile(this.fileNames.PROJECT_CHAPTERS(projectId), data)
      if (success) {
        const cacheKey = this.cacheKeys.PROJECT_CHAPTERS(projectId)
        this.cache.set(cacheKey, chapters)
        this.emit('projectChaptersSaved', { projectId, chapters })
      }
      return success
    } catch (error) {
      console.error('保存项目章节失败:', error)
      this.emit('error', { type: 'saveProjectChapters', error })
      return false
    }
  }

  // ==================== 角色管理 ====================

  /**
   * 获取项目角色
   */
  async getProjectCharacters(projectId) {
    try {
      const cacheKey = this.cacheKeys.PROJECT_CHARACTERS(projectId)
      
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey)
      }
      
      const data = await this.readJsonFile(this.fileNames.PROJECT_CHARACTERS(projectId))
      const characters = data ? data.map(characterData => CharacterModel.fromStorageFormat(characterData)) : []
      
      this.cache.set(cacheKey, characters)
      return characters
    } catch (error) {
      console.error('获取项目角色失败:', error)
      return []
    }
  }

  /**
   * 保存项目角色
   */
  async saveProjectCharacters(projectId, characters) {
    try {
      const data = characters.map(character => {
        if (character instanceof CharacterModel) {
          return character.toStorageFormat()
        }
        return character
      })
      
      const success = await this.writeJsonFile(this.fileNames.PROJECT_CHARACTERS(projectId), data)
      if (success) {
        const cacheKey = this.cacheKeys.PROJECT_CHARACTERS(projectId)
        this.cache.set(cacheKey, characters)
        this.emit('projectCharactersSaved', { projectId, characters })
      }
      return success
    } catch (error) {
      console.error('保存项目角色失败:', error)
      this.emit('error', { type: 'saveProjectCharacters', error })
      return false
    }
  }

  /**
   * 创建角色
   */
  async createCharacter(projectId, characterData) {
    try {
      const validation = DataValidator.validateCharacter({ ...characterData, projectId })
      if (!validation.isValid) {
        throw new Error(`角色数据验证失败: ${validation.errors.join(', ')}`)
      }

      const character = new CharacterModel({ ...characterData, projectId })
      const characters = await this.getProjectCharacters(projectId)
      characters.push(character)
      
      const success = await this.saveProjectCharacters(projectId, characters)
      if (success) {
        this.emit('characterCreated', character)
        return character
      }
      
      return null
    } catch (error) {
      console.error('创建角色失败:', error)
      this.emit('error', { type: 'createCharacter', error })
      return null
    }
  }

  /**
   * 更新角色
   */
  async updateCharacter(projectId, characterId, updates) {
    try {
      const characters = await this.getProjectCharacters(projectId)
      const index = characters.findIndex(c => c.id === characterId)
      
      if (index === -1) {
        throw new Error('角色不存在')
      }

      const updatedCharacter = new CharacterModel({
        ...characters[index].toStorageFormat(),
        ...updates,
        lastModified: new Date().toISOString()
      })

      const validation = DataValidator.validateCharacter(updatedCharacter)
      if (!validation.isValid) {
        throw new Error(`角色数据验证失败: ${validation.errors.join(', ')}`)
      }

      characters[index] = updatedCharacter
      
      const success = await this.saveProjectCharacters(projectId, characters)
      if (success) {
        this.emit('characterUpdated', updatedCharacter)
        return updatedCharacter
      }
      
      return null
    } catch (error) {
      console.error('更新角色失败:', error)
      this.emit('error', { type: 'updateCharacter', error })
      return null
    }
  }

  /**
   * 删除角色
   */
  async deleteCharacter(projectId, characterId) {
    try {
      const characters = await this.getProjectCharacters(projectId)
      const character = characters.find(c => c.id === characterId)
      
      if (!character) {
        throw new Error('角色不存在')
      }

      const filteredCharacters = characters.filter(c => c.id !== characterId)
      
      const success = await this.saveProjectCharacters(projectId, filteredCharacters)
      if (success) {
        this.emit('characterDeleted', character)
        return true
      }
      
      return false
    } catch (error) {
      console.error('删除角色失败:', error)
      this.emit('error', { type: 'deleteCharacter', error })
      return false
    }
  }

  // ==================== 写作统计管理 ====================

  /**
   * 获取写作统计
   */
  async getWritingStats(projectId) {
    try {
      const cacheKey = this.cacheKeys.WRITING_STATS(projectId)
      
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey)
      }
      
      const data = await this.readJsonFile(this.fileNames.WRITING_STATS(projectId))
      const stats = data ? WritingStatsModel.fromStorageFormat(data) : DataFactory.createDefaultWritingStats(projectId)
      
      this.cache.set(cacheKey, stats)
      return stats
    } catch (error) {
      console.error('获取写作统计失败:', error)
      return DataFactory.createDefaultWritingStats(projectId)
    }
  }

  /**
   * 保存写作统计
   */
  async saveWritingStats(projectId, stats) {
    try {
      const data = stats instanceof WritingStatsModel ? stats.toStorageFormat() : stats
      
      const success = await this.writeJsonFile(this.fileNames.WRITING_STATS(projectId), data)
      if (success) {
        const cacheKey = this.cacheKeys.WRITING_STATS(projectId)
        this.cache.set(cacheKey, stats)
        this.emit('writingStatsSaved', { projectId, stats })
      }
      return success
    } catch (error) {
      console.error('保存写作统计失败:', error)
      this.emit('error', { type: 'saveWritingStats', error })
      return false
    }
  }

  // ==================== 应用设置管理 ====================

  /**
   * 加载应用设置
   */
  async loadSettings() {
    try {
      const data = await this.readJsonFile(this.fileNames.SETTINGS)
      if (data) {
        return AppSettingsModel.fromStorageFormat(data)
      }
      return DataFactory.createDefaultSettings()
    } catch (error) {
      console.error('加载应用设置失败:', error)
      return DataFactory.createDefaultSettings()
    }
  }

  /**
   * 保存应用设置
   */
  async saveSettings(settings) {
    try {
      const validation = DataValidator.validateSettings(settings)
      if (!validation.isValid) {
        throw new Error(`设置数据验证失败: ${validation.errors.join(', ')}`)
      }

      const data = settings instanceof AppSettingsModel ? settings.toStorageFormat() : settings
      
      const success = await this.writeJsonFile(this.fileNames.SETTINGS, data)
      if (success) {
        this.cache.set(this.cacheKeys.SETTINGS, settings)
        this.emit('settingsSaved', settings)
      }
      return success
    } catch (error) {
      console.error('保存应用设置失败:', error)
      this.emit('error', { type: 'saveSettings', error })
      return false
    }
  }

  /**
   * 获取应用设置（同步）
   */
  getSettings() {
    const settings = this.cache.get(this.cacheKeys.SETTINGS)
    return settings || DataFactory.createDefaultSettings()
  }

  // ==================== 数据导入导出 ====================

  /**
   * 导出所有数据
   */
  async exportAllData() {
    try {
      const exportData = {
        version: '2.0.0',
        exportDate: new Date().toISOString(),
        projects: [],
        settings: null
      }

      // 导出项目数据
      const projects = this.getProjects()
      for (const project of projects) {
        const projectData = {
          project: project.toStorageFormat(),
          content: await this.getProjectContent(project.id),
          chapters: await this.getProjectChapters(project.id),
          characters: await this.getProjectCharacters(project.id),
          stats: await this.getWritingStats(project.id)
        }
        exportData.projects.push(projectData)
      }

      // 导出设置
      exportData.settings = this.getSettings().toStorageFormat()

      return DataConverter.exportToJson(exportData)
    } catch (error) {
      console.error('导出数据失败:', error)
      this.emit('error', { type: 'exportData', error })
      return null
    }
  }

  /**
   * 导入数据
   */
  async importAllData(jsonData) {
    try {
      const data = DataConverter.importFromJson(jsonData)
      
      if (!data.version || !data.projects) {
        throw new Error('无效的导入数据格式')
      }

      // 备份当前数据
      await this.createBackup('import_backup')

      // 导入项目数据
      for (const projectData of data.projects) {
        const project = ProjectModel.fromStorageFormat(projectData.project)
        
        // 保存项目
        const projects = this.getProjects()
        projects.push(project)
        await this.saveProjects(projects)
        
        // 保存项目内容
        if (projectData.content) {
          await this.saveProjectContent(project.id, projectData.content)
        }
        
        // 保存章节
        if (projectData.chapters) {
          const chapters = projectData.chapters.map(c => ChapterModel.fromStorageFormat(c))
          await this.saveProjectChapters(project.id, chapters)
        }
        
        // 保存角色
        if (projectData.characters) {
          const characters = projectData.characters.map(c => CharacterModel.fromStorageFormat(c))
          await this.saveProjectCharacters(project.id, characters)
        }
        
        // 保存统计
        if (projectData.stats) {
          const stats = WritingStatsModel.fromStorageFormat(projectData.stats)
          await this.saveWritingStats(project.id, stats)
        }
      }

      // 导入设置
      if (data.settings) {
        const settings = AppSettingsModel.fromStorageFormat(data.settings)
        await this.saveSettings(settings)
      }

      this.emit('dataImported', data)
      return true
    } catch (error) {
      console.error('导入数据失败:', error)
      this.emit('error', { type: 'importData', error })
      return false
    }
  }

  // ==================== 备份管理 ====================

  /**
   * 创建备份
   */
  async createBackup(backupName = null) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const name = backupName || `backup_${timestamp}`
      
      const backupData = await this.exportAllData()
      if (!backupData) {
        throw new Error('导出备份数据失败')
      }

      const fileName = `backup_${name}.json`
      const success = await this.writeJsonFile(fileName, JSON.parse(backupData))
      
      if (success) {
        this.emit('backupCreated', { name, fileName })
        return { name, fileName }
      }
      
      return null
    } catch (error) {
      console.error('创建备份失败:', error)
      this.emit('error', { type: 'createBackup', error })
      return null
    }
  }

  // ==================== 清理和维护 ====================

  /**
   * 清空所有数据
   */
  async clearAllData() {
    try {
      // 清空缓存
      this.cache.clear()
      
      // 删除所有文件
      const deletePromises = [
        this.deleteFile(this.fileNames.PROJECTS),
        this.deleteFile(this.fileNames.CURRENT_PROJECT),
        this.deleteFile(this.fileNames.SETTINGS)
      ]
      
      await Promise.allSettled(deletePromises)
      
      // 重新初始化默认数据
      await this.preloadCoreData()
      
      this.emit('allDataCleared')
      return true
    } catch (error) {
      console.error('清空数据失败:', error)
      this.emit('error', { type: 'clearAllData', error })
      return false
    }
  }

  /**
   * 获取存储统计信息
   */
  getStorageStats() {
    const projects = this.getProjects()
    const settings = this.getSettings()
    
    return {
      projectCount: projects.length,
      totalWords: projects.reduce((sum, p) => sum + (p.wordCount || 0), 0),
      cacheSize: this.cache.size,
      isElectron: this.isElectron,
      initialized: this.initialized,
      lastUpdate: new Date().toISOString()
    }
  }
}

// 创建单例实例
const enhancedStorage = new EnhancedStorageManager()

// 自动初始化
if (typeof window !== 'undefined') {
  enhancedStorage.initialize().catch(console.error)
}

export default enhancedStorage