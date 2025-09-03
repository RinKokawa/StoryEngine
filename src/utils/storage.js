// 本地存储管理工具
class StorageManager {
  constructor() {
    this.STORAGE_KEYS = {
      PROJECTS: 'story_engine_projects',
      CURRENT_PROJECT: 'story_engine_current_project',
      PROJECT_CONTENT: 'story_engine_project_content_',
      WRITING_STATS: 'story_engine_writing_stats_',
      SETTINGS: 'story_engine_settings'
    }
  }

  // 获取所有项目
  getProjects() {
    try {
      const projects = localStorage.getItem(this.STORAGE_KEYS.PROJECTS)
      return projects ? JSON.parse(projects) : []
    } catch (error) {
      console.error('获取项目列表失败:', error)
      return []
    }
  }

  // 保存项目列表
  saveProjects(projects) {
    try {
      localStorage.setItem(this.STORAGE_KEYS.PROJECTS, JSON.stringify(projects))
      return true
    } catch (error) {
      console.error('保存项目列表失败:', error)
      return false
    }
  }

  // 获取单个项目
  getProject(projectId) {
    const projects = this.getProjects()
    return projects.find(p => p.id === projectId) || null
  }

  // 保存单个项目
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

  // 删除项目
  deleteProject(projectId) {
    const projects = this.getProjects()
    const filteredProjects = projects.filter(p => p.id !== projectId)
    
    // 同时删除项目相关的内容和统计数据
    this.deleteProjectContent(projectId)
    this.deleteWritingStats(projectId)
    
    return this.saveProjects(filteredProjects)
  }

  // 获取当前项目
  getCurrentProject() {
    try {
      const currentProject = localStorage.getItem(this.STORAGE_KEYS.CURRENT_PROJECT)
      return currentProject ? JSON.parse(currentProject) : null
    } catch (error) {
      console.error('获取当前项目失败:', error)
      return null
    }
  }

  // 设置当前项目
  setCurrentProject(project) {
    try {
      localStorage.setItem(this.STORAGE_KEYS.CURRENT_PROJECT, JSON.stringify(project))
      return true
    } catch (error) {
      console.error('设置当前项目失败:', error)
      return false
    }
  }

  // 获取项目内容
  getProjectContent(projectId) {
    try {
      const content = localStorage.getItem(this.STORAGE_KEYS.PROJECT_CONTENT + projectId)
      return content || '　　'
    } catch (error) {
      console.error('获取项目内容失败:', error)
      return '　　'
    }
  }

  // 保存项目内容
  saveProjectContent(projectId, content) {
    try {
      localStorage.setItem(this.STORAGE_KEYS.PROJECT_CONTENT + projectId, content)
      
      // 更新项目的字数统计
      const wordCount = content.replace(/\s/g, '').length
      this.updateProjectWordCount(projectId, wordCount)
      
      return true
    } catch (error) {
      console.error('保存项目内容失败:', error)
      return false
    }
  }

  // 删除项目内容
  deleteProjectContent(projectId) {
    try {
      localStorage.removeItem(this.STORAGE_KEYS.PROJECT_CONTENT + projectId)
      return true
    } catch (error) {
      console.error('删除项目内容失败:', error)
      return false
    }
  }

  // 更新项目字数统计
  updateProjectWordCount(projectId, wordCount) {
    const project = this.getProject(projectId)
    if (project) {
      project.wordCount = wordCount
      project.lastModified = new Date().toISOString()
      this.saveProject(project)
    }
  }

  // 获取写作统计
  getWritingStats(projectId) {
    try {
      const stats = localStorage.getItem(this.STORAGE_KEYS.WRITING_STATS + projectId)
      return stats ? JSON.parse(stats) : {
        dailyWords: {},
        totalWords: 0,
        todayWords: 0,
        weekWords: 0,
        lastWriteDate: null
      }
    } catch (error) {
      console.error('获取写作统计失败:', error)
      return {
        dailyWords: {},
        totalWords: 0,
        todayWords: 0,
        weekWords: 0,
        lastWriteDate: null
      }
    }
  }

  // 保存写作统计
  saveWritingStats(projectId, stats) {
    try {
      localStorage.setItem(this.STORAGE_KEYS.WRITING_STATS + projectId, JSON.stringify(stats))
      return true
    } catch (error) {
      console.error('保存写作统计失败:', error)
      return false
    }
  }

  // 删除写作统计
  deleteWritingStats(projectId) {
    try {
      localStorage.removeItem(this.STORAGE_KEYS.WRITING_STATS + projectId)
      return true
    } catch (error) {
      console.error('删除写作统计失败:', error)
      return false
    }
  }

  // 角色管理相关方法
  // 获取项目角色列表
  getProjectCharacters(projectId) {
    try {
      const key = `project_characters_${projectId}`
      const characters = localStorage.getItem(key)
      return characters ? JSON.parse(characters) : []
    } catch (error) {
      console.error('获取角色列表失败:', error)
      return []
    }
  }

  // 创建角色
  createCharacter(projectId, characterData) {
    try {
      const characters = this.getProjectCharacters(projectId)
      characters.push(characterData)
      const key = `project_characters_${projectId}`
      localStorage.setItem(key, JSON.stringify(characters))
      return true
    } catch (error) {
      console.error('创建角色失败:', error)
      return false
    }
  }

  // 更新角色
  updateCharacter(projectId, characterData) {
    try {
      const characters = this.getProjectCharacters(projectId)
      const index = characters.findIndex(c => c.id === characterData.id)
      if (index !== -1) {
        characters[index] = characterData
        const key = `project_characters_${projectId}`
        localStorage.setItem(key, JSON.stringify(characters))
        return true
      }
      return false
    } catch (error) {
      console.error('更新角色失败:', error)
      return false
    }
  }

  // 删除角色
  deleteCharacter(projectId, characterId) {
    try {
      const characters = this.getProjectCharacters(projectId)
      const filteredCharacters = characters.filter(c => c.id !== characterId)
      const key = `project_characters_${projectId}`
      localStorage.setItem(key, JSON.stringify(filteredCharacters))
      return true
    } catch (error) {
      console.error('删除角色失败:', error)
      return false
    }
  }

  // 更新今日写作统计
  updateTodayWriting(projectId, wordCount) {
    const stats = this.getWritingStats(projectId)
    const today = new Date().toDateString()
    
    // 如果是新的一天，重置今日字数
    if (stats.lastWriteDate !== today) {
      stats.todayWords = 0
      stats.lastWriteDate = today
    }
    
    // 计算新增字数
    const previousWordCount = stats.totalWords
    const newWords = Math.max(0, wordCount - previousWordCount)
    
    // 更新统计
    stats.totalWords = wordCount
    stats.todayWords += newWords
    stats.dailyWords[today] = (stats.dailyWords[today] || 0) + newWords
    
    // 计算本周字数
    stats.weekWords = this.calculateWeekWords(stats.dailyWords)
    
    this.saveWritingStats(projectId, stats)
    return stats
  }

  // 计算本周字数
  calculateWeekWords(dailyWords) {
    const now = new Date()
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))
    let weekWords = 0
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + i)
      const dateString = date.toDateString()
      weekWords += dailyWords[dateString] || 0
    }
    
    return weekWords
  }

  // 获取应用设置
  getSettings() {
    try {
      const settings = localStorage.getItem(this.STORAGE_KEYS.SETTINGS)
      return settings ? JSON.parse(settings) : this.getDefaultSettings()
    } catch (error) {
      console.error('获取设置失败:', error)
      return this.getDefaultSettings()
    }
  }

  // 获取默认设置
  getDefaultSettings() {
    return {
      // 编辑器设置
      autoSave: true,
      autoSaveInterval: 30000, // 30秒
      fontSize: 16,
      lineHeight: 1.5,
      autoIndent: true,
      
      // 界面设置
      theme: 'light',
      sidebarCollapsed: true,
      windowSize: 'normal',
      
      // 应用设置
      openLastProject: true,
      minimizeToTray: false,
      checkUpdates: true
    }
  }

  // 保存应用设置
  saveSettings(settings) {
    try {
      localStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(settings))
      return true
    } catch (error) {
      console.error('保存设置失败:', error)
      return false
    }
  }

  // 清空所有数据
  clearAll() {
    try {
      Object.values(this.STORAGE_KEYS).forEach(key => {
        if (key.endsWith('_')) {
          // 处理带项目ID后缀的键
          const keys = Object.keys(localStorage).filter(k => k.startsWith(key))
          keys.forEach(k => localStorage.removeItem(k))
        } else {
          localStorage.removeItem(key)
        }
      })
      return true
    } catch (error) {
      console.error('清空数据失败:', error)
      return false
    }
  }

  // 导出数据
  exportData() {
    try {
      const data = {
        projects: this.getProjects(),
        currentProject: this.getCurrentProject(),
        settings: this.getSettings(),
        exportTime: new Date().toISOString()
      }
      
      // 添加所有项目的内容和统计
      data.projectContents = {}
      data.writingStats = {}
      
      data.projects.forEach(project => {
        data.projectContents[project.id] = this.getProjectContent(project.id)
        data.writingStats[project.id] = this.getWritingStats(project.id)
      })
      
      return JSON.stringify(data, null, 2)
    } catch (error) {
      console.error('导出数据失败:', error)
      return null
    }
  }

  // 导入数据
  importData(jsonData) {
    try {
      const data = JSON.parse(jsonData)
      
      // 验证数据格式
      if (!data.projects || !Array.isArray(data.projects)) {
        throw new Error('无效的数据格式')
      }
      
      // 导入项目
      this.saveProjects(data.projects)
      
      // 导入当前项目
      if (data.currentProject) {
        this.setCurrentProject(data.currentProject)
      }
      
      // 导入设置
      if (data.settings) {
        this.saveSettings(data.settings)
      }
      
      // 导入项目内容和统计
      if (data.projectContents) {
        Object.entries(data.projectContents).forEach(([projectId, content]) => {
          this.saveProjectContent(parseInt(projectId), content)
        })
      }
      
      if (data.writingStats) {
        Object.entries(data.writingStats).forEach(([projectId, stats]) => {
          this.saveWritingStats(parseInt(projectId), stats)
        })
      }
      
      return true
    } catch (error) {
      console.error('导入数据失败:', error)
      return false
    }
  }
}

// 创建单例实例
const storageManager = new StorageManager()

export default storageManager