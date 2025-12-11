<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

const props = defineProps<{
  projectPath: string
}>()

type LogEntry = {
  time: string
  action: string
  target: string
  before?: unknown
  after?: unknown
}

const entries = ref<LogEntry[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const stats = ref<{ volumes: number; chapters: number; words: number }>({ volumes: 0, chapters: 0, words: 0 })

const parseLog = (content: string): LogEntry[] => {
  const blocks = content.split('---').map((b) => b.trim()).filter(Boolean)
  const result: LogEntry[] = []
  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trim())
    if (lines.length < 3) continue
    const header = lines[0]
    const beforeLine = lines[1].replace(/^before:\s*/i, '')
    const afterLine = lines[2].replace(/^after:\s*/i, '')
    const match = header.match(/^\[(.+?)\]\s+(\S+)\s+(.+)$/)
    if (!match) continue
    const [, time, action, target] = match
    try {
      result.push({
        time,
        action,
        target,
        before: JSON.parse(beforeLine || 'null'),
        after: JSON.parse(afterLine || 'null'),
      })
    } catch {
      // ignore malformed block
    }
  }
  return result
}

const loadLog = async () => {
  entries.value = []
  error.value = null
  if (!props.projectPath) return
  loading.value = true
  try {
    const logDir = `${props.projectPath.replace(/[\\/]+$/, '')}/log`
    const files: string[] = await window.ipcRenderer.invoke('fs:list-dir', logDir)
    const logFiles = files.filter((f) => f.endsWith('.log')).sort().reverse() // latest first
    let collected: LogEntry[] = []
    for (const f of logFiles) {
      try {
        const raw = await window.ipcRenderer.invoke('fs:read-file', `${logDir}/${f}`)
        const parsed = parseLog(raw)
        collected = collected.concat(parsed)
        if (collected.length >= 50) break
      } catch {
        // ignore single file errors
      }
    }
    collected.sort((a, b) => (a.time > b.time ? -1 : 1))
    const latest = collected.slice(0, 20)
    entries.value = latest
  } catch (err: any) {
    error.value = '暂无修改记录或无法读取日志。'
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  stats.value = { volumes: 0, chapters: 0, words: 0 }
  if (!props.projectPath) return
  try {
    const outline = await window.ipcRenderer.invoke('list-outline-structure', props.projectPath)
    if (Array.isArray(outline)) {
      let vol = 0
      let chap = 0
      let words = 0
      for (const v of outline) {
        vol += 1
        if (Array.isArray(v.chapters)) {
          chap += v.chapters.length
          for (const c of v.chapters) {
            if (typeof c.content === 'string') {
              words += c.content.length
            }
          }
        }
      }
      stats.value = { volumes: vol, chapters: chap, words }
    }
  } catch (err) {
    // ignore stats errors silently
  }
}

onMounted(() => {
  loadLog()
  loadStats()
})
watch(
  () => props.projectPath,
  () => {
    loadLog()
    loadStats()
  },
)
</script>

<template>
  <section class="dashboard">
    <div class="head">
      <h3>仪表盘</h3>
      <button type="button" class="ghost" :disabled="loading" @click="loadLog">
        {{ loading ? '刷新中...' : '刷新日志' }}
      </button>
    </div>
    <p class="hint">下方展示最近的修改记录（来自 log/changes.log）。</p>

    <div class="stats">
      <div class="stat">
        <span class="label">卷</span>
        <strong>{{ stats.volumes }}</strong>
      </div>
      <div class="stat">
        <span class="label">章</span>
        <strong>{{ stats.chapters }}</strong>
      </div>
      <div class="stat">
        <span class="label">字数</span>
        <strong>{{ stats.words }}</strong>
      </div>
    </div>

    <div class="log">
      <p v-if="error" class="placeholder">{{ error }}</p>
      <p v-else-if="!entries.length" class="placeholder">暂无修改记录。</p>
      <ul v-else>
        <li v-for="item in entries" :key="item.time + item.target + item.action">
          <div class="row">
            <span class="time">{{ item.time }}</span>
            <span class="action">{{ item.action }}</span>
            <span class="target">{{ item.target }}</span>
          </div>
          <details>
            <summary>查看详情</summary>
            <div class="diff">
              <div>
                <strong>before</strong>
                <pre>{{ JSON.stringify(item.before, null, 2) }}</pre>
              </div>
              <div>
                <strong>after</strong>
                <pre>{{ JSON.stringify(item.after, null, 2) }}</pre>
              </div>
            </div>
          </details>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.dashboard {
  padding: 0.5rem 0;
  color: #2c2f36;
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

h3 {
  margin: 0 0 0.25rem;
}

.ghost {
  padding: 0.35rem 0.65rem;
  border: 1px solid #d0d4dd;
  background: #f5f6fa;
  cursor: pointer;
  border-radius: 0;
}

.ghost:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.ghost:focus,
.ghost:focus-visible {
  outline: none;
  box-shadow: none;
}

.hint {
  margin: 0 0 0.5rem;
  color: #6c7180;
  font-size: 0.95rem;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.stat {
  border: 1px solid #e5e7ec;
  background: #fff;
  padding: 0.65rem 0.75rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat .label {
  color: #6c7180;
}

.log ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.log li {
  border: 1px solid #e5e7ec;
  background: #fff;
  padding: 0.75rem;
}

.row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.35rem;
}

.time {
  color: #6c7180;
  font-size: 0.9rem;
}

.action {
  font-weight: 600;
}

.target {
  color: #4a5a7d;
}

.diff {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.5rem;
  margin-top: 0.25rem;
}

pre {
  background: #f7f8fb;
  border: 1px solid #e5e7ec;
  padding: 0.5rem;
  margin: 0;
  font-size: 0.85rem;
  white-space: pre-wrap;
  word-break: break-all;
}

.placeholder {
  margin: 0;
  color: #6c7180;
}
</style>
