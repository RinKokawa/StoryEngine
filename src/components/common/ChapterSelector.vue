<template>
  <div class="chapter-selector">
    <div class="chapter-header">
      <h3>章节管理</h3>
      <button @click="createNewChapter" class="create-btn" title="新建章节">
        <span>+</span>
      </button>
    </div>
    
    <div class="chapter-list" v-if="chapters.length > 0">
      <div 
        v-for="chapter in sortedChapters" 
        :key="chapter.id"
        :class="['chapter-item', { active: chapter.id === currentChapterId }]"
        @click="selectChapter(chapter)"
        @contextmenu="showContextMenu($event, chapter)"
      >
        <div class="chapter-info">
          <div class="chapter-title">{{ chapter.title || `第${chapter.order}章` }}</div>
          <div class="chapter-meta">
            <span class="word-count">{{ chapter.wordCount || 0 }}字</span>
            <span class="status" :class="chapter.status">{{ getStatusText(chapter.status) }}</span>
          </div>
        </div>
        <div class="chapter-actions">
          <button @click.stop="editChapter(chapter)" class="edit-btn" title="编辑章节信息">
            ✏️
          </button>
          <button @click.stop="deleteChapter(chapter)" class="delete-btn" title="删除章节">
            🗑️
          </button>
        </div>
      </div>
    </div>
    
    <div v-else class="empty-state">
      <p>暂无章节</p>
      <button @click="createNewChapter" class="create-first-btn">创建第一章</button>
    </div>

    <!-- 章节编辑对话框 -->
    <div v-if="showEditDialog" class="dialog-overlay" @click="closeEditDialog">
      <div class="dialog" @click.stop>
        <div class="dialog-header">
          <h4>{{ editingChapter.id ? '编辑章节' : '新建章节' }}</h4>
          <button @click="closeEditDialog" class="close-btn">×</button>
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label>章节标题</label>
            <input 
              v-model="editingChapter.title" 
              type="text" 
              placeholder="请输入章节标题"
              @keyup.enter="saveChapter"
            />
          </div>
          <div class="form-group">
            <label>章节顺序</label>
            <input 
              v-model.number="editingChapter.order" 
              type="number" 
              min="1"
              :max="chapters.length + 1"
            />
          </div>
          <div class="form-group">
            <label>状态</label>
            <select v-model="editingChapter.status">
              <option value="draft">草稿</option>
              <option value="writing">写作中</option>
              <option value="completed">已完成</option>
            </select>
          </div>
          <div class="form-group">
            <label>章节简介</label>
            <textarea
              v-model="editingChapter.notes"
              placeholder="章节简介或备注（可选）"
              rows="3"
              class="form-textarea"
            ></textarea>
          </div>
        </div>
        <div class="dialog-footer">
          <button @click="closeEditDialog" class="cancel-btn">取消</button>
          <button @click="saveChapter" class="save-btn">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { storageService } from '@/services/storage'

/* migrated to storageService */ 

export default {
  name: 'ChapterSelector',
  props: {
    projectId: {
      type: String,
      required: true
    },
    currentChapterId: {
      type: String,
      default: null
    }
  },
  emits: ['chapter-selected', 'chapter-created', 'chapter-updated', 'chapter-deleted'],
  setup(props, { emit }) {
    const chapters = ref([])
    const showEditDialog = ref(false)
    const editingChapter = ref({
      id: null,
      title: '',
      order: 1,
      status: 'draft',
      notes: ''
    })

    // 按顺序排序的章节
    const sortedChapters = computed(() => {
      return [...chapters.value].sort((a, b) => (a.order || 0) - (b.order || 0))
    })

    // 加载章节列表
    const loadChapters = async () => {
      if (props.projectId) {
        chapters.value = await storageService.getProjectChapters(props.projectId)
      }
    }

    // 监听项目ID变化
    watch(() => props.projectId, () => {
      loadChapters()
    }, { immediate: true })

    // 选择章节
    const selectChapter = (chapter) => {
      emit('chapter-selected', chapter)
    }

    // 创建新章节
    const createNewChapter = () => {
      editingChapter.value = {
        id: null,
        title: `第${chapters.value.length + 1}章`,
        order: chapters.value.length + 1,
        status: 'draft',
        notes: ''
      }
      showEditDialog.value = true
    }

    // 编辑章节
    const editChapter = (chapter) => {
      editingChapter.value = {
        id: chapter.id,
        title: chapter.title,
        order: chapter.order,
        status: chapter.status,
        notes: chapter.notes || ''
      }
      showEditDialog.value = true
    }

    // 保存章节
    const saveChapter = async () => {
      if (!editingChapter.value.title.trim()) {
        alert('请输入章节标题')
        return
      }

      const chapterData = {
        ...editingChapter.value,
        title: editingChapter.value.title.trim()
      }

      if (chapterData.id) {
        // 更新现有章节
        const updatedChapter = await storageService.updateChapter(props.projectId, chapterData)
        if (updatedChapter) {
          const index = chapters.value.findIndex(c => c.id === chapterData.id)
          if (index >= 0) {
            chapters.value[index] = updatedChapter
          }
          emit('chapter-updated', updatedChapter)
        }
      } else {
        // 创建新章节
        const newChapter = await storageService.createChapter(props.projectId, chapterData)
        if (newChapter) {
          chapters.value.push(newChapter)
          emit('chapter-created', newChapter)
        }
      }

      closeEditDialog()
    }

    // 删除章节
    const deleteChapter = async (chapter) => {
      if (confirm(`确定要删除章节"${chapter.title}"吗？此操作不可撤销。`)) {
        const success = await storageService.deleteChapter(props.projectId, chapter.id)
        if (success) {
          chapters.value = chapters.value.filter(c => c.id !== chapter.id)
          emit('chapter-deleted', chapter)
        }
      }
    }

    // 关闭编辑对话框
    const closeEditDialog = () => {
      showEditDialog.value = false
      editingChapter.value = {
        id: null,
        title: '',
        order: 1,
        status: 'draft',
        notes: ''
      }
    }

    // 获取状态文本
    const getStatusText = (status) => {
      const statusMap = {
        draft: '草稿',
        writing: '写作中',
        completed: '已完成'
      }
      return statusMap[status] || '草稿'
    }

    // 显示右键菜单（暂时简化）
    const showContextMenu = (event, chapter) => {
      event.preventDefault()
      // 这里可以实现更复杂的右键菜单
    }

    return {
      chapters,
      sortedChapters,
      showEditDialog,
      editingChapter,
      loadChapters,
      selectChapter,
      createNewChapter,
      editChapter,
      saveChapter,
      deleteChapter,
      closeEditDialog,
      getStatusText,
      showContextMenu
    }
  }
}
</script>

<style scoped>
.chapter-selector {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.chapter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e0e0e0;
}

.chapter-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.create-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: #007bff;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: bold;
  transition: background-color 0.3s;
}

.create-btn:hover {
  background: #0056b3;
}

.chapter-list {
  max-height: 400px;
  overflow-y: auto;
}

.chapter-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.chapter-item:hover {
  border-color: #007bff;
  background: #f8f9fa;
}

.chapter-item.active {
  border-color: #007bff;
  background: #e3f2fd;
}

.chapter-info {
  flex: 1;
}

.chapter-title {
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 4px;
}

.chapter-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #666;
}

.word-count {
  color: #28a745;
}

.status {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
}

.status.draft {
  background: #f8f9fa;
  color: #6c757d;
}

.status.writing {
  background: #fff3cd;
  color: #856404;
}

.status.completed {
  background: #d4edda;
  color: #155724;
}

.chapter-actions {
  display: flex;
  gap: 4px;
}

.edit-btn, .delete-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.edit-btn:hover {
  background: #e3f2fd;
}

.delete-btn:hover {
  background: #ffebee;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.create-first-btn {
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 12px;
}

.create-first-btn:hover {
  background: #0056b3;
}

/* 对话框样式 */
.dialog-overlay {
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

.dialog {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
}

.dialog-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.close-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 18px;
  color: #666;
}

.dialog-body {
  padding: 20px;
  max-height: 60vh;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #2c3e50;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #007bff;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #e0e0e0;
}

.cancel-btn, .save-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.cancel-btn {
  background: #f8f9fa;
  color: #6c757d;
}

.cancel-btn:hover {
  background: #e9ecef;
}

.save-btn {
  background: #007bff;
  color: white;
}

.save-btn:hover {
  background: #0056b3;
}

/* 滚动条样式 */
.chapter-list::-webkit-scrollbar,
.dialog-body::-webkit-scrollbar {
  width: 6px;
}

.chapter-list::-webkit-scrollbar-track,
.dialog-body::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.chapter-list::-webkit-scrollbar-thumb,
.dialog-body::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.chapter-list::-webkit-scrollbar-thumb:hover,
.dialog-body::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>