<template>
  <div class="writing-notes">
    <div class="notes-header">
      <h3>写作笔记</h3>
      <div class="header-actions">
        <button @click="showCreateDialog = true" class="add-btn" title="新建笔记">
          <span class="icon">+</span>
        </button>
      </div>
    </div>

    <div class="notes-content">
      <!-- 当前章节笔记 -->
      <div v-if="chapterNotes.length > 0" class="notes-section">
        <h4 class="section-title">
          <span class="icon">📝</span>
          本章笔记 ({{ chapterNotes.length }})
        </h4>
        <div class="notes-list">
          <div 
            v-for="note in chapterNotes" 
            :key="note.id"
            class="note-item chapter-note"
            @click="selectNote(note)"
          >
            <div class="note-header">
              <div class="note-title">{{ note.title || '无标题' }}</div>
              <div class="note-actions">
                <button @click.stop="editNote(note)" class="action-btn" title="编辑">
                  <span class="icon">✏️</span>
                </button>
                <button @click.stop="deleteNote(note)" class="action-btn" title="删除">
                  <span class="icon">🗑️</span>
                </button>
              </div>
            </div>
            <div class="note-content">
              {{ truncateText(note.content, 100) }}
            </div>
            <div class="note-meta">
              <span class="note-type">{{ getNoteTypeText(note.type) }}</span>
              <span class="note-time">{{ formatTime(note.updatedAt) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 项目笔记 -->
      <div class="notes-section">
        <h4 class="section-title">
          <span class="icon">📚</span>
          项目笔记 ({{ projectNotes.length }})
        </h4>
        <div class="notes-list">
          <div 
            v-for="note in projectNotes" 
            :key="note.id"
            class="note-item"
            @click="selectNote(note)"
          >
            <div class="note-header">
              <div class="note-title">{{ note.title || '无标题' }}</div>
              <div class="note-actions">
                <button @click.stop="editNote(note)" class="action-btn" title="编辑">
                  <span class="icon">✏️</span>
                </button>
                <button @click.stop="deleteNote(note)" class="action-btn" title="删除">
                  <span class="icon">🗑️</span>
                </button>
              </div>
            </div>
            <div class="note-content">
              {{ truncateText(note.content, 100) }}
            </div>
            <div class="note-meta">
              <span class="note-type">{{ getNoteTypeText(note.type) }}</span>
              <span class="note-time">{{ formatTime(note.updatedAt) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 无笔记提示 -->
      <div v-if="allNotes.length === 0" class="empty-state">
        <div class="empty-icon">📝</div>
        <p>暂无写作笔记</p>
        <button @click="showCreateDialog = true" class="btn btn-primary">
          创建第一个笔记
        </button>
      </div>
    </div>

    <!-- 笔记详情/编辑对话框 -->
    <div v-if="showNoteDialog" class="note-dialog-overlay" @click="closeNoteDialog">
      <div class="note-dialog" @click.stop>
        <div class="dialog-header">
          <h3>{{ editingNote ? '编辑笔记' : '新建笔记' }}</h3>
          <button @click="closeNoteDialog" class="close-btn">×</button>
        </div>
        
        <div class="dialog-content">
          <div class="form-group">
            <label>笔记标题</label>
            <input v-model="noteForm.title" type="text" placeholder="输入笔记标题（可选）">
          </div>
          
          <div class="form-group">
            <label>笔记类型</label>
            <select v-model="noteForm.type">
              <option value="idea">灵感想法</option>
              <option value="plot">情节构思</option>
              <option value="character">人物设定</option>
              <option value="dialogue">对话记录</option>
              <option value="research">资料研究</option>
              <option value="todo">待办事项</option>
              <option value="other">其他</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>关联章节</label>
            <select v-model="noteForm.chapterId">
              <option value="">无关联（项目笔记）</option>
              <option v-if="currentChapter" :value="currentChapter.id">
                当前章节: {{ currentChapter.title || `第${currentChapter.order}章` }}
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label>笔记内容</label>
            <textarea 
              v-model="noteForm.content" 
              placeholder="输入笔记内容..." 
              rows="8"
              class="note-textarea"
            ></textarea>
          </div>
          
          <div class="form-group">
            <label>标签 (用逗号分隔)</label>
            <input v-model="noteForm.tagsInput" type="text" placeholder="例如: 重要, 待修改, 灵感">
          </div>
        </div>
        
        <div class="dialog-actions">
          <button @click="saveNote" class="btn btn-primary" :disabled="!noteForm.content.trim()">
            {{ editingNote ? '保存' : '创建' }}
          </button>
          <button @click="closeNoteDialog" class="btn btn-secondary">
            取消
          </button>
        </div>
      </div>
    </div>

    <!-- 快速笔记输入框 -->
    <div class="quick-note">
      <div class="quick-note-header">
        <span class="icon">⚡</span>
        <span>快速笔记</span>
      </div>
      <textarea 
        v-model="quickNoteContent"
        placeholder="快速记录想法..."
        rows="3"
        class="quick-textarea"
        @keydown.ctrl.enter="saveQuickNote"
      ></textarea>
      <div class="quick-actions">
        <button @click="saveQuickNote" class="btn btn-small" :disabled="!quickNoteContent.trim()">
          保存 (Ctrl+Enter)
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { storageService } from '@/services/storage'

export default {
  name: 'WritingNotes',
  props: {
    projectId: {
      type: String,
      required: true
    },
    chapterId: {
      type: String,
      default: null
    },
    currentChapter: {
      type: Object,
      default: null
    }
  },
  setup(props) {
    const notes = ref([])
    const showCreateDialog = ref(false)
    const showNoteDialog = ref(false)
    const editingNote = ref(null)
    const quickNoteContent = ref('')
    const loading = ref(false)

    // 笔记表单
    const noteForm = ref({
      title: '',
      type: 'idea',
      content: '',
      chapterId: '',
      tagsInput: ''
    })

    // 笔记类型配置
    const noteTypes = {
      idea: '灵感想法',
      plot: '情节构思',
      character: '人物设定',
      dialogue: '对话记录',
      research: '资料研究',
      todo: '待办事项',
      other: '其他'
    }

    // 所有笔记
    const allNotes = computed(() => notes.value)

    // 当前章节笔记
    const chapterNotes = computed(() => {
      if (!props.chapterId) return []
      return notes.value.filter(note => note.chapterId === props.chapterId)
    })

    // 项目笔记（不关联特定章节）
    const projectNotes = computed(() => {
      return notes.value.filter(note => !note.chapterId)
    })

    // 加载笔记
    const loadNotes = async () => {
      if (!props.projectId) return
      
      loading.value = true
      try {
        const projectNotes = await storageService.getProjectNotes(props.projectId)
        notes.value = projectNotes || []
      } catch (error) {
        console.error('加载笔记失败:', error)
      } finally {
        loading.value = false
      }
    }

    // 选择笔记
    const selectNote = (note) => {
      console.log('选择笔记:', note.title || note.id)
    }

    // 编辑笔记
    const editNote = (note) => {
      editingNote.value = note
      noteForm.value = {
        title: note.title || '',
        type: note.type || 'idea',
        content: note.content || '',
        chapterId: note.chapterId || '',
        tagsInput: note.tags ? note.tags.join(', ') : ''
      }
      showNoteDialog.value = true
    }

    // 删除笔记
    const deleteNote = async (note) => {
      if (!confirm('确定要删除这个笔记吗？')) return
      
      try {
        await storageService.deleteNote(note.id)
        notes.value = notes.value.filter(n => n.id !== note.id)
        console.log('笔记删除成功')
      } catch (error) {
        console.error('删除笔记失败:', error)
        alert('删除笔记失败，请重试')
      }
    }

    // 保存笔记
    const saveNote = async () => {
      if (!noteForm.value.content.trim()) return
      
      try {
        const tags = noteForm.value.tagsInput 
          ? noteForm.value.tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag)
          : []

        const noteData = {
          title: noteForm.value.title.trim() || null,
          type: noteForm.value.type,
          content: noteForm.value.content.trim(),
          chapterId: noteForm.value.chapterId || null,
          tags,
          projectId: props.projectId
        }
        
        if (editingNote.value) {
          // 更新现有笔记
          const updatedNote = await storageService.updateNote(editingNote.value.id, noteData)
          const index = notes.value.findIndex(n => n.id === editingNote.value.id)
          if (index >= 0) {
            notes.value[index] = updatedNote
          }
          console.log('笔记更新成功')
        } else {
          // 创建新笔记
          const createdNote = await storageService.createNote(noteData)
          notes.value.unshift(createdNote)
          console.log('笔记创建成功')
        }
        
        closeNoteDialog()
      } catch (error) {
        console.error('保存笔记失败:', error)
        alert('保存笔记失败，请重试')
      }
    }

    // 保存快速笔记
    const saveQuickNote = async () => {
      if (!quickNoteContent.value.trim()) return
      
      try {
        const noteData = {
          title: null,
          type: 'idea',
          content: quickNoteContent.value.trim(),
          chapterId: props.chapterId || null,
          tags: [],
          projectId: props.projectId
        }
        
        const createdNote = await storageService.createNote(noteData)
        notes.value.unshift(createdNote)
        quickNoteContent.value = ''
        console.log('快速笔记保存成功')
      } catch (error) {
        console.error('保存快速笔记失败:', error)
        alert('保存快速笔记失败，请重试')
      }
    }

    // 显示创建对话框
    const showCreateDialog = () => {
      editingNote.value = null
      noteForm.value = {
        title: '',
        type: 'idea',
        content: '',
        chapterId: props.chapterId || '',
        tagsInput: ''
      }
      showNoteDialog.value = true
    }

    // 关闭笔记对话框
    const closeNoteDialog = () => {
      showNoteDialog.value = false
      editingNote.value = null
      noteForm.value = {
        title: '',
        type: 'idea',
        content: '',
        chapterId: '',
        tagsInput: ''
      }
    }

    // 获取笔记类型文本
    const getNoteTypeText = (type) => {
      return noteTypes[type] || type
    }

    // 截断文本
    const truncateText = (text, maxLength) => {
      if (!text) return ''
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
    }

    // 格式化时间
    const formatTime = (dateString) => {
      if (!dateString) return ''
      const date = new Date(dateString)
      const now = new Date()
      const diffTime = now - date
      const diffMinutes = Math.floor(diffTime / (1000 * 60))
      
      if (diffMinutes < 1) {
        return '刚刚'
      } else if (diffMinutes < 60) {
        return `${diffMinutes}分钟前`
      } else if (diffMinutes < 1440) {
        return `${Math.floor(diffMinutes / 60)}小时前`
      } else {
        return date.toLocaleDateString('zh-CN')
      }
    }

    // 监听项目变化
    watch(() => props.projectId, () => {
      loadNotes()
    }, { immediate: true })

    onMounted(() => {
      loadNotes()
    })

    return {
      notes,
      showCreateDialog: showCreateDialog,
      showNoteDialog,
      editingNote,
      noteForm,
      quickNoteContent,
      loading,
      allNotes,
      chapterNotes,
      projectNotes,
      selectNote,
      editNote,
      deleteNote,
      saveNote,
      saveQuickNote,
      showCreateDialog: showCreateDialog,
      closeNoteDialog,
      getNoteTypeText,
      truncateText,
      formatTime
    }
  }
}
</script>

<style scoped>
.writing-notes {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.notes-header {
  padding: 16px;
  border-bottom: 1px solid #e1e4e8;
  background: #f6f8fa;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.notes-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #24292e;
}

.add-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #d1d5da;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #586069;
  transition: all 0.2s;
}

.add-btn:hover {
  background: #f6f8fa;
  border-color: #28a745;
  color: #28a745;
}

.notes-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.notes-section {
  margin-bottom: 24px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #586069;
}

.notes-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.note-item {
  padding: 12px;
  background: white;
  border: 1px solid #e1e4e8;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.note-item:hover {
  border-color: #0366d6;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.note-item.chapter-note {
  border-left: 3px solid #f66a0a;
}

.note-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.note-title {
  font-weight: 600;
  color: #24292e;
  font-size: 14px;
}

.note-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.note-item:hover .note-actions {
  opacity: 1;
}

.action-btn {
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  border-radius: 3px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #586069;
  transition: all 0.2s;
  font-size: 10px;
}

.action-btn:hover {
  background: #e1e4e8;
  color: #24292e;
}

.note-content {
  font-size: 12px;
  color: #586069;
  line-height: 1.4;
  margin-bottom: 6px;
}

.note-meta {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #8b949e;
}

.note-type {
  padding: 1px 4px;
  background: #f1f8ff;
  color: #0366d6;
  border-radius: 8px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
  color: #586069;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

/* 快速笔记 */
.quick-note {
  border-top: 1px solid #e1e4e8;
  background: #f6f8fa;
  padding: 12px;
}

.quick-note-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #24292e;
}

.quick-textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #d1d5da;
  border-radius: 6px;
  font-size: 12px;
  resize: vertical;
  outline: none;
  box-sizing: border-box;
}

.quick-textarea:focus {
  border-color: #0366d6;
  box-shadow: 0 0 0 3px rgba(3, 102, 214, 0.1);
}

.quick-actions {
  margin-top: 8px;
  text-align: right;
}

.btn-small {
  padding: 4px 8px;
  font-size: 12px;
}

/* 笔记对话框 */
.note-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.note-dialog {
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #e1e4e8;
  background: #f6f8fa;
}

.dialog-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #24292e;
}

.close-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 18px;
  color: #586069;
  border-radius: 4px;
  transition: background 0.2s;
}

.close-btn:hover {
  background: #e1e4e8;
}

.dialog-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #24292e;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5da;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
}

.note-textarea {
  resize: vertical;
  font-family: inherit;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  border-color: #0366d6;
  box-shadow: 0 0 0 3px rgba(3, 102, 214, 0.1);
}

.dialog-actions {
  display: flex;
  gap: 8px;
  padding: 16px;
  border-top: 1px solid #e1e4e8;
  background: #f6f8fa;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary {
  background: #0366d6;
  color: white;
}

.btn-primary:hover {
  background: #0256cc;
}

.btn-secondary {
  background: #f6f8fa;
  color: #24292e;
  border: 1px solid #d1d5da;
}

.btn-secondary:hover {
  background: #e1e4e8;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 滚动条样式 */
.notes-content::-webkit-scrollbar,
.dialog-content::-webkit-scrollbar {
  width: 6px;
}

.notes-content::-webkit-scrollbar-track,
.dialog-content::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.notes-content::-webkit-scrollbar-thumb,
.dialog-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.notes-content::-webkit-scrollbar-thumb:hover,
.dialog-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>