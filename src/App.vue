<template>
  <div id="app">
    <Sidebar 
      :currentPage="currentPage"
      @sidebar-toggle="handleSidebarToggle" 
      @navigate="handleNavigation"
    />
    <div class="main-content" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
      <Dashboard v-if="currentPage === 'dashboard'" :current-project="currentProject" @navigate="handleNavigation" @project-changed="handleProjectSelected" />
      <ProjectManager v-else-if="currentPage === 'projects'" @navigate="handleNavigation" @project-selected="handleProjectSelected" />
      <StoryEditor v-else-if="currentPage === 'editor'" :current-project="currentProject" @project-changed="handleProjectSelected" />
      <Settings v-else-if="currentPage === 'settings'" @settings-changed="handleSettingsChanged" />
      <div v-else class="page-placeholder">
        <h2>{{ getPageTitle() }}</h2>
        <p>此页面正在开发中...</p>
      </div>
    </div>
  </div>
</template>

<script>
import Dashboard from './components/Dashboard.vue'
import ProjectManager from './components/ProjectManager.vue'
import Sidebar from './components/Sidebar.vue'
import StoryEditor from './views/StoryEditor.vue'
import Settings from './components/Settings.vue'
import storageManager from './utils/storage.js'

export default {
  name: 'App',
  components: {
    StoryEditor,
    Dashboard,
    ProjectManager,
    Sidebar,
    Settings
  },
  data() {
    return {
      sidebarCollapsed: true,
      currentPage: 'dashboard',
      currentProject: null,
      appSettings: {},
      themeMediaQuery: null,
      themeChangeHandler: null
    }
  },
  mounted() {
    // 启动时加载当前项目和设置
    this.currentProject = storageManager.getCurrentProject()
    this.appSettings = storageManager.getSettings()
    this.applySidebarSettings()
    this.applyThemeSettings()
  },
  
  beforeUnmount() {
    // 清理主题监听器
    if (this.themeMediaQuery && this.themeChangeHandler) {
      this.themeMediaQuery.removeListener(this.themeChangeHandler)
    }
  },
  methods: {
    handleSidebarToggle(collapsed) {
      this.sidebarCollapsed = collapsed
    },
    handleNavigation(page, params = {}) {
      this.currentPage = page
      console.log('导航到:', page, params)
    },
    handleProjectSelected(project) {
      this.currentProject = project
      console.log('选择项目:', project)
    },
    getPageTitle() {
      const titles = {
        dashboard: '仪表盘',
        projects: '项目管理',
        editor: '故事编辑',
        characters: '角色管理',
        worldview: '世界设定',
        settings: '设置'
      }
      return titles[this.currentPage] || '未知页面'
    },
    
    handleSettingsChanged(newSettings) {
      this.appSettings = { ...newSettings }
      this.applySidebarSettings()
      this.applyThemeSettings()
    },
    
    applySidebarSettings() {
      // 应用侧边栏默认状态设置
      if (this.appSettings.sidebarCollapsed !== undefined) {
        this.sidebarCollapsed = this.appSettings.sidebarCollapsed
      }
    },
    
    applyThemeSettings() {
      // 清除所有主题类
      document.body.classList.remove('dark-theme', 'auto-theme')
      
      // 应用主题设置
      if (this.appSettings.theme === 'dark') {
        document.body.classList.add('dark-theme')
      } else if (this.appSettings.theme === 'light') {
        // 浅色主题不需要添加类
      } else if (this.appSettings.theme === 'auto') {
        document.body.classList.add('auto-theme')
        // 监听系统主题变化
        this.watchSystemTheme()
      }
    },
    
    watchSystemTheme() {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleThemeChange = (e) => {
        if (this.appSettings.theme === 'auto') {
          // 当系统主题改变且用户选择自动主题时，重新应用主题
          this.applyThemeSettings()
        }
      }
      
      // 移除之前的监听器（如果存在）
      if (this.themeMediaQuery) {
        this.themeMediaQuery.removeListener(this.themeChangeHandler)
      }
      
      // 添加新的监听器
      this.themeMediaQuery = mediaQuery
      this.themeChangeHandler = handleThemeChange
      mediaQuery.addListener(handleThemeChange)
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  height: 100vh;
  overflow: hidden;
  display: flex;
}

.main-content {
  margin-left: 250px;
  flex: 1;
  width: calc(100vw - 250px);
  height: 100vh;
  overflow-y: auto;
  transition: margin-left 0.3s ease, width 0.3s ease;
}

.main-content.sidebar-collapsed {
  margin-left: 60px;
  width: calc(100vw - 60px);
}

.page-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  color: #666;
}

.page-placeholder h2 {
  margin-bottom: 10px;
  color: #2c3e50;
}

body {
  font-family: 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>