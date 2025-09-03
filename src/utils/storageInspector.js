// 存储检查工具
class StorageInspector {
  // 获取所有故事引擎相关的存储数据
  getAllStoryEngineData() {
    const data = {}
    const keys = Object.keys(localStorage)
    
    // 筛选出故事引擎相关的键
    const storyEngineKeys = keys.filter(key => 
      key.startsWith('story_engine_') || 
      key.startsWith('project_characters_')
    )
    
    storyEngineKeys.forEach(key => {
      try {
        const value = localStorage.getItem(key)
        data[key] = {
          value: value,
          size: new Blob([value]).size, // 字节大小
          type: this.getDataType(key),
          lastModified: this.getLastModified(key, value)
        }
      } catch (error) {
        data[key] = { error: error.message }
      }
    })
    
    return data
  }
  
  // 获取数据类型
  getDataType(key) {
    if (key.includes('projects')) return '项目列表'
    if (key.includes('current_project')) return '当前项目'
    if (key.includes('project_content_')) return '项目内容'
    if (key.includes('writing_stats_')) return '写作统计'
    if (key.includes('characters_')) return '角色数据'
    if (key.includes('settings')) return '应用设置'
    return '未知类型'
  }
  
  // 获取最后修改时间
  getLastModified(key, value) {
    try {
      const parsed = JSON.parse(value)
      if (parsed.lastModified) return parsed.lastModified
      if (parsed.updatedAt) return parsed.updatedAt
      if (Array.isArray(parsed) && parsed[0]?.lastModified) {
        return parsed[0].lastModified
      }
    } catch (error) {
      // 不是JSON格式，可能是纯文本内容
    }
    return '未知'
  }
  
  // 计算总存储大小
  getTotalSize() {
    const data = this.getAllStoryEngineData()
    return Object.values(data).reduce((total, item) => {
      return total + (item.size || 0)
    }, 0)
  }
  
  // 格式化大小显示
  formatSize(bytes) {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
  
  // 显示存储信息
  displayStorageInfo() {
    const data = this.getAllStoryEngineData()
    const totalSize = this.getTotalSize()
    
    console.group('📁 故事引擎本地存储信息')
    console.log(`总存储大小: ${this.formatSize(totalSize)}`)
    console.log(`存储项目数: ${Object.keys(data).length}`)
    console.log('---')
    
    Object.entries(data).forEach(([key, info]) => {
      console.group(`🔑 ${key}`)
      console.log(`类型: ${info.type}`)
      console.log(`大小: ${this.formatSize(info.size || 0)}`)
      console.log(`最后修改: ${info.lastModified}`)
      if (info.value && info.value.length < 200) {
        console.log(`内容预览: ${info.value.substring(0, 100)}...`)
      }
      console.groupEnd()
    })
    
    console.groupEnd()
    
    return {
      totalSize: this.formatSize(totalSize),
      itemCount: Object.keys(data).length,
      data: data
    }
  }
  
  // 导出所有数据到文件
  exportToFile() {
    const data = this.getAllStoryEngineData()
    const exportData = {
      exportTime: new Date().toISOString(),
      totalSize: this.formatSize(this.getTotalSize()),
      data: data
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `story-engine-storage-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
  
  // 清空所有故事引擎数据
  clearAllData() {
    const keys = Object.keys(localStorage).filter(key => 
      key.startsWith('story_engine_') || 
      key.startsWith('project_characters_')
    )
    
    keys.forEach(key => localStorage.removeItem(key))
    console.log(`已清空 ${keys.length} 个存储项`)
    return keys.length
  }
}

// 创建全局实例
window.storageInspector = new StorageInspector()

// 在控制台中提供快捷命令
console.log('📁 存储检查工具已加载！')
console.log('使用方法：')
console.log('  storageInspector.displayStorageInfo() - 显示存储信息')
console.log('  storageInspector.exportToFile() - 导出数据到文件')
console.log('  storageInspector.clearAllData() - 清空所有数据（谨慎使用）')

export default StorageInspector