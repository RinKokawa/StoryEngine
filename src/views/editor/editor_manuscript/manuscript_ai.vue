<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'

type ChatMessage = { role: 'user' | 'assistant' | 'system'; content: string }

const props = defineProps<{
  projectPath: string
  currentChapter?: { id: string; name: string; synopsis?: string; content?: string } | null
  liveContent?: string
}>()

const baseSystem = '你是写作助手，回答简洁具体。'
const messages = ref<ChatMessage[]>([{ role: 'system', content: baseSystem }])
const input = ref('')
const loading = ref(false)
const error = ref('')
const listRef = ref<HTMLElement | null>(null)
const visibleMessages = computed(() => messages.value.filter((m) => m.role !== 'system'))
const metaInfo = ref<{ name: string; synopsis: string }>({ name: '', synopsis: '' })
const previousChapters = ref<
  Array<{ id: string; name: string; synopsis?: string; content?: string }>
>([])

const scrollToBottom = async () => {
  await nextTick()
  const el = listRef.value
  if (el) {
    el.scrollTop = el.scrollHeight
  }
}

const send = async () => {
  if (!input.value.trim() || loading.value) return
  error.value = ''
  const userMsg: ChatMessage = { role: 'user', content: input.value.trim() }
  messages.value.push(userMsg)
  input.value = ''
  loading.value = true
  await scrollToBottom()
  try {
    const res = await window.ipcRenderer.invoke('ai:chat', {
      messages: messages.value.map((m) => ({ role: m.role, content: m.content })),
    })
    const assistantContent = res?.content || '（无响应）'
    messages.value.push({ role: 'assistant', content: assistantContent })
  } catch (err: any) {
    console.error('AI 调用失败', err)
    error.value = err?.message || 'AI 调用失败'
  } finally {
    loading.value = false
    await scrollToBottom()
  }
}

const handleKey = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    send()
  }
}

onMounted(scrollToBottom)

const rebuildSystemMessage = () => {
  const name = metaInfo.value.name?.trim() || '未命名作品'
  const synopsis = metaInfo.value.synopsis?.trim() || '暂无简介'

  const contextLines: string[] = []
  previousChapters.value.forEach((c) => {
    contextLines.push(`前章《${c.name}》\n梗概：${c.synopsis ?? '无'}\n正文：${c.content ?? ''}`)
  })
  if (props.currentChapter) {
    const content = props.liveContent ?? props.currentChapter.content ?? ''
    contextLines.push(`当前章节《${props.currentChapter.name}》\n梗概：${props.currentChapter.synopsis ?? '无'}\n正文：${content}`)
  }

  const parts = [
    baseSystem,
    `作品信息：\n标题：${name}\n简介：${synopsis}`,
  ]
  if (contextLines.length) {
    parts.push(`章节上下文（当前章节 + 前三章）：\n${contextLines.join('\n\n')}`)
  }
  const content = parts.join('\n\n')
  messages.value = [{ role: 'system', content }, ...messages.value.filter((m) => m.role !== 'system')]
}

const loadProjectMeta = async () => {
  if (!props.projectPath) return
  try {
    const meta = await window.ipcRenderer.invoke('project:read-meta', props.projectPath)
    metaInfo.value = {
      name: meta?.name ?? '',
      synopsis: meta?.synopsis ?? '',
    }
    rebuildSystemMessage()
  } catch (err) {
    console.error('读取作品信息失败', err)
    metaInfo.value = { name: '', synopsis: '' }
    rebuildSystemMessage()
  }
}

const loadChapterContext = async () => {
  if (!props.projectPath || !props.currentChapter?.id) {
    previousChapters.value = []
    rebuildSystemMessage()
    return
  }
  try {
    const list = await window.ipcRenderer.invoke('list-outline-structure', props.projectPath)
    const flat: Array<{ id: string; name: string; synopsis?: string; content?: string }> = []
    if (Array.isArray(list)) {
      for (const v of list) {
        if (Array.isArray(v.chapters)) {
          flat.push(...v.chapters)
        }
      }
    }
    const idx = flat.findIndex((c) => c.id === props.currentChapter?.id)
    if (idx >= 0) {
      const start = Math.max(0, idx - 3)
      previousChapters.value = flat.slice(start, idx)
    } else {
      previousChapters.value = []
    }
  } catch (err) {
    console.error('加载章节上下文失败', err)
    previousChapters.value = []
  }
  rebuildSystemMessage()
}

onMounted(() => {
  loadProjectMeta()
  loadChapterContext()
})

watch(
  () => props.projectPath,
  () => {
    loadProjectMeta()
    loadChapterContext()
  },
)

watch(
  () => props.currentChapter?.id,
  () => loadChapterContext(),
)

watch(
  () => props.liveContent,
  () => rebuildSystemMessage(),
)
</script>

<template>
  <div class="ai-chat">
    <header class="head">
      <div>
        <h4>AI 聊天</h4>
        <p class="hint">使用 QWEN_API_KEY（userData/.env）。</p>
      </div>
      <span v-if="loading" class="badge">生成中...</span>
    </header>

    <div ref="listRef" class="messages">
      <p v-if="!visibleMessages.length" class="placeholder">开始提问，获取灵感。</p>
      <div
        v-for="(msg, idx) in visibleMessages"
        :key="idx"
        class="msg"
        :data-role="msg.role"
      >
        <div class="bubble">
          <strong class="role">{{ msg.role === 'assistant' ? 'AI' : '我' }}</strong>
          <p class="content">{{ msg.content }}</p>
        </div>
      </div>
    </div>

    <div v-if="error" class="error">{{ error }}</div>

    <div class="input-area">
      <textarea
        v-model="input"
        placeholder="输入问题，Shift+Enter 换行，Enter 发送"
        @keydown="handleKey"
      ></textarea>
      <button type="button" class="primary" :disabled="loading" @click="send">
        {{ loading ? '生成中...' : '发送' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.ai-chat {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

h4 {
  margin: 0;
}

.hint {
  margin: 0;
  color: #6c7180;
  font-size: 0.9rem;
}

.badge {
  background: #e8ecf9;
  color: #4a5a7d;
  padding: 4px 8px;
  border-radius: 10px;
  font-size: 12px;
}

.messages {
  flex: 1;
  border: 1px solid #e5e7ec;
  border-radius: 10px;
  padding: 0.75rem;
  overflow-y: auto;
  background: linear-gradient(180deg, #f9fafc 0%, #ffffff 40%);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.msg {
  display: flex;
}

.msg[data-role='assistant'] {
  justify-content: flex-start;
}

.msg[data-role='user'] {
  justify-content: flex-end;
}

.bubble {
  max-width: 90%;
  padding: 0.5rem 0.65rem;
  border-radius: 10px;
  background: #f7f9fc;
  border: 1px solid #eef1f6;
}

.msg[data-role='assistant'] .bubble {
  background: #f0f4ff;
  border-color: #dbe4ff;
  box-shadow: 0 4px 12px rgba(55, 88, 182, 0.08);
}

.msg[data-role='user'] .bubble {
  background: #e8ecf9;
  border-color: #cfd8f4;
  box-shadow: 0 4px 12px rgba(74, 90, 125, 0.08);
}

.role {
  display: inline-block;
  margin: 0 0 2px;
  color: #4a5a7d;
}

.content {
  margin: 0;
  white-space: pre-wrap;
  color: #2c2f36;
}

.placeholder {
  margin: 0;
  color: #6c7180;
}

.error {
  color: #c62828;
  background: #fdecea;
  border: 1px solid #f5c6cb;
  padding: 0.4rem 0.6rem;
  border-radius: 6px;
  margin: 0;
}

.input-area {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
}

textarea {
  flex: 1;
  min-height: 80px;
  resize: vertical;
  border: 1px solid #d0d4dd;
  border-radius: 6px;
  padding: 0.55rem;
  font-size: 0.95rem;
  box-sizing: border-box;
}

textarea:focus,
textarea:focus-visible {
  outline: none;
  box-shadow: none;
  border-color: #646cff;
}

.primary {
  padding: 0.55rem 1rem;
  border: 1px solid #646cff;
  background: #646cff;
  color: #fff;
  border-radius: 6px;
  cursor: pointer;
  min-width: 90px;
}

.primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@media (max-width: 900px) {
  .messages {
    max-height: 280px;
  }
  .input-area {
    flex-direction: column;
  }
  .primary {
    width: 100%;
  }
}
</style>
