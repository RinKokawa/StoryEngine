<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref } from 'vue'

defineProps<{
  projectPath: string
}>()

const collapsed = reactive({
  left: false,
  center: false,
  right: false,
})

const widths = reactive<Record<'left' | 'center' | 'right', number>>({
  left: 25,
  center: 50,
  right: 25,
})

const visibleKeys = computed(() => {
  const keys: Array<'left' | 'center' | 'right'> = []
  if (!collapsed.left) keys.push('left')
  if (!collapsed.center) keys.push('center')
  if (!collapsed.right) keys.push('right')
  return keys
})

const gridColumns = computed(() => {
  const keys = visibleKeys.value
  if (!keys.length) return '1fr'
  const total = keys.reduce((sum, key) => sum + widths[key], 0)
  return keys
    .map((key) => `${((widths[key] / total) * 100).toFixed(2)}%`)
    .join(' ')
})

const handlePairs = computed(() => {
  const keys = visibleKeys.value
  const pairs: Array<{ left: 'left' | 'center' | 'right'; right: 'left' | 'center' | 'right'; pos: number }> = []
  if (keys.length < 2) return pairs
  const total = keys.reduce((sum, key) => sum + widths[key], 0)
  let acc = 0
  for (let i = 0; i < keys.length - 1; i++) {
    acc += widths[keys[i]]
    pairs.push({
      left: keys[i],
      right: keys[i + 1],
      pos: (acc / total) * 100,
    })
  }
  return pairs
})

const layoutRef = ref<HTMLElement | null>(null)
const dragging = ref<{
  left: 'left' | 'center' | 'right'
  right: 'left' | 'center' | 'right'
  startX: number
  totalWidth: number
  leftWidth: number
  rightWidth: number
} | null>(null)
const minWidth = 8 // percent of total

const onMouseMove = (e: MouseEvent) => {
  const state = dragging.value
  if (!state) return
  const deltaPx = e.clientX - state.startX
  const deltaPercent = (deltaPx / state.totalWidth) * 100
  let newLeft = state.leftWidth + deltaPercent
  let newRight = state.rightWidth - deltaPercent

  const guard = Math.max(minWidth, 2)
  if (newLeft < guard) {
    newRight -= guard - newLeft
    newLeft = guard
  }
  if (newRight < guard) {
    newLeft -= guard - newRight
    newRight = guard
  }

  widths[state.left] = newLeft
  widths[state.right] = newRight
}

const stopDrag = () => {
  dragging.value = null
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', stopDrag)
}

const startDrag = (
  left: 'left' | 'center' | 'right',
  right: 'left' | 'center' | 'right',
  e: MouseEvent,
) => {
  const el = layoutRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const totalWidth = rect.width
  dragging.value = {
    left,
    right,
    startX: e.clientX,
    totalWidth,
    leftWidth: widths[left],
    rightWidth: widths[right],
  }
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', stopDrag)
}

onBeforeUnmount(() => {
  stopDrag()
})

const toggle = (key: 'left' | 'center' | 'right') => {
  collapsed[key] = !collapsed[key]
}
</script>

<template>
  <section class="manuscript">
    <header class="head">
      <div class="titles">
        <h3>正文</h3>
        <p class="hint">左/中/右三栏布局，可折叠任意一栏。</p>
      </div>
      <div class="actions">
        <button type="button" class="ghost" @click="toggle('left')">
          {{ collapsed.left ? '显示左栏' : '收起左栏' }}
        </button>
        <button type="button" class="ghost" @click="toggle('center')">
          {{ collapsed.center ? '显示中栏' : '收起中栏' }}
        </button>
        <button type="button" class="ghost" @click="toggle('right')">
          {{ collapsed.right ? '显示右栏' : '收起右栏' }}
        </button>
      </div>
    </header>

    <div class="grid-wrapper">
      <div class="layout" ref="layoutRef" :style="{ gridTemplateColumns: gridColumns }">
        <template v-for="key in visibleKeys" :key="`panel-${key}`">
          <section class="panel">
            <header class="panel-head">
              <strong v-if="key === 'left'">左栏</strong>
              <strong v-else-if="key === 'center'">中栏</strong>
              <strong v-else>右栏</strong>
            </header>
            <div class="panel-body">
              <div v-if="key === 'left'" class="outline">
                <h4>卷章结构</h4>
                <ul>
                  <li>卷一 · 待添加</li>
                  <li>卷二 · 待添加</li>
                </ul>
              </div>
              <div v-else-if="key === 'center'" class="manuscript-body">
                <h4>正文内容</h4>
                <textarea placeholder="在这里撰写正文..." />
              </div>
              <div v-else class="ai-chat">
                <h4>AI 聊天</h4>
                <div class="chat-placeholder">未来在此接入对话。</div>
              </div>
            </div>
          </section>
        </template>

        <div
          v-for="pair in handlePairs"
          :key="`handle-${pair.left}-${pair.right}`"
          class="handle"
          :style="{ left: pair.pos + '%' }"
          @mousedown.prevent="startDrag(pair.left, pair.right, $event)"
        ></div>
      </div>

      <p v-if="!visibleKeys.length" class="placeholder empty">全部折叠了，点击上方按钮重新显示任意一栏。</p>
    </div>
  </section>
</template>

<style scoped>
.manuscript {
  color: #2c2f36;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  height: 100%;
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.titles h3 {
  margin: 0 0 0.1rem;
}

.hint {
  margin: 0;
  color: #6c7180;
  font-size: 0.95rem;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.ghost {
  padding: 0.45rem 0.75rem;
  border: 1px solid #d0d4dd;
  background: #f5f6fa;
  cursor: pointer;
  border-radius: 0;
}

.ghost:focus,
.ghost:focus-visible {
  outline: none;
  box-shadow: none;
}

.grid-wrapper {
  flex: 1;
  min-height: 0;
  position: relative;
}

.layout {
  position: relative;
  display: grid;
  grid-template-rows: 1fr;
  gap: 0;
  border: 1px solid #d0d4dd;
  min-height: 320px;
  height: 100%;
  background: #fff;
}

.panel {
  border-right: 1px solid #e5e7ec;
  display: flex;
  flex-direction: column;
}

.panel:last-child {
  border-right: none;
}

.panel-head {
  padding: 0.65rem 0.75rem;
  border-bottom: 1px solid #e5e7ec;
  background: #f9fafc;
}

.panel-body {
  flex: 1;
  padding: 0.75rem;
}

.outline h4,
.manuscript-body h4,
.ai-chat h4 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
}

.outline ul {
  margin: 0;
  padding-left: 1.1rem;
  color: #2c2f36;
}

.manuscript-body textarea {
  width: 100%;
  height: 100%;
  min-height: 240px;
  resize: vertical;
  border: 1px solid #d0d4dd;
  padding: 0.65rem;
  font-size: 0.95rem;
  box-sizing: border-box;
}

.manuscript-body textarea:focus,
.manuscript-body textarea:focus-visible {
  outline: none;
  box-shadow: none;
  border-color: #646cff;
}

.ai-chat .chat-placeholder {
  border: 1px dashed #d0d4dd;
  padding: 0.75rem;
  color: #6c7180;
}

.placeholder {
  margin: 0;
  color: #6c7180;
}

.empty {
  margin-top: 0.5rem;
}

.handle {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 8px;
  margin-left: -4px;
  cursor: col-resize;
  z-index: 5;
}

.handle::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 2px;
  width: 4px;
  background: transparent;
  transition: background 0.15s ease;
}

.handle:hover::after {
  background: rgba(0, 0, 0, 0.08);
}
</style>
