// 设置功能测试脚本
import storageManager from './storage.js'

export function testSettingsFeatures() {
  console.log('开始测试设置功能...')
  
  // 测试默认设置
  const defaultSettings = storageManager.getDefaultSettings()
  console.log('默认设置:', defaultSettings)
  
  // 测试设置保存和读取
  const testSettings = {
    ...defaultSettings,
    fontSize: 18,
    theme: 'dark',
    autoSave: false
  }
  
  const saveResult = storageManager.saveSettings(testSettings)
  console.log('保存设置结果:', saveResult)
  
  const loadedSettings = storageManager.getSettings()
  console.log('加载的设置:', loadedSettings)
  
  // 验证设置是否正确保存
  const isCorrect = loadedSettings.fontSize === 18 && 
                   loadedSettings.theme === 'dark' && 
                   loadedSettings.autoSave === false
  
  console.log('设置保存/读取测试:', isCorrect ? '通过' : '失败')
  
  // 测试数据导出
  const exportData = storageManager.exportData()
  console.log('数据导出测试:', exportData ? '成功' : '失败')
  
  // 恢复默认设置
  storageManager.saveSettings(defaultSettings)
  console.log('已恢复默认设置')
  
  return {
    defaultSettings: !!defaultSettings,
    saveLoad: isCorrect,
    export: !!exportData
  }
}

// 在开发环境下自动运行测试
if (import.meta.env.DEV) {
  window.testSettings = testSettingsFeatures
  console.log('设置测试函数已添加到 window.testSettings，可在控制台调用')
}