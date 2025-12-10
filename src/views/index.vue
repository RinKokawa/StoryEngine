<script setup lang="ts">
import { computed, ref } from 'vue'
import IndexNav from './index/index_nav.vue'
import IndexHome from './index/index_home.vue'
import IndexProjects from './index/index_projects.vue'
import IndexFeed from './index/index_feed.vue'
import IndexSettings from './index/index_settings.vue'
import IndexTitlebar from './index/index_titlebar.vue'
import Editor from './editor.vue'

type NavKey = 'home' | 'projects' | 'feed' | 'settings'

const selected = ref<NavKey>('home')
const mode = ref<'dashboard' | 'editor'>('dashboard')
const currentProjectPath = ref<string | null>(null)
const viewMap: Record<NavKey, any> = {
  home: IndexHome,
  projects: IndexProjects,
  feed: IndexFeed,
  settings: IndexSettings,
}

const currentView = computed(() => viewMap[selected.value])

const openProject = (path: string) => {
  currentProjectPath.value = path
  mode.value = 'editor'
}

const closeEditor = () => {
  mode.value = 'dashboard'
  currentProjectPath.value = null
  selected.value = 'home'
}

const closeApp = () => {
  window.ipcRenderer.invoke('window-control', 'close')
}
</script>

<template>
  <template v-if="mode === 'dashboard'">
    <IndexTitlebar @close="closeApp" />
    <main class="page">
      <IndexNav :active="selected" @select="selected = $event" />

      <section class="hero">
        <component :is="currentView" @open-project="openProject" />
      </section>
    </main>
  </template>
  <template v-else>
    <Editor :path="currentProjectPath" @close="closeEditor" />
  </template>
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
  min-width: 960px;
  min-height: 540px;
}

:global(html) {
  min-width: 960px;
  min-height: 540px;
}

:global(#app) {
  max-width: none;
  padding: 0;
  text-align: left;
}
</style>
