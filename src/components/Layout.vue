<template>
  <div class="desktop-layout">
    <!-- 侧边栏 -->
    <Sidebar />
    
    <!-- 主内容区域 -->
    <div class="main-area">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import Sidebar from './Sidebar.vue'
</script>

<style scoped>
.desktop-layout {
  display: flex;
  width: 100%;
  height: 100vh;
  background: var(--main-bg);
  overflow: hidden;
}

.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100vh;
  overflow: auto;
}
</style> 