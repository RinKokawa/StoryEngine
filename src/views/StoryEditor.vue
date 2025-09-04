<template>
  <div class="story-editor">
    <div class="editor-header">
      <div class="title-section">
        <div class="title-row">
          <button @click="toggleSidebar" class="sidebar-toggle" :title="sidebarVisible ? '隐藏章节面板' : '显示章节面板'">
            <span v-if="sidebarVisible">◀</span>
            <span v-else>▶</span>
          </button>
          <h1>故事编辑</h1>
        </div>
        <div v-if="currentProject" class="subtitle">
          {{ currentProject.name }}
          <span v-if="currentChapter" class="chapter-info">
            - {{ currentChapter.title || `第${currentChapter.order}章` }}
          </span>
        </div>
      </div>
    </div>
    
    <div class="editor-layout">
      <!-- 左侧章节选择器 -->
      <div v-if="sidebarVisible" class="sidebar">
        <ChapterSelector
          v-if="currentProject"
          :project-id="currentProject.id"
          :current-chapter-id="currentChapterId"
          @chapter-selected="handleChapterSelected"
          @chapter-created="handleChapterCreated"
          @chapter-updated="handleChapterUpdated"
          @chapter-deleted="handleChapterDeleted"
        />
      </div>
      
      <!-- 右侧编辑器 -->
      <div class="editor-content" :class="{ 'full-width': !sidebarVisible }">
        <NovelEditor 
          :current-project="currentProject"
          :current-chapter="currentChapter"
          @project-changed="handleProjectChanged"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import NovelEditor from '../components/NovelEditor.vue'
import ChapterSelector from '../components/common/ChapterSelector.vue'
import storageManager from '../utils/storage.js'

export default {
  name: 'StoryEditor',
  components: {
    NovelEditor,
    ChapterSelector
  },
  setup() {
    const currentProject = ref(null)
    const currentChapterId = ref(null)
    const chapters = ref([])
    const sidebarVisible = ref(true)

    // 当前章节
    const currentChapter = computed(() => {
      if (!currentChapterId.value || !chapters.value.length) return null
      return chapters.value.find(c => c.id === currentChapterId.value)
    })

    // 加载当前项目
    const loadCurrentProject = () => {
      const project = storageManager.getCurrentProject()
      if (project) {
        currentProject.value = project
        loadChapters()
        loadCurrentChapter()
      }
    }

    // 加载章节列表
    const loadChapters = () => {
      if (currentProject.value) {
        chapters.value = storageManager.getProjectChapters(currentProject.value.id)
        
        // 如果没有章节，创建第一章
        if (chapters.value.length === 0) {
          const firstChapter = storageManager.createChapter(currentProject.value.id, {
            title: '第一章',
            order: 1,
            content: '　　'
          })
          if (firstChapter) {
            chapters.value = [firstChapter]
            currentChapterId.value = firstChapter.id
            storageManager.setCurrentChapter(currentProject.value.id, firstChapter.id)
          }
        }
      }
    }

    // 加载当前编辑的章节
    const loadCurrentChapter = () => {
      if (currentProject.value) {
        const chapterId = storageManager.getCurrentChapter(currentProject.value.id)
        if (chapterId && chapters.value.find(c => c.id === chapterId)) {
          currentChapterId.value = chapterId
        } else if (chapters.value.length > 0) {
          // 如果没有设置当前章节，默认选择第一章
          currentChapterId.value = chapters.value[0].id
          storageManager.setCurrentChapter(currentProject.value.id, chapters.value[0].id)
        }
      }
    }

    // 处理项目切换
    const handleProjectChanged = (project) => {
      currentProject.value = project
      storageManager.setCurrentProject(project)
      loadChapters()
      loadCurrentChapter()
    }

    // 处理章节选择
    const handleChapterSelected = (chapter) => {
      currentChapterId.value = chapter.id
      if (currentProject.value) {
        storageManager.setCurrentChapter(currentProject.value.id, chapter.id)
      }
    }

    // 处理章节创建
    const handleChapterCreated = (chapter) => {
      chapters.value.push(chapter)
      currentChapterId.value = chapter.id
      if (currentProject.value) {
        storageManager.setCurrentChapter(currentProject.value.id, chapter.id)
      }
    }

    // 处理章节更新
    const handleChapterUpdated = (chapter) => {
      const index = chapters.value.findIndex(c => c.id === chapter.id)
      if (index >= 0) {
        chapters.value[index] = chapter
      }
    }

    // 处理章节删除
    const handleChapterDeleted = (chapter) => {
      chapters.value = chapters.value.filter(c => c.id !== chapter.id)
      
      // 如果删除的是当前章节，切换到第一章
      if (currentChapterId.value === chapter.id) {
        if (chapters.value.length > 0) {
          currentChapterId.value = chapters.value[0].id
          if (currentProject.value) {
            storageManager.setCurrentChapter(currentProject.value.id, chapters.value[0].id)
          }
        } else {
          currentChapterId.value = null
        }
      }
    }

    // 切换侧边栏显示状态
    const toggleSidebar = () => {
      sidebarVisible.value = !sidebarVisible.value
    }

    onMounted(() => {
      loadCurrentProject()
    })

    return {
      currentProject,
      currentChapterId,
      currentChapter,
      sidebarVisible,
      toggleSidebar,
      handleProjectChanged,
      handleChapterSelected,
      handleChapterCreated,
      handleChapterUpdated,
      handleChapterDeleted
    }
  }
}
</script>

<style scoped>
.story-editor {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}

.editor-header {
  background: white;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sidebar-toggle {
  width: 32px;
  height: 32px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #666;
  transition: all 0.3s;
}

.sidebar-toggle:hover {
  background: #f8f9fa;
  border-color: #007bff;
  color: #007bff;
}

.title-section h1 {
  margin: 0 0 4px 0;
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
}

.subtitle {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.chapter-info {
  color: #007bff;
}

.editor-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar {
  width: 300px;
  background: #f8f9fa;
  border-right: 1px solid #e0e0e0;
  padding: 16px;
  overflow-y: auto;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.editor-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.3s ease;
}

.editor-content.full-width {
  width: 100%;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .editor-layout {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
    height: 200px;
    border-right: none;
    border-bottom: 1px solid #e0e0e0;
  }
  
  .editor-content {
    flex: 1;
  }
}

/* 滚动条样式 */
.sidebar::-webkit-scrollbar {
  width: 6px;
}

.sidebar::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.sidebar::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.sidebar::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>