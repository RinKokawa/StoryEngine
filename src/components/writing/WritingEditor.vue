<template>
  <main class="editor-main" :class="{ fullscreen: isFullscreen }">
    <div class="editor-container">
      <textarea
        ref="editorRef"
        :value="content"
        @input="handleInput"
        @scroll="$emit('scroll', $event)"
        @keydown="handleKeydown"
        class="editor"
        placeholder="开始你的创作... 输入 @ 可以选择角色"
        spellcheck="false"
      ></textarea>
      <div v-if="showPreview" class="preview-panel">
        <div class="preview-content" v-html="formattedContent"></div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  content: string
  showPreview: boolean
  isFullscreen: boolean
}

interface Emits {
  (e: 'update:content', content: string): void
  (e: 'scroll', event: Event): void
  (e: 'keydown', event: KeyboardEvent): void
  (e: 'atSymbol', textarea: HTMLTextAreaElement): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const editorRef = ref<HTMLTextAreaElement>()

const formattedContent = computed(() => 
  props.content
    .replace(/\n/g, '<br>')
    .replace(/^(\s{4,}|\t+)(.+)$/gm, '<div class="indent">$2</div>')
)

const handleInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  emit('update:content', target.value)
}

const handleKeydown = (event: KeyboardEvent) => {
  emit('keydown', event)
  
  // 检测 @ 符号
  if (event.key === '@' && editorRef.value) {
    setTimeout(() => {
      emit('atSymbol', editorRef.value!)
    }, 0)
  }
}

// 暴露编辑器引用给父组件
defineExpose({
  editorRef
})
</script>

<style scoped>
.editor-main {
  flex: 1;
  display: flex;
  align-items: stretch;
  background: var(--main-bg);
  transition: background 0.5s;
}

.editor-container {
  flex: 1;
  display: flex;
  position: relative;
  height: 100%;
}

.editor {
  flex: 1;
  width: 100%;
  height: 100%;
  min-height: 480px;
  font-size: 1.15rem;
  font-family: 'JetBrains Mono', 'Fira Mono', 'Consolas', 'Menlo', 'monospace', 'PingFang SC', 'Microsoft YaHei', Arial, sans-serif;
  padding: 2.2rem 2.5rem;
  border: none;
  outline: none;
  background: var(--card-bg);
  color: var(--title-color);
  border-radius: 1.5rem;
  box-shadow: var(--card-shadow);
  resize: none;
  transition: background 0.3s, color 0.3s;
}

.preview-panel {
  position: absolute;
  top: 0;
  right: 0;
  width: 48%;
  height: 100%;
  background: var(--card-bg);
  border-radius: 1.5rem;
  box-shadow: var(--card-shadow);
  padding: 2.2rem 2.5rem;
  overflow-y: auto;
  z-index: 2;
  border-left: 2px solid var(--border);
}

.preview-content {
  color: var(--title-color);
  font-size: 1.1rem;
  line-height: 1.8;
}

.preview-content .indent {
  margin-left: 2rem;
  font-style: italic;
  opacity: 0.8;
}
</style>