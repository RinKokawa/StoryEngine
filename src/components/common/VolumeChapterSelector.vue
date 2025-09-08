<template>
  <div class="vscode-file-explorer">
    <!-- 标题栏 -->
    <div class="explorer-header">
      <div class="header-title">
        <svg class="folder-icon" viewBox="0 0 16 16" width="16" height="16">
          <path fill="currentColor" d="M1.75 2.5a.25.25 0 0 0-.25.25v10.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25v-8.5a.25.25 0 0 0-.25-.25H7.5L6.25 3.5H1.75z"/>
        </svg>
        <span>卷章管理</span>
      </div>
      <div class="header-actions">
        <button @click="createVolume" class="action-btn" title="新建卷" :disabled="isLoading">
          <svg viewBox="0 0 16 16" width="14" height="14">
            <path fill="currentColor" d="M7.75 2a.75.75 0 0 1 .75.75V7h4.25a.75.75 0 0 1 0 1.5H8.5v4.25a.75.75 0 0 1-1.5 0V8.5H2.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2Z"/>
          </svg>
        </button>
        <button @click="refreshData" class="action-btn" title="刷新数据" :disabled="isLoading">
          <svg viewBox="0 0 16 16" width="14" height="14">
            <path fill="currentColor" d="M1.705 8.005a.75.75 0 0 1 .834.656 5.5 5.5 0 0 0 9.592 2.97l-1.204-1.204a.25.25 0 0 1 .177-.427h3.646a.25.25 0 0 1 .25.25v3.646a.25.25 0 0 1-.427.177l-1.38-1.38A7.002 7.002 0 0 1 1.05 8.84a.75.75 0 0 1 .656-.834ZM8 2.5a5.487 5.487 0 0 0-4.131 1.869l1.204 1.204A.25.25 0 0 1 4.896 6H1.25A.25.25 0 0 1 1 5.75V2.104a.25.25 0 0 1 .427-.177l1.38 1.38A7.002 7.002 0 0 1 14.95 7.16a.75.75 0 0 1-1.49.178A5.5 5.5 0 0 0 8 2.5Z"/>
          </svg>
        </button>
        <button @click="refreshAllWordCounts" class="action-btn" title="更新字数统计" :disabled="isLoading || isProcessing">
          <svg viewBox="0 0 16 16" width="14" height="14">
            <path fill="currentColor" d="M2 3.75C2 2.784 2.784 2 3.75 2h8.5c.966 0 1.75.784 1.75 1.75v8.5A1.75 1.75 0 0 1 12.25 14h-8.5A1.75 1.75 0 0 1 2 12.25Zm1.75-.25a.25.25 0 0 0-.25.25v8.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-8.5a.25.25 0 0 0-.25-.25ZM4.75 6a.75.75 0 0 1 .75-.75h5a.75.75 0 0 1 0 1.5h-5A.75.75 0 0 1 4.75 6ZM5.5 8.25a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5Z"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <span>加载中...</span>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="loadError" class="error-state">
      <svg class="error-icon" viewBox="0 0 16 16" width="16" height="16">
        <path fill="currentColor" d="M2.343 13.657A8 8 0 1 1 13.658 2.343 8 8 0 0 1 2.343 13.657ZM6.03 4.97a.751.751 0 0 0-1.042.018.751.751 0 0 0-.018 1.042L6.94 8 4.97 9.97a.749.749 0 0 0 .326 1.275.749.749 0 0 0 .734-.215L8 9.06l1.97 1.97a.749.749 0 0 0 1.275-.326.749.749 0 0 0-.215-.734L9.06 8l1.97-1.97a.749.749 0 0 0-.326-1.275.749.749 0 0 0-.734.215L8 6.94Z"/>
      </svg>
      <span>{{ loadError }}</span>
      <button @click="retryLoad" class="retry-btn">重试</button>
    </div>

    <!-- 文件树 -->
    <div v-else class="file-tree">
      <!-- 卷列表 -->
      <div v-for="volume in volumes" :key="volume.id" class="tree-item volume-item">
        <div 
          class="tree-node" 
          :class="{ 'expanded': expandedVolumes.has(volume.id) }"
          @click="toggleVolume(volume.id)"
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
            <button @click="editVolume(volume)" class="action-btn" title="编辑">
              <svg viewBox="0 0 16 16" width="12" height="12">
                <path fill="currentColor" d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Zm.176 4.823L9.75 4.81l-6.286 6.287a.253.253 0 0 0-.064.108l-.558 1.953 1.953-.558a.253.253 0 0 0 .108-.064Z"/>
              </svg>
            </button>
            <button @click="deleteVolume(volume.id)" class="action-btn delete" title="删除">
              <svg viewBox="0 0 16 16" width="12" height="12">
                <path fill="currentColor" d="M11 1.75V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM4.496 6.675l.66 6.6a.25.25 0 0 0 .249.225h5.19a.25.25 0 0 0 .249-.225l.66-6.6a.75.75 0 0 1 1.492.149l-.66 6.6A1.748 1.748 0 0 1 10.595 15h-5.19a1.748 1.748 0 0 1-1.741-1.575l-.66-6.6a.75.75 0 1 1 1.492-.15ZM6.5 1.75V3h3V1.75a.25.25 0 0 0-.25-.25h-2.5a.25.25 0 0 0-.25.25Z"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- 章节列表 -->
        <div v-if="expandedVolumes.has(volume.id)" class="tree-children">
          <div 
            v-for="chapter in getVolumeChapters(volume.id)" 
            :key="chapter.id"
            class="tree-item chapter-item"
            :class="{ 'selected': selectedChapter?.id === chapter.id }"
            @click="selectChapter(chapter)"
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
                <button @click="editChapter(chapter)" class="action-btn" title="编辑">
                  <svg viewBox="0 0 16 16" width="12" height="12">
                    <path fill="currentColor" d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Zm.176 4.823L9.75 4.81l-6.286 6.287a.253.253 0 0 0-.064.108l-.558 1.953 1.953-.558a.253.253 0 0 0 .108-.064Z"/>
                  </svg>
                </button>
                <button @click="deleteChapter(chapter.id)" class="action-btn delete" title="删除">
                  <svg viewBox="0 0 16 16" width="12" height="12">
                    <path fill="currentColor" d="M11 1.75V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM4.496 6.675l.66 6.6a.25.25 0 0 0 .249.225h5.19a.25.25 0 0 0 .249-.225l.66-6.6a.75.75 0 0 1 1.492.149l-.66 6.6A1.748 1.748 0 0 1 10.595 15h-5.19a1.748 1.748 0 0 1-1.741-1.575l-.66-6.6a.75.75 0 1 1 1.492-.15ZM6.5 1.75V3h3V1.75a.25.25 0 0 0-.25-.25h-2.5a.25.25 0 0 0-.25.25Z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- 添加章节按钮 -->
          <div class="tree-item add-item" @click="createChapter(volume.id)">
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
          <div v-if="getVolumeChapters(volume.id).length === 0" class="tree-item empty-item">
            <div class="tree-node">
              <div class="node-content">
                <div class="node-indent"></div>
                <span class="empty-text">暂无章节</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="volumes.length === 0" class="empty-state">
        <svg class="empty-icon" viewBox="0 0 16 16" width="24" height="24">
          <path fill="currentColor" d="M1.75 2.5a.25.25 0 0 0-.25.25v10.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25v-8.5a.25.25 0 0 0-.25-.25H7.5L6.25 3.5H1.75z"/>
        </svg>
        <p>暂无卷</p>
        <button @click="createVolume" class="create-first-btn">创建第一卷</button>
      </div>
    </div>

    <!-- 编辑对话框 -->
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
import { ref, computed, watch, onMounted } from 'vue'
import { ServiceFactory } from '@/services/storage'

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
  emits: ['chapter-selected', 'data-updated'],
  setup(props, { emit }) {
    // 响应式数据
    const volumes = ref([])
    const chapters = ref([])
    const expandedVolumes = ref(new Set())
    const isLoading = ref(false)
    const isProcessing = ref(false)
    const loadError = ref(null)

    // 对话框状态
    const showVolumeDialog = ref(false)
    const showChapterDialog = ref(false)
    const editingVolume = ref(null)
    const editingChapter = ref(null)

    // 表单数据
    const volumeForm = ref({
      title: '',
      description: ''
    })

    const chapterForm = ref({
      title: '',
      volumeId: ''
    })

    // 计算属性
    const chaptersByVolume = computed(() => {
      const map = new Map()
      chapters.value.forEach(chapter => {
        const volumeId = chapter.volumeId
        if (!map.has(volumeId)) {
          map.set(volumeId, [])
        }
        map.get(volumeId).push(chapter)
      })
      return map
    })

    // 方法
    const loadData = async () => {
      if (!props.projectId) return

      isLoading.value = true
      loadError.value = null

      try {
        // 加载卷数据
        let volumesData
        try {
          const volumeService = ServiceFactory.getVolumeService()
          volumesData = await volumeService.getProjectVolumes(props.projectId)
        } catch (error) {
          console.error('加载卷数据失败:', error)
          volumesData = []
        }

        volumes.value = volumesData || []

        // 加载章节数据
        let chaptersData
        try {
          const chapterService = ServiceFactory.getChapterService()
          chaptersData = await chapterService.getProjectChapters(props.projectId)
        } catch (error) {
          console.error('加载章节数据失败:', error)
          chaptersData = []
        }

        chapters.value = chaptersData || []

        // 默认展开第一卷
        if (volumes.value.length > 0 && expandedVolumes.value.size === 0) {
          expandedVolumes.value.add(volumes.value[0].id)
        }

      } catch (error) {
        console.error('加载数据失败:', error)
        loadError.value = '加载数据失败，请重试'
      } finally {
        isLoading.value = false
      }
    }

    const retryLoad = () => {
      loadData()
    }

    const refreshData = () => {
      loadData()
    }

    const toggleVolume = (volumeId) => {
      if (expandedVolumes.value.has(volumeId)) {
        expandedVolumes.value.delete(volumeId)
      } else {
        expandedVolumes.value.add(volumeId)
      }
    }

    const getVolumeChapters = (volumeId) => {
      return chaptersByVolume.value.get(volumeId) || []
    }

    const getVolumeChapterCount = (volumeId) => {
      const count = getVolumeChapters(volumeId).length
      return count > 0 ? count : ''
    }

    const formatWordCount = (wordCount) => {
      if (!wordCount || wordCount === 0) return ''
      if (wordCount >= 10000) {
        return `${(wordCount / 10000).toFixed(1)}万字`
      }
      return `${wordCount}字`
    }

    // 计算字数（去除HTML标签和空白字符）
    const calculateWordCount = (content) => {
      if (!content) return 0
      // 去除HTML标签
      const textContent = content.replace(/<[^>]*>/g, '')
      // 去除多余空白字符并计算字数
      return textContent.replace(/\s+/g, '').length
    }

    // 更新章节字数
    const updateChapterWordCount = async (chapterId, content) => {
      try {
        const wordCount = calculateWordCount(content)
        
        // 更新本地数据
        const chapterIndex = chapters.value.findIndex(c => c.id === chapterId)
        if (chapterIndex !== -1) {
          chapters.value[chapterIndex] = {
            ...chapters.value[chapterIndex],
            wordCount: wordCount,
            lastModified: new Date().toISOString()
          }
        }

        // 保存到存储
        const chapter = chapters.value[chapterIndex]
        if (chapter) {
          const chapterService = ServiceFactory.getChapterService()
          await chapterService.updateChapter(props.projectId, {
            ...chapter,
            wordCount: wordCount
          })
        }

        return wordCount
      } catch (error) {
        console.error('更新章节字数失败:', error)
        return 0
      }
    }

    // 批量更新所有章节字数
    const refreshAllWordCounts = async () => {
      try {
        for (const chapter of chapters.value) {
          if (chapter.content) {
            await updateChapterWordCount(chapter.id, chapter.content)
          }
        }
        emit('data-updated')
      } catch (error) {
        console.error('批量更新字数失败:', error)
      }
    }

    const selectChapter = (chapter) => {
      emit('chapter-selected', chapter)
    }

    // 卷管理
    const createVolume = () => {
      editingVolume.value = null
      volumeForm.value = {
        title: '',
        description: ''
      }
      showVolumeDialog.value = true
    }

    const editVolume = (volume) => {
      editingVolume.value = volume
      volumeForm.value = {
        title: volume.title,
        description: volume.description || ''
      }
      showVolumeDialog.value = true
    }

    const saveVolume = async () => {
      if (isProcessing.value) return

      isProcessing.value = true
      try {
        const volumeService = ServiceFactory.getVolumeService()
        if (editingVolume.value) {
          // 更新卷
          const updatedVolume = {
            ...editingVolume.value,
            ...volumeForm.value
          }
          await volumeService.updateVolume(props.projectId, updatedVolume)
          
          const index = volumes.value.findIndex(v => v.id === editingVolume.value.id)
          if (index !== -1) {
            volumes.value[index] = updatedVolume
          }
        } else {
          // 创建新卷
          const newVolume = await volumeService.createVolume(props.projectId, volumeForm.value)
          if (newVolume && !volumes.value.some(v => v.id === newVolume.id)) {
            volumes.value.push(newVolume)
            expandedVolumes.value.add(newVolume.id)
          }
        }

        closeVolumeDialog()
        emit('data-updated')
      } catch (error) {
        console.error('保存卷失败:', error)
        alert('保存失败，请重试')
      } finally {
        isProcessing.value = false
      }
    }

    const deleteVolume = async (volumeId) => {
      const volume = volumes.value.find(v => v.id === volumeId)
      if (!volume) return

      if (!confirm(`确定要删除卷"${volume.title}"吗？这将同时删除该卷下的所有章节。`)) {
        return
      }

      try {
        const volumeService = ServiceFactory.getVolumeService()
        await volumeService.deleteVolume(props.projectId, volumeId)
        volumes.value = volumes.value.filter(v => v.id !== volumeId)
        chapters.value = chapters.value.filter(c => c.volumeId !== volumeId)
        expandedVolumes.value.delete(volumeId)
        emit('data-updated')
      } catch (error) {
        console.error('删除卷失败:', error)
        alert('删除失败，请重试')
      }
    }

    const closeVolumeDialog = () => {
      showVolumeDialog.value = false
      editingVolume.value = null
    }

    // 章节管理
    const createChapter = (volumeId) => {
      editingChapter.value = null
      chapterForm.value = {
        title: '',
        volumeId: volumeId
      }
      showChapterDialog.value = true
    }

    const editChapter = (chapter) => {
      editingChapter.value = chapter
      chapterForm.value = {
        title: chapter.title,
        volumeId: chapter.volumeId
      }
      showChapterDialog.value = true
    }

    const saveChapter = async () => {
      if (isProcessing.value) return

      isProcessing.value = true
      try {
        if (editingChapter.value) {
          // 更新章节
          const updatedChapter = {
            ...editingChapter.value,
            ...chapterForm.value,
            lastModified: new Date().toISOString()
          }
          
          // 如果有内容，计算字数
          if (updatedChapter.content) {
            updatedChapter.wordCount = calculateWordCount(updatedChapter.content)
          }
          
          const chapterService = ServiceFactory.getChapterService()
          await chapterService.updateChapter(props.projectId, updatedChapter)
          
          const index = chapters.value.findIndex(c => c.id === editingChapter.value.id)
          if (index !== -1) {
            chapters.value[index] = updatedChapter
          }
        } else {
          // 创建新章节
          const newChapterData = {
            ...chapterForm.value,
            wordCount: 0,
            content: '',
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString()
          }
          
          const chapterService = ServiceFactory.getChapterService()
          const newChapter = await chapterService.createChapter(
            props.projectId, 
            chapterForm.value.volumeId, 
            newChapterData
          )
          if (newChapter && !chapters.value.some(c => c.id === newChapter.id)) {
            chapters.value.push(newChapter)
          }
        }

        closeChapterDialog()
        emit('data-updated')
      } catch (error) {
        console.error('保存章节失败:', error)
        alert('保存失败，请重试')
      } finally {
        isProcessing.value = false
      }
    }

    const deleteChapter = async (chapterId) => {
      const chapter = chapters.value.find(c => c.id === chapterId)
      if (!chapter) return

      if (!confirm(`确定要删除章节"${chapter.title}"吗？`)) {
        return
      }

      try {
        const chapterService = ServiceFactory.getChapterService()
        await chapterService.deleteChapter(props.projectId, chapterId)
        chapters.value = chapters.value.filter(c => c.id !== chapterId)
        emit('data-updated')
      } catch (error) {
        console.error('删除章节失败:', error)
        alert('删除失败，请重试')
      }
    }

    const closeChapterDialog = () => {
      showChapterDialog.value = false
      editingChapter.value = null
    }

    // 监听项目变化
    watch(() => props.projectId, () => {
      if (props.projectId) {
        loadData()
      }
    }, { immediate: true })

    // 生命周期
    onMounted(() => {
      if (props.projectId) {
        loadData()
      }
    })

    // 暴露给父组件的方法
    const expose = {
      updateChapterWordCount,
      refreshAllWordCounts,
      loadData,
      calculateWordCount
    }

    // 使用 defineExpose 暴露方法（Vue 3.2+）
    if (typeof defineExpose !== 'undefined') {
      defineExpose(expose)
    }

    return {
      // 数据
      volumes,
      chapters,
      expandedVolumes,
      isLoading,
      isProcessing,
      loadError,
      chaptersByVolume,

      // 对话框
      showVolumeDialog,
      showChapterDialog,
      editingVolume,
      editingChapter,
      volumeForm,
      chapterForm,

      // 方法
      loadData,
      retryLoad,
      refreshData,
      toggleVolume,
      getVolumeChapters,
      getVolumeChapterCount,
      formatWordCount,
      selectChapter,

      // 卷管理
      createVolume,
      editVolume,
      saveVolume,
      deleteVolume,
      closeVolumeDialog,

      // 章节管理
      createChapter,
      editChapter,
      saveChapter,
      deleteChapter,
      closeChapterDialog,

      // 字数管理
      calculateWordCount,
      updateChapterWordCount,
      refreshAllWordCounts
    }
  }
}
</script>

<style scoped>
.vscode-file-explorer {
  height: 100%;
  background: var(--vscode-sideBar-background, #252526);
  color: var(--vscode-sideBar-foreground, #cccccc);
  font-family: var(--vscode-font-family, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif);
  font-size: 13px;
  display: flex;
  flex-direction: column;
  user-select: none;
}

/* 标题栏 */
.explorer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--vscode-sideBarSectionHeader-background, #2d2d30);
  border-bottom: 1px solid var(--vscode-sideBar-border, #3e3e42);
  font-weight: 600;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 6px;
}

.folder-icon {
  color: var(--vscode-icon-foreground, #c5c5c5);
}

.header-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  background: none;
  border: none;
  color: var(--vscode-icon-foreground, #c5c5c5);
  cursor: pointer;
  padding: 4px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.1s ease;
}

.action-btn:hover:not(:disabled) {
  background: var(--vscode-toolbar-hoverBackground, #37373d);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 加载和错误状态 */
.loading-state, .error-state {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  color: var(--vscode-descriptionForeground, #9d9d9d);
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--vscode-progressBar-background, #0e70c0);
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon {
  color: var(--vscode-errorForeground, #f85149);
}

.retry-btn {
  background: var(--vscode-button-background, #0e639c);
  color: var(--vscode-button-foreground, #ffffff);
  border: none;
  padding: 4px 8px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 11px;
}

.retry-btn:hover {
  background: var(--vscode-button-hoverBackground, #1177bb);
}

/* 文件树 */
.file-tree {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
}

.tree-item {
  position: relative;
}

.tree-node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px 4px 12px;
  cursor: pointer;
  transition: background-color 0.1s ease;
  min-height: 22px;
}

.tree-node:hover {
  background: var(--vscode-list-hoverBackground, #2a2d2e);
}

.volume-item .tree-node {
  font-weight: 500;
}

.chapter-item.selected .tree-node {
  background: var(--vscode-list-activeSelectionBackground, #094771);
  color: var(--vscode-list-activeSelectionForeground, #ffffff);
}

.node-content {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.node-indent {
  width: 16px;
  flex-shrink: 0;
}

.chevron-icon {
  color: var(--vscode-icon-foreground, #c5c5c5);
  transition: transform 0.1s ease;
  flex-shrink: 0;
}

.chevron-icon.expanded {
  transform: rotate(90deg);
}

.folder-icon {
  color: var(--vscode-icon-foreground, #c5c5c5);
  flex-shrink: 0;
}

.folder-icon.open {
  color: var(--vscode-tree-tableOddRowsBackground, #dcb67a);
}

.file-icon {
  color: var(--vscode-icon-foreground, #c5c5c5);
  flex-shrink: 0;
}

.add-icon {
  color: var(--vscode-icon-foreground, #c5c5c5);
  flex-shrink: 0;
}

.node-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.add-label {
  color: var(--vscode-descriptionForeground, #9d9d9d);
  font-style: italic;
}

.node-badge {
  background: var(--vscode-badge-background, #4d4d4d);
  color: var(--vscode-badge-foreground, #ffffff);
  font-size: 10px;
  padding: 1px 4px;
  border-radius: 8px;
  min-width: 16px;
  text-align: center;
  font-weight: 600;
}

.node-meta {
  color: var(--vscode-descriptionForeground, #9d9d9d);
  font-size: 11px;
  margin-left: auto;
}

.node-actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.1s ease;
}

.tree-node:hover .node-actions {
  opacity: 1;
}

.node-actions .action-btn {
  padding: 2px;
}

.node-actions .action-btn.delete:hover {
  background: var(--vscode-errorBackground, #5a1d1d);
  color: var(--vscode-errorForeground, #f85149);
}

/* 树形结构缩进 */
.tree-children {
  margin-left: 0;
}

.tree-children .tree-node {
  padding-left: 28px;
}

/* 添加项目样式 */
.add-item .tree-node:hover {
  background: var(--vscode-list-hoverBackground, #2a2d2e);
}

.add-item .tree-node:hover .add-label {
  color: var(--vscode-foreground, #cccccc);
}

/* 空状态 */
.empty-item {
  pointer-events: none;
}

.empty-text {
  color: var(--vscode-descriptionForeground, #9d9d9d);
  font-style: italic;
  font-size: 11px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  text-align: center;
  color: var(--vscode-descriptionForeground, #9d9d9d);
  gap: 12px;
}

.empty-icon {
  color: var(--vscode-icon-foreground, #c5c5c5);
  opacity: 0.6;
}

.create-first-btn {
  background: var(--vscode-button-background, #0e639c);
  color: var(--vscode-button-foreground, #ffffff);
  border: none;
  padding: 6px 12px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
}

.create-first-btn:hover {
  background: var(--vscode-button-hoverBackground, #1177bb);
}

/* 模态框 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-dialog {
  background: var(--vscode-editorWidget-background, #2d2d30);
  border: 1px solid var(--vscode-editorWidget-border, #454545);
  border-radius: 6px;
  width: 400px;
  max-width: 90vw;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--vscode-editorWidget-border, #454545);
  background: var(--vscode-editorGroupHeader-tabsBackground, #2d2d30);
}

.modal-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--vscode-foreground, #cccccc);
}

.close-btn {
  background: none;
  border: none;
  color: var(--vscode-icon-foreground, #c5c5c5);
  cursor: pointer;
  padding: 4px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  width: 24px;
  height: 24px;
}

.close-btn:hover {
  background: var(--vscode-toolbar-hoverBackground, #37373d);
}

.modal-form {
  padding: 20px;
}

.form-field {
  margin-bottom: 16px;
}

.form-field label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--vscode-foreground, #cccccc);
}

.form-field input,
.form-field textarea,
.form-field select {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--vscode-input-border, #3c3c3c);
  background: var(--vscode-input-background, #3c3c3c);
  color: var(--vscode-input-foreground, #cccccc);
  border-radius: 3px;
  font-size: 13px;
  font-family: inherit;
  box-sizing: border-box;
}

.form-field input:focus,
.form-field textarea:focus,
.form-field select:focus {
  outline: none;
  border-color: var(--vscode-focusBorder, #007acc);
  box-shadow: 0 0 0 1px var(--vscode-focusBorder, #007acc);
}

.form-field textarea {
  resize: vertical;
  min-height: 60px;
}

.modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--vscode-editorWidget-border, #454545);
}

.modal-actions button {
  padding: 8px 16px;
  border: 1px solid var(--vscode-button-border, transparent);
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.1s ease;
}

.modal-actions button[type="button"] {
  background: var(--vscode-button-secondaryBackground, #5a5d5e);
  color: var(--vscode-button-secondaryForeground, #ffffff);
}

.modal-actions button[type="button"]:hover:not(:disabled) {
  background: var(--vscode-button-secondaryHoverBackground, #6c7070);
}

.modal-actions button.primary {
  background: var(--vscode-button-background, #0e639c);
  color: var(--vscode-button-foreground, #ffffff);
}

.modal-actions button.primary:hover:not(:disabled) {
  background: var(--vscode-button-hoverBackground, #1177bb);
}

.modal-actions button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 滚动条样式 */
.file-tree::-webkit-scrollbar {
  width: 10px;
}

.file-tree::-webkit-scrollbar-track {
  background: var(--vscode-scrollbarSlider-background, #79797966);
}

.file-tree::-webkit-scrollbar-thumb {
  background: var(--vscode-scrollbarSlider-background, #79797966);
  border-radius: 5px;
}

.file-tree::-webkit-scrollbar-thumb:hover {
  background: var(--vscode-scrollbarSlider-hoverBackground, #646464b3);
}

/* 深色主题适配 */
@media (prefers-color-scheme: dark) {
  .vscode-file-explorer {
    --vscode-sideBar-background: #252526;
    --vscode-sideBar-foreground: #cccccc;
    --vscode-sideBarSectionHeader-background: #2d2d30;
    --vscode-sideBar-border: #3e3e42;
    --vscode-icon-foreground: #c5c5c5;
    --vscode-toolbar-hoverBackground: #37373d;
    --vscode-list-hoverBackground: #2a2d2e;
    --vscode-list-activeSelectionBackground: #094771;
    --vscode-list-activeSelectionForeground: #ffffff;
    --vscode-descriptionForeground: #9d9d9d;
    --vscode-progressBar-background: #0e70c0;
    --vscode-errorForeground: #f85149;
    --vscode-button-background: #0e639c;
    --vscode-button-foreground: #ffffff;
    --vscode-button-hoverBackground: #1177bb;
    --vscode-badge-background: #4d4d4d;
    --vscode-badge-foreground: #ffffff;
    --vscode-editorWidget-background: #2d2d30;
    --vscode-editorWidget-border: #454545;
    --vscode-editorGroupHeader-tabsBackground: #2d2d30;
    --vscode-input-background: #3c3c3c;
    --vscode-input-foreground: #cccccc;
    --vscode-input-border: #3c3c3c;
    --vscode-focusBorder: #007acc;
    --vscode-button-secondaryBackground: #5a5d5e;
    --vscode-button-secondaryForeground: #ffffff;
    --vscode-button-secondaryHoverBackground: #6c7070;
  }
}

/* 浅色主题适配 */
@media (prefers-color-scheme: light) {
  .vscode-file-explorer {
    --vscode-sideBar-background: #f3f3f3;
    --vscode-sideBar-foreground: #383a42;
    --vscode-sideBarSectionHeader-background: #e8e8e8;
    --vscode-sideBar-border: #e5e5e5;
    --vscode-icon-foreground: #424242;
    --vscode-toolbar-hoverBackground: #e8e8e8;
    --vscode-list-hoverBackground: #e8e8e8;
    --vscode-list-activeSelectionBackground: #0078d4;
    --vscode-list-activeSelectionForeground: #ffffff;
    --vscode-descriptionForeground: #717171;
    --vscode-progressBar-background: #0078d4;
    --vscode-errorForeground: #e51400;
    --vscode-button-background: #0078d4;
    --vscode-button-foreground: #ffffff;
    --vscode-button-hoverBackground: #106ebe;
    --vscode-badge-background: #c4c4c4;
    --vscode-badge-foreground: #333333;
    --vscode-editorWidget-background: #f8f8f8;
    --vscode-editorWidget-border: #c8c8c8;
    --vscode-editorGroupHeader-tabsBackground: #f8f8f8;
    --vscode-input-background: #ffffff;
    --vscode-input-foreground: #383a42;
    --vscode-input-border: #cecece;
    --vscode-focusBorder: #0078d4;
    --vscode-button-secondaryBackground: #e1e1e1;
    --vscode-button-secondaryForeground: #383a42;
    --vscode-button-secondaryHoverBackground: #d6d6d6;
  }
}
</style>