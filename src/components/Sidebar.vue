<template>
  <div class="sidebar" :class="{ collapsed: isCollapsed }">
    <div class="sidebar-header">
      <h3 v-show="!isCollapsed">故事引擎</h3>
      <button class="collapse-btn" @click="toggleSidebar">
        <span v-if="!isCollapsed">‹</span>
        <span v-else>›</span>
      </button>
    </div>
    <nav class="sidebar-nav">
      <ul>
        <li class="nav-item">
          <a href="#"
             class="nav-link"
             :class="{ active: currentPage === 'dashboard' }"
             @click="navigate('dashboard')"
             :title="'仪表盘：查看项目总体概览与最近活动'"
             data-tooltip="仪表盘">
            <i class="icon">📊</i>
            <span v-show="!isCollapsed">仪表盘</span>
          </a>
        </li>
        <li class="nav-item">
          <a href="#"
             class="nav-link"
             :class="{ active: currentPage === 'projects' }"
             @click="navigate('projects')"
             :title="'项目管理：创建、打开与管理项目'"
             data-tooltip="项目管理">
            <i class="icon">📚</i>
            <span v-show="!isCollapsed">项目管理</span>
          </a>
        </li>
        <li class="nav-item">
          <a href="#"
             class="nav-link"
             :class="{ active: currentPage === 'editor' }"
             @click="navigate('editor')"
             :title="'故事编辑：撰写章节与进行内容编辑'"
             data-tooltip="故事编辑">
            <i class="icon">📖</i>
            <span v-show="!isCollapsed">故事编辑</span>
          </a>
        </li>
        <li class="nav-item">
          <a href="#"
             class="nav-link"
             @click="navigate('outline')"
             :title="'大纲管理：规划故事结构与章节层级'"
             data-tooltip="大纲管理">
            <i class="icon">📋</i>
            <span v-show="!isCollapsed">大纲管理</span>
          </a>
        </li>
        <li class="nav-item">
          <a href="#"
             class="nav-link"
             @click="navigate('characters')"
             :title="'角色管理：维护角色档案与关系'"
             data-tooltip="角色管理">
            <i class="icon">👥</i>
            <span v-show="!isCollapsed">角色管理</span>
          </a>
        </li>
        <li class="nav-item">
          <a href="#"
             class="nav-link"
             @click="navigate('worldview')"
             :title="'世界设定：管理世界观、设定与术语'"
             data-tooltip="世界设定">
            <i class="icon">🌍</i>
            <span v-show="!isCollapsed">世界设定</span>
          </a>
        </li>
        <li class="nav-item">
          <a href="#"
             class="nav-link"
             @click="navigate('settings')"
             :title="'设置：配置主题、偏好与应用选项'"
             data-tooltip="设置">
            <i class="icon">⚙️</i>
            <span v-show="!isCollapsed">设置</span>
          </a>
        </li>
      </ul>
    </nav>
    
    <!-- GitHub 角标 -->
    <div class="sidebar-footer">
      <a href="#" 
         @click.prevent="openGitHub"
         class="github-link"
         :title="isCollapsed ? 'GitHub' : '在 GitHub 上查看源码'">
        <img src="/github.svg" alt="GitHub" class="icon github-icon" />
        <span v-show="!isCollapsed">GitHub</span>
      </a>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Sidebar',
  props: {
    currentPage: {
      type: String,
      default: 'dashboard'
    },
    initialCollapsed: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      isCollapsed: this.initialCollapsed
    }
  },
  watch: {
    initialCollapsed(newVal) {
      this.isCollapsed = newVal
    }
  },
  methods: {
    toggleSidebar() {
      this.isCollapsed = !this.isCollapsed
      this.$emit('sidebar-toggle', this.isCollapsed)
    },
    navigate(page) {
      this.$emit('navigate', page)
    },
    openGitHub() {
      const url = 'https://github.com/RinKokawa/StoryEngine'
      
      // 检查是否在Electron环境中
      if (window.electronAPI && window.electronAPI.openExternal) {
        // 使用Electron的shell.openExternal打开外部链接
        window.electronAPI.openExternal(url)
      } else {
        // 在浏览器环境中使用window.open
        window.open(url, '_blank')
      }
    }
  }
}
</script>

<style scoped>
.sidebar {
  width: 250px;
  height: 100vh;
  background-color: #2c3e50;
  color: white;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
}

.sidebar.collapsed {
  width: 60px;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #34495e;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  flex: 1;
}

.collapse-btn {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 5px;
  border-radius: 3px;
  transition: background-color 0.3s ease;
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
}

.collapse-btn:hover {
  background-color: #34495e;
}

.collapsed .sidebar-header {
  justify-content: center;
  padding: 20px 10px;
}

.collapsed .collapse-btn {
  position: static;
  transform: none;
}

.sidebar-nav {
  flex: 1;
  padding: 20px 0;
}

.sidebar-nav ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-item {
  margin-bottom: 5px;
}

.nav-link {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  color: #bdc3c7;
  text-decoration: none;
  transition: all 0.3s ease;
  position: relative;
}

.collapsed .nav-link {
  justify-content: center;
  padding: 12px 10px;
}

.collapsed .nav-link::after {
  content: attr(data-tooltip);
  position: absolute;
  left: 100%;
  top: 50%;
  transform: translate(8px, -50%);
  white-space: nowrap;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
}

.collapsed .nav-link:hover::after {
  opacity: 1;
  transform: translate(12px, -50%);
}

.nav-link:hover {
  background-color: #34495e;
  color: white;
}

.nav-link.active {
  background-color: #3498db;
  color: white;
}

.icon {
  margin-right: 12px;
  font-size: 16px;
  width: 20px;
  text-align: center;
}

.nav-link span {
  font-size: 14px;
}

/* GitHub 角标样式 */
.sidebar-footer {
  padding: 0;
  border-top: 1px solid #34495e;
  margin-top: auto;
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
}

.github-link {
  display: flex;
  align-items: center;
  padding: 8px 20px;
  color: #95a5a6;
  text-decoration: none;
  transition: all 0.3s ease;
  font-size: 13px;
}

.collapsed .github-link {
  justify-content: center;
  padding: 8px;
}

.github-link:hover {
  background-color: #34495e;
  color: #ecf0f1;
}

.github-link .icon {
  margin-right: 10px;
  font-size: 14px;
}

.github-icon {
  width: 30px;
  height: 30px;
  filter: brightness(0.6); /* 使图标颜色与文字颜色匹配 */
}

.github-link:hover .github-icon {
  filter: brightness(1); /* 悬停时变亮 */
}

.collapsed .github-link .icon {
  margin-right: 0;
}
</style>
