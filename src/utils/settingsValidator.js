// 设置功能验证器
import storageManager from './storage.js'

export class SettingsValidator {
  constructor() {
    this.testResults = []
  }

  // 验证默认设置结构
  validateDefaultSettings() {
    const settings = storageManager.getDefaultSettings()
    const requiredKeys = [
      'autoSave', 'autoSaveInterval', 'fontSize', 'lineHeight', 'autoIndent',
      'theme', 'sidebarCollapsed', 'windowSize',
      'openLastProject', 'minimizeToTray', 'checkUpdates'
    ]
    
    const hasAllKeys = requiredKeys.every(key => settings.hasOwnProperty(key))
    this.testResults.push({
      test: '默认设置结构',
      passed: hasAllKeys,
      details: hasAllKeys ? '所有必需的设置项都存在' : '缺少必需的设置项'
    })
    
    return hasAllKeys
  }

  // 验证设置保存和读取
  validateSettingsPersistence() {
    const originalSettings = storageManager.getSettings()
    const testSettings = {
      ...originalSettings,
      fontSize: 20,
      theme: 'dark',
      autoSave: !originalSettings.autoSave
    }
    
    // 保存测试设置
    const saveSuccess = storageManager.saveSettings(testSettings)
    
    // 读取设置
    const loadedSettings = storageManager.getSettings()
    
    // 验证设置是否正确保存
    const isCorrect = loadedSettings.fontSize === 20 && 
                     loadedSettings.theme === 'dark' && 
                     loadedSettings.autoSave === testSettings.autoSave
    
    // 恢复原始设置
    storageManager.saveSettings(originalSettings)
    
    this.testResults.push({
      test: '设置持久化',
      passed: saveSuccess && isCorrect,
      details: saveSuccess && isCorrect ? '设置保存和读取正常' : '设置保存或读取失败'
    })
    
    return saveSuccess && isCorrect
  }

  // 验证数据导出功能
  validateDataExport() {
    const exportData = storageManager.exportData()
    let isValidJson = false
    let hasRequiredFields = false
    
    try {
      const data = JSON.parse(exportData)
      isValidJson = true
      hasRequiredFields = data.hasOwnProperty('projects') && 
                         data.hasOwnProperty('settings') && 
                         data.hasOwnProperty('exportTime')
    } catch (error) {
      isValidJson = false
    }
    
    const passed = exportData && isValidJson && hasRequiredFields
    this.testResults.push({
      test: '数据导出',
      passed: passed,
      details: passed ? '数据导出功能正常' : '数据导出失败或格式错误'
    })
    
    return passed
  }

  // 验证主题设置
  validateThemeSettings() {
    const validThemes = ['light', 'dark', 'auto']
    const currentSettings = storageManager.getSettings()
    const isValidTheme = validThemes.includes(currentSettings.theme)
    
    this.testResults.push({
      test: '主题设置',
      passed: isValidTheme,
      details: isValidTheme ? `当前主题 "${currentSettings.theme}" 有效` : '主题设置无效'
    })
    
    return isValidTheme
  }

  // 验证编辑器设置范围
  validateEditorSettings() {
    const settings = storageManager.getSettings()
    const fontSizeValid = settings.fontSize >= 12 && settings.fontSize <= 24
    const lineHeightValid = settings.lineHeight >= 1.2 && settings.lineHeight <= 2.0
    const intervalValid = [10000, 30000, 60000, 120000].includes(settings.autoSaveInterval)
    
    const passed = fontSizeValid && lineHeightValid && intervalValid
    this.testResults.push({
      test: '编辑器设置范围',
      passed: passed,
      details: passed ? '所有编辑器设置都在有效范围内' : '某些编辑器设置超出有效范围'
    })
    
    return passed
  }

  // 运行所有验证
  runAllValidations() {
    console.log('🔍 开始验证设置功能...')
    
    this.testResults = []
    
    const tests = [
      this.validateDefaultSettings(),
      this.validateSettingsPersistence(),
      this.validateDataExport(),
      this.validateThemeSettings(),
      this.validateEditorSettings()
    ]
    
    const passedTests = tests.filter(Boolean).length
    const totalTests = tests.length
    
    console.log(`\n📊 验证结果: ${passedTests}/${totalTests} 项测试通过\n`)
    
    this.testResults.forEach(result => {
      const icon = result.passed ? '✅' : '❌'
      console.log(`${icon} ${result.test}: ${result.details}`)
    })
    
    if (passedTests === totalTests) {
      console.log('\n🎉 所有设置功能验证通过！')
    } else {
      console.log('\n⚠️ 部分功能需要检查')
    }
    
    return {
      passed: passedTests,
      total: totalTests,
      success: passedTests === totalTests,
      results: this.testResults
    }
  }
}

// 创建全局验证器实例
const validator = new SettingsValidator()

// 在开发环境下添加到全局对象
if (import.meta.env.DEV) {
  window.validateSettings = () => validator.runAllValidations()
  console.log('💡 设置验证器已就绪，使用 window.validateSettings() 运行验证')
}

export default validator