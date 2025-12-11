<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import Titlebar from './components/titlebar.vue'
import EditorNav from './editor/editor_nav.vue'
import EditorDashboard from './editor/editor_dashboard.vue'
import EditorCharacters from './editor/editor_characters.vue'
import EditorManuscript from './editor/editor_manuscript.vue'
import EditorWorldview from './editor/editor_worldview.vue'

const props = defineProps<{
  path: string | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const close = () => emit('close')

const displayName = computed(() => {
  if (!props.path) return '未命名项目'
  const segments = props.path.split(/[\\/]/).filter(Boolean)
  return segments[segments.length - 1] || '未命名项目'
})

const onKey = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    close()
  }
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

const activeNav = ref('dashboard')
const sidebarWidth = ref(64)
const currentView = computed(() => {
  if (activeNav.value === 'dashboard') return EditorDashboard
  if (activeNav.value === 'manuscript') return EditorManuscript
  if (activeNav.value === 'characters') return EditorCharacters
  if (activeNav.value === 'world') return EditorWorldview
  return null
})

const handleNavSelect = (key: string) => {
  activeNav.value = key
}

const handleNavToggle = (collapsed: boolean) => {
  sidebarWidth.value = collapsed ? 64 : 220
}

const handleOpenExternal = (url: string) => {
  window.ipcRenderer.invoke('shell:open-external', url)
}

const minimizeWindow = () => window.ipcRenderer.invoke('window-control', 'minimize')
const maximizeWindow = () => window.ipcRenderer.invoke('window-control', 'maximize')
</script>

<template>
  <section class="editor">
    <Titlebar
      :name="displayName"
      @close="close"
      @minimize="minimizeWindow"
      @maximize="maximizeWindow"
    />
    <div class="body">
      <EditorNav
        :active="activeNav"
        :initial-collapsed="true"
        @select="handleNavSelect"
        @toggle="handleNavToggle"
        @open-external="handleOpenExternal"
      />
      <div class="workspace" :style="{ marginLeft: sidebarWidth + 'px' }">
        <component
          v-if="currentView"
          :is="currentView"
          :project-path="props.path || ''"
        />
        <p v-else class="placeholder">这里将是编辑页面的内容。</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.editor {
  padding: 0;
}

.body {
  display: flex;
  min-height: calc(100vh - 32px);
}

.workspace {
  flex: 1;
  padding: 1rem 1.5rem;
  margin-left: 220px;
  box-sizing: border-box;
}

.placeholder {
  margin: 0;
  color: #6c7180;
}
</style>
