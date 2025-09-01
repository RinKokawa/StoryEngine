<template>
  <div id="app">
    <Sidebar @sidebar-toggle="handleSidebarToggle" />
    <div class="main-content" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
      <NovelEditor />
    </div>
  </div>
</template>

<script>
import NovelEditor from './components/NovelEditor.vue'
import Sidebar from './components/Sidebar.vue'

export default {
  name: 'App',
  components: {
    NovelEditor,
    Sidebar
  },
  data() {
    return {
      sidebarCollapsed: false
    }
  },
  methods: {
    handleSidebarToggle(collapsed) {
      this.sidebarCollapsed = collapsed
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
  overflow: hidden;
  transition: margin-left 0.3s ease, width 0.3s ease;
}

.main-content.sidebar-collapsed {
  margin-left: 60px;
  width: calc(100vw - 60px);
}

body {
  font-family: 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>