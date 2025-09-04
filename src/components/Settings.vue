<template>
  <div class="settings-container">
    <div class="settings-header">
      <h2>应用设置</h2>
      <p>自定义您的写作环境和应用行为</p>
    </div>
    
    <div class="settings-content">
      <!-- 设置分类导航 -->
      <div class="settings-nav">
        <div class="nav-item" 
             :class="{ active: activeTab === 'editor' }" 
             @click="activeTab = 'editor'">
          <i class="icon">📝</i>
          <span>编辑器设置</span>
        </div>
        <div class="nav-item" 
             :class="{ active: activeTab === 'interface' }" 
             @click="activeTab = 'interface'">
          <i class="icon">🎨</i>
          <span>界面设置</span>
        </div>
        <div class="nav-item" 
             :class="{ active: activeTab === 'data' }" 
             @click="activeTab = 'data'">
          <i class="icon">💾</i>
          <span>数据管理</span>
        </div>
        <div class="nav-item" 
             :class="{ active: activeTab === 'api' }" 
             @click="activeTab = 'api'">
          <i class="icon">🔑</i>
          <span>API 配置</span>
        </div>
        <div class="nav-item" 
             :class="{ active: activeTab === 'app' }" 
             @click="activeTab = 'app'">
          <i class="icon">⚙️</i>
          <span>应用设置</span>
        </div>
      </div>

      <!-- 设置内容区域 -->
      <div class="settings-panel">
        <!-- 编辑器设置 -->
        <div v-if="activeTab === 'editor'" class="settings-section">
          <h3>编辑器设置</h3>
          
          <div class="setting-item">
            <label>字体大小</label>
            <div class="setting-control">
              <input type="range" 
                     v-model="settings.fontSize" 
                     min="12" 
                     max="24" 
                     step="1"
                     @input="onSettingChange">
              <span class="value">{{ settings.fontSize }}px</span>
            </div>
          </div>

          <div class="setting-item">
            <label>行高</label>
            <div class="setting-control">
              <input type="range" 
                     v-model="settings.lineHeight" 
                     min="1.2" 
                     max="2.0" 
                     step="0.1"
                     @input="onSettingChange">
              <span class="value">{{ settings.lineHeight }}</span>
            </div>
          </div>

          <div class="setting-item">
            <label>自动保存</label>
            <div class="setting-control">
              <ToggleSwitch 
                v-model="settings.autoSave"
                @update:modelValue="onSettingChange"
              />
            </div>
          </div>

          <div class="setting-item" v-if="settings.autoSave">
            <label>自动保存间隔</label>
            <div class="setting-control">
              <select v-model="settings.autoSaveInterval" @change="onSettingChange">
                <option :value="10000">10秒</option>
                <option :value="30000">30秒</option>
                <option :value="60000">1分钟</option>
                <option :value="120000">2分钟</option>
              </select>
            </div>
          </div>

          <div class="setting-item">
            <label>自动缩进</label>
            <div class="setting-control">
              <ToggleSwitch 
                v-model="settings.autoIndent"
                @update:modelValue="onSettingChange"
              />
            </div>
            <p class="setting-description">回车时自动添加段首空格</p>
          </div>
        </div>

        <!-- 界面设置 -->
        <div v-if="activeTab === 'interface'" class="settings-section">
          <h3>界面设置</h3>
          
          <div class="setting-item">
            <label>主题</label>
            <div class="setting-control">
              <select v-model="settings.theme" @change="onSettingChange">
                <option value="light">浅色主题</option>
                <option value="dark">深色主题</option>
                <option value="auto">跟随系统</option>
              </select>
            </div>
          </div>

          <div class="setting-item">
            <label>侧边栏默认状态</label>
            <div class="setting-control">
              <select v-model="settings.sidebarCollapsed" @change="onSettingChange">
                <option :value="false">展开</option>
                <option :value="true">收起</option>
              </select>
            </div>
          </div>

          <div class="setting-item">
            <label>窗口启动大小</label>
            <div class="setting-control">
              <select v-model="settings.windowSize" @change="onSettingChange">
                <option value="small">小窗口 (800x600)</option>
                <option value="normal">标准窗口 (1200x800)</option>
                <option value="large">大窗口 (1600x1000)</option>
                <option value="maximized">最大化</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 数据管理 -->
        <div v-if="activeTab === 'data'" class="settings-section">
          <h3>数据管理</h3>
          
          <div class="setting-item">
            <label>数据存储位置</label>
            <div class="setting-control">
              <span class="storage-info">浏览器本地存储 (localStorage)</span>
            </div>
            <p class="setting-description">数据保存在本地，清理浏览器数据可能导致丢失</p>
          </div>

          <div class="setting-item">
            <label>导出数据</label>
            <div class="setting-control">
              <button class="btn btn-primary" @click="exportData">
                <i class="icon">📤</i>
                导出所有数据
              </button>
            </div>
            <p class="setting-description">将所有项目和设置导出为JSON文件</p>
          </div>

          <div class="setting-item">
            <label>导入数据</label>
            <div class="setting-control">
              <input type="file" 
                     ref="importFile" 
                     accept=".json"
                     @change="importData"
                     style="display: none">
              <button class="btn btn-secondary" @click="$refs.importFile.click()">
                <i class="icon">📥</i>
                选择文件导入
              </button>
            </div>
            <p class="setting-description">从JSON文件恢复数据，将覆盖现有数据</p>
          </div>

          <div class="setting-item">
            <label>打开存储位置</label>
            <div class="setting-control">
              <button class="btn btn-secondary" @click="openStorageLocation">
                <i class="icon">📁</i>
                打开文件夹
              </button>
            </div>
            <p class="setting-description">在文件管理器中打开应用数据存储位置</p>
          </div>

          <div class="setting-item danger-zone">
            <label>危险操作</label>
            <div class="setting-control">
              <button class="btn btn-danger" @click="confirmClearData">
                <i class="icon">🗑️</i>
                清空所有数据
              </button>
            </div>
            <p class="setting-description">永久删除所有项目、内容和设置，此操作不可恢复</p>
          </div>
        </div>

        <!-- API 配置 -->
        <div v-if="activeTab === 'api'" class="settings-section">
          <h3>API 配置</h3>
          
          <div class="setting-item">
            <label>Qwen API Key</label>
            <div class="setting-control">
              <input 
                type="password" 
                v-model="settings.qwenApiKey" 
                placeholder="请输入您的 Qwen API Key"
                class="api-key-input"
                @input="onSettingChange"
              >
              <button 
                type="button" 
                class="btn btn-secondary show-password-btn"
                @click="togglePasswordVisibility"
              >
                {{ showApiKey ? '隐藏' : '显示' }}
              </button>
            </div>
            <p class="setting-description">
              用于调用通义千问 API 服务。您可以在 
              <a href="https://dashscope.aliyun.com/" target="_blank" rel="noopener noreferrer">
                阿里云百炼平台
              </a> 
              获取 API Key。
            </p>
          </div>

          <div class="setting-item">
            <label>API 基础地址</label>
            <div class="setting-control">
              <input 
                type="text" 
                v-model="settings.qwenApiBase" 
                placeholder="https://dashscope.aliyuncs.com/compatible-mode/v1"
                class="api-base-input"
                @input="onSettingChange"
              >
            </div>
            <p class="setting-description">
              Qwen API 的基础地址，通常使用默认值即可。
            </p>
          </div>

          <div class="setting-item">
            <label>默认模型</label>
            <div class="setting-control">
              <select v-model="settings.qwenModel" @change="onSettingChange" class="model-select">
                <option value="qwen-turbo">Qwen-Turbo (快速)</option>
                <option value="qwen-plus">Qwen-Plus (平衡)</option>
                <option value="qwen-max">Qwen-Max (高质量)</option>
                <option value="qwen-max-longcontext">Qwen-Max-LongContext (长文本)</option>
              </select>
            </div>
            <p class="setting-description">
              选择默认使用的 Qwen 模型。不同模型在速度、质量和成本上有所差异。
            </p>
          </div>

          <div class="setting-item">
            <label>最大 Token 数</label>
            <div class="setting-control">
              <input 
                type="number" 
                v-model.number="settings.qwenMaxTokens" 
                min="100" 
                max="8000" 
                step="100"
                @input="onSettingChange"
                class="token-input"
              >
              <span class="value">{{ settings.qwenMaxTokens }} tokens</span>
            </div>
            <p class="setting-description">
              单次请求的最大 token 数量，影响生成内容的长度和 API 费用。
            </p>
          </div>

          <div class="setting-item">
            <label>温度参数</label>
            <div class="setting-control">
              <input 
                type="range" 
                v-model.number="settings.qwenTemperature" 
                min="0" 
                max="2" 
                step="0.1"
                @input="onSettingChange"
                class="temperature-slider"
              >
              <span class="value">{{ settings.qwenTemperature }}</span>
            </div>
            <p class="setting-description">
              控制生成内容的随机性。较低值(0.1-0.5)更保守，较高值(0.8-1.5)更有创意。
            </p>
          </div>

          <div class="setting-item">
            <label>启用 AI 辅助功能</label>
            <div class="setting-control">
              <ToggleSwitch 
                v-model="settings.enableAiAssistant"
                @update:modelValue="onSettingChange"
              />
            </div>
            <p class="setting-description">
              开启后可在编辑器中使用 AI 辅助写作、续写、润色等功能。
            </p>
          </div>

          <div class="setting-item" v-if="settings.qwenApiKey">
            <label>连接测试</label>
            <div class="setting-control">
              <button 
                class="btn btn-primary" 
                @click="testApiConnection"
                :disabled="testingConnection"
              >
                <i class="icon">{{ testingConnection ? '⏳' : '🔗' }}</i>
                {{ testingConnection ? '测试中...' : '测试连接' }}
              </button>
              <span v-if="connectionStatus" :class="connectionStatusClass">
                {{ connectionStatusText }}
              </span>
            </div>
            <div v-if="connectionMessage" class="connection-message" :class="connectionStatusClass">
              {{ connectionMessage }}
            </div>
            <p class="setting-description">
              测试 API Key 是否有效以及网络连接是否正常。
            </p>
          </div>

          <div class="api-usage-info" v-if="settings.qwenApiKey">
            <h4>使用说明</h4>
            <ul>
              <li>配置完成后，您可以在故事编辑器中使用 AI 辅助功能</li>
              <li>支持智能续写、内容润色、角色对话生成等功能</li>
              <li>API 调用会产生费用，请合理使用</li>
              <li>建议定期检查 API 使用量和余额</li>
            </ul>
          </div>
        </div>

        <!-- 应用设置 -->
        <div v-if="activeTab === 'app'" class="settings-section">
          <h3>应用设置</h3>
          
          <div class="setting-item">
            <label>启动时打开上次项目</label>
            <div class="setting-control">
              <ToggleSwitch 
                v-model="settings.openLastProject"
                @update:modelValue="onSettingChange"
              />
            </div>
          </div>

          <div class="setting-item">
            <label>最小化到系统托盘</label>
            <div class="setting-control">
              <ToggleSwitch 
                v-model="settings.minimizeToTray"
                @update:modelValue="onSettingChange"
              />
            </div>
            <p class="setting-description">关闭窗口时最小化到系统托盘而不是退出</p>
          </div>

          <div class="setting-item">
            <label>自动检查更新</label>
            <div class="setting-control">
              <ToggleSwitch 
                v-model="settings.checkUpdates"
                @update:modelValue="onSettingChange"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div class="settings-footer">
      <button class="btn btn-secondary" @click="resetSettings">重置为默认</button>
      <div class="footer-right">
        <span class="save-status" :class="{ saved: saveStatus === 'saved' }">
          {{ saveStatusText }}
        </span>
        <button class="btn btn-primary" @click="saveSettings">保存设置</button>
      </div>
    </div>

    <!-- 确认对话框 -->
    <div v-if="showConfirmDialog" class="modal-overlay" @click="showConfirmDialog = false">
      <div class="modal-dialog" @click.stop>
        <h3>{{ confirmDialog.title }}</h3>
        <p>{{ confirmDialog.message }}</p>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showConfirmDialog = false">取消</button>
          <button class="btn btn-danger" @click="confirmDialog.action">确认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import storageManager from '../utils/storage.js'
import ToggleSwitch from './ToggleSwitch.vue'

export default {
  name: 'Settings',
  components: {
    ToggleSwitch
  },
  data() {
    return {
      activeTab: 'editor',
      settings: {},
      originalSettings: {},
      saveStatus: 'idle', // idle, saving, saved
      showConfirmDialog: false,
      confirmDialog: {
        title: '',
        message: '',
        action: null
      },
      showApiKey: false,
      testingConnection: false,
      connectionStatus: null, // 'success', 'error', null
      connectionMessage: '' // 详细的连接测试消息
    }
  },
  computed: {
    saveStatusText() {
      switch (this.saveStatus) {
        case 'saving': return '保存中...'
        case 'saved': return '已保存'
        default: return ''
      }
    },
    connectionStatusClass() {
      return {
        'connection-success': this.connectionStatus === 'success',
        'connection-error': this.connectionStatus === 'error'
      }
    },
    connectionStatusText() {
      switch (this.connectionStatus) {
        case 'success': return '✅ 连接成功'
        case 'error': return '❌ 连接失败'
        default: return ''
      }
    }
  },
  mounted() {
    this.loadSettings()
  },
  methods: {
    loadSettings() {
      this.settings = { ...storageManager.getSettings() }
      this.originalSettings = { ...this.settings }
    },
    
    onSettingChange() {
      this.saveStatus = 'idle'
      // 实时应用某些设置
      this.applySettings()
    },
    
    applySettings() {
      // 应用主题
      if (this.settings.theme === 'dark') {
        document.body.classList.add('dark-theme')
      } else {
        document.body.classList.remove('dark-theme')
      }
      
      // 应用字体设置到编辑器
      this.$emit('settings-changed', this.settings)
    },
    
    saveSettings() {
      this.saveStatus = 'saving'
      
      setTimeout(() => {
        const success = storageManager.saveSettings(this.settings)
        if (success) {
          this.saveStatus = 'saved'
          this.originalSettings = { ...this.settings }
          this.applySettings()
          
          setTimeout(() => {
            this.saveStatus = 'idle'
          }, 2000)
        } else {
          this.saveStatus = 'idle'
          alert('保存设置失败，请重试')
        }
      }, 500)
    },
    
    resetSettings() {
      this.showConfirmDialog = true
      this.confirmDialog = {
        title: '重置设置',
        message: '确定要将所有设置重置为默认值吗？',
        action: () => {
          this.settings = {
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
            checkUpdates: true,
            // API 配置默认值
            qwenApiKey: '',
            qwenApiBase: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
            qwenModel: 'qwen-plus',
            qwenMaxTokens: 2000,
            qwenTemperature: 0.7,
            enableAiAssistant: false
          }
          this.showConfirmDialog = false
          this.saveSettings()
        }
      }
    },

    togglePasswordVisibility() {
      this.showApiKey = !this.showApiKey
      const input = document.querySelector('.api-key-input')
      if (input) {
        input.type = this.showApiKey ? 'text' : 'password'
      }
    },

    async testApiConnection() {
      if (!this.settings.qwenApiKey) {
        alert('请先输入 API Key')
        return
      }

      this.testingConnection = true
      this.connectionStatus = null
      this.connectionMessage = ''

      try {
        // 先保存当前设置以便 API 服务使用最新配置
        storageManager.saveSettings(this.settings)
        
        // 动态导入 API 服务
        const { default: qwenApiService } = await import('../utils/qwenApi.js')
        
        // 重新加载配置
        qwenApiService.loadConfig()
        
        // 测试连接
        const result = await qwenApiService.testConnection()
        
        if (result.success) {
          this.connectionStatus = 'success'
          this.connectionMessage = result.message
          console.log('API 连接测试成功:', result.details)
        } else {
          this.connectionStatus = 'error'
          this.connectionMessage = result.message
          console.error('API 连接测试失败:', result.details)
        }
      } catch (error) {
        console.error('API 连接测试错误:', error)
        this.connectionStatus = 'error'
        this.connectionMessage = '连接测试过程中发生未知错误'
      } finally {
        this.testingConnection = false
        
        // 5秒后清除状态
        setTimeout(() => {
          this.connectionStatus = null
          this.connectionMessage = ''
        }, 5000)
      }
    },
    
    exportData() {
      const data = storageManager.exportData()
      if (data) {
        const blob = new Blob([data], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `StoryEngine_backup_${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else {
        alert('导出数据失败')
      }
    },
    
    importData(event) {
      const file = event.target.files[0]
      if (!file) return
      
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const success = storageManager.importData(e.target.result)
          if (success) {
            alert('数据导入成功！页面将刷新以应用新数据。')
            window.location.reload()
          } else {
            alert('数据导入失败，请检查文件格式')
          }
        } catch (error) {
          alert('文件格式错误，请选择有效的JSON文件')
        }
      }
      reader.readAsText(file)
      
      // 清空文件选择
      event.target.value = ''
    },
    
    confirmClearData() {
      this.showConfirmDialog = true
      this.confirmDialog = {
        title: '清空所有数据',
        message: '此操作将永久删除所有项目、内容和设置，且无法恢复。确定要继续吗？',
        action: () => {
          const success = storageManager.clearAll()
          if (success) {
            alert('数据已清空！页面将刷新。')
            window.location.reload()
          } else {
            alert('清空数据失败')
          }
          this.showConfirmDialog = false
        }
      }
    },
    
    openStorageLocation() {
      // 检查是否在Electron环境中
      if (window.electronAPI && window.electronAPI.openStorageLocation) {
        // 如果在Electron中，调用主进程方法打开文件夹
        window.electronAPI.openStorageLocation()
      } else {
        // 如果在浏览器中，显示存储信息
        alert('当前在浏览器环境中运行，数据存储在浏览器的localStorage中。在桌面应用版本中，您可以直接打开存储文件夹。')
      }
    }
  }
}
</script>

<style scoped>
.settings-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f8f9fa;
}

.settings-header {
  padding: 30px;
  background: white;
  border-bottom: 1px solid #e9ecef;
}

.settings-header h2 {
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-size: 24px;
  font-weight: 600;
}

.settings-header p {
  margin: 0;
  color: #6c757d;
  font-size: 14px;
}

.settings-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.settings-nav {
  width: 200px;
  background: white;
  border-right: 1px solid #e9ecef;
  padding: 20px 0;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: 3px solid transparent;
}

.nav-item:hover {
  background-color: #f8f9fa;
}

.nav-item.active {
  background-color: #e3f2fd;
  border-left-color: #2196f3;
  color: #1976d2;
}

.nav-item .icon {
  margin-right: 10px;
  font-size: 16px;
}

.nav-item span {
  font-size: 14px;
  font-weight: 500;
}

.settings-panel {
  flex: 1;
  padding: 30px;
  overflow-y: auto;
  background: white;
}

.settings-section h3 {
  margin: 0 0 25px 0;
  color: #2c3e50;
  font-size: 18px;
  font-weight: 600;
  padding-bottom: 10px;
  border-bottom: 2px solid #e9ecef;
}

.setting-item {
  margin-bottom: 25px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f1f3f4;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-item label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #2c3e50;
  font-size: 14px;
}

.setting-control {
  display: flex;
  align-items: center;
  gap: 10px;
}

.setting-control input[type="range"] {
  flex: 1;
  max-width: 200px;
}

.setting-control .value {
  min-width: 50px;
  font-size: 14px;
  color: #6c757d;
  font-weight: 500;
}

.setting-control select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  min-width: 150px;
}

.setting-description {
  margin: 8px 0 0 0;
  font-size: 12px;
  color: #6c757d;
  line-height: 1.4;
}



/* 按钮样式 */
.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-primary {
  background-color: #2196f3;
  color: white;
}

.btn-primary:hover {
  background-color: #1976d2;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #5a6268;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

.btn-danger:hover {
  background-color: #c82333;
}

.storage-info {
  font-size: 14px;
  color: #6c757d;
  background-color: #f8f9fa;
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.danger-zone {
  background-color: #fff5f5;
  border: 1px solid #fed7d7;
  border-radius: 6px;
  padding: 20px;
  margin-top: 20px;
}

.danger-zone label {
  color: #c53030;
}

.settings-footer {
  padding: 20px 30px;
  background: white;
  border-top: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.save-status {
  font-size: 14px;
  color: #6c757d;
  transition: color 0.3s ease;
}

.save-status.saved {
  color: #28a745;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-dialog {
  background: white;
  border-radius: 8px;
  padding: 30px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.modal-dialog h3 {
  margin: 0 0 15px 0;
  color: #2c3e50;
  font-size: 18px;
}

.modal-dialog p {
  margin: 0 0 25px 0;
  color: #6c757d;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

/* API 配置样式 */
.api-key-input, .api-base-input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  font-family: 'Courier New', monospace;
}

.show-password-btn {
  min-width: 60px;
  padding: 10px 12px;
}

.model-select {
  min-width: 200px;
}

.token-input {
  width: 100px;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.temperature-slider {
  flex: 1;
  max-width: 200px;
}

.connection-success {
  color: #28a745;
  font-weight: 500;
  margin-left: 10px;
}

.connection-error {
  color: #dc3545;
  font-weight: 500;
  margin-left: 10px;
}

.connection-message {
  margin-top: 8px;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 13px;
  line-height: 1.4;
}

.connection-message.connection-success {
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
}

.connection-message.connection-error {
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
}

.api-usage-info {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 20px;
  margin-top: 30px;
}

.api-usage-info h4 {
  margin: 0 0 15px 0;
  color: #2c3e50;
  font-size: 16px;
  font-weight: 600;
}

.api-usage-info ul {
  margin: 0;
  padding-left: 20px;
}

.api-usage-info li {
  margin-bottom: 8px;
  color: #6c757d;
  line-height: 1.4;
}

.setting-description a {
  color: #2196f3;
  text-decoration: none;
}

.setting-description a:hover {
  text-decoration: underline;
}

/* 深色主题 */
body.dark-theme .settings-container {
  background-color: #1a1a1a;
}

body.dark-theme .settings-header,
body.dark-theme .settings-nav,
body.dark-theme .settings-panel,
body.dark-theme .settings-footer {
  background-color: #2d2d2d;
  border-color: #404040;
}

body.dark-theme .settings-header h2,
body.dark-theme .settings-section h3,
body.dark-theme .setting-item label {
  color: #ffffff;
}

body.dark-theme .settings-header p,
body.dark-theme .setting-description,
body.dark-theme .save-status {
  color: #b0b0b0;
}

body.dark-theme .nav-item {
  color: #b0b0b0;
}

body.dark-theme .nav-item:hover {
  background-color: #404040;
}

body.dark-theme .nav-item.active {
  background-color: #1e3a8a;
  color: #60a5fa;
}

body.dark-theme .setting-item {
  border-bottom-color: #404040;
}

body.dark-theme .storage-info {
  background-color: #404040;
  border-color: #555;
  color: #b0b0b0;
}

body.dark-theme .modal-dialog {
  background-color: #2d2d2d;
}

body.dark-theme .modal-dialog h3 {
  color: #ffffff;
}

body.dark-theme .modal-dialog p {
  color: #b0b0b0;
}

/* 深色主题 API 配置样式 */
body.dark-theme .api-key-input,
body.dark-theme .api-base-input,
body.dark-theme .token-input {
  background-color: #404040;
  border-color: #555;
  color: #ffffff;
}

body.dark-theme .api-key-input::placeholder,
body.dark-theme .api-base-input::placeholder {
  color: #888;
}

body.dark-theme .model-select {
  background-color: #404040;
  border-color: #555;
  color: #ffffff;
}

body.dark-theme .api-usage-info {
  background-color: #404040;
  border-color: #555;
}

body.dark-theme .api-usage-info h4 {
  color: #ffffff;
}

body.dark-theme .api-usage-info li {
  color: #b0b0b0;
}

body.dark-theme .setting-description a {
  color: #60a5fa;
}

body.dark-theme .connection-message.connection-success {
  background-color: #1e4d2b;
  border-color: #2d5a3d;
  color: #a7d4b4;
}

body.dark-theme .connection-message.connection-error {
  background-color: #4d1e1e;
  border-color: #5a2d2d;
  color: #d4a7a7;
}
</style>