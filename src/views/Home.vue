<template>
  <div class="home-container">
    <!-- 顶部标题栏 -->
    <header class="app-header">
      <h1 class="app-title">我的小说工作室</h1>
      <p class="app-subtitle">创作属于你的故事世界</p>
    </header>

    <!-- 快速操作区域 -->
    <section class="quick-actions">
      <button @click="showCreateModal = true" class="create-btn">
        <PlusIcon class="icon" />
        创建新小说
      </button>
      <button @click="importNovel" class="import-btn">
        <UploadIcon class="icon" />
        导入小说
      </button>
    </section>

    <!-- 小说列表 -->
    <section class="novels-section">
      <div class="section-header">
        <h2>我的小说</h2>
        <div class="view-controls">
          <button @click="viewMode = 'grid'" :class="{ active: viewMode === 'grid' }">
            <GridIcon class="icon" />
          </button>
          <button @click="viewMode = 'list'" :class="{ active: viewMode === 'list' }">
            <ListIcon class="icon" />
          </button>
        </div>
      </div>

      <!-- 小说网格/列表视图 -->
      <div class="novels-container" :class="viewMode">
        <div 
          v-for="novel in novels" 
          :key="novel.id" 
          class="novel-card"
          @click="openNovel(novel)"
        >
          <div class="novel-cover">
            <img v-if="novel.cover" :src="novel.cover" :alt="novel.title" />
            <div v-else class="default-cover">
              <BookIcon class="book-icon" />
            </div>
          </div>
          <div class="novel-info">
            <h3 class="novel-title">{{ novel.title }}</h3>
            <p class="novel-description">{{ novel.description || '暂无简介' }}</p>
            <div class="novel-stats">
              <span class="word-count">{{ formatWordCount(novel.wordCount) }}</span>
              <span class="last-edit">{{ formatDate(novel.lastEdit) }}</span>
            </div>
          </div>
          <div class="novel-actions">
            <button @click.stop="editNovelInfo(novel)" class="action-btn">
              <EditIcon class="icon" />
            </button>
            <button @click.stop="deleteNovel(novel)" class="action-btn delete">
              <TrashIcon class="icon" />
            </button>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="novels.length === 0" class="empty-state">
          <BookIcon class="empty-icon" />
          <h3>还没有小说</h3>
          <p>点击"创建新小说"开始你的创作之旅</p>
        </div>
      </div>
    </section>

    <!-- 创建小说弹窗 -->
    <div v-if="showCreateModal" class="modal-overlay" @click="showCreateModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>创建新小说</h3>
          <button @click="showCreateModal = false" class="close-btn">
            <XIcon class="icon" />
          </button>
        </div>
        <form @submit.prevent="createNovel" class="modal-content">
          <div class="form-group">
            <label for="title">小说标题 *</label>
            <input 
              id="title"
              v-model="newNovel.title" 
              type="text" 
              placeholder="输入小说标题"
              required
            />
          </div>
          <div class="form-group">
            <label for="description">简介</label>
            <textarea 
              id="description"
              v-model="newNovel.description" 
              placeholder="简要描述你的故事..."
              rows="3"
            ></textarea>
          </div>
          <div class="form-group">
            <label for="genre">类型</label>
            <select id="genre" v-model="newNovel.genre">
              <option value="">选择类型</option>
              <option value="fantasy">玄幻</option>
              <option value="romance">言情</option>
              <option value="science-fiction">科幻</option>
              <option value="historical">历史</option>
              <option value="mystery">悬疑</option>
              <option value="other">其他</option>
            </select>
          </div>
          <div class="modal-actions">
            <button type="button" @click="showCreateModal = false" class="cancel-btn">
              取消
            </button>
            <button type="submit" class="confirm-btn">
              创建
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 主题切换器 -->
    <div class="theme-switcher">
      <label>主题：</label>
      <select v-model="theme" @change="applyTheme">
        <option value="modern">现代极简</option>
        <option value="cyber">酷炫赛博</option>
        <option value="glass">玻璃拟态</option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { 
  PlusIcon, 
  UploadIcon, 
  GridIcon, 
  ListIcon, 
  BookIcon, 
  EditIcon, 
  TrashIcon,
  XIcon 
} from 'lucide-vue-next'

interface Novel {
  id: string
  title: string
  description?: string
  genre?: string
  cover?: string
  wordCount: number
  lastEdit: Date
  createdAt: Date
}

const router = useRouter()

// 响应式数据
const novels = ref<Novel[]>([])
const viewMode = ref<'grid' | 'list'>('grid')
const showCreateModal = ref(false)
const newNovel = reactive({
  title: '',
  description: '',
  genre: ''
})

const theme = ref('modern')

const applyTheme = () => {
  const root = document.documentElement
  if (theme.value === 'modern') {
    root.setAttribute('data-theme', 'modern')
  } else if (theme.value === 'cyber') {
    root.setAttribute('data-theme', 'cyber')
  } else if (theme.value === 'glass') {
    root.setAttribute('data-theme', 'glass')
  }
  localStorage.setItem('novel-theme', theme.value)
}

// 生命周期
onMounted(() => {
  loadNovels()
  // 主题初始化
  const saved = localStorage.getItem('novel-theme')
  if (saved) {
    theme.value = saved
    applyTheme()
  } else {
    applyTheme()
  }
})

watch(theme, applyTheme)

// 方法
const loadNovels = () => {
  // 从本地存储加载小说列表
  const stored = localStorage.getItem('novels')
  if (stored) {
    novels.value = JSON.parse(stored).map((novel: any) => ({
      ...novel,
      lastEdit: new Date(novel.lastEdit),
      createdAt: new Date(novel.createdAt)
    }))
  }
}

const createNovel = () => {
  if (!newNovel.title.trim()) return

  const novel: Novel = {
    id: Date.now().toString(),
    title: newNovel.title,
    description: newNovel.description,
    genre: newNovel.genre,
    wordCount: 0,
    lastEdit: new Date(),
    createdAt: new Date()
  }

  novels.value.unshift(novel)
  saveNovels()
  
  // 重置表单
  Object.assign(newNovel, { title: '', description: '', genre: '' })
  showCreateModal.value = false
  
  // 直接进入编辑模式
  openNovel(novel)
}

const openNovel = (novel: Novel) => {
  // 设置当前小说ID，然后跳转到写作页面
  localStorage.setItem('currentNovelId', novel.id)
  router.push('/writing')
}

const editNovelInfo = (novel: Novel) => {
  // TODO: 实现编辑小说信息功能
  console.log('编辑小说信息:', novel)
}

const deleteNovel = (novel: Novel) => {
  if (confirm(`确定要删除小说《${novel.title}》吗？此操作不可恢复。`)) {
    novels.value = novels.value.filter(n => n.id !== novel.id)
    saveNovels()
  }
}

const importNovel = () => {
  // TODO: 实现导入小说功能
  console.log('导入小说')
}

const saveNovels = () => {
  localStorage.setItem('novels', JSON.stringify(novels.value))
}

const formatWordCount = (count: number): string => {
  if (count < 1000) return `${count}字`
  if (count < 10000) return `${(count / 1000).toFixed(1)}千字`
  return `${(count / 10000).toFixed(1)}万字`
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

<style>
:root,
[data-theme='modern'] {
  --main-bg: linear-gradient(135deg, #f8fafc 0%, #e9ecef 100%);
  --header-bg: #fff;
  --title-color: #2c3e50;
  --subtitle-color: #7f8c8d;
  --card-bg: #fff;
  --card-shadow: 0 2px 8px rgba(0,0,0,0.08);
  --card-hover-shadow: 0 8px 24px rgba(0,0,0,0.12);
  --primary-btn-bg: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --primary-btn-color: #fff;
  --primary-btn-hover: 0 4px 12px rgba(102,126,234,0.4);
  --accent: #667eea;
  --border: #dee2e6;
  --input-bg: #fff;
  --input-border: #ced4da;
  --modal-bg: #fff;
  --modal-shadow: 0 10px 40px rgba(0,0,0,0.2);
}
[data-theme='cyber'] {
  --main-bg: linear-gradient(120deg, #0f2027 0%, #2c5364 100%);
  --header-bg: rgba(20,20,40,0.95);
  --title-color: #00fff7;
  --subtitle-color: #ff00cc;
  --card-bg: rgba(30,30,60,0.95);
  --card-shadow: 0 0 16px #00fff7, 0 2px 8px rgba(0,0,0,0.3);
  --card-hover-shadow: 0 0 32px #ff00cc, 0 8px 24px rgba(0,0,0,0.4);
  --primary-btn-bg: linear-gradient(90deg, #00fff7 0%, #ff00cc 100%);
  --primary-btn-color: #222;
  --primary-btn-hover: 0 0 16px #00fff7;
  --accent: #ff00cc;
  --border: #00fff7;
  --input-bg: #181828;
  --input-border: #00fff7;
  --modal-bg: rgba(20,20,40,0.98);
  --modal-shadow: 0 0 40px #ff00cc;
}
[data-theme='glass'] {
  --main-bg: linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%);
  --header-bg: rgba(255,255,255,0.7);
  --title-color: #3a3a3a;
  --subtitle-color: #6c757d;
  --card-bg: rgba(255,255,255,0.5);
  --card-shadow: 0 8px 32px 0 rgba(31,38,135,0.18);
  --card-hover-shadow: 0 16px 48px 0 rgba(31,38,135,0.24);
  --primary-btn-bg: linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%);
  --primary-btn-color: #222;
  --primary-btn-hover: 0 4px 24px rgba(137,247,254,0.4);
  --accent: #66a6ff;
  --border: #b0c4de;
  --input-bg: rgba(255,255,255,0.7);
  --input-border: #b0c4de;
  --modal-bg: rgba(255,255,255,0.8);
  --modal-shadow: 0 10px 40px rgba(137,247,254,0.2);
}

.home-container {
  padding: 2rem 3rem;
  min-height: 100vh;
  width: 100%;
  background: var(--main-bg);
  transition: background 0.5s;
}

.app-header {
  text-align: center;
  margin-bottom: 3rem;
  padding: 0 2rem;
  background: var(--header-bg);
  border-radius: 1.5rem;
  box-shadow: var(--card-shadow);
  position: relative;
}

.app-title {
  font-size: 2.8rem;
  font-weight: bold;
  color: var(--title-color);
  margin-bottom: 0.5rem;
  letter-spacing: 2px;
  text-shadow: 0 2px 8px var(--accent), 0 0 1px #fff;
}

.app-subtitle {
  font-size: 1.1rem;
  color: var(--subtitle-color);
  margin-bottom: 0.5rem;
}

.quick-actions {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  margin-bottom: 3rem;
}

.create-btn, .import-btn {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 1rem 2rem;
  border: none;
  border-radius: 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(.4,2,.6,1);
  background: var(--primary-btn-bg);
  color: var(--primary-btn-color);
  box-shadow: var(--card-shadow);
}
.create-btn:hover, .import-btn:hover {
  transform: scale(1.06) translateY(-2px);
  box-shadow: var(--primary-btn-hover);
}
.import-btn {
  background: var(--input-bg);
  color: var(--accent);
  border: 2px solid var(--border);
}
.import-btn:hover {
  background: var(--accent);
  color: #fff;
}

.novels-section {
  margin-bottom: 2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h2 {
  font-size: 1.5rem;
  color: var(--title-color);
}

.view-controls {
  display: flex;
  gap: 0.5rem;
}

.view-controls button {
  padding: 0.5rem;
  border: 2px solid var(--border);
  background: var(--input-bg);
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--accent);
}
.view-controls button.active {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}

.novels-container.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 2rem;
  max-width: none;
}
.novels-container.list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.novel-card {
  background: var(--card-bg);
  border-radius: 2rem;
  padding: 2rem 1.5rem 1.5rem 1.5rem;
  box-shadow: var(--card-shadow);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(.4,2,.6,1);
  position: relative;
  backdrop-filter: blur(8px);
  border: 2px solid var(--border);
}
.novel-card:hover {
  transform: translateY(-8px) scale(1.03) rotateZ(-0.5deg);
  box-shadow: var(--card-hover-shadow);
  border-color: var(--accent);
}

.novel-cover {
  width: 70px;
  height: 90px;
  border-radius: 1rem;
  overflow: hidden;
  margin-bottom: 1rem;
  background: var(--input-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  border: 2px solid var(--border);
  backdrop-filter: blur(4px);
}
.novel-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.default-cover {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary-btn-bg);
}
.book-icon {
  color: #fff;
  width: 32px;
  height: 32px;
  filter: drop-shadow(0 0 8px var(--accent));
}

.novel-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--title-color);
  margin-bottom: 0.5rem;
  line-height: 1.2;
  letter-spacing: 1px;
}
.novel-description {
  color: var(--subtitle-color);
  font-size: 1rem;
  line-height: 1.5;
  margin-bottom: 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.novel-stats {
  display: flex;
  justify-content: space-between;
  font-size: 0.95rem;
  color: var(--subtitle-color);
}
.novel-actions {
  position: absolute;
  top: 1.2rem;
  right: 1.2rem;
  display: flex;
  gap: 0.7rem;
  opacity: 0;
  transition: opacity 0.2s;
}
.novel-card:hover .novel-actions {
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
  font-size: 1.1rem;
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
.icon {
  width: 1.2rem;
  height: 1.2rem;
}

.theme-switcher {
  position: fixed;
  top: 24px;
  right: 32px;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  background: rgba(255,255,255,0.7);
  border-radius: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  padding: 0.4rem 1.2rem;
  border: 1.5px solid var(--border);
  backdrop-filter: blur(8px);
}
.theme-switcher label {
  color: var(--accent);
  font-weight: bold;
}
.theme-switcher select {
  border: none;
  background: transparent;
  font-size: 1rem;
  color: var(--accent);
  outline: none;
  font-weight: 600;
  padding: 0.2rem 0.5rem;
}
</style> 