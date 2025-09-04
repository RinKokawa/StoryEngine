// 存储管理工具 - 现在使用文件系统存储
import storageAdapter from './storageAdapter.js'

class StorageManager {
  constructor() {
    this.adapter = storageAdapter
  }

  // 获取所有项目
  getProjects() {
    return this.adapter.getProjects()
  }

  // 保存项目列表
  saveProjects(projects) {
    return this.adapter.saveProjects(projects)
  }

  // 获取单个项目
  getProject(projectId) {
    return this.adapter.getProject(projectId)
  }

  // 保存单个项目
  saveProject(project) {
    return this.adapter.saveProject(project)
  }

  // 删除项目
  deleteProject(projectId) {
    return this.adapter.deleteProject(projectId)
  }

  // 获取当前项目
  getCurrentProject() {
    return this.adapter.getCurrentProject()
  }

  // 设置当前项目
  setCurrentProject(project) {
    return this.adapter.setCurrentProject(project)
  }

  // 获取项目内容
  getProjectContent(projectId) {
    return this.adapter.getProjectContent(projectId)
  }

  // 保存项目内容
  saveProjectContent(projectId, content) {
    return this.adapter.saveProjectContent(projectId, content)
  }

  // 删除项目内容
  deleteProjectContent(projectId) {
    return this.adapter.deleteProjectContent(projectId)
  }

  // 更新项目字数统计
  updateProjectWordCount(projectId, wordCount) {
    return this.adapter.updateProjectWordCount(projectId, wordCount)
  }

  // 获取写作统计
  getWritingStats(projectId) {
    // 暂时返回默认值，后续可以实现
    return {
      dailyWords: {},
      totalWords: 0,
      todayWords: 0,
      weekWords: 0,
      lastWriteDate: null
    }
  }

  // 保存写作统计
  saveWritingStats(projectId, stats) {
    // 暂时返回true，后续可以实现
    return true
  }

  // 删除写作统计
  deleteWritingStats(projectId) {
    return true
  }

  // ==================== 章节管理方法 ====================
  
  // 获取项目的所有章节
  getProjectChapters(projectId) {
    return this.adapter.getProjectChapters(projectId)
  }

  // 获取单个章节
  getChapter(projectId, chapterId) {
    return this.adapter.getChapter(projectId, chapterId)
  }

  // 创建新章节
  createChapter(projectId, chapterData) {
    return this.adapter.createChapter(projectId, chapterData)
  }

  // 更新章节
  updateChapter(projectId, chapterData) {
    return this.adapter.updateChapter(projectId, chapterData)
  }

  // 删除章节
  deleteChapter(projectId, chapterId) {
    return this.adapter.deleteChapter(projectId, chapterId)
  }

  // 获取章节内容
  getChapterContent(projectId, chapterId) {
    return this.adapter.getChapterContent(projectId, chapterId)
  }

  // 保存章节内容
  saveChapterContent(projectId, chapterId, content) {
    return this.adapter.saveChapterContent(projectId, chapterId, content)
  }

  // 重新排序章节
  reorderChapters(projectId, chapterIds) {
    return this.adapter.reorderChapters(projectId, chapterIds)
  }

  // 获取当前编辑的章节
  getCurrentChapter(projectId) {
    return this.adapter.getCurrentChapter(projectId)
  }

  // 设置当前编辑的章节
  setCurrentChapter(projectId, chapterId) {
    return this.adapter.setCurrentChapter(projectId, chapterId)
  }

  // 获取项目角色列表
  getProjectCharacters(projectId) {
    return this.adapter.getProjectCharacters(projectId)
  }

  // 创建角色
  createCharacter(projectId, characterData) {
    return this.adapter.createCharacter(projectId, characterData)
  }

  // 更新角色
  updateCharacter(projectId, characterData) {
    return this.adapter.updateCharacter(projectId, characterData)
  }

  // 删除角色
  deleteCharacter(projectId, characterId) {
    return this.adapter.deleteCharacter(projectId, characterId)
  }

  // 获取项目世界设定列表
  getProjectWorldItems(projectId) {
    return this.adapter.getProjectWorldItems(projectId)
  }

  // 创建世界设定
  createWorldItem(projectId, worldData) {
    return this.adapter.createWorldItem(projectId, worldData)
  }

  // 更新世界设定
  updateWorldItem(projectId, worldData) {
    return this.adapter.updateWorldItem(projectId, worldData)
  }

  // 删除世界设定
  deleteWorldItem(projectId, worldId) {
    return this.adapter.deleteWorldItem(projectId, worldId)
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
    return this.adapter.getSettings()
  }

  // 获取默认设置
  getDefaultSettings() {
    return this.adapter.getDefaultSettings()
  }

  // 保存应用设置
  saveSettings(settings) {
    return this.adapter.saveSettings(settings)
  }

  // 清空所有数据
  clearAll() {
    return this.adapter.clearAll()
  }

  // 导出数据
  exportData() {
    return this.adapter.exportData()
  }

  // 导入数据
  importData(jsonData) {
    return this.adapter.importData(jsonData)
  }
}

// 创建单例实例
const storageManager = new StorageManager()

export default storageManager