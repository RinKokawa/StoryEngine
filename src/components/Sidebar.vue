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
          <a href="#" class="nav-link" :class="{ active: currentPage === 'dashboard' }" @click="navigate('dashboard')">
            <i class="icon">📊</i>
            <span v-show="!isCollapsed">仪表盘</span>
          </a>
        </li>
        <li class="nav-item">
          <a href="#" class="nav-link" :class="{ active: currentPage === 'projects' }" @click="navigate('projects')">
            <i class="icon">📚</i>
            <span v-show="!isCollapsed">项目管理</span>
          </a>
        </li>
        <li class="nav-item">
          <a href="#" class="nav-link" :class="{ active: currentPage === 'editor' }" @click="navigate('editor')">
            <i class="icon">📖</i>
            <span v-show="!isCollapsed">故事编辑</span>
          </a>
        </li>
        <li class="nav-item">
          <a href="#" class="nav-link" @click="navigate('characters')">
            <i class="icon">👥</i>
            <span v-show="!isCollapsed">角色管理</span>
          </a>
        </li>
        <li class="nav-item">
          <a href="#" class="nav-link" @click="navigate('worldview')">
            <i class="icon">🌍</i>
            <span v-show="!isCollapsed">世界设定</span>
          </a>
        </li>
        <li class="nav-item">
          <a href="#" class="nav-link" @click="navigate('settings')">
            <i class="icon">⚙️</i>
            <span v-show="!isCollapsed">设置</span>
          </a>
        </li>
      </ul>
    </nav>
  </div>
</template>

<script>
export default {
  name: 'Sidebar',
  props: {
    currentPage: {
      type: String,
      default: 'dashboard'
    }
  },
  data() {
    return {
      isCollapsed: true
    }
  },
  methods: {
    toggleSidebar() {
      this.isCollapsed = !this.isCollapsed
      this.$emit('sidebar-toggle', this.isCollapsed)
    },
    navigate(page) {
      this.$emit('navigate', page)
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
}

.collapsed .nav-link {
  justify-content: center;
  padding: 12px 10px;
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
</style>