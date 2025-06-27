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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
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

// 生命周期
onMounted(() => {
  loadNovels()
})

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

<style scoped>
.home-container {
  padding: 2rem 3rem;
  min-height: 100vh;
  width: 100%;
}

.app-header {
  text-align: center;
  margin-bottom: 3rem;
  padding: 0 2rem;
}

.app-title {
  font-size: 2.5rem;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.app-subtitle {
  font-size: 1.1rem;
  color: #7f8c8d;
}

.quick-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 3rem;
}

.create-btn, .import-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.create-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.create-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.import-btn {
  background: #f8f9fa;
  color: #495057;
  border: 1px solid #dee2e6;
}

.import-btn:hover {
  background: #e9ecef;
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
  color: #2c3e50;
}

.view-controls {
  display: flex;
  gap: 0.5rem;
}

.view-controls button {
  padding: 0.5rem;
  border: 1px solid #dee2e6;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.view-controls button.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.novels-container.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  max-width: none;
}

.novels-container.list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.novel-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.novel-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.novel-cover {
  width: 60px;
  height: 80px;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 1rem;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.book-icon {
  color: white;
  width: 24px;
  height: 24px;
}

.novel-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.5rem;
  line-height: 1.2;
}

.novel-description {
  color: #6c757d;
  font-size: 0.9rem;
  line-height: 1.4;
  margin-bottom: 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.novel-stats {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: #868e96;
}

.novel-actions {
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  gap: 0.5rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.novel-card:hover .novel-actions {
  opacity: 1;
}

.action-btn {
  padding: 0.5rem;
  border: 1px solid #dee2e6;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f8f9fa;
}

.action-btn.delete:hover {
  background: #dc3545;
  color: white;
  border-color: #dc3545;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #6c757d;
}

.empty-icon {
  width: 4rem;
  height: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
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
  background: white;
  border-radius: 12px;
  width: 600px;
  max-width: 90vw;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #dee2e6;
}

.modal-header h3 {
  margin: 0;
  color: #2c3e50;
}

.close-btn {
  padding: 0.5rem;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s;
}

.close-btn:hover {
  background: #f8f9fa;
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
  color: #495057;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
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
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: #f8f9fa;
  color: #6c757d;
  border: 1px solid #dee2e6;
}

.cancel-btn:hover {
  background: #e9ecef;
}

.confirm-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.confirm-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.icon {
  width: 1rem;
  height: 1rem;
}
</style> 