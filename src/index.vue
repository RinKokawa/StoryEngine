<script setup lang="ts">
import { computed, ref } from 'vue'
import IndexNav from './views/index/index_nav.vue'
import IndexHome from './views/index/index_home.vue'
import IndexProjects from './views/index/index_projects.vue'
import IndexFeed from './views/index/index_feed.vue'
import IndexSettings from './views/index/index_settings.vue'

type NavKey = 'home' | 'projects' | 'feed' | 'settings'

const selected = ref<NavKey>('home')
const viewMap: Record<NavKey, any> = {
  home: IndexHome,
  projects: IndexProjects,
  feed: IndexFeed,
  settings: IndexSettings,
}

const currentView = computed(() => viewMap[selected.value])
</script>

<template>
  <main class="page">
    <IndexNav :active="selected" @select="selected = $event" />

    <section class="hero">
      <component :is="currentView" />
    </section>
  </main>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: flex-start;
  justify-content: flex-start;
  position: relative;
  width: 100%;
  padding-left: 240px;
  padding-top: 1rem;
  min-height: 100vh;
  box-sizing: border-box;
}

.hero {
  text-align: left;
  width: 100%;
  padding-left: 16px;
  padding-top: 0;
}

.hero p {
  color: #8a8f9c;
  margin-top: 0.5rem;
  text-align: left;
}

:global(body) {
  margin: 0;
  height: 100vh;
  overflow: hidden;
  display: block;
}

:global(#app) {
  max-width: none;
  padding: 0;
  text-align: left;
}
</style>
