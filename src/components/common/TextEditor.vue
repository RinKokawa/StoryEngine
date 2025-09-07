<!--
TextEditor.vue - 基于 CodeMirror 6 的通用文本编辑器组件

Props:
- modelValue: string - v-model 绑定的文本内容
- placeholder?: string - 占位符文本
- autofocus?: boolean - 是否自动聚焦
- readOnly?: boolean - 是否只读
- wordWrap?: boolean - 是否启用软换行（默认 true）
- extensions?: any[] - 额外的 CodeMirror 扩展

Events:
- update:modelValue: (value: string) => void - 文本内容变化事件

使用示例:
<TextEditor 
  v-model="content" 
  placeholder="请输入内容..."
  :autofocus="true"
  :wordWrap="true"
/>

如何关闭 Markdown 支持:
传入 extensions 覆盖默认配置，不包含 markdown() 即可

如何添加额外扩展:
<TextEditor 
  v-model="content"
  :extensions="[spellChecker(), customTheme]"
/>
-->

<template>
  <div ref="editorContainer" class="text-editor-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { EditorView, keymap, placeholder as placeholderExtension, lineNumbers } from '@codemirror/view'
import { EditorState, Extension } from '@codemirror/state'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { indentOnInput, bracketMatching, foldGutter, foldKeymap } from '@codemirror/language'
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search'
import { markdown } from '@codemirror/lang-markdown'

interface Props {
  modelValue: string
  placeholder?: string
  autofocus?: boolean
  readOnly?: boolean
  wordWrap?: boolean
  extensions?: Extension[]
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '',
  autofocus: false,
  readOnly: false,
  wordWrap: true,
  extensions: () => []
})

const emit = defineEmits<Emits>()

const editorContainer = ref<HTMLElement>()
let editorView: EditorView | null = null
let isInternalUpdate = false

// 创建编辑器扩展配置
const createExtensions = (): Extension[] => {
  const baseExtensions: Extension[] = [
    // 基础功能
    history(),
    indentOnInput(),
    bracketMatching(),
    foldGutter(),
    highlightSelectionMatches(),
    
    // 快捷键
    keymap.of([
      ...defaultKeymap,
      ...historyKeymap,
      ...foldKeymap,
      ...searchKeymap,
      indentWithTab
    ]),
    
    // 编辑器行为
    EditorView.updateListener.of((update) => {
      if (update.docChanged && !isInternalUpdate) {
        const newValue = update.state.doc.toString()
        emit('update:modelValue', newValue)
      }
    }),
    
    // 增强样式和布局
    EditorView.theme({
      '&': {
        fontSize: '16px',
        fontFamily: '"Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", sans-serif',
        border: '1px solid #d1d5db',
        borderRadius: '8px',
        overflow: 'hidden'
      },
      '.cm-content': {
        padding: '16px',
        minHeight: '280px',
        lineHeight: '1.8',
        caretColor: '#007bff'
      },
      '.cm-focused': {
        outline: '2px solid #007bff',
        outlineOffset: '-2px'
      },
      '.cm-editor': {
        height: '100%'
      },
      '.cm-scroller': {
        fontFamily: 'inherit'
      },
      '.cm-line': {
        padding: '2px 0'
      },
      '.cm-cursor': {
        borderLeft: '2px solid #007bff'
      },
      '.cm-selectionBackground': {
        backgroundColor: 'rgba(0, 123, 255, 0.15)'
      },
      '.cm-activeLine': {
        backgroundColor: 'rgba(0, 123, 255, 0.05)'
      },
      '.cm-gutters': {
        backgroundColor: '#f8f9fa',
        borderRight: '1px solid #e9ecef'
      },
      '.cm-foldGutter .cm-gutterElement': {
        textAlign: 'center',
        cursor: 'pointer'
      },
      '.cm-searchMatch': {
        backgroundColor: 'rgba(255, 255, 0, 0.4)',
        border: '1px solid #ffc107'
      },
      '.cm-searchMatch.cm-searchMatch-selected': {
        backgroundColor: 'rgba(255, 193, 7, 0.6)'
      }
    })
  ]

  // 行号显示
  baseExtensions.push(lineNumbers())
  
  // 软换行
  if (props.wordWrap) {
    baseExtensions.push(EditorView.lineWrapping)
  }

  // 占位符
  if (props.placeholder) {
    baseExtensions.push(placeholderExtension(props.placeholder))
  }

  // 只读模式
  if (props.readOnly) {
    baseExtensions.push(EditorState.readOnly.of(true))
  }

  // Markdown 支持（如果没有自定义扩展覆盖）
  if (props.extensions.length === 0) {
    baseExtensions.push(markdown())
  }

  // 自动补全括号和段落缩进
  baseExtensions.push(
    keymap.of([
      {
        key: 'Enter',
        run: (view) => {
          const { state } = view
          const { selection } = state
          const line = state.doc.lineAt(selection.main.head)
          const lineText = line.text
          
          // 如果当前行为空或只有空格，添加段落缩进
          if (lineText.trim() === '') {
            const indent = '　　' // 两个全角空格
            view.dispatch({
              changes: {
                from: selection.main.head,
                insert: '\n' + indent
              },
              selection: {
                anchor: selection.main.head + 1 + indent.length
              }
            })
            return true
          }
          return false
        }
      }
    ])
  )

  // 添加自定义扩展
  baseExtensions.push(...props.extensions)

  return baseExtensions
}

// 初始化编辑器
const initEditor = () => {
  if (!editorContainer.value) return

  const state = EditorState.create({
    doc: props.modelValue,
    extensions: createExtensions()
  })

  editorView = new EditorView({
    state,
    parent: editorContainer.value
  })

  // 自动聚焦
  if (props.autofocus) {
    nextTick(() => {
      editorView?.focus()
    })
  }
}

// 更新编辑器内容
const updateEditorContent = (newValue: string) => {
  if (!editorView || isInternalUpdate) return
  
  const currentValue = editorView.state.doc.toString()
  if (currentValue !== newValue) {
    isInternalUpdate = true
    editorView.dispatch({
      changes: {
        from: 0,
        to: editorView.state.doc.length,
        insert: newValue
      }
    })
    isInternalUpdate = false
  }
}

// 监听 modelValue 变化
watch(() => props.modelValue, (newValue) => {
  updateEditorContent(newValue)
})

// 监听其他 props 变化，重新创建编辑器
watch([() => props.readOnly, () => props.wordWrap, () => props.placeholder, () => props.extensions], () => {
  if (editorView) {
    const currentValue = editorView.state.doc.toString()
    editorView.destroy()
    initEditor()
    updateEditorContent(currentValue)
  }
}, { deep: true })

onMounted(() => {
  initEditor()
})

onUnmounted(() => {
  if (editorView) {
    editorView.destroy()
    editorView = null
  }
})

// 暴露编辑器实例供父组件使用
defineExpose({
  focus: () => editorView?.focus(),
  blur: () => editorView?.contentDOM.blur(),
  getSelection: () => editorView?.state.selection,
  getEditorView: () => editorView
})
</script>

<style scoped>
.text-editor-container {
  height: 100%;
  min-height: 280px;
  overflow: hidden;
}

.text-editor-container :deep(.cm-editor) {
  height: 100%;
}

.text-editor-container :deep(.cm-content) {
  min-height: 280px;
}

.text-editor-container :deep(.cm-focused) {
  outline: none;
}

/* 占位符样式 */
.text-editor-container :deep(.cm-placeholder) {
  color: #9ca3af;
  font-style: italic;
}

/* 当前行高亮 */
.text-editor-container :deep(.cm-activeLine) {
  background-color: rgba(59, 130, 246, 0.05);
}

/* 选择区域样式 */
.text-editor-container :deep(.cm-selectionBackground) {
  background-color: rgba(59, 130, 246, 0.2);
}
</style>