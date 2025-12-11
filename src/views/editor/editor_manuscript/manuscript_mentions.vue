<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  projectPath: string
  chapter: { id: string; name: string; synopsis?: string; content?: string } | null
  content: string
}>()

const characters = ref<Array<{ id: string; name: string; gender?: string; avatar?: string | null }>>([])

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
  loadCharacters()
})

watch(
  () => props.projectPath,
  () => loadCharacters(),
)

watch(
  () => props.chapter?.id,
  () => loadCharacters(),
)

const countOccurrences = (text: string, keyword: string) => {
  if (!keyword) return 0
  let count = 0
  let idx = 0
  while (idx !== -1) {
    idx = text.indexOf(keyword, idx)
    if (idx === -1) break
    count += 1
    idx += keyword.length
  }
  return count
}

const mentionedCharacters = computed(() => {
  if (!props.content || !characters.value.length) return []
  const text = props.content
  const list = characters.value
    .map((c) => ({
      ...c,
      count: countOccurrences(text, c.name),
    }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
  return list
})
</script>

<template>
  <div class="mentions">
    <h4>提及概览</h4>
    <div class="block">
      <h5>角色提及</h5>
      <ul v-if="mentionedCharacters.length">
        <li v-for="item in mentionedCharacters" :key="item.id">
          <div class="name">
            <strong>{{ item.name }}</strong>
            <span class="muted" v-if="item.gender"> - {{ item.gender }}</span>
          </div>
          <span class="count">×{{ item.count }}</span>
        </li>
      </ul>
      <p v-else class="placeholder">{{ chapter ? '当前正文未提及角色' : '请选择章节' }}</p>
    </div>

    <div class="block">
      <h5>世界观</h5>
      <p class="placeholder">未来实现</p>
    </div>
  </div>
</template>

<style scoped>
.mentions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  color: #2c2f36;
  min-height: 0;
}

h4 {
  margin: 0;
}

.block {
  border: 1px solid #e5e7ec;
  padding: 0.6rem 0.75rem;
  background: #fff;
}

h5 {
  margin: 0 0 0.5rem;
  font-size: 0.95rem;
}

ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

li {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.name {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.muted {
  color: #6c7180;
}

.count {
  color: #4a5a7d;
  font-weight: 600;
}

.placeholder {
  margin: 0;
  color: #6c7180;
}
</style>
