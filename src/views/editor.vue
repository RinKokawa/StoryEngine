<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import EditorTitlebar from './editor/editor_titlebar.vue'
import EditorNav from './editor/editor_nav.vue'

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

const activeNav = ref('manuscript')
const sidebarWidth = ref(220)

const handleNavSelect = (key: string) => {
  activeNav.value = key
}

const handleNavToggle = (collapsed: boolean) => {
  sidebarWidth.value = collapsed ? 64 : 220
}
</script>

<template>
  <section class="editor">
    <EditorTitlebar :name="displayName" @close="close" />
    <div class="body">
      <EditorNav
        :active="activeNav"
        :initial-collapsed="false"
        @select="handleNavSelect"
        @toggle="handleNavToggle"
      />
      <div class="workspace" :style="{ marginLeft: sidebarWidth + 'px' }">
        <p class="placeholder">这里将是编辑页面的内容。</p>
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
