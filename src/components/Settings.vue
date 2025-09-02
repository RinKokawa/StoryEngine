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
      }
    }
  },
  computed: {
    saveStatusText() {
      switch (this.saveStatus) {
        case 'saving': return '保存中...'
        case 'saved': return '已保存'
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
            checkUpdates: true
          }
          this.showConfirmDialog = false
          this.saveSettings()
        }
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
</style>