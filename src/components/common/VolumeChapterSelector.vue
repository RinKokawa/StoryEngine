<template>
  <div class="volume-chapter-selector">
    <div class="selector-header">
      <h3>卷章管理</h3>
      <button @click="createVolume" class="create-btn" title="创建新卷">
        <span>+卷</span>
      </button>
    </div>

    <div class="volumes-list">
      <div v-for="volume in volumes" :key="volume.id" class="volume-item">
        <div class="volume-header" @click="toggleVolume(volume.id)">
          <span class="volume-toggle" :class="{ expanded: expandedVolumes.has(volume.id) }">
            {{ expandedVolumes.has(volume.id) ? '▼' : '▶' }}
          </span>
          <span class="volume-title">{{ volume.title }}</span>
          <div class="volume-actions">
            <button @click.stop="editVolume(volume)" class="edit-btn" title="编辑卷">✏️</button>
            <button @click.stop="deleteVolume(volume.id)" class="delete-btn" title="删除卷">🗑️</button>
          </div>
        </div>

        <div v-if="expandedVolumes.has(volume.id)" class="chapters-list">
          <div class="chapter-actions">
            <button @click="createChapter(volume.id)" class="create-chapter-btn">
              + 新建章节
            </button>
          </div>
          
          <div v-for="chapter in getVolumeChapters(volume.id)" :key="chapter.id" 
               class="chapter-item" 
               :class="{ active: selectedChapter?.id === chapter.id }"
               @click="selectChapter(chapter)">
            <div class="chapter-info">
              <span class="chapter-title">{{ chapter.title || '未命名章节' }}</span>
              <span class="chapter-meta">{{ chapter.wordCount || 0 }}字</span>
            </div>
            <div class="chapter-actions">
              <button @click.stop="editChapter(chapter)" class="edit-btn" title="编辑章节">✏️</button>
              <button @click.stop="deleteChapter(chapter.id)" class="delete-btn" title="删除章节">🗑️</button>
            </div>
          </div>

          <div v-if="getVolumeChapters(volume.id).length === 0" class="empty-chapters">
            暂无章节
          </div>
        </div>
      </div>

      <div v-if="volumes.length === 0" class="empty-volumes">
        <p>暂无卷，点击上方按钮创建第一卷</p>
      </div>
    </div>

    <!-- 卷编辑对话框 -->
    <div v-if="showVolumeDialog" class="dialog-overlay" @click.self="closeVolumeDialog">
      <div class="dialog">
        <h4>{{ editingVolume ? '编辑卷' : '创建新卷' }}</h4>
        <form @submit.prevent="saveVolume">
          <div class="form-group">
            <label>卷标题:</label>
            <input v-model="volumeForm.title" type="text" required placeholder="请输入卷标题">
          </div>
          <div class="form-group">
            <label>描述:</label>
            <textarea v-model="volumeForm.description" placeholder="卷的简介或描述"></textarea>
          </div>
          <div class="form-group">
            <label>状态:</label>
            <select v-model="volumeForm.status">
              <option value="draft">草稿</option>
              <option value="writing">写作中</option>
              <option value="completed">已完成</option>
            </select>
          </div>
          <div class="form-actions">
            <button type="button" @click="closeVolumeDialog">取消</button>
            <button type="submit">保存</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 章节编辑对话框 -->
    <div v-if="showChapterDialog" class="dialog-overlay" @click.self="closeChapterDialog">
      <div class="dialog">
        <h4>{{ editingChapter ? '编辑章节' : '创建新章节' }}</h4>
        <form @submit.prevent="saveChapter">
          <div class="form-group">
            <label>章节标题:</label>
            <input v-model="chapterForm.title" type="text" required placeholder="请输入章节标题">
          </div>
          <div class="form-group">
            <label>状态:</label>
            <select v-model="chapterForm.status">
              <option value="draft">草稿</option>
              <option value="writing">写作中</option>
              <option value="completed">已完成</option>
            </select>
          </div>
          <div class="form-group">
            <label>简介:</label>
            <textarea v-model="chapterForm.notes" placeholder="章节简介或备注"></textarea>
          </div>
          <div class="form-actions">
            <button type="button" @click="closeChapterDialog">取消</button>
            <button type="submit">保存</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import storageManager from '../../utils/storage.js'
import { VolumeModel, ChapterModel } from '../../utils/dataModels.js'

export default {
  name: 'VolumeChapterSelector',
  props: {
    projectId: {
      type: String,
      required: true
    },
    selectedChapter: {
      type: Object,
      default: null
    }
  },
  emits: ['chapter-selected', 'chapter-created', 'chapter-updated', 'chapter-deleted'],
  setup(props, { emit }) {
    const volumes = ref([])
    const chapters = ref([])
    const expandedVolumes = ref(new Set())
    
    // 对话框状态
    const showVolumeDialog = ref(false)
    const showChapterDialog = ref(false)
    const editingVolume = ref(null)
    const editingChapter = ref(null)
    const currentVolumeId = ref(null)
    
    // 表单数据
    const volumeForm = reactive({
      title: '',
      description: '',
      status: 'draft'
    })
    
    const chapterForm = reactive({
      title: '',
      status: 'draft',
      notes: ''
    })

    // 获取指定卷的章节
    const getVolumeChapters = (volumeId) => {
      return chapters.value.filter(c => c.volumeId === volumeId).sort((a, b) => a.order - b.order)
    }

    // 加载数据
    const loadData = async () => {
      try {
        // 加载卷数据
        volumes.value = await storageManager.getProjectVolumes(props.projectId) || []
        
        // 加载章节数据
        chapters.value = await storageManager.getProjectChapters(props.projectId) || []
        
        // 默认展开第一卷（如果有）
        if (volumes.value.length > 0) {
          expandedVolumes.value.add(volumes.value[0].id)
        }
        
        // 如果有选中的章节，确保其所在的卷是展开的
        if (props.selectedChapter) {
          const chapter = chapters.value.find(c => c.id === props.selectedChapter.id)
          if (chapter && chapter.volumeId) {
            expandedVolumes.value.add(chapter.volumeId)
          }
        }
      } catch (error) {
        console.error('加载卷章数据失败:', error)
      }
    }

    // 创建默认卷
    const createDefaultVolume = async () => {
      const volumeData = {
        title: '第一卷',
        description: '故事的开始',
        status: 'writing'
      }
      return await storageManager.createVolume(props.projectId, volumeData)
    }

    // 创建默认章节
    const createDefaultChapter = async (volumeId) => {
      const chapterData = {
        title: '第一章',
        status: 'draft',
        notes: ''
      }
      return await storageManager.createChapter(props.projectId, volumeId, chapterData)
    }

    // 切换卷的展开状态
    const toggleVolume = (volumeId) => {
      if (expandedVolumes.value.has(volumeId)) {
        expandedVolumes.value.delete(volumeId)
      } else {
        expandedVolumes.value.add(volumeId)
      }
    }

    // 选择章节
    const selectChapter = (chapter) => {
      emit('chapter-selected', chapter)
    }

    // 创建卷
    const createVolume = () => {
      editingVolume.value = null
      volumeForm.title = ''
      volumeForm.description = ''
      volumeForm.status = 'draft'
      showVolumeDialog.value = true
    }

    // 编辑卷
    const editVolume = (volume) => {
      editingVolume.value = volume
      volumeForm.title = volume.title
      volumeForm.description = volume.description || ''
      volumeForm.status = volume.status
      showVolumeDialog.value = true
    }

    // 保存卷
    const saveVolume = async () => {
      try {
        if (editingVolume.value) {
          // 更新卷
          const updatedVolume = {
            ...editingVolume.value,
            title: volumeForm.title,
            description: volumeForm.description,
            status: volumeForm.status,
            lastModified: new Date().toISOString()
          }
          
          await storageManager.updateVolume(props.projectId, updatedVolume)
          
          const index = volumes.value.findIndex(v => v.id === editingVolume.value.id)
          if (index !== -1) {
            volumes.value[index] = updatedVolume
          }
        } else {
          // 创建新卷
          const volumeData = {
            title: volumeForm.title,
            description: volumeForm.description,
            status: volumeForm.status
          }
          
          const newVolume = await storageManager.createVolume(props.projectId, volumeData)
          volumes.value.push(newVolume)
          expandedVolumes.value.add(newVolume.id)
        }
        closeVolumeDialog()
      } catch (error) {
        console.error('保存卷失败:', error)
        alert('保存卷失败，请重试')
      }
    }

    // 删除卷
    const deleteVolume = async (volumeId) => {
      if (confirm('确定要删除这个卷吗？卷下的所有章节也会被删除。')) {
        try {
          await storageManager.deleteVolume(props.projectId, volumeId)
          volumes.value = volumes.value.filter(v => v.id !== volumeId)
          chapters.value = chapters.value.filter(c => c.volumeId !== volumeId)
          expandedVolumes.value.delete(volumeId)
        } catch (error) {
          console.error('删除卷失败:', error)
          alert('删除卷失败，请重试')
        }
      }
    }

    // 创建章节
    const createChapter = (volumeId) => {
      editingChapter.value = null
      currentVolumeId.value = volumeId
      chapterForm.title = ''
      chapterForm.status = 'draft'
      chapterForm.notes = ''
      showChapterDialog.value = true
    }

    // 编辑章节
    const editChapter = (chapter) => {
      editingChapter.value = chapter
      currentVolumeId.value = chapter.volumeId
      chapterForm.title = chapter.title
      chapterForm.status = chapter.status
      chapterForm.notes = chapter.notes || ''
      showChapterDialog.value = true
    }

    // 保存章节
    const saveChapter = async () => {
      try {
        if (editingChapter.value) {
          // 更新章节
          const updatedChapter = {
            ...editingChapter.value,
            title: chapterForm.title,
            status: chapterForm.status,
            notes: chapterForm.notes,
            lastModified: new Date().toISOString()
          }
          
          await storageManager.updateChapter(props.projectId, updatedChapter)
          
          const index = chapters.value.findIndex(c => c.id === editingChapter.value.id)
          if (index !== -1) {
            chapters.value[index] = updatedChapter
          }
          emit('chapter-updated', updatedChapter)
        } else {
          // 创建新章节
          const chapterData = {
            title: chapterForm.title,
            status: chapterForm.status,
            notes: chapterForm.notes
          }
          
          const newChapter = await storageManager.createChapter(props.projectId, currentVolumeId.value, chapterData)
          chapters.value.push(newChapter)
          emit('chapter-created', newChapter)
          selectChapter(newChapter)
        }
        closeChapterDialog()
      } catch (error) {
        console.error('保存章节失败:', error)
        alert('保存章节失败，请重试')
      }
    }

    // 删除章节
    const deleteChapter = async (chapterId) => {
      if (confirm('确定要删除这个章节吗？')) {
        try {
          await storageManager.deleteChapter(props.projectId, chapterId)
          chapters.value = chapters.value.filter(c => c.id !== chapterId)
          emit('chapter-deleted', chapterId)
        } catch (error) {
          console.error('删除章节失败:', error)
          alert('删除章节失败，请重试')
        }
      }
    }

    // 关闭对话框
    const closeVolumeDialog = () => {
      showVolumeDialog.value = false
      editingVolume.value = null
    }

    const closeChapterDialog = () => {
      showChapterDialog.value = false
      editingChapter.value = null
      currentVolumeId.value = null
    }

    onMounted(() => {
      loadData()
    })

    return {
      volumes,
      chapters,
      expandedVolumes,
      showVolumeDialog,
      showChapterDialog,
      editingVolume,
      editingChapter,
      volumeForm,
      chapterForm,
      getVolumeChapters,
      toggleVolume,
      selectChapter,
      createVolume,
      editVolume,
      saveVolume,
      deleteVolume,
      createChapter,
      editChapter,
      saveChapter,
      deleteChapter,
      closeVolumeDialog,
      closeChapterDialog
    }
  }
}
</script>

<style scoped>
.volume-chapter-selector {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
}

.selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e9ecef;
  background: white;
}

.selector-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.create-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.2s;
}

.create-btn:hover {
  background: #0056b3;
}

.volumes-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.volume-item {
  margin-bottom: 8px;
  background: white;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.volume-header {
  display: flex;
  align-items: center;
  padding: 12px;
  cursor: pointer;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.volume-header:hover {
  background: #f8f9fa;
}

.volume-toggle {
  margin-right: 8px;
  font-size: 12px;
  color: #666;
  transition: transform 0.2s;
}

.volume-toggle.expanded {
  transform: rotate(0deg);
}

.volume-title {
  flex: 1;
  font-weight: 500;
  color: #333;
}

.volume-actions {
  display: flex;
  gap: 4px;
}

.volume-actions button {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  border-radius: 3px;
  font-size: 12px;
  opacity: 0.7;
  transition: opacity 0.2s, background-color 0.2s;
}

.volume-actions button:hover {
  opacity: 1;
  background: #e9ecef;
}

.chapters-list {
  border-top: 1px solid #e9ecef;
  padding: 8px;
}

.chapter-actions {
  margin-bottom: 8px;
}

.create-chapter-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.2s;
}

.create-chapter-btn:hover {
  background: #1e7e34;
}

.chapter-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 4px;
  background: #f8f9fa;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.chapter-item:hover {
  background: #e9ecef;
}

.chapter-item.active {
  background: #007bff;
  color: white;
}

.chapter-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.chapter-title {
  font-size: 14px;
  font-weight: 500;
}

.chapter-meta {
  font-size: 12px;
  opacity: 0.7;
}

.chapter-item .chapter-actions {
  display: flex;
  gap: 4px;
  margin: 0;
}

.chapter-item .chapter-actions button {
  background: none;
  border: none;
  padding: 2px;
  cursor: pointer;
  border-radius: 3px;
  font-size: 10px;
  opacity: 0.7;
  transition: opacity 0.2s, background-color 0.2s;
}

.chapter-item .chapter-actions button:hover {
  opacity: 1;
  background: rgba(255,255,255,0.2);
}

.chapter-item.active .chapter-actions button:hover {
  background: rgba(255,255,255,0.2);
}

.empty-chapters, .empty-volumes {
  text-align: center;
  color: #666;
  font-size: 14px;
  padding: 20px;
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
  padding: 24px;
  width: 400px;
  max-width: 90vw;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

.dialog h4 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #333;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
  color: #333;
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

.form-group textarea {
  height: 80px;
  resize: vertical;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
}

.form-actions button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.form-actions button[type="button"] {
  background: #6c757d;
  color: white;
}

.form-actions button[type="button"]:hover {
  background: #545b62;
}

.form-actions button[type="submit"] {
  background: #007bff;
  color: white;
}

.form-actions button[type="submit"]:hover {
  background: #0056b3;
}
</style>