<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import EditorCharactersModal from './editor_characters/modal.vue'

const props = defineProps<{
  projectPath: string
}>()

const ensureFolder = async () => {
  if (!props.projectPath) return
  await window.ipcRenderer.invoke('ensure-characters-folder', props.projectPath)
}

const characters = ref<Array<{ id: string; name: string; gender: string; avatar: string | null }>>([])

const loadCharacters = async () => {
  if (!props.projectPath) {
    characters.value = []
    return
  }
  try {
    const list = await window.ipcRenderer.invoke('list-characters', props.projectPath)
    if (Array.isArray(list)) {
      characters.value = list
    }
  } catch (err) {
    console.error('加载角色列表失败', err)
  }
}

onMounted(() => {
  ensureFolder()
  loadCharacters()
})
watch(
  () => props.projectPath,
  () => {
    ensureFolder()
    loadCharacters()
  },
)

const showModal = ref(false)

const openModal = () => {
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const handleSaved = () => {
  loadCharacters()
}

const projectName = computed(() => {
  if (!props.projectPath) return '未命名项目'
  const segments = props.projectPath.split(/[\\/]/).filter(Boolean)
  return segments.at(-1) || '未命名项目'
})
</script>

<template>
  <section class="characters">
    <header class="top">
      <h3>角色</h3>
      <div class="search">
        <input type="text" placeholder="搜索角色" />
        <button type="button">搜索</button>
        <button type="button" class="primary" @click="openModal">新增角色</button>
      </div>
    </header>
    <div class="list-placeholder">
      <ul v-if="characters.length">
        <li v-for="item in characters" :key="item.id">
          <span class="avatar" v-if="item.avatar">
            <img :src="item.avatar" :alt="item.name" />
          </span>
          <span class="avatar placeholder" v-else></span>
          <div class="info">
            <strong>{{ item.name }}</strong>
            <span class="muted" v-if="item.gender"> - {{ item.gender }}</span>
          </div>
          <button type="button" class="ghost more">⋯</button>
        </li>
      </ul>
      <p v-else>未来在这里列出角色列表。</p>
    </div>

    <EditorCharactersModal
      v-if="showModal"
      :project-name="projectName"
      :project-path="props.projectPath"
      @close="closeModal"
      @saved="handleSaved"
    />
  </section>
</template>

<style scoped>
.characters {
  padding: 0.5rem 0;
  color: #2c2f36;
}

h3 {
  margin: 0 0 0.5rem;
}

.top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.search {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.search input {
  padding: 0.45rem 0.6rem;
  border: 1px solid #d0d4dd;
  border-radius: 0;
  font-size: 0.95rem;
  box-sizing: border-box;
  width: 200px;
}

.search input:focus-visible {
  outline: none;
  box-shadow: none;
}

.search button {
  padding: 0.45rem 0.75rem;
  border: 1px solid #646cff;
  background: #646cff;
  color: #fff;
  border-radius: 0;
  cursor: pointer;
}

.primary {
  padding: 0.45rem 0.75rem;
  border: 1px solid #646cff;
  background: #646cff;
  color: #fff;
  border-radius: 0;
  cursor: pointer;
}

.search button:focus-visible,
.primary:focus-visible {
  outline: none;
  box-shadow: none;
}

.search input:focus,
.search button:focus,
.primary:focus {
  outline: none;
  box-shadow: none;
}

.list-placeholder {
  margin-top: 1rem;
  padding: 1rem;
  border: 1px dashed #d0d4dd;
  color: #6c7180;
}

ul {
  list-style: none;
  margin: 0;
  padding: 0;
  color: #2c2f36;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  justify-content: space-between;
}

li > .info {
  flex: 1;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #d0d4dd;
  flex-shrink: 0;
  display: inline-flex;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar.placeholder {
  background: #f0f2f5;
}

.info {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.muted {
  color: #6c7180;
  font-size: 0.95rem;
}

.ghost.more {
  border: none;
  background: transparent;
  padding: 4px 6px;
  cursor: pointer;
  border-radius: 4px;
}

.ghost.more:hover {
  background: #f0f2f5;
}
</style>
