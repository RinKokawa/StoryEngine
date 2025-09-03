/**
 * 存储系统迁移工具
 * 用于从旧的存储系统迁移到新的增强型存储系统
 */

import enhancedStorage from './enhancedStorage.js'
import storageManager from './storage.js'
import { DataConverter, DataFactory } from './dataModels.js'

/**
 * 存储迁移管理器
 */
class StorageMigrationManager {
  constructor() {
    this.migrationSteps = [
      { name: '检查旧数据', handler: this.checkLegacyData },
      { name: '备份旧数据', handler: this.backupLegacyData },
      { name: '迁移项目数据', handler: this.migrateProjects },
      { name: '迁移项目内容', handler: this.migrateProjectContents },
      { name: '迁移应用设置', handler: this.migrateSettings },
      { name: '验证迁移结果', handler: this.validateMigration },
      { name: '清理旧数据', handler: this.cleanupLegacyData }
    ]
    
    this.migrationLog = []
    this.migrationStats = {
      startTime: null,
      endTime: null,
      totalSteps: this.migrationSteps.length,
      completedSteps: 0,
      errors: [],
      warnings: []
    }
  }

  /**
   * 执行完整迁移
   */
  async performMigration(options = {}) {
    const {
      skipBackup = false,
      skipCleanup = false,
      dryRun = false
    } = options

    this.migrationStats.startTime = new Date().toISOString()
    this.log('开始存储系统迁移', 'info')

    try {
      for (const step of this.migrationSteps) {
        // 跳过某些步骤的逻辑
        if (skipBackup && step.name === '备份旧数据') {
          this.log(`跳过步骤: ${step.name}`, 'info')
          continue
        }
        
        if (skipCleanup && step.name === '清理旧数据') {
          this.log(`跳过步骤: ${step.name}`, 'info')
          continue
        }

        this.log(`执行步骤: ${step.name}`, 'info')
        
        try {
          const result = await step.handler.call(this, dryRun)
          
          if (result.success) {
            this.migrationStats.completedSteps++
            this.log(`步骤完成: ${step.name}`, 'success')
            
            if (result.warnings && result.warnings.length > 0) {
              this.migrationStats.warnings.push(...result.warnings)
            }
          } else {
            throw new Error(result.error || '步骤执行失败')
          }
        } catch (error) {
          this.migrationStats.errors.push({
            step: step.name,
            error: error.message,
            timestamp: new Date().toISOString()
          })
          
          this.log(`步骤失败: ${step.name} - ${error.message}`, 'error')
          
          // 某些步骤失败不应该中断整个迁移过程
          if (!this.isNonCriticalStep(step.name)) {
            throw error
          }
        }
      }

      this.migrationStats.endTime = new Date().toISOString()
      this.log('存储系统迁移完成', 'success')
      
      return {
        success: true,
        stats: this.migrationStats,
        log: this.migrationLog
      }

    } catch (error) {
      this.migrationStats.endTime = new Date().toISOString()
      this.log(`迁移失败: ${error.message}`, 'error')
      
      return {
        success: false,
        error: error.message,
        stats: this.migrationStats,
        log: this.migrationLog
      }
    }
  }

  /**
   * 检查是否为非关键步骤
   */
  isNonCriticalStep(stepName) {
    const nonCriticalSteps = ['备份旧数据', '清理旧数据']
    return nonCriticalSteps.includes(stepName)
  }

  /**
   * 记录迁移日志
   */
  log(message, level = 'info') {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message
    }
    
    this.migrationLog.push(logEntry)
    
    // 同时输出到控制台
    const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'
    console[consoleMethod](`[迁移] ${message}`)
  }

  /**
   * 步骤1: 检查旧数据
   */
  async checkLegacyData(dryRun = false) {
    try {
      const legacyProjects = storageManager.getProjects()
      const legacySettings = storageManager.getSettings()
      const legacyCurrentProject = storageManager.getCurrentProject()

      const stats = {
        projectCount: legacyProjects.length,
        hasSettings: !!legacySettings,
        hasCurrentProject: !!legacyCurrentProject,
        totalWordCount: legacyProjects.reduce((sum, p) => sum + (p.wordCount || 0), 0)
      }

      this.log(`发现 ${stats.projectCount} 个项目，总字数 ${stats.totalWordCount}`, 'info')

      return {
        success: true,
        data: stats
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 步骤2: 备份旧数据
   */
  async backupLegacyData(dryRun = false) {
    try {
      if (dryRun) {
        this.log('模拟备份旧数据', 'info')
        return { success: true }
      }

      // 导出旧数据
      const legacyData = {
        projects: storageManager.getProjects(),
        settings: storageManager.getSettings(),
        currentProject: storageManager.getCurrentProject(),
        exportDate: new Date().toISOString(),
        version: 'legacy'
      }

      // 保存备份
      const backupName = `legacy_backup_${new Date().toISOString().replace(/[:.]/g, '-')}`
      const backupResult = await enhancedStorage.createBackup(backupName)

      if (backupResult) {
        this.log(`旧数据备份完成: ${backupResult.fileName}`, 'success')
        return { success: true, backupFile: backupResult.fileName }
      } else {
        throw new Error('备份创建失败')
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 步骤3: 迁移项目数据
   */
  async migrateProjects(dryRun = false) {
    try {
      const legacyProjects = storageManager.getProjects()
      const migratedProjects = []
      const warnings = []

      for (const legacyProject of legacyProjects) {
        try {
          // 转换项目数据
          const convertedProject = DataConverter.convertLegacyProject(legacyProject)
          
          if (!dryRun) {
            // 创建新项目（不使用createProject以避免重复初始化）
            const newProjects = enhancedStorage.getProjects()
            newProjects.push(convertedProject)
            await enhancedStorage.saveProjects(newProjects)
          }
          
          migratedProjects.push(convertedProject)
          this.log(`项目迁移成功: ${convertedProject.name}`, 'info')
          
        } catch (error) {
          warnings.push(`项目 "${legacyProject.name}" 迁移失败: ${error.message}`)
          this.log(`项目迁移失败: ${legacyProject.name} - ${error.message}`, 'warn')
        }
      }

      this.log(`成功迁移 ${migratedProjects.length}/${legacyProjects.length} 个项目`, 'info')

      return {
        success: true,
        data: {
          migratedCount: migratedProjects.length,
          totalCount: legacyProjects.length,
          projects: migratedProjects
        },
        warnings
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 步骤4: 迁移项目内容
   */
  async migrateProjectContents(dryRun = false) {
    try {
      const projects = enhancedStorage.getProjects()
      let migratedCount = 0
      const warnings = []

      for (const project of projects) {
        try {
          // 获取旧的项目内容
          const legacyContent = await this.getLegacyProjectContent(project.id)
          
          if (legacyContent && legacyContent !== '　　') {
            if (!dryRun) {
              await enhancedStorage.saveProjectContent(project.id, legacyContent)
            }
            migratedCount++
            this.log(`项目内容迁移成功: ${project.name}`, 'info')
          }
          
        } catch (error) {
          warnings.push(`项目 "${project.name}" 内容迁移失败: ${error.message}`)
          this.log(`项目内容迁移失败: ${project.name} - ${error.message}`, 'warn')
        }
      }

      this.log(`成功迁移 ${migratedCount} 个项目的内容`, 'info')

      return {
        success: true,
        data: { migratedCount },
        warnings
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 获取旧的项目内容
   */
  async getLegacyProjectContent(projectId) {
    try {
      // 尝试从旧的存储适配器获取内容
      if (storageManager.getProjectContent) {
        return storageManager.getProjectContent(projectId)
      }
      
      // 直接从localStorage获取
      const key = `story_engine_project_content_${projectId}`
      return localStorage.getItem(key) || '　　'
      
    } catch (error) {
      this.log(`获取项目 ${projectId} 的旧内容失败: ${error.message}`, 'warn')
      return '　　'
    }
  }

  /**
   * 步骤5: 迁移应用设置
   */
  async migrateSettings(dryRun = false) {
    try {
      const legacySettings = storageManager.getSettings()
      
      if (!legacySettings) {
        this.log('未发现旧设置，使用默认设置', 'info')
        return { success: true }
      }

      // 转换设置数据
      const convertedSettings = DataConverter.convertLegacySettings(legacySettings)
      
      if (!dryRun) {
        await enhancedStorage.saveSettings(convertedSettings)
      }
      
      this.log('应用设置迁移成功', 'success')

      return {
        success: true,
        data: convertedSettings
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 步骤6: 验证迁移结果
   */
  async validateMigration(dryRun = false) {
    try {
      const validation = {
        projects: { valid: 0, invalid: 0, errors: [] },
        settings: { valid: false, errors: [] },
        content: { migrated: 0, missing: 0 }
      }

      // 验证项目数据
      const projects = enhancedStorage.getProjects()
      for (const project of projects) {
        try {
          const projectValidation = project.validate()
          if (projectValidation.isValid) {
            validation.projects.valid++
          } else {
            validation.projects.invalid++
            validation.projects.errors.push({
              project: project.name,
              errors: projectValidation.errors
            })
          }
        } catch (error) {
          validation.projects.invalid++
          validation.projects.errors.push({
            project: project.name || 'Unknown',
            errors: [error.message]
          })
        }
      }

      // 验证设置数据
      try {
        const settings = enhancedStorage.getSettings()
        validation.settings.valid = !!settings
      } catch (error) {
        validation.settings.errors.push(error.message)
      }

      // 验证内容迁移
      for (const project of projects) {
        try {
          const content = await enhancedStorage.getProjectContent(project.id)
          if (content && content !== '　　') {
            validation.content.migrated++
          } else {
            validation.content.missing++
          }
        } catch (error) {
          validation.content.missing++
        }
      }

      const isValid = validation.projects.invalid === 0 && 
                     validation.settings.valid && 
                     validation.settings.errors.length === 0

      this.log(`验证结果: ${validation.projects.valid} 个有效项目, ${validation.content.migrated} 个内容已迁移`, 'info')

      return {
        success: true,
        data: {
          isValid,
          validation
        },
        warnings: validation.projects.errors.length > 0 ? ['存在无效的项目数据'] : []
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 步骤7: 清理旧数据
   */
  async cleanupLegacyData(dryRun = false) {
    try {
      if (dryRun) {
        this.log('模拟清理旧数据', 'info')
        return { success: true }
      }

      const cleanupTasks = []

      // 清理localStorage中的旧数据
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('story_engine_')) {
          keysToRemove.push(key)
        }
      }

      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
        cleanupTasks.push(`删除localStorage键: ${key}`)
      })

      this.log(`清理完成，删除了 ${keysToRemove.length} 个旧数据项`, 'info')

      return {
        success: true,
        data: {
          cleanedItems: keysToRemove.length,
          tasks: cleanupTasks
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 检查是否需要迁移
   */
  async checkMigrationNeeded() {
    try {
      // 检查是否存在旧数据
      const legacyProjects = storageManager.getProjects()
      const hasLegacyData = legacyProjects && legacyProjects.length > 0

      // 检查是否已经有新数据
      const newProjects = enhancedStorage.getProjects()
      const hasNewData = newProjects && newProjects.length > 0

      return {
        needed: hasLegacyData && !hasNewData,
        hasLegacyData,
        hasNewData,
        legacyProjectCount: legacyProjects ? legacyProjects.length : 0,
        newProjectCount: newProjects ? newProjects.length : 0
      }
    } catch (error) {
      console.error('检查迁移需求失败:', error)
      return {
        needed: false,
        error: error.message
      }
    }
  }

  /**
   * 生成迁移报告
   */
  generateMigrationReport() {
    const duration = this.migrationStats.endTime && this.migrationStats.startTime
      ? new Date(this.migrationStats.endTime) - new Date(this.migrationStats.startTime)
      : 0

    return {
      summary: {
        success: this.migrationStats.errors.length === 0,
        duration: Math.round(duration / 1000), // 秒
        completedSteps: this.migrationStats.completedSteps,
        totalSteps: this.migrationStats.totalSteps,
        errorCount: this.migrationStats.errors.length,
        warningCount: this.migrationStats.warnings.length
      },
      details: {
        startTime: this.migrationStats.startTime,
        endTime: this.migrationStats.endTime,
        errors: this.migrationStats.errors,
        warnings: this.migrationStats.warnings
      },
      log: this.migrationLog
    }
  }
}

// 创建单例实例
const migrationManager = new StorageMigrationManager()

// 导出便捷方法
export const checkMigrationNeeded = () => migrationManager.checkMigrationNeeded()
export const performMigration = (options) => migrationManager.performMigration(options)
export const generateMigrationReport = () => migrationManager.generateMigrationReport()

export default migrationManager