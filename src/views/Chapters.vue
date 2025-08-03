<template>
  <Layout>
    <div class="main-area">
      <!-- 顶部栏 -->
      <header class="main-header">
        <div class="header-left">
          <button class="back-btn" @click="goBack">
            <ArrowLeftIcon class="icon" />
          </button>
          <div class="header-title">
            <h1>{{ currentNovel?.title }}</h1>
            <span class="subtitle">章节管理</span>
          </div>
        </div>
        <div class="header-actions">
          <button class="create-volume-btn" @click="showCreateVolumeModal = true">
            <PlusIcon class="icon" /> 新建卷
          </button>
          <button class="create-chapter-btn" @click="showCreateChapterModal = true">
            <PlusIcon class="icon" /> 新建章节
          </button>
        </div>
      </header>

      <!-- 主要内容区域 -->
      <div class="content-wrapper">
        <!-- 导航侧边栏 -->
        <aside class="navigation-sidebar">
          <div class="sidebar-header">
            <h3>快速导航</h3>
          </div>
          
          <div class="sidebar-content">
            <div class="navigation-list">
              <!-- 卷列表 -->
              <div 
                v-for="volume in volumes" 
                :key="volume.id" 
                class="volume-nav-item"
              >
                <div class="volume-nav-header" @click="scrollToVolume(volume.id)">
                  <BookOpenIcon class="icon" />
                  <span class="volume-nav-title">{{ volume.title }}</span>
                  <span class="chapter-count">{{ volume.chapters.length }}章</span>
                </div>
                
                <!-- 章节列表 -->
                <div class="chapters-nav-list">
                  <div 
                    v-for="chapter in volume.chapters" 
                    :key="chapter.id"
                    class="chapter-nav-item"
                    @click="scrollToChapter(chapter.id)"
                  >
                    <div class="chapter-nav-number">{{ chapter.number }}</div>
                    <div class="chapter-nav-title">{{ chapter.title }}</div>
                  </div>
                </div>
              </div>

              <!-- 未分类章节 -->
              <div v-if="unassignedChapters.length > 0" class="volume-nav-item">
                <div class="volume-nav-header" @click="scrollToUnassigned">
                  <FolderIcon class="icon" />
                  <span class="volume-nav-title">未分类章节</span>
                  <span class="chapter-count">{{ unassignedChapters.length }}章</span>
                </div>
                
                <div class="chapters-nav-list">
                  <div 
                    v-for="chapter in unassignedChapters" 
                    :key="chapter.id"
                    class="chapter-nav-item"
                    @click="scrollToChapter(chapter.id)"
                  >
                    <div class="chapter-nav-number">{{ chapter.number }}</div>
                    <div class="chapter-nav-title">{{ chapter.title }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <!-- 章节内容区 -->
        <div class="chapters-container">
          <div v-if="volumes.length === 0" class="empty-state">
            <BookOpenIcon class="empty-icon" />
            <h3>还没有章节</h3>
            <p>点击"新建章节"开始创建你的故事</p>
          </div>

          <div v-else class="volumes-list">
            <div 
              v-for="volume in volumes" 
              :key="volume.id" 
              class="volume-section"
              :id="`volume-${volume.id}`"
            >
              <div class="volume-header">
                <div class="volume-info">
                  <h3 class="volume-title">{{ volume.title }}</h3>
                  <span class="volume-chapter-count">{{ volume.chapters.length }}章</span>
                </div>
                <div class="volume-actions">
                  <button @click="editVolume(volume)" class="action-btn">
                    <EditIcon class="icon" />
                  </button>
                  <button @click="deleteVolume(volume)" class="action-btn delete">
                    <TrashIcon class="icon" />
                  </button>
                </div>
              </div>

              <div class="chapters-list">
                <div 
                  v-for="chapter in volume.chapters" 
                  :key="chapter.id" 
                  class="chapter-item"
                  :id="`chapter-${chapter.id}`"
                  @click="openChapter(chapter)"
                >
                  <div class="chapter-info">
                    <div class="chapter-number">{{ chapter.number }}</div>
                    <div class="chapter-details">
                      <h4 class="chapter-title">{{ chapter.title }}</h4>
                      <div class="chapter-stats">
                        <span class="word-count">{{ formatWordCount(chapter.wordCount) }}</span>
                        <span class="last-edit">{{ formatDate(chapter.lastEdit) }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="chapter-actions">
                    <button @click.stop="editChapter(chapter)" class="action-btn">
                      <EditIcon class="icon" />
                    </button>
                    <button @click.stop="deleteChapter(chapter)" class="action-btn delete">
                      <TrashIcon class="icon" />
                    </button>
                  </div>
                </div>

                <div v-if="volume.chapters.length === 0" class="empty-chapters">
                  <p>此卷还没有章节</p>
                </div>
              </div>
            </div>

            <!-- 未分类章节 -->
            <div v-if="unassignedChapters.length > 0" class="volume-section" id="unassigned-chapters">
              <div class="volume-header">
                <div class="volume-info">
                  <h3 class="volume-title">未分类章节</h3>
                  <span class="volume-chapter-count">{{ unassignedChapters.length }}章</span>
                </div>
              </div>
              <div class="chapters-list">
                <div 
                  v-for="chapter in unassignedChapters" 
                  :key="chapter.id" 
                  class="chapter-item"
                  :id="`chapter-${chapter.id}`"
                  @click="openChapter(chapter)"
                >
                  <div class="chapter-info">
                    <div class="chapter-number">{{ chapter.number }}</div>
                    <div class="chapter-details">
                      <h4 class="chapter-title">{{ chapter.title }}</h4>
                      <div class="chapter-stats">
                        <span class="word-count">{{ formatWordCount(chapter.wordCount) }}</span>
                        <span class="last-edit">{{ formatDate(chapter.lastEdit) }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="chapter-actions">
                    <button @click.stop="editChapter(chapter)" class="action-btn">
                      <EditIcon class="icon" />
                    </button>
                    <button @click.stop="deleteChapter(chapter)" class="action-btn delete">
                      <TrashIcon class="icon" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建/编辑卷弹窗 -->
    <div v-if="showCreateVolumeModal || editVolumeModal.visible" class="modal-overlay" @click="closeVolumeModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ editVolumeModal.visible ? '编辑卷' : '创建新卷' }}</h3>
          <button @click="closeVolumeModal" class="close-btn">
            <XIcon class="icon" />
          </button>
        </div>
        <form @submit.prevent="editVolumeModal.visible ? updateVolume() : createVolume()" class="modal-content">
          <div class="form-group">
            <label for="volumeTitle">卷标题 *</label>
            <input 
              id="volumeTitle"
              :value="editVolumeModal.visible ? editVolumeData.title : newVolume.title"
              @input="e => editVolumeModal.visible ? (editVolumeData.title = (e.target as HTMLInputElement).value) : (newVolume.title = (e.target as HTMLInputElement).value)"
              type="text" 
              placeholder="输入卷标题"
              required
            />
          </div>
          <div class="form-group">
            <label for="volumeDescription">卷简介</label>
            <textarea 
              id="volumeDescription"
              :value="editVolumeModal.visible ? editVolumeData.description : newVolume.description"
              @input="e => editVolumeModal.visible ? (editVolumeData.description = (e.target as HTMLTextAreaElement).value) : (newVolume.description = (e.target as HTMLTextAreaElement).value)"
              placeholder="简要描述这个卷的内容..."
              rows="3"
            ></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" @click="closeVolumeModal" class="cancel-btn">取消</button>
            <button type="submit" class="confirm-btn">{{ editVolumeModal.visible ? '保存' : '创建' }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 创建/编辑章节弹窗 -->
    <div v-if="showCreateChapterModal || editChapterModal.visible" class="modal-overlay" @click="closeChapterModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ editChapterModal.visible ? '编辑章节' : '创建新章节' }}</h3>
          <button @click="closeChapterModal" class="close-btn">
            <XIcon class="icon" />
          </button>
        </div>
        <form @submit.prevent="editChapterModal.visible ? updateChapter() : createChapter()" class="modal-content">
          <div class="form-group">
            <label for="chapterTitle">章节标题 *</label>
            <input 
              id="chapterTitle"
              :value="editChapterModal.visible ? editChapterData.title : newChapter.title"
              @input="e => editChapterModal.visible ? (editChapterData.title = (e.target as HTMLInputElement).value) : (newChapter.title = (e.target as HTMLInputElement).value)"
              type="text" 
              placeholder="输入章节标题"
              required
            />
          </div>
          <div class="form-group">
            <label for="chapterVolume">所属卷</label>
            <select 
              id="chapterVolume"
              :value="editChapterModal.visible ? editChapterData.volumeId : newChapter.volumeId"
              @change="e => editChapterModal.visible ? (editChapterData.volumeId = (e.target as HTMLSelectElement).value) : (newChapter.volumeId = (e.target as HTMLSelectElement).value)"
            >
              <option value="">不分类</option>
              <option v-for="volume in volumes" :key="volume.id" :value="volume.id">
                {{ volume.title }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label for="chapterContent">章节内容</label>
            <textarea 
              id="chapterContent"
              :value="editChapterModal.visible ? editChapterData.content : newChapter.content"
              @input="e => editChapterModal.visible ? (editChapterData.content = (e.target as HTMLTextAreaElement).value) : (newChapter.content = (e.target as HTMLTextAreaElement).value)"
              placeholder="开始写作..."
              rows="8"
            ></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" @click="closeChapterModal" class="cancel-btn">取消</button>
            <button type="submit" class="confirm-btn">{{ editChapterModal.visible ? '保存' : '创建' }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 删除确认弹窗 -->
    <div v-if="deleteModal.visible" class="modal-overlay" @click="closeDeleteModal">
      <div class="modal delete-modal" @click.stop>
        <div class="modal-header">
          <h3>确认删除</h3>
          <button @click="closeDeleteModal" class="close-btn">
            <XIcon class="icon" />
          </button>
        </div>
        <div class="modal-content">
          <p>确定要删除 <b>"{{ deleteModal.item?.title }}"</b> 吗？此操作不可恢复！</p>
          <div class="modal-actions">
            <button type="button" @click="closeDeleteModal" class="cancel-btn">取消</button>
            <button type="button" class="confirm-btn delete" @click="confirmDelete">删除</button>
          </div>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Layout from '../components/Layout.vue'
import { 
  ArrowLeftIcon,
  PlusIcon, 
  EditIcon, 
  TrashIcon,
  XIcon,
  BookOpenIcon,
  FolderIcon
} from 'lucide-vue-next'

interface Chapter {
  id: string
  title: string
  content: string
  number: string
  volumeId?: string
  wordCount: number
  lastEdit: Date
  createdAt: Date
}

interface Volume {
  id: string
  title: string
  description?: string
  chapters: Chapter[]
  createdAt: Date
}

interface Novel {
  id: string
  title: string
  description?: string
  genre?: string
  cover?: string
  wordCount: number
  lastEdit: Date
  createdAt: Date
  volumes: Volume[]
}

const router = useRouter()
const route = useRoute()
const currentNovel = ref<Novel | null>(null)
const volumes = ref<Volume[]>([])
const showCreateVolumeModal = ref(false)
const showCreateChapterModal = ref(false)
const editVolumeModal = ref({ visible: false, volume: null as Volume | null })
const editChapterModal = ref({ visible: false, chapter: null as Chapter | null })
const deleteModal = ref({ visible: false, item: null as Volume | Chapter | null, type: 'volume' as 'volume' | 'chapter' })



const newVolume = reactive({ title: '', description: '' })
const newChapter = reactive({ title: '', content: '', volumeId: '' })
const editVolumeData = reactive({ title: '', description: '' })
const editChapterData = reactive({ title: '', content: '', volumeId: '' })

onMounted(() => {
  loadNovel()
})

const loadNovel = () => {
  const novelId = route.params.id as string
  const stored = localStorage.getItem('novels')
  if (stored) {
    const novels = JSON.parse(stored)
    const novel = novels.find((n: any) => n.id === novelId)
    if (novel) {
      currentNovel.value = {
        ...novel,
        lastEdit: new Date(novel.lastEdit),
        createdAt: new Date(novel.createdAt),
        volumes: novel.volumes ? novel.volumes.map((v: any) => ({
          ...v,
          createdAt: new Date(v.createdAt),
          chapters: v.chapters ? v.chapters.map((c: any) => ({
            ...c,
            lastEdit: new Date(c.lastEdit),
            createdAt: new Date(c.createdAt)
          })) : []
        })) : []
      }
      volumes.value = currentNovel.value?.volumes || []
    }
  }
}

const unassignedChapters = computed(() => {
  if (!currentNovel.value) return []
  const allChapters = volumes.value.flatMap(v => v.chapters)
  return allChapters.filter(c => !c.volumeId)
})

const goBack = () => {
  router.push('/')
}

const closeVolumeModal = () => {
  showCreateVolumeModal.value = false
  editVolumeModal.value.visible = false
  Object.assign(newVolume, { title: '', description: '' })
  Object.assign(editVolumeData, { title: '', description: '' })
}

const closeChapterModal = () => {
  showCreateChapterModal.value = false
  editChapterModal.value.visible = false
  Object.assign(newChapter, { title: '', content: '', volumeId: '' })
  Object.assign(editChapterData, { title: '', content: '', volumeId: '' })
}

const closeDeleteModal = () => {
  deleteModal.value.visible = false
  deleteModal.value.item = null
  deleteModal.value.type = 'volume'
}

const createVolume = () => {
  if (!newVolume.title.trim()) return
  const volume: Volume = {
    id: Date.now().toString(),
    title: newVolume.title,
    description: newVolume.description,
    chapters: [],
    createdAt: new Date()
  }
  volumes.value.push(volume)
  saveNovel()
  closeVolumeModal()
}

const editVolume = (volume: Volume) => {
  editVolumeModal.value.visible = true
  editVolumeModal.value.volume = volume
  Object.assign(editVolumeData, {
    title: volume.title,
    description: volume.description || ''
  })
}

const updateVolume = () => {
  if (!editVolumeModal.value.volume) return
  editVolumeModal.value.volume.title = editVolumeData.title
  editVolumeModal.value.volume.description = editVolumeData.description
  saveNovel()
  closeVolumeModal()
}

const deleteVolume = (volume: Volume) => {
  deleteModal.value.visible = true
  deleteModal.value.item = volume
  deleteModal.value.type = 'volume'
}

const createChapter = () => {
  if (!newChapter.title.trim()) return
  
  let targetVolume: Volume
  
  if (newChapter.volumeId) {
    targetVolume = volumes.value.find(v => v.id === newChapter.volumeId)!
  } else {
    // 添加到第一个卷，如果没有卷则创建默认卷
    if (volumes.value.length === 0) {
      targetVolume = {
        id: Date.now().toString(),
        title: '第一卷',
        chapters: [],
        createdAt: new Date()
      }
      volumes.value.push(targetVolume)
    } else {
      targetVolume = volumes.value[0]
    }
  }
  
  const chapter: Chapter = {
    id: Date.now().toString(),
    title: newChapter.title,
    content: newChapter.content,
    number: `第${targetVolume.chapters.length + 1}章`,
    volumeId: targetVolume.id,
    wordCount: newChapter.content.length,
    lastEdit: new Date(),
    createdAt: new Date()
  }
  
  targetVolume.chapters.push(chapter)
  
  // 重新生成所有章节的编号
  regenerateChapterNumbers()
  
  saveNovel()
  closeChapterModal()
}

const editChapter = (chapter: Chapter) => {
  editChapterModal.value.visible = true
  editChapterModal.value.chapter = chapter
  Object.assign(editChapterData, {
    title: chapter.title,
    content: chapter.content,
    volumeId: chapter.volumeId || ''
  })
}

const updateChapter = () => {
  if (!editChapterModal.value.chapter) return
  const chapter = editChapterModal.value.chapter
  chapter.title = editChapterData.title
  chapter.content = editChapterData.content
  chapter.wordCount = editChapterData.content.length
  chapter.lastEdit = new Date()
  
  // 处理卷的变更
  if (chapter.volumeId !== editChapterData.volumeId) {
    // 从原卷中移除
    volumes.value.forEach(volume => {
      volume.chapters = volume.chapters.filter(c => c.id !== chapter.id)
    })
    
    // 添加到新卷
    if (editChapterData.volumeId) {
      const targetVolume = volumes.value.find(v => v.id === editChapterData.volumeId)
      if (targetVolume) {
        chapter.volumeId = editChapterData.volumeId
        targetVolume.chapters.push(chapter)
      }
    } else {
      chapter.volumeId = undefined
      // 添加到第一个卷
      if (volumes.value.length > 0) {
        volumes.value[0].chapters.push(chapter)
      }
    }
    
    // 重新生成所有章节的编号
    regenerateChapterNumbers()
  }
  
  saveNovel()
  closeChapterModal()
}

const deleteChapter = (chapter: Chapter) => {
  deleteModal.value.visible = true
  deleteModal.value.item = chapter
  deleteModal.value.type = 'chapter'
}

const confirmDelete = () => {
  if (!deleteModal.value.item) return
  
  if (deleteModal.value.type === 'volume') {
    const volume = deleteModal.value.item as Volume
    volumes.value = volumes.value.filter(v => v.id !== volume.id)
  } else if (deleteModal.value.type === 'chapter') {
    const chapter = deleteModal.value.item as Chapter
    volumes.value.forEach(volume => {
      volume.chapters = volume.chapters.filter(c => c.id !== chapter.id)
    })
    
    // 删除章节后重新生成编号
    regenerateChapterNumbers()
  }
  
  saveNovel()
  closeDeleteModal()
}

const openChapter = (chapter: Chapter) => {
  localStorage.setItem('currentNovelId', currentNovel.value!.id)
  localStorage.setItem('currentChapterId', chapter.id)
  router.push('/writing')
}

const regenerateChapterNumbers = () => {
  // 为每个卷内的章节重新生成编号
  volumes.value.forEach(volume => {
    volume.chapters.forEach((chapter, index) => {
      chapter.number = `第${index + 1}章`
      // 如果章节标题是默认的"第X章"格式，也更新标题
      if (chapter.title.match(/^第\d+章$/)) {
        chapter.title = `第${index + 1}章`
      }
    })
  })
}

const generateChapterNumber = (): string => {
  const allChapters = volumes.value.flatMap(v => v.chapters)
  return `第${allChapters.length + 1}章`
}

const saveNovel = () => {
  if (!currentNovel.value) return
  
  currentNovel.value.volumes = volumes.value
  currentNovel.value.lastEdit = new Date()
  
  const stored = localStorage.getItem('novels')
  const novels = stored ? JSON.parse(stored) : []
  const novelIndex = novels.findIndex((n: any) => n.id === currentNovel.value!.id)
  
  if (novelIndex !== -1) {
    novels[novelIndex] = currentNovel.value
  }
  
  localStorage.setItem('novels', JSON.stringify(novels))
}

const formatWordCount = (count: number): string => {
  if (count < 1000) return `${count}字`
  if (count < 10000) return `${(count / 1000).toFixed(1)}千字`
  return `${(count / 10000).toFixed(1)}万字`
}



// 滚动到指定位置
const scrollToVolume = (volumeId: string) => {
  const element = document.getElementById(`volume-${volumeId}`)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const scrollToChapter = (chapterId: string) => {
  const element = document.getElementById(`chapter-${chapterId}`)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

const scrollToUnassigned = () => {
  const element = document.getElementById('unassigned-chapters')
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const formatDate = (date: Date): string => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString()
}
</script>

<style scoped>
.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100vh;
  overflow: auto;
}

.main-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2.2rem 3vw 1.2rem 3vw;
  background: var(--header-bg);
  border-bottom: 2px solid var(--border);
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  position: sticky;
  top: 0;
  z-index: 2;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border: 2px solid var(--border);
  background: var(--input-bg);
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--accent);
}

.back-btn:hover {
  background: var(--accent);
  color: #fff;
  transform: translateX(-2px);
}

.header-title {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.header-title h1 {
  font-size: 1.8rem;
  font-weight: bold;
  color: var(--title-color);
  margin: 0;
}

.subtitle {
  font-size: 1rem;
  color: var(--subtitle-color);
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.create-volume-btn,
.create-chapter-btn {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.9rem 1.5rem;
  border: none;
  border-radius: 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.22s cubic-bezier(.4,2,.6,1);
}

.create-volume-btn {
  background: var(--input-bg);
  color: var(--accent);
  border: 2px solid var(--border);
}

.create-volume-btn:hover {
  background: var(--accent);
  color: #fff;
  transform: translateY(-2px);
}

.create-chapter-btn {
  background: var(--primary-btn-bg);
  color: var(--primary-btn-color);
}

.create-chapter-btn:hover {
  transform: scale(1.06) translateY(-2px);
  box-shadow: var(--primary-btn-hover);
}

.content-wrapper {
  display: flex;
  flex: 1;
  overflow-x: hidden; /* Prevent horizontal scroll */
}

.navigation-sidebar {
  width: 300px; /* Fixed width for the sidebar */
  background: var(--sidebar-bg);
  border-right: 2px solid var(--border);
  box-shadow: 2px 0 8px rgba(0,0,0,0.08);
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease-in-out;
  z-index: 1; /* Ensure it's above content */
  overflow-y: auto; /* Allow scrolling for content */
  height: 100%;
}



.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border);
  background: var(--header-bg);
}

.sidebar-header h3 {
  margin: 0;
  color: var(--title-color);
  font-size: 1.2rem;
}



.sidebar-content {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
}



.navigation-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.volume-nav-item {
  background: var(--card-bg);
  border-radius: 1.5rem;
  padding: 1.2rem;
  box-shadow: var(--card-shadow);
  border: 2px solid var(--border);
}

.volume-nav-header {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  cursor: pointer;
  padding-bottom: 0.8rem;
  border-bottom: 1px solid var(--border);
}

.volume-nav-header:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.volume-nav-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--title-color);
  flex: 1;
}

.chapter-count {
  background: var(--accent);
  color: #fff;
  padding: 0.3rem 0.8rem;
  border-radius: 1rem;
  font-size: 0.9rem;
  font-weight: 600;
}

.chapters-nav-list {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.chapter-nav-item {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.8rem 0.5rem;
  background: var(--input-bg);
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.chapter-nav-item:hover {
  border-color: var(--accent);
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.chapter-nav-number {
  background: var(--primary-btn-bg);
  color: var(--primary-btn-color);
  padding: 0.5rem 1rem;
  border-radius: 1rem;
  font-size: 0.9rem;
  font-weight: 600;
  min-width: 4rem;
  text-align: center;
}

.chapter-nav-title {
  font-size: 1rem;
  font-weight: 500;
  color: var(--title-color);
  flex: 1;
}

.chapters-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 2.5rem 2vw;
  overflow-y: auto; /* Allow scrolling for content */
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--subtitle-color);
}

.empty-icon {
  width: 4rem;
  height: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
  filter: drop-shadow(0 0 8px var(--accent));
}

.volumes-list {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

.volume-section {
  background: var(--card-bg);
  border-radius: 2rem;
  padding: 2rem;
  box-shadow: var(--card-shadow);
  border: 2px solid var(--border);
}

.volume-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border);
}

.volume-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.volume-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--title-color);
  margin: 0;
}

.volume-chapter-count {
  background: var(--accent);
  color: #fff;
  padding: 0.3rem 0.8rem;
  border-radius: 1rem;
  font-size: 0.9rem;
  font-weight: 600;
}

.volume-actions {
  display: flex;
  gap: 0.7rem;
}

.chapters-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.chapter-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.2rem 1.5rem;
  background: var(--input-bg);
  border-radius: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.chapter-item:hover {
  border-color: var(--accent);
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.chapter-info {
  display: flex;
  align-items: center;
  gap: 1.2rem;
  flex: 1;
}

.chapter-number {
  background: var(--primary-btn-bg);
  color: var(--primary-btn-color);
  padding: 0.5rem 1rem;
  border-radius: 1rem;
  font-size: 0.9rem;
  font-weight: 600;
  min-width: 4rem;
  text-align: center;
}

.chapter-details {
  flex: 1;
}

.chapter-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--title-color);
  margin: 0 0 0.3rem 0;
}

.chapter-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  color: var(--subtitle-color);
}

.chapter-actions {
  display: flex;
  gap: 0.7rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.chapter-item:hover .chapter-actions {
  opacity: 1;
}

.action-btn {
  padding: 0.6rem;
  border: 2px solid var(--border);
  background: var(--input-bg);
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--accent);
  font-size: 1rem;
}

.action-btn:hover {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
  box-shadow: 0 0 8px var(--accent);
}

.action-btn.delete:hover {
  background: #dc3545;
  color: #fff;
  border-color: #dc3545;
  box-shadow: 0 0 8px #dc3545;
}

.empty-chapters {
  text-align: center;
  padding: 2rem;
  color: var(--subtitle-color);
  font-style: italic;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--modal-bg);
  border-radius: 2rem;
  width: 600px;
  max-width: 90vw;
  box-shadow: var(--modal-shadow);
  backdrop-filter: blur(12px);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border);
}

.modal-header h3 {
  margin: 0;
  color: var(--title-color);
}

.close-btn {
  padding: 0.5rem;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 1rem;
  transition: background 0.2s;
}

.close-btn:hover {
  background: var(--input-bg);
}

.modal-content {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--title-color);
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid var(--input-border);
  border-radius: 1rem;
  font-size: 1rem;
  background: var(--input-bg);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--primary-btn-bg);
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

.cancel-btn,
.confirm-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 1rem;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: var(--input-bg);
  color: var(--subtitle-color);
  border: 2px solid var(--border);
}

.cancel-btn:hover {
  background: var(--accent);
  color: #fff;
}

.confirm-btn {
  background: var(--primary-btn-bg);
  color: var(--primary-btn-color);
}

.confirm-btn:hover {
  transform: translateY(-1px) scale(1.04);
  box-shadow: var(--primary-btn-hover);
}

.confirm-btn.delete {
  background: #dc3545;
  border-color: #dc3545;
}

.delete-modal {
  border: 2px solid #dc3545;
}

.icon {
  width: 1.2rem;
  height: 1.2rem;
}
</style> 