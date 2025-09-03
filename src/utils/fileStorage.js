// 基于文件系统的存储管理工具
class FileStorageManager {
  constructor() {
    this.FILE_NAMES = {
      PROJECTS: 'projects.json',
      CURRENT_PROJECT: 'current-project.json',
      SETTINGS: 'settings.json'
    }
    
    // 检查是否在Electron环境中
    this.isElectron = window.electronAPI && window.electronAPI.readFile
  }

  // 读取JSON文件
  async readJsonFile(fileName) {
    if (!this.isElectron) {
      // 在浏览器环境中回退到localStorage
      return this.readFromLocalStorage(fileName)
    }

    try {
      const result = await window.electronAPI.readFile(fileName)
      if (result.success && result.data) {
        return JSON.parse(result.data)
      }
      return null
    } catch (error) {
      console.error(`读取文件 ${fileName} 失败:`, error)
      return null
    }
  }

  // 写入JSON文件
  async writeJsonFile(fileName, data) {
    if (!this.isElectron) {
      // 在浏览器环境中回退到localStorage
      return this.writeToLocalStorage(fileName, data)
    }

    try {
      const jsonData = JSON.stringify(data, null, 2)
      const result = await window.electronAPI.writeFile(fileName, jsonData)
      return result.success
    } catch (error) {
      console.error(`写入文件 ${fileName} 失败:`, error)
      return false
    }
  }

  // 删除文件
  async deleteFile(fileName) {
    if (!this.isElectron) {
      return this.deleteFromLocalStorage(fileName)
    }

    try {
      const result = await window.electronAPI.deleteFile(fileName)
      return result.success
    } catch (error) {
      console.error(`删除文件 ${fileName} 失败:`, error)
      return false
    }
  }

  // localStorage回退方法
  readFromLocalStorage(fileName) {
    try {
      const key = `story_engine_${fileName.replace('.json', '')}`
      const data = localStorage.getItem(key)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('从localStorage读取失败:', error)
      return null
    }
  }

  writeToLocalStorage(fileName, data) {
    try {
      const key = `story_engine_${fileName.replace('.json', '')}`
      localStorage.setItem(key, JSON.stringify(data))
      return true
    } catch (error) {
      console.error('写入localStorage失败:', error)
      return false
    }
  }

  deleteFromLocalStorage(fileName) {
    try {
      const key = `story_engine_${fileName.replace('.json', '')}`
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error('从localStorage删除失败:', error)
      return false
    }
  }

  // 获取所有项目
  async getProjects() {
    try {
      const projects = await this.readJsonFile(this.FILE_NAMES.PROJECTS)
      return projects || []
    } catch (error) {
      console.error('获取项目列表失败:', error)
      return []
    }
  }

  // 保存项目列表
  async saveProjects(projects) {
    try {
      return await this.writeJsonFile(this.FILE_NAMES.PROJECTS, projects)
    } catch (error) {
      console.error('保存项目列表失败:', error)
      return false
    }
  }

  // 获取单个项目
  async getProject(projectId) {
    const projects = await this.getProjects()
    return projects.find(p => p.id === projectId) || null
  }

  // 保存单个项目
  async saveProject(project) {
    const projects = await this.getProjects()
    const index = projects.findIndex(p => p.id === project.id)
    
    if (index >= 0) {
      projects[index] = { ...projects[index], ...project, lastModified: new Date().toISOString() }
    } else {
      projects.push({ ...project, id: project.id || Date.now(), lastModified: new Date().toISOString() })
    }
    
    return await this.saveProjects(projects)
  }

  // 删除项目
  async deleteProject(projectId) {
    const projects = await this.getProjects()
    const filteredProjects = projects.filter(p => p.id !== projectId)
    
    // 同时删除项目相关的内容和统计数据
    await this.deleteProjectContent(projectId)
    await this.deleteWritingStats(projectId)
    await this.deleteProjectCharacters(projectId)
    await this.deleteProjectWorldItems(projectId)
    
    return await this.saveProjects(filteredProjects)
  }

  // 获取当前项目
  async getCurrentProject() {
    try {
      return await this.readJsonFile(this.FILE_NAMES.CURRENT_PROJECT)
    } catch (error) {
      console.error('获取当前项目失败:', error)
      return null
    }
  }

  // 设置当前项目
  async setCurrentProject(project) {
    try {
      return await this.writeJsonFile(this.FILE_NAMES.CURRENT_PROJECT, project)
    } catch (error) {
      console.error('设置当前项目失败:', error)
      return false
    }
  }

  // 获取项目内容
  async getProjectContent(projectId) {
    try {
      const fileName = `project-content-${projectId}.txt`
      if (!this.isElectron) {
        const key = `story_engine_project_content_${projectId}`
        return localStorage.getItem(key) || '　　'
      }

      const result = await window.electronAPI.readFile(fileName)
      if (result.success && result.data !== null) {
        return result.data
      }
      return '　　'
    } catch (error) {
      console.error('获取项目内容失败:', error)
      return '　　'
    }
  }

  // 保存项目内容
  async saveProjectContent(projectId, content) {
    try {
      const fileName = `project-content-${projectId}.txt`
      let success = false
      
      if (!this.isElectron) {
        const key = `story_engine_project_content_${projectId}`
        localStorage.setItem(key, content)
        success = true
      } else {
        const result = await window.electronAPI.writeFile(fileName, content)
        success = result.success
      }
      
      if (success) {
        // 更新项目的字数统计
        const wordCount = content.replace(/\s/g, '').length
        await this.updateProjectWordCount(projectId, wordCount)
      }
      
      return success
    } catch (error) {
      console.error('保存项目内容失败:', error)
      return false
    }
  }

  // 删除项目内容
  async deleteProjectContent(projectId) {
    try {
      const fileName = `project-content-${projectId}.txt`
      return await this.deleteFile(fileName)
    } catch (error) {
      console.error('删除项目内容失败:', error)
      return false
    }
  }

  // 更新项目字数统计
  async updateProjectWordCount(projectId, wordCount) {
    const project = await this.getProject(projectId)
    if (project) {
      project.wordCount = wordCount
      project.lastModified = new Date().toISOString()
      await this.saveProject(project)
    }
  }

  // 获取应用设置
  async getSettings() {
    try {
      const settings = await this.readJsonFile(this.FILE_NAMES.SETTINGS)
      return settings || this.getDefaultSettings()
    } catch (error) {
      console.error('获取设置失败:', error)
      return this.getDefaultSettings()
    }
  }

  // 获取默认设置
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

  // 获取项目角色
  async getProjectCharacters(projectId) {
    try {
      const fileName = `project-characters-${projectId}.json`
      const data = await this.readJsonFile(fileName)
      return data || []
    } catch (error) {
      console.error('获取项目角色失败:', error)
      return []
    }
  }

  // 保存项目角色
  async saveProjectCharacters(projectId, characters) {
    try {
      const fileName = `project-characters-${projectId}.json`
      return await this.writeJsonFile(fileName, characters)
    } catch (error) {
      console.error('保存项目角色失败:', error)
      return false
    }
  }

  // 删除项目角色
  async deleteProjectCharacters(projectId) {
    try {
      const fileName = `project-characters-${projectId}.json`
      return await this.deleteFile(fileName)
    } catch (error) {
      console.error('删除项目角色失败:', error)
      return false
    }
  }

  // 获取项目世界设定
  async getProjectWorldItems(projectId) {
    try {
      const fileName = `project-world-${projectId}.json`
      const data = await this.readJsonFile(fileName)
      return data || []
    } catch (error) {
      console.error('获取项目世界设定失败:', error)
      return []
    }
  }

  // 保存项目世界设定
  async saveProjectWorldItems(projectId, worldItems) {
    try {
      const fileName = `project-world-${projectId}.json`
      return await this.writeJsonFile(fileName, worldItems)
    } catch (error) {
      console.error('保存项目世界设定失败:', error)
      return false
    }
  }

  // 删除项目世界设定
  async deleteProjectWorldItems(projectId) {
    try {
      const fileName = `project-world-${projectId}.json`
      return await this.deleteFile(fileName)
    } catch (error) {
      console.error('删除项目世界设定失败:', error)
      return false
    }
  }

  // 保存应用设置
  async saveSettings(settings) {
    try {
      return await this.writeJsonFile(this.FILE_NAMES.SETTINGS, settings)
    } catch (error) {
      console.error('保存设置失败:', error)
      return false
    }
  }
}

// 创建单例实例
const fileStorageManager = new FileStorageManager()

export default fileStorageManager