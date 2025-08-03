<template>
  <div class="writing-desktop-layout">
    <!-- 侧边栏 -->
    <Sidebar />
    
    <!-- 主内容区域 -->
    <div class="writing-main-area">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import Sidebar from './Sidebar.vue'
</script>

<style scoped>
.writing-desktop-layout {
  display: flex;
  width: 100vw;
  height: 100vh;
  background: var(--main-bg);
}

.writing-main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100vh;
  overflow: auto;
}
</style> 