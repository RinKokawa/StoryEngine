<template>
  <div class="volume-chapter-selector">
    <div class="selector-header">
      <h3>卷章管理</h3>
      <button @click="createVolume" class="create-btn" title="创建新卷" :disabled="isLoading || isDataLoading">
        <span>+卷</span>
      </button>
    </div>

    <!-- 加载状态指示器 -->
    <div v-if="isLoading || isDataLoading" class="loading-indicator">
      <div class="spinner"></div>
      <p>{{ isLoading ? '加载中...' : '数据同步中...' }}</p>
    </div>

    <!-- 错误状态提示 -->
    <div v-else-if="loadError" class="error-state">
      <p>{{ loadError }}</p>
      <button @click="retryLoad" class="retry-btn">重试</button>
    </div>

    <div v-else class="volumes-list">
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
            <button @click="createChapter(volume.id)" class="create-chapter-btn" :disabled="isProcessing">
              + 新建章节
            </button>
          </div>
          
          <div v-for="chapter in getVolumeChapters(volume.id)" :key="chapter.id" 
               class="chapter-item" 
               :class="{ active: selectedChapter?.id === chapter.id, 'disabled': isDataLoading }"
               @click="!isDataLoading && selectChapter(chapter)">
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
            <textarea 
              v-model="volumeForm.description" 
              placeholder="卷的简介或描述"
              rows="3"
            ></textarea>
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
            <button type="button" @click="closeVolumeDialog" :disabled="isProcessing">取消</button>
            <button type="submit" :disabled="isProcessing">
              {{ isProcessing ? '保存中...' : '保存' }}
            </button>
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
            <textarea 
              v-model="chapterForm.notes" 
              placeholder="章节简介或备注"
              rows="3"
            ></textarea>
          </div>
          <div class="form-actions">
            <button type="button" @click="closeChapterDialog" :disabled="isProcessing">取消</button>
            <button type="submit" :disabled="isProcessing">
              {{ isProcessing ? '保存中...' : '保存' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'

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
  emits: ['chapter-selected', 'chapter-created', 'chapter-updated', 'chapter-deleted', 'data-loaded'],
  setup(props, { emit }) {
    const volumes = ref([])
    const chapters = ref([])
    const expandedVolumes = ref(new Set())
    
    // 加载和处理状态
    const isLoading = ref(false)
    const isProcessing = ref(false)
    const loadError = ref(null)
    const loadAttempts = ref(0)
    const maxLoadAttempts = 5
    
    // 数据加载状态 - 用于防止在数据未完全加载时点击章节
    const isDataLoading = ref(false)
    
    // 轮询相关
    const pollingTimer = ref(null)
    const pollingCount = ref(0)
    const maxPollingCount = 10 // 恢复原来的轮询次数
    const pollingInterval = 500 // 恢复原来的轮询间隔
    
    // 防止重复创建
    const operationInProgress = ref(false)
    const operationTimeout = ref(null)
    
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

    // 监听项目ID变化，重新加载数据
    watch(() => props.projectId, (newProjectId) => {
      console.log('[DEBUG] watch projectId 触发, 新ID:', newProjectId)
      if (newProjectId) {
        console.log('[DEBUG] 项目ID变化，准备加载数据:', newProjectId)
        try {
          loadData()
        } catch (error) {
          console.error('[ERROR] watch 回调中加载数据失败:', error)
        }
      } else {
        console.log('[DEBUG] 项目ID为空，跳过加载')
      }
    }, { immediate: true })

    // 获取指定卷的章节
    const getVolumeChapters = (volumeId) => {
      return chapters.value.filter(c => c.volumeId === volumeId).sort((a, b) => a.order - b.order)
    }

    // 加载数据
    const loadData = async () => {
      console.log('[DEBUG] loadData 函数开始执行')
      
      if (!props.projectId) {
        console.log('[DEBUG] 无项目ID，跳过加载')
        return
      }
      
      if (isLoading.value) {
        console.log('[DEBUG] 已经在加载中，跳过重复加载')
        return
      }
      
      console.log('[DEBUG] 设置 isLoading = true')
      isLoading.value = true
      loadError.value = null
      
      try {
        console.log('[DEBUG] 开始加载卷章数据...项目ID:', props.projectId)
        
        // 加载卷数据
        console.log('[DEBUG] 准备调用 storageManager.getProjectVolumes')
        let volumesData
        try {
          volumesData = await storageManager.getProjectVolumes(props.projectId)
          console.log('[DEBUG] getProjectVolumes 调用成功, 返回数据长度:', volumesData ? volumesData.length : 0)
        } catch (error) {
          console.error('[ERROR] getProjectVolumes 调用失败:', error)
          volumesData = []
        }
        
        volumes.value = volumesData || []
        console.log('[DEBUG] 卷数据已设置, 长度:', volumes.value.length)
        
        // 加载章节数据
        console.log('[DEBUG] 准备调用 storageManager.getProjectChapters')
        let chaptersData
        try {
          chaptersData = await storageManager.getProjectChapters(props.projectId)
          console.log('[DEBUG] getProjectChapters 调用成功, 返回数据长度:', chaptersData ? chaptersData.length : 0)
        } catch (error) {
          console.error('[ERROR] getProjectChapters 调用失败:', error)
          chaptersData = []
        }
        
        chapters.value = chaptersData || []
        console.log('[DEBUG] 章节数据已设置, 长度:', chapters.value.length)
        
        // 默认展开第一卷（如果有）
        if (volumes.value.length > 0) {
          console.log('[DEBUG] 展开第一卷:', volumes.value[0].id)
          expandedVolumes.value.add(volumes.value[0].id)
        }
        
        // 如果有选中的章节，确保其所在的卷是展开的
        if (props.selectedChapter) {
          console.log('[DEBUG] 有选中的章节:', props.selectedChapter.id)
          const chapter = chapters.value.find(c => c.id === props.selectedChapter.id)
          if (chapter && chapter.volumeId) {
            console.log('[DEBUG] 展开章节所在的卷:', chapter.volumeId)
            expandedVolumes.value.add(chapter.volumeId)
          }
        }
        
        // 重置加载尝试次数
        loadAttempts.value = 0
        console.log('[DEBUG] 数据加载完成')
        
        // 发出数据加载完成事件
        emit('data-loaded', {
          volumes: volumes.value,
          chapters: chapters.value,
          hasData: volumes.value.length > 0 || chapters.value.length > 0
        })
      } catch (error) {
        console.error('[ERROR] 加载卷章数据失败:', error)
        loadError.value = '加载数据失败，请重试'
      } finally {
        console.log('[DEBUG] 设置 isLoading = false')
        isLoading.value = false
      }
    }

    // 手动重试加载
    const retryLoad = () => {
      loadAttempts.value = 0
      loadData()
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
      if (isLoading.value || isDataLoading.value) {
        console.log('[DEBUG] 数据加载中，暂时无法选择章节')
        return
      }
      
      console.log('[DEBUG] 选择章节:', chapter.id, chapter.title)
      
      // 设置数据加载状态，防止重复点击
      isDataLoading.value = true
      
      // 延迟发出事件，确保UI状态更新
      nextTick(() => {
        emit('chapter-selected', chapter)
        
        // 短暂延迟后重置数据加载状态
        setTimeout(() => {
          isDataLoading.value = false
        }, 500)
      })
    }

    // 创建卷
    const createVolume = () => {
      if (isProcessing.value) return
      
      editingVolume.value = null
      volumeForm.title = ''
      volumeForm.description = ''
      volumeForm.status = 'draft'
      showVolumeDialog.value = true
    }

    // 编辑卷
    const editVolume = (volume) => {
      if (isProcessing.value) return
      
      editingVolume.value = volume
      volumeForm.title = volume.title
      volumeForm.description = volume.description || ''
      volumeForm.status = volume.status
      showVolumeDialog.value = true
    }

    // 保存卷
    const saveVolume = async () => {
      if (isProcessing.value) return
      
      isProcessing.value = true
      
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
      } finally {
        isProcessing.value = false
      }
    }

    // 删除卷
    const deleteVolume = async (volumeId) => {
      if (isProcessing.value) return
      
      if (confirm('确定要删除这个卷吗？卷下的所有章节也会被删除。')) {
        isProcessing.value = true
        
        try {
          await storageManager.deleteVolume(props.projectId, volumeId)
          volumes.value = volumes.value.filter(v => v.id !== volumeId)
          chapters.value = chapters.value.filter(c => c.volumeId !== volumeId)
          expandedVolumes.value.delete(volumeId)
        } catch (error) {
          console.error('删除卷失败:', error)
          alert('删除卷失败，请重试')
        } finally {
          isProcessing.value = false
        }
      }
    }

    // 创建章节
    const createChapter = (volumeId) => {
      if (isProcessing.value || operationInProgress.value) return
      
      // 防止重复创建
      operationInProgress.value = true
      
      // 设置超时，5秒后重置操作状态
      if (operationTimeout.value) clearTimeout(operationTimeout.value)
      operationTimeout.value = setTimeout(() => {
        operationInProgress.value = false
      }, 5000)
      
      editingChapter.value = null
      currentVolumeId.value = volumeId
      chapterForm.title = ''
      chapterForm.status = 'draft'
      chapterForm.notes = ''
      showChapterDialog.value = true
      
      // 对话框显示后重置操作状态
      setTimeout(() => {
        operationInProgress.value = false
      }, 500)
    }

    // 编辑章节
    const editChapter = (chapter) => {
      if (isProcessing.value) return
      
      editingChapter.value = chapter
      currentVolumeId.value = chapter.volumeId
      chapterForm.title = chapter.title
      chapterForm.status = chapter.status
      chapterForm.notes = chapter.notes || ''
      showChapterDialog.value = true
    }

    // 保存章节
    const saveChapter = async () => {
      if (isProcessing.value) return
      
      isProcessing.value = true
      
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
          
          // 检查是否已存在相同ID的章节（防止重复添加）
          if (!chapters.value.some(c => c.id === newChapter.id)) {
            chapters.value.push(newChapter)
            emit('chapter-created', newChapter)
            selectChapter(newChapter)
          } else {
            console.warn('章节已存在，避免重复添加:', newChapter.id)
          }
        }
        closeChapterDialog()
      } catch (error) {
        console.error('保存章节失败:', error)
        alert('保存章节失败，请重试')
      } finally {
        isProcessing.value = false
      }
    }

    // 删除章节
    const deleteChapter = async (chapterId) => {
      if (isProcessing.value) return
      
      if (confirm('确定要删除这个章节吗？')) {
        isProcessing.value = true
        
        try {
          await storageManager.deleteChapter(props.projectId, chapterId)
          chapters.value = chapters.value.filter(c => c.id !== chapterId)
          emit('chapter-deleted', chapterId)
        } catch (error) {
          console.error('删除章节失败:', error)
          alert('删除章节失败，请重试')
        } finally {
          isProcessing.value = false
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

    // 组件卸载时清理定时器
    const cleanup = () => {
      if (operationTimeout.value) {
        clearTimeout(operationTimeout.value)
      }
    }

    // 启动轮询机制，确保数据能够被正确加载
    const startPolling = () => {
      console.log('[DEBUG] 启动轮询机制')
      
      // 清除可能存在的旧定时器
      if (pollingTimer.value) {
        clearInterval(pollingTimer.value)
      }
      
      // 重置轮询计数
      pollingCount.value = 0
      
      // 设置轮询定时器
      pollingTimer.value = setInterval(() => {
        pollingCount.value++
        console.log(`[DEBUG] 轮询第 ${pollingCount.value} 次`)
        
        // 如果已经有数据了，或者达到最大轮询次数，则停止轮询
        if (volumes.value.length > 0 || pollingCount.value >= maxPollingCount) {
          console.log('[DEBUG] 停止轮询:', 
            volumes.value.length > 0 ? '已有数据' : '达到最大轮询次数')
          clearInterval(pollingTimer.value)
          pollingTimer.value = null
          return
        }
        
        // 如果有项目ID但没有数据，尝试加载数据
        if (props.projectId && volumes.value.length === 0) {
          console.log('[DEBUG] 轮询中尝试加载数据, 项目ID:', props.projectId)
          try {
            loadData().catch(error => 
              console.error('[ERROR] 轮询中加载数据失败:', error))
          } catch (error) {
            console.error('[ERROR] 轮询中调用loadData异常:', error)
          }
        }
      }, pollingInterval)
    }
    
    // 组件卸载时清理定时器
    onUnmounted(() => {
      console.log('[DEBUG] 组件卸载，清理定时器')
      if (pollingTimer.value) {
        clearInterval(pollingTimer.value)
        pollingTimer.value = null
      }
      
      if (operationTimeout.value) {
        clearTimeout(operationTimeout.value)
        operationTimeout.value = null
      }
    })

    onMounted(() => {
      console.log('[DEBUG] VolumeChapterSelector组件挂载开始')
      console.log('[DEBUG] 组件挂载时的项目ID:', props.projectId)
      
      // 确保组件挂载时加载数据，但使用setTimeout避免阻塞渲染
      setTimeout(() => {
        console.log('[DEBUG] onMounted setTimeout 触发')
        if (props.projectId) {
          console.log('[DEBUG] onMounted中准备加载数据, 项目ID:', props.projectId)
          try {
            // 直接加载数据
            loadData()
              .then(() => {
                console.log('[DEBUG] 初始数据加载成功')
                // 如果数据加载成功但为空，启动轮询
                if (volumes.value.length === 0) {
                  console.log('[DEBUG] 数据为空，启动轮询')
                  startPolling()
                }
              })
              .catch(error => {
                console.error('[ERROR] onMounted中加载数据失败:', error)
                // 如果加载失败，启动轮询
                startPolling()
              })
          } catch (error) {
            console.error('[ERROR] onMounted中调用loadData异常:', error)
            // 即使出现异常，也启动轮询机制
            startPolling()
          }
        } else {
          console.log('[DEBUG] onMounted中项目ID为空，跳过加载')
        }
      }, 100)
      
      console.log('[DEBUG] VolumeChapterSelector组件挂载完成')
    })

    return {
      volumes,
      chapters,
      expandedVolumes,
      isLoading,
      isProcessing,
      isDataLoading,
      loadError,
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
      closeChapterDialog,
      retryLoad
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

.create-btn:hover:not(:disabled) {
  background: #0056b3;
}

.create-btn:disabled {
  background: #a0c4e4;
  cursor: not-allowed;
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

.create-chapter-btn:hover:not(:disabled) {
  background: #1e7e34;
}

.create-chapter-btn:disabled {
  background: #8fcb9b;
  cursor: not-allowed;
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

.chapter-item:hover:not(.disabled) {
  background: #e9ecef;
}

.chapter-item.active {
  background: #007bff;
  color: white;
}

.chapter-item.disabled {
  opacity: 0.7;
  cursor: wait;
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

/* 加载状态和错误状态 */
.loading-indicator, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  flex: 1;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 123, 255, 0.1);
  border-radius: 50%;
  border-top-color: #007bff;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-state p {
  color: #dc3545;
  margin-bottom: 16px;
}

.retry-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.retry-btn:hover {
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

.textarea-wrapper {
  height: 80px;
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

.form-actions button[type="button"]:hover:not(:disabled) {
  background: #545b62;
}

.form-actions button[type="button"]:disabled {
  background: #adb5bd;
  cursor: not-allowed;
}

.form-actions button[type="submit"] {
  background: #007bff;
  color: white;
}

.form-actions button[type="submit"]:hover:not(:disabled) {
  background: #0056b3;
}

.form-actions button[type="submit"]:disabled {
  background: #a0c4e4;
  cursor: not-allowed;
}
</style>