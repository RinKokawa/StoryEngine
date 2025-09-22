<template>
  <div class="volume-selector">
    <!-- 卷列表 -->
    <div v-for="volume in volumes" :key="volume.id" class="tree-item volume-item">
      <div 
        class="tree-node" 
        :class="{ 'expanded': expandedVolumes.has(volume.id) }"
        @click="handleToggleVolume(volume.id)"
      >
        <div class="node-content">
          <svg class="chevron-icon" :class="{ 'expanded': expandedVolumes.has(volume.id) }" viewBox="0 0 16 16" width="16" height="16">
            <path fill="currentColor" d="M6 4.75a.75.75 0 0 1 1.28-.53l3.25 3.25a.75.75 0 0 1 0 1.06L7.28 11.78a.75.75 0 0 1-1.28-.53V4.75Z"/>
          </svg>
          <svg class="folder-icon" :class="{ 'open': expandedVolumes.has(volume.id) }" viewBox="0 0 16 16" width="16" height="16">
            <path fill="currentColor" d="M1.75 2.5a.25.25 0 0 0-.25.25v10.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25v-8.5a.25.25 0 0 0-.25-.25H7.5L6.25 3.5H1.75z"/>
          </svg>
          <span class="node-label">{{ volume.title }}</span>
          <span class="node-badge" v-if="getVolumeChapterCount(volume.id)">{{ getVolumeChapterCount(volume.id) }}</span>
        </div>
        <div class="node-actions" @click.stop>
          <button @click="handleEditVolume(volume)" class="action-btn" title="编辑" :disabled="isProcessing">
            <svg viewBox="0 0 16 16" width="12" height="12">
              <path fill="currentColor" d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Zm.176 4.823L9.75 4.81l-6.286 6.287a.253.253 0 0 0-.064.108l-.558 1.953 1.953-.558a.253.253 0 0 0 .108-.064Z"/>
            </svg>
          </button>
          <button @click="handleDeleteVolume(volume)" class="action-btn delete" title="删除" :disabled="isProcessing">
            <svg viewBox="0 0 16 16" width="12" height="12">
              <path fill="currentColor" d="M11 1.75V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM4.496 6.675l.66 6.6a.25.25 0 0 0 .249.225h5.19a.25.25 0 0 0 .249-.225l.66-6.6a.75.75 0 0 1 1.492.149l-.66 6.6A1.748 1.748 0 0 1 10.595 15h-5.19a1.748 1.748 0 0 1-1.741-1.575l-.66-6.6a.75.75 0 1 1 1.492-.15ZM6.5 1.75V3h3V1.75a.25.25 0 0 0-.25-.25h-2.5a.25.25 0 0 0-.25.25Z"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- 章节列表插槽 -->
      <div v-if="expandedVolumes.has(volume.id)" class="tree-children">
        <slot 
          name="chapters" 
          :volume="volume" 
          :chapters="getVolumeChapters(volume.id)"
          :onCreateChapter="(chapterData) => handleCreateChapter(volume.id, chapterData)"
        />
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="volumes.length === 0" class="empty-state">
      <svg class="empty-icon" viewBox="0 0 16 16" width="24" height="24">
        <path fill="currentColor" d="M1.75 2.5a.25.25 0 0 0-.25.25v10.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25v-8.5a.25.25 0 0 0-.25-.25H7.5L6.25 3.5H1.75z"/>
      </svg>
      <p>暂无卷</p>
      <button @click="handleCreateVolume" class="create-first-btn" :disabled="isProcessing">创建第一卷</button>
    </div>

    <!-- 卷编辑对话框 -->
    <div v-if="showVolumeDialog" class="modal-overlay" @click.self="closeVolumeDialog">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3>{{ editingVolume ? '编辑卷' : '新建卷' }}</h3>
          <button @click="closeVolumeDialog" class="close-btn">×</button>
        </div>
        <form @submit.prevent="saveVolume" class="modal-form">
          <div class="form-field">
            <label>标题</label>
            <input v-model="volumeForm.title" type="text" required placeholder="输入卷标题">
          </div>
          <div class="form-field">
            <label>描述</label>
            <textarea v-model="volumeForm.description" placeholder="卷的描述（可选）" rows="3"></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" @click="closeVolumeDialog" :disabled="isProcessing">取消</button>
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
import { validateVolumeData } from '../../utils/volumeChapterUtils.js'

export default {
  name: 'VolumeSelector',
  props: {
    volumes: {
      type: Array,
      required: true
    },
    expandedVolumes: {
      type: Set,
      required: true
    },
    isProcessing: {
      type: Boolean,
      default: false
    },
    getVolumeChapters: {
      type: Function,
      required: true
    },
    getVolumeChapterCount: {
      type: Function,
      required: true
    }
  },
  emits: [
    'toggle-volume',
    'create-volume',
    'edit-volume', 
    'delete-volume',
    'create-chapter'
  ],
  setup(props, { emit }) {
    // 对话框状态
    const showVolumeDialog = ref(false)
    const editingVolume = ref(null)
    const volumeForm = ref({
      title: '',
      description: ''
    })

    // 事件处理
    const handleToggleVolume = (volumeId) => {
      emit('toggle-volume', volumeId)
    }

    const handleCreateVolume = () => {
      editingVolume.value = null
      volumeForm.value = {
        title: '',
        description: ''
      }
      showVolumeDialog.value = true
    }

    const handleEditVolume = (volume) => {
      editingVolume.value = volume
      volumeForm.value = {
        title: volume.title,
        description: volume.description || ''
      }
      showVolumeDialog.value = true
    }

    const handleDeleteVolume = async (volume) => {
      if (!confirm(`确定要删除卷"${volume.title}"吗？这将同时删除该卷下的所有章节。`)) {
        return
      }
      
      try {
        emit('delete-volume', volume.id)
      } catch (error) {
        console.error('删除卷失败:', error)
        alert('删除失败，请重试')
      }
    }

    const handleCreateChapter = (volumeId, chapterData) => {
      emit('create-chapter', volumeId, chapterData)
    }

    const saveVolume = async () => {
      if (!validateVolumeData(volumeForm.value)) {
        alert('请填写有效的卷标题')
        return
      }

      try {
        if (editingVolume.value) {
          const updatedVolume = {
            ...editingVolume.value,
            ...volumeForm.value
          }
          emit('edit-volume', updatedVolume)
        } else {
          emit('create-volume', volumeForm.value)
        }
        closeVolumeDialog()
      } catch (error) {
        console.error('保存卷失败:', error)
        alert('保存失败，请重试')
      }
    }

    const closeVolumeDialog = () => {
      showVolumeDialog.value = false
      editingVolume.value = null
    }

    return {
      // 对话框状态
      showVolumeDialog,
      editingVolume,
      volumeForm,

      // 事件处理
      handleToggleVolume,
      handleCreateVolume,
      handleEditVolume,
      handleDeleteVolume,
      handleCreateChapter,
      saveVolume,
      closeVolumeDialog
    }
  }
}
</script>

<style scoped>
@import '../../styles/volumeChapterStyles.css';
</style>