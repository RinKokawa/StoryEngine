/**
 * 数据模型定义和验证工具
 * 为StoryEngine项目提供统一的数据结构定义、验证和转换功能
 */

// ==================== 基础数据类型定义 ====================

/**
 * 项目数据模型
 */
export class ProjectModel {
  constructor(data = {}) {
    this.id = data.id || this.generateId()
    this.name = data.name || ''
    this.genre = data.genre || ''
    this.description = data.description || ''
    this.targetWords = data.targetWords || 50000
    this.wordCount = data.wordCount || 0
    this.chapters = data.chapters || 0
    this.characters = data.characters || 0
    this.status = data.status || 'draft' // draft, active, completed, paused
    this.createdAt = data.createdAt || new Date().toISOString()
    this.lastModified = data.lastModified || new Date().toISOString()
    this.settings = new ProjectSettingsModel(data.settings)
    this.metadata = new ProjectMetadataModel(data.metadata)
  }

  generateId() {
    return `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // 更新项目统计信息
  updateStats(stats = {}) {
    if (stats.wordCount !== undefined) this.wordCount = stats.wordCount
    if (stats.chapters !== undefined) this.chapters = stats.chapters
    if (stats.characters !== undefined) this.characters = stats.characters
    this.lastModified = new Date().toISOString()
  }

  // 验证项目数据
  validate() {
    const errors = []
    if (!this.name || this.name.trim().length === 0) {
      errors.push('项目名称不能为空')
    }
    if (this.targetWords < 0) {
      errors.push('目标字数不能为负数')
    }
    if (this.wordCount < 0) {
      errors.push('当前字数不能为负数')
    }
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // 转换为存储格式
  toStorageFormat() {
    return {
      id: this.id,
      name: this.name,
      genre: this.genre,
      description: this.description,
      targetWords: this.targetWords,
      wordCount: this.wordCount,
      chapters: this.chapters,
      characters: this.characters,
      status: this.status,
      createdAt: this.createdAt,
      lastModified: this.lastModified,
      settings: this.settings.toStorageFormat(),
      metadata: this.metadata.toStorageFormat()
    }
  }

  // 从存储格式创建实例
  static fromStorageFormat(data) {
    return new ProjectModel(data)
  }
}

/**
 * 项目设置模型
 */
export class ProjectSettingsModel {
  constructor(data = {}) {
    this.autoSave = data.autoSave !== undefined ? data.autoSave : true
    this.autoSaveInterval = data.autoSaveInterval || 30000
    this.fontSize = data.fontSize || 16
    this.lineHeight = data.lineHeight || 1.5
    this.fontFamily = data.fontFamily || 'Microsoft YaHei'
    this.theme = data.theme || 'light' // light, dark, auto
    this.wordCountTarget = data.wordCountTarget || 500 // 每日目标字数
    this.enableBackup = data.enableBackup !== undefined ? data.enableBackup : true
    this.backupInterval = data.backupInterval || 3600000 // 1小时
  }

  toStorageFormat() {
    return {
      autoSave: this.autoSave,
      autoSaveInterval: this.autoSaveInterval,
      fontSize: this.fontSize,
      lineHeight: this.lineHeight,
      fontFamily: this.fontFamily,
      theme: this.theme,
      wordCountTarget: this.wordCountTarget,
      enableBackup: this.enableBackup,
      backupInterval: this.backupInterval
    }
  }
}

/**
 * 项目元数据模型
 */
export class ProjectMetadataModel {
  constructor(data = {}) {
    this.tags = data.tags || []
    this.language = data.language || 'zh-CN'
    this.version = data.version || '1.0.0'
    this.author = data.author || ''
    this.collaborators = data.collaborators || []
    this.exportFormats = data.exportFormats || ['txt', 'docx']
    this.customFields = data.customFields || {}
  }

  toStorageFormat() {
    return {
      tags: this.tags,
      language: this.language,
      version: this.version,
      author: this.author,
      collaborators: this.collaborators,
      exportFormats: this.exportFormats,
      customFields: this.customFields
    }
  }
}

/**
 * 章节数据模型
 */
export class ChapterModel {
  constructor(data = {}) {
    this.id = data.id || this.generateId()
    this.projectId = data.projectId || ''
    this.title = data.title || ''
    this.content = data.content || ''
    this.wordCount = data.wordCount || 0
    this.order = data.order || 0
    this.status = data.status || 'draft' // draft, writing, completed
    this.notes = data.notes || ''
    this.createdAt = data.createdAt || new Date().toISOString()
    this.lastModified = data.lastModified || new Date().toISOString()
    this.outline = new ChapterOutlineModel(data.outline)
  }

  generateId() {
    return `chapter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // 更新内容并重新计算字数
  updateContent(content) {
    this.content = content
    this.wordCount = this.calculateWordCount(content)
    this.lastModified = new Date().toISOString()
  }

  // 计算字数（去除空白字符）
  calculateWordCount(text) {
    return text.replace(/\s/g, '').length
  }

  validate() {
    const errors = []
    if (!this.title || this.title.trim().length === 0) {
      errors.push('章节标题不能为空')
    }
    if (!this.projectId) {
      errors.push('章节必须属于一个项目')
    }
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  toStorageFormat() {
    return {
      id: this.id,
      projectId: this.projectId,
      title: this.title,
      content: this.content,
      wordCount: this.wordCount,
      order: this.order,
      status: this.status,
      notes: this.notes,
      createdAt: this.createdAt,
      lastModified: this.lastModified,
      outline: this.outline.toStorageFormat()
    }
  }

  static fromStorageFormat(data) {
    return new ChapterModel(data)
  }
}

/**
 * 章节大纲模型
 */
export class ChapterOutlineModel {
  constructor(data = {}) {
    this.summary = data.summary || ''
    this.keyEvents = data.keyEvents || []
    this.characters = data.characters || []
    this.locations = data.locations || []
    this.timeline = data.timeline || ''
    this.conflicts = data.conflicts || []
    this.themes = data.themes || []
  }

  toStorageFormat() {
    return {
      summary: this.summary,
      keyEvents: this.keyEvents,
      characters: this.characters,
      locations: this.locations,
      timeline: this.timeline,
      conflicts: this.conflicts,
      themes: this.themes
    }
  }
}

/**
 * 角色数据模型
 */
export class CharacterModel {
  constructor(data = {}) {
    this.id = data.id || this.generateId()
    this.projectId = data.projectId || ''
    this.name = data.name || ''
    this.role = data.role || '' // 主角、配角、反派、路人
    this.age = data.age || null
    this.gender = data.gender || ''
    this.occupation = data.occupation || ''
    this.appearance = data.appearance || ''
    this.personality = data.personality || ''
    this.background = data.background || ''
    this.description = data.description || ''
    this.avatar = data.avatar || null
    this.relationships = data.relationships || []
    this.createdAt = data.createdAt || new Date().toISOString()
    this.lastModified = data.lastModified || new Date().toISOString()
    this.profile = new CharacterProfileModel(data.profile)
  }

  generateId() {
    return `character_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  validate() {
    const errors = []
    if (!this.name || this.name.trim().length === 0) {
      errors.push('角色姓名不能为空')
    }
    if (!this.projectId) {
      errors.push('角色必须属于一个项目')
    }
    if (this.age !== null && (this.age < 0 || this.age > 200)) {
      errors.push('年龄必须在0-200之间')
    }
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  toStorageFormat() {
    return {
      id: this.id,
      projectId: this.projectId,
      name: this.name,
      role: this.role,
      age: this.age,
      gender: this.gender,
      occupation: this.occupation,
      appearance: this.appearance,
      personality: this.personality,
      background: this.background,
      description: this.description,
      avatar: this.avatar,
      relationships: this.relationships,
      createdAt: this.createdAt,
      lastModified: this.lastModified,
      profile: this.profile.toStorageFormat()
    }
  }

  static fromStorageFormat(data) {
    return new CharacterModel(data)
  }
}

/**
 * 角色详细档案模型
 */
export class CharacterProfileModel {
  constructor(data = {}) {
    this.physicalTraits = data.physicalTraits || {}
    this.mentalTraits = data.mentalTraits || {}
    this.skills = data.skills || []
    this.goals = data.goals || []
    this.fears = data.fears || []
    this.secrets = data.secrets || []
    this.quirks = data.quirks || []
    this.backstory = data.backstory || ''
    this.motivations = data.motivations || []
    this.flaws = data.flaws || []
  }

  toStorageFormat() {
    return {
      physicalTraits: this.physicalTraits,
      mentalTraits: this.mentalTraits,
      skills: this.skills,
      goals: this.goals,
      fears: this.fears,
      secrets: this.secrets,
      quirks: this.quirks,
      backstory: this.backstory,
      motivations: this.motivations,
      flaws: this.flaws
    }
  }
}

/**
 * 写作统计模型
 */
export class WritingStatsModel {
  constructor(data = {}) {
    this.projectId = data.projectId || ''
    this.totalWords = data.totalWords || 0
    this.todayWords = data.todayWords || 0
    this.weekWords = data.weekWords || 0
    this.monthWords = data.monthWords || 0
    this.dailyWords = data.dailyWords || {} // { '2024-01-01': 1000 }
    this.writingSessions = data.writingSessions || []
    this.lastWriteDate = data.lastWriteDate || null
    this.streak = data.streak || 0 // 连续写作天数
    this.averageDaily = data.averageDaily || 0
    this.createdAt = data.createdAt || new Date().toISOString()
    this.lastUpdated = data.lastUpdated || new Date().toISOString()
  }

  // 添加写作记录
  addWritingSession(wordCount, duration = 0) {
    const today = new Date().toDateString()
    const session = {
      id: `session_${Date.now()}`,
      date: today,
      wordCount: wordCount,
      duration: duration, // 写作时长（分钟）
      timestamp: new Date().toISOString()
    }

    this.writingSessions.push(session)
    this.dailyWords[today] = (this.dailyWords[today] || 0) + wordCount
    this.updateStats()
  }

  // 更新统计数据
  updateStats() {
    const today = new Date().toDateString()
    
    // 更新今日字数
    this.todayWords = this.dailyWords[today] || 0
    
    // 更新总字数
    this.totalWords = Object.values(this.dailyWords).reduce((sum, count) => sum + count, 0)
    
    // 更新本周字数
    this.weekWords = this.calculateWeekWords()
    
    // 更新本月字数
    this.monthWords = this.calculateMonthWords()
    
    // 更新连续写作天数
    this.streak = this.calculateStreak()
    
    // 更新平均日字数
    this.averageDaily = this.calculateAverageDaily()
    
    this.lastWriteDate = today
    this.lastUpdated = new Date().toISOString()
  }

  // 计算本周字数
  calculateWeekWords() {
    const now = new Date()
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))
    let weekWords = 0
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + i)
      const dateString = date.toDateString()
      weekWords += this.dailyWords[dateString] || 0
    }
    
    return weekWords
  }

  // 计算本月字数
  calculateMonthWords() {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    let monthWords = 0
    
    for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
      const dateString = d.toDateString()
      monthWords += this.dailyWords[dateString] || 0
    }
    
    return monthWords
  }

  // 计算连续写作天数
  calculateStreak() {
    const dates = Object.keys(this.dailyWords)
      .filter(date => this.dailyWords[date] > 0)
      .sort((a, b) => new Date(b) - new Date(a))
    
    if (dates.length === 0) return 0
    
    let streak = 1
    const today = new Date()
    let currentDate = new Date(dates[0])
    
    // 检查是否包含今天或昨天
    const daysDiff = Math.floor((today - currentDate) / (1000 * 60 * 60 * 24))
    if (daysDiff > 1) return 0
    
    for (let i = 1; i < dates.length; i++) {
      const prevDate = new Date(dates[i])
      const diff = Math.floor((currentDate - prevDate) / (1000 * 60 * 60 * 24))
      
      if (diff === 1) {
        streak++
        currentDate = prevDate
      } else {
        break
      }
    }
    
    return streak
  }

  // 计算平均日字数
  calculateAverageDaily() {
    const writingDays = Object.keys(this.dailyWords).filter(date => this.dailyWords[date] > 0)
    if (writingDays.length === 0) return 0
    return Math.round(this.totalWords / writingDays.length)
  }

  toStorageFormat() {
    return {
      projectId: this.projectId,
      totalWords: this.totalWords,
      todayWords: this.todayWords,
      weekWords: this.weekWords,
      monthWords: this.monthWords,
      dailyWords: this.dailyWords,
      writingSessions: this.writingSessions,
      lastWriteDate: this.lastWriteDate,
      streak: this.streak,
      averageDaily: this.averageDaily,
      createdAt: this.createdAt,
      lastUpdated: this.lastUpdated
    }
  }

  static fromStorageFormat(data) {
    return new WritingStatsModel(data)
  }
}

/**
 * 应用设置模型
 */
export class AppSettingsModel {
  constructor(data = {}) {
    this.general = new GeneralSettingsModel(data.general)
    this.editor = new EditorSettingsModel(data.editor)
    this.appearance = new AppearanceSettingsModel(data.appearance)
    this.backup = new BackupSettingsModel(data.backup)
    this.export = new ExportSettingsModel(data.export)
    this.advanced = new AdvancedSettingsModel(data.advanced)
  }

  toStorageFormat() {
    return {
      general: this.general.toStorageFormat(),
      editor: this.editor.toStorageFormat(),
      appearance: this.appearance.toStorageFormat(),
      backup: this.backup.toStorageFormat(),
      export: this.export.toStorageFormat(),
      advanced: this.advanced.toStorageFormat()
    }
  }

  static fromStorageFormat(data) {
    return new AppSettingsModel(data)
  }

  // 获取扁平化的设置对象（兼容旧版本）
  getFlatSettings() {
    return {
      // 通用设置
      autoSave: this.general.autoSave,
      autoSaveInterval: this.general.autoSaveInterval,
      openLastProject: this.general.openLastProject,
      checkUpdates: this.general.checkUpdates,
      
      // 编辑器设置
      fontSize: this.editor.fontSize,
      lineHeight: this.editor.lineHeight,
      fontFamily: this.editor.fontFamily,
      autoIndent: this.editor.autoIndent,
      
      // 外观设置
      theme: this.appearance.theme,
      sidebarCollapsed: this.appearance.sidebarCollapsed,
      windowSize: this.appearance.windowSize,
      minimizeToTray: this.appearance.minimizeToTray
    }
  }
}

/**
 * 通用设置模型
 */
export class GeneralSettingsModel {
  constructor(data = {}) {
    this.autoSave = data.autoSave !== undefined ? data.autoSave : true
    this.autoSaveInterval = data.autoSaveInterval || 30000
    this.openLastProject = data.openLastProject !== undefined ? data.openLastProject : true
    this.checkUpdates = data.checkUpdates !== undefined ? data.checkUpdates : true
    this.language = data.language || 'zh-CN'
    this.dataPath = data.dataPath || ''
  }

  toStorageFormat() {
    return {
      autoSave: this.autoSave,
      autoSaveInterval: this.autoSaveInterval,
      openLastProject: this.openLastProject,
      checkUpdates: this.checkUpdates,
      language: this.language,
      dataPath: this.dataPath
    }
  }
}

/**
 * 编辑器设置模型
 */
export class EditorSettingsModel {
  constructor(data = {}) {
    this.fontSize = data.fontSize || 16
    this.lineHeight = data.lineHeight || 1.5
    this.fontFamily = data.fontFamily || 'Microsoft YaHei'
    this.autoIndent = data.autoIndent !== undefined ? data.autoIndent : true
    this.wordWrap = data.wordWrap !== undefined ? data.wordWrap : true
    this.showLineNumbers = data.showLineNumbers !== undefined ? data.showLineNumbers : false
    this.highlightCurrentLine = data.highlightCurrentLine !== undefined ? data.highlightCurrentLine : true
    this.tabSize = data.tabSize || 4
    this.insertSpaces = data.insertSpaces !== undefined ? data.insertSpaces : true
  }

  toStorageFormat() {
    return {
      fontSize: this.fontSize,
      lineHeight: this.lineHeight,
      fontFamily: this.fontFamily,
      autoIndent: this.autoIndent,
      wordWrap: this.wordWrap,
      showLineNumbers: this.showLineNumbers,
      highlightCurrentLine: this.highlightCurrentLine,
      tabSize: this.tabSize,
      insertSpaces: this.insertSpaces
    }
  }
}

/**
 * 外观设置模型
 */
export class AppearanceSettingsModel {
  constructor(data = {}) {
    this.theme = data.theme || 'light' // light, dark, auto
    this.sidebarCollapsed = data.sidebarCollapsed !== undefined ? data.sidebarCollapsed : true
    this.windowSize = data.windowSize || 'normal' // normal, maximized, fullscreen
    this.minimizeToTray = data.minimizeToTray !== undefined ? data.minimizeToTray : false
    this.showStatusBar = data.showStatusBar !== undefined ? data.showStatusBar : true
    this.showToolbar = data.showToolbar !== undefined ? data.showToolbar : true
  }

  toStorageFormat() {
    return {
      theme: this.theme,
      sidebarCollapsed: this.sidebarCollapsed,
      windowSize: this.windowSize,
      minimizeToTray: this.minimizeToTray,
      showStatusBar: this.showStatusBar,
      showToolbar: this.showToolbar
    }
  }
}

/**
 * 备份设置模型
 */
export class BackupSettingsModel {
  constructor(data = {}) {
    this.enableAutoBackup = data.enableAutoBackup !== undefined ? data.enableAutoBackup : true
    this.backupInterval = data.backupInterval || 3600000 // 1小时
    this.maxBackupFiles = data.maxBackupFiles || 10
    this.backupPath = data.backupPath || ''
    this.backupOnClose = data.backupOnClose !== undefined ? data.backupOnClose : true
    this.compressBackups = data.compressBackups !== undefined ? data.compressBackups : true
  }

  toStorageFormat() {
    return {
      enableAutoBackup: this.enableAutoBackup,
      backupInterval: this.backupInterval,
      maxBackupFiles: this.maxBackupFiles,
      backupPath: this.backupPath,
      backupOnClose: this.backupOnClose,
      compressBackups: this.compressBackups
    }
  }
}

/**
 * 导出设置模型
 */
export class ExportSettingsModel {
  constructor(data = {}) {
    this.defaultFormat = data.defaultFormat || 'txt'
    this.includeMetadata = data.includeMetadata !== undefined ? data.includeMetadata : true
    this.chapterSeparator = data.chapterSeparator || '\n\n---\n\n'
    this.exportPath = data.exportPath || ''
    this.customTemplates = data.customTemplates || {}
  }

  toStorageFormat() {
    return {
      defaultFormat: this.defaultFormat,
      includeMetadata: this.includeMetadata,
      chapterSeparator: this.chapterSeparator,
      exportPath: this.exportPath,
      customTemplates: this.customTemplates
    }
  }
}

/**
 * 高级设置模型
 */
export class AdvancedSettingsModel {
  constructor(data = {}) {
    this.enableDebugMode = data.enableDebugMode !== undefined ? data.enableDebugMode : false
    this.logLevel = data.logLevel || 'info' // debug, info, warn, error
    this.maxLogFiles = data.maxLogFiles || 5
    this.enableTelemetry = data.enableTelemetry !== undefined ? data.enableTelemetry : false
    this.customCss = data.customCss || ''
    this.plugins = data.plugins || []
  }

  toStorageFormat() {
    return {
      enableDebugMode: this.enableDebugMode,
      logLevel: this.logLevel,
      maxLogFiles: this.maxLogFiles,
      enableTelemetry: this.enableTelemetry,
      customCss: this.customCss,
      plugins: this.plugins
    }
  }
}

// ==================== 数据验证工具 ====================

/**
 * 数据验证器
 */
export class DataValidator {
  static validateProject(data) {
    const project = new ProjectModel(data)
    return project.validate()
  }

  static validateChapter(data) {
    const chapter = new ChapterModel(data)
    return chapter.validate()
  }

  static validateCharacter(data) {
    const character = new CharacterModel(data)
    return character.validate()
  }

  static validateSettings(data) {
    // 基本的设置验证
    const errors = []
    
    if (data.general?.autoSaveInterval && data.general.autoSaveInterval < 1000) {
      errors.push('自动保存间隔不能少于1秒')
    }
    
    if (data.editor?.fontSize && (data.editor.fontSize < 8 || data.editor.fontSize > 72)) {
      errors.push('字体大小必须在8-72之间')
    }
    
    if (data.editor?.lineHeight && (data.editor.lineHeight < 0.5 || data.editor.lineHeight > 3)) {
      errors.push('行高必须在0.5-3之间')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

// ==================== 数据转换工具 ====================

/**
 * 数据转换器
 */
export class DataConverter {
  // 将旧版本的项目数据转换为新格式
  static convertLegacyProject(legacyData) {
    return new ProjectModel({
      id: legacyData.id,
      name: legacyData.name,
      genre: legacyData.genre,
      description: legacyData.description,
      targetWords: legacyData.targetWords,
      wordCount: legacyData.wordCount,
      chapters: legacyData.chapters,
      characters: legacyData.characters,
      status: legacyData.status,
      createdAt: legacyData.createdAt,
      lastModified: legacyData.lastModified
    })
  }

  // 将旧版本的设置数据转换为新格式
  static convertLegacySettings(legacyData) {
    return new AppSettingsModel({
      general: {
        autoSave: legacyData.autoSave,
        autoSaveInterval: legacyData.autoSaveInterval,
        openLastProject: legacyData.openLastProject,
        checkUpdates: legacyData.checkUpdates
      },
      editor: {
        fontSize: legacyData.fontSize,
        lineHeight: legacyData.lineHeight,
        autoIndent: legacyData.autoIndent
      },
      appearance: {
        theme: legacyData.theme,
        sidebarCollapsed: legacyData.sidebarCollapsed,
        windowSize: legacyData.windowSize,
        minimizeToTray: legacyData.minimizeToTray
      }
    })
  }

  // 导出数据为JSON格式
  static exportToJson(data) {
    return JSON.stringify(data, null, 2)
  }

  // 从JSON格式导入数据
  static importFromJson(jsonString) {
    try {
      return JSON.parse(jsonString)
    } catch (error) {
      throw new Error('无效的JSON格式')
    }
  }
}

// ==================== 默认数据工厂 ====================

/**
 * 默认数据工厂
 */
export class DataFactory {
  static createDefaultProject(name = '新项目') {
    return new ProjectModel({
      name,
      genre: '小说',
      targetWords: 50000,
      status: 'draft'
    })
  }

  static createDefaultChapter(projectId, title = '新章节') {
    return new ChapterModel({
      projectId,
      title,
      content: '　　',
      order: 1
    })
  }

  static createDefaultCharacter(projectId, name = '新角色') {
    return new CharacterModel({
      projectId,
      name,
      role: '配角'
    })
  }

  static createDefaultSettings() {
    return new AppSettingsModel()
  }

  static createDefaultWritingStats(projectId) {
    return new WritingStatsModel({ projectId })
  }
}

// ==================== 导出所有模型 ====================

export default {
  // 数据模型
  ProjectModel,
  ProjectSettingsModel,
  ProjectMetadataModel,
  ChapterModel,
  ChapterOutlineModel,
  CharacterModel,
  CharacterProfileModel,
  WritingStatsModel,
  AppSettingsModel,
  GeneralSettingsModel,
  EditorSettingsModel,
  AppearanceSettingsModel,
  BackupSettingsModel,
  ExportSettingsModel,
  AdvancedSettingsModel,
  
  // 工具类
  DataValidator,
  DataConverter,
  DataFactory
}