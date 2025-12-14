<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import ManuscriptOutline from './editor_manuscript/manuscript_outline.vue'
import ManuscriptBody from './editor_manuscript/manuscript_body.vue'
import ManuscriptAi from './editor_manuscript/manuscript_ai.vue'
import ManuscriptMentions from './editor_manuscript/manuscript_mentions.vue'

defineProps<{
  projectPath: string
}>()

const collapsed = reactive({
  left: false,
  center: false,
  mentions: false,
  right: false,
})

const widths = reactive<Record<'left' | 'center' | 'mentions' | 'right', number>>({
  left: 22,
  center: 38,
  mentions: 20,
  right: 20,
})

const visibleKeys = computed(() => {
  const keys: Array<'left' | 'center' | 'mentions' | 'right'> = []
  if (!collapsed.left) keys.push('left')
  if (!collapsed.center) keys.push('center')
  if (!collapsed.mentions) keys.push('mentions')
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
  const pairs: Array<{
    left: 'left' | 'center' | 'mentions' | 'right'
    right: 'left' | 'center' | 'mentions' | 'right'
    pos: number
  }> = []
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
  left: 'left' | 'center' | 'mentions' | 'right'
  right: 'left' | 'center' | 'mentions' | 'right'
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
  left: 'left' | 'center' | 'mentions' | 'right',
  right: 'left' | 'center' | 'mentions' | 'right',
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

const toggle = (key: 'left' | 'center' | 'mentions' | 'right') => {
  collapsed[key] = !collapsed[key]
}

const currentChapter = ref<{ id: string; name: string; synopsis?: string; content?: string } | null>(null)
const liveContent = ref('')

const handleOpenChapter = (chapter: { id: string; name: string; synopsis?: string; content?: string }) => {
  currentChapter.value = chapter
  liveContent.value = chapter.content ?? ''
}

const handleChapterUpdated = (chapter: { id: string; name: string; synopsis?: string; content?: string }) => {
  currentChapter.value = chapter
  liveContent.value = chapter.content ?? ''
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
        <button type="button" class="ghost" @click="toggle('mentions')">
          {{ collapsed.mentions ? '显示提及栏' : '收起提及栏' }}
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
              <strong v-else-if="key === 'mentions'">提及</strong>
              <strong v-else>右栏</strong>
            </header>
            <div class="panel-body">
              <ManuscriptOutline v-if="key === 'left'" :project-path="projectPath" @open-chapter="handleOpenChapter" />
              <ManuscriptBody
                v-else-if="key === 'center'"
                :project-path="projectPath"
                :chapter="currentChapter"
                @content-change="liveContent = $event"
                @updated="handleChapterUpdated"
              />
              <ManuscriptMentions
                v-else-if="key === 'mentions'"
                :project-path="projectPath"
                :chapter="currentChapter"
                :content="liveContent"
              />
              <ManuscriptAi
                v-else
                :project-path="projectPath"
                :current-chapter="currentChapter"
                :live-content="liveContent"
              />
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
  min-height: 0;
}

.panel {
  border-right: 1px solid #e5e7ec;
  display: flex;
  flex-direction: column;
  min-height: 0;
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
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
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
