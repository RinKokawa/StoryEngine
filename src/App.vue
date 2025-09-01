<template>
  <div id="app">
    <Sidebar 
      :currentPage="currentPage"
      @sidebar-toggle="handleSidebarToggle" 
      @navigate="handleNavigation"
    />
    <div class="main-content" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
      <Dashboard v-if="currentPage === 'dashboard'" @navigate="handleNavigation" />
      <ProjectManager v-else-if="currentPage === 'projects'" @navigate="handleNavigation" @project-selected="handleProjectSelected" />
      <NovelEditor v-else-if="currentPage === 'editor'" :current-project="currentProject" @project-changed="handleProjectSelected" />
      <div v-else class="page-placeholder">
        <h2>{{ getPageTitle() }}</h2>
        <p>此页面正在开发中...</p>
      </div>
    </div>
  </div>
</template>

<script>
import NovelEditor from './components/NovelEditor.vue'
import Dashboard from './components/Dashboard.vue'
import ProjectManager from './components/ProjectManager.vue'
import Sidebar from './components/Sidebar.vue'

export default {
  name: 'App',
  components: {
    NovelEditor,
    Dashboard,
    ProjectManager,
    Sidebar
  },
  data() {
    return {
      sidebarCollapsed: true,
      currentPage: 'dashboard',
      currentProject: null
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