<template>
  <div class="chapter-list">
    <!-- 章节项 -->
    <div 
      v-for="chapter in chapters" 
      :key="chapter.id"
      class="tree-item chapter-item"
      :class="{ 'selected': selectedChapter?.id === chapter.id }"
      @click="handleSelectChapter(chapter)"
    >
      <div class="tree-node">
        <div class="node-content">
          <div class="node-indent"></div>
          <svg class="file-icon" viewBox="0 0 16 16" width="16" height="16">
            <path fill="currentColor" d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688l-.011-.013-2.914-2.914-.013-.011Z"/>
          </svg>
          <span class="node-label">{{ chapter.title || '未命名章节' }}</span>
          <span class="node-meta" v-if="chapter.wordCount">{{ formatWordCount(chapter.wordCount) }}</span>
        </div>
        <div class="node-actions" @click.stop>
          <button @click="handleEditChapter(chapter)" class="action-btn" title="编辑" :disabled="isProcessing">
            <svg viewBox="0 0 16 16" width="12" height="12">
              <path fill="currentColor" d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Zm.176 4.823L9.75 4.81l-6.286 6.287a.253.253 0 0 0-.064.108l-.558 1.953 1.953-.558a.253.253 0 0 0 .108-.064Z"/>
            </svg>
          </button>
          <button @click="handleDeleteChapter(chapter)" class="action-btn delete" title="删除" :disabled="isProcessing">
            <svg viewBox="0 0 16 16" width="12" height="12">
              <path fill="currentColor" d="M11 1.75V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM4.496 6.675l.66 6.6a.25.25 0 0 0 .249.225h5.19a.25.25 0 0 0 .249-.225l.66-6.6a.75.75 0 0 1 1.492.149l-.66 6.6A1.748 1.748 0 0 1 10.595 15h-5.19a1.748 1.748 0 0 1-1.741-1.575l-.66-6.6a.75.75 0 1 1 1.492-.15ZM6.5 1.75V3h3V1.75a.25.25 0 0 0-.25-.25h-2.5a.25.25 0 0 0-.25.25Z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 添加章节按钮 -->
    <div class="tree-item add-item" @click="handleCreateChapter">
      <div class="tree-node">
        <div class="node-content">
          <div class="node-indent"></div>
          <svg class="add-icon" viewBox="0 0 16 16" width="16" height="16">
            <path fill="currentColor" d="M7.75 2a.75.75 0 0 1 .75.75V7h4.25a.75.75 0 0 1 0 1.5H8.5v4.25a.75.75 0 0 1-1.5 0V8.5H2.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2Z"/>
          </svg>
          <span class="node-label add-label">新建章节</span>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="chapters.length === 0" class="tree-item empty-item">
      <div class="tree-node">
        <div class="node-content">
          <div class="node-indent"></div>
          <span class="empty-text">暂无章节</span>
        </div>
      </div>
    </div>

    <!-- 章节编辑对话框 -->
    <div v-if="showChapterDialog" class="modal-overlay" @click.self="closeChapterDialog">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3>{{ editingChapter ? '编辑章节' : '新建章节' }}</h3>
          <button @click="closeChapterDialog" class="close-btn">×</button>
        </div>
        <form @submit.prevent="saveChapter" class="modal-form">
          <div class="form-field">
            <label>标题</label>
            <input v-model="chapterForm.title" type="text" required placeholder="输入章节标题">
          </div>
          <div class="form-field">
            <label>所属卷</label>
            <select v-model="chapterForm.volumeId" required>
              <option value="">选择卷</option>
              <option v-for="volume in volumes" :key="volume.id" :value="volume.id">
                {{ volume.title }}
              </option>
            </select>
          </div>
          <div class="modal-actions">
            <button type="button" @click="closeChapterDialog" :disabled="isProcessing">取消</button>
            <button type="submit" :disabled="isProcessing" class="primary">
              {{ isProcessing ? '保存中...' : '保存' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { formatWordCount, validateChapterData } from '../../utils/volumeChapterUtils.js'

export default {
  name: 'ChapterList',
  props: {
    chapters: {
      type: Array,
      required: true
    },
    volumes: {
      type: Array,
      required: true
    },
    volumeId: {
      type: String,
      required: true
    },
    selectedChapter: {
      type: Object,
      default: null
    },
    isProcessing: {
      type: Boolean,
      default: false
    }
  },
  emits: [
    'select-chapter',
    'create-chapter',
    'edit-chapter',
    'delete-chapter'
  ],
  setup(props, { emit }) {
    // 对话框状态
    const showChapterDialog = ref(false)
    const editingChapter = ref(null)
    const chapterForm = ref({
      title: '',
      volumeId: ''
    })

    // 事件处理
    const handleSelectChapter = (chapter) => {
      emit('select-chapter', chapter)
    }

    const handleCreateChapter = () => {
      editingChapter.value = null
      chapterForm.value = {
        title: '',
        volumeId: props.volumeId
      }
      showChapterDialog.value = true
    }

    const handleEditChapter = (chapter) => {
      editingChapter.value = chapter
      chapterForm.value = {
        title: chapter.title,
        volumeId: chapter.volumeId
      }
      showChapterDialog.value = true
    }

    const handleDeleteChapter = async (chapter) => {
      if (!confirm(`确定要删除章节"${chapter.title}"吗？`)) {
        return
      }

      try {
        emit('delete-chapter', chapter.id)
      } catch (error) {
        console.error('删除章节失败:', error)
        alert('删除失败，请重试')
      }
    }

    const saveChapter = async () => {
      if (!validateChapterData(chapterForm.value)) {
        alert('请填写有效的章节信息')
        return
      }

      try {
        if (editingChapter.value) {
          const updatedChapter = {
            ...editingChapter.value,
            ...chapterForm.value
          }
          emit('edit-chapter', updatedChapter)
        } else {
          emit('create-chapter', chapterForm.value)
        }
        closeChapterDialog()
      } catch (error) {
        console.error('保存章节失败:', error)
        alert('保存失败，请重试')
      }
    }

    const closeChapterDialog = () => {
      showChapterDialog.value = false
      editingChapter.value = null
    }

    return {
      // 对话框状态
      showChapterDialog,
      editingChapter,
      chapterForm,

      // 工具函数
      formatWordCount,

      // 事件处理
      handleSelectChapter,
      handleCreateChapter,
      handleEditChapter,
      handleDeleteChapter,
      saveChapter,
      closeChapterDialog
    }
  }
}
</script>

<style scoped>
@import '../../styles/volumeChapterStyles.css';
</style>