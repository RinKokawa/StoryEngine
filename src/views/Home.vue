<template>
  <Layout>
    <div class="main-area">
      <!-- 顶部栏 -->
      <header class="main-header">
        <div class="header-title">StoryEngine</div>
        <div class="header-actions">
          <button class="create-btn" @click="showCreateModal = true">
            <PlusIcon class="icon" /> 新建小说
          </button>
        </div>
      </header>

      <!-- 小说列表区 -->
      <section v-if="currentNav==='novels'" class="novels-section">
        <div class="section-header">
          <h2>我的项目</h2>
          <div class="view-controls">
            <button @click="viewMode = 'grid'" :class="{ active: viewMode === 'grid' }">
              <GridIcon class="icon" />
            </button>
            <button @click="viewMode = 'list'" :class="{ active: viewMode === 'list' }">
              <ListIcon class="icon" />
            </button>
            <button @click="importNovel" class="import-btn">
              <UploadIcon class="icon" /> 导入
            </button>
          </div>
        </div>
        <div class="novels-container" :class="viewMode">
          <div 
            v-for="novel in novels" 
            :key="novel.id" 
            class="novel-card"
            @dblclick="openNovel(novel)"
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
              <button @click.stop="openChapters(novel)" class="action-btn chapters">
                <BookOpenIcon class="icon" />
              </button>
              <button @click.stop="editNovelInfo(novel)" class="action-btn">
                <EditIcon class="icon" />
              </button>
              <button @click.stop="deleteNovel(novel)" class="action-btn delete">
                <TrashIcon class="icon" />
              </button>
            </div>
          </div>
          <div v-if="novels.length === 0" class="empty-state">
            <BookIcon class="empty-icon" />
            <h3>还没有项目</h3>
            <p>点击"新建小说"开始你的创作之旅</p>
          </div>
        </div>
      </section>
      <!-- 其他功能区预留 -->
      <section v-else class="placeholder-section">
        <div class="placeholder-content">
          <h2>功能开发中…</h2>
          <p>敬请期待！</p>
        </div>
      </section>
    </div>

    <!-- 创建/编辑小说弹窗 -->
    <div v-if="showCreateModal || editModal.visible" class="modal-overlay" @click="closeNovelModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ editModal.visible ? '编辑小说' : '创建新小说' }}</h3>
          <button @click="closeNovelModal" class="close-btn">
            <XIcon class="icon" />
          </button>
        </div>
        <form @submit.prevent="editModal.visible ? updateNovel() : createNovel()" class="modal-content">
          <div class="form-group">
            <label for="title">小说标题 *</label>
            <input 
              id="title"
              :value="editModal.visible ? editNovelData.title : newNovel.title"
              @input="e => editModal.visible ? (editNovelData.title = (e.target as HTMLInputElement).value) : (newNovel.title = (e.target as HTMLInputElement).value)"
              type="text" 
              placeholder="输入小说标题"
              required
            />
          </div>
          <div class="form-group">
            <label for="description">简介</label>
            <textarea 
              id="description"
              :value="editModal.visible ? editNovelData.description : newNovel.description"
              @input="e => editModal.visible ? (editNovelData.description = (e.target as HTMLTextAreaElement).value) : (newNovel.description = (e.target as HTMLTextAreaElement).value)"
              placeholder="简要描述你的故事..."
              rows="3"
            ></textarea>
          </div>
          <div class="form-group">
            <label for="genre">类型</label>
            <select 
              id="genre"
              :value="editModal.visible ? editNovelData.genre : newNovel.genre"
              @change="e => editModal.visible ? (editNovelData.genre = (e.target as HTMLSelectElement).value) : (newNovel.genre = (e.target as HTMLSelectElement).value)"
            >
              <option value="">选择类型</option>
              <option value="fantasy">玄幻</option>
              <option value="romance">言情</option>
              <option value="science-fiction">科幻</option>
              <option value="historical">历史</option>
              <option value="mystery">悬疑</option>
              <option value="other">其他</option>
            </select>
          </div>
          <div class="form-group">
            <label>封面</label>
            <input type="file" accept="image/*" @change="onCoverChange($event, editModal.visible)" />
            <div v-if="coverPreview" class="cover-preview">
              <img :src="coverPreview" alt="封面预览" />
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" @click="closeNovelModal" class="cancel-btn">取消</button>
            <button type="submit" class="confirm-btn">{{ editModal.visible ? '保存' : '创建' }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 删除小说确认弹窗 -->
    <div v-if="deleteModal.visible" class="modal-overlay" @click="closeDeleteModal">
      <div class="modal delete-modal" @click.stop>
        <div class="modal-header">
          <h3>危险操作：删除小说</h3>
          <button @click="closeDeleteModal" class="close-btn">
            <XIcon class="icon" />
          </button>
        </div>
        <div class="modal-content">
          <p>请输入小说标题 <b>"{{ deleteModal.novel?.title }}"</b> 以确认删除。此操作不可恢复！</p>
          <input
            v-model="deleteModal.input"
            class="delete-input"
            :placeholder="deleteModal.novel?.title"
            @keydown.enter="confirmDeleteNovel"
            autofocus
          />
          <div v-if="deleteModal.input && deleteModal.input !== deleteModal.novel?.title" class="delete-warn">标题不匹配，无法删除。</div>
          <div class="modal-actions">
            <button type="button" @click="closeDeleteModal" class="cancel-btn">取消</button>
            <button type="button" class="confirm-btn delete" :disabled="deleteModal.input !== deleteModal.novel?.title" @click="confirmDeleteNovel">删除</button>
          </div>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Layout from '../components/Layout.vue'
import { 
  PlusIcon, 
  UploadIcon, 
  GridIcon, 
  ListIcon, 
  BookIcon, 
  EditIcon, 
  TrashIcon,
  XIcon,
  BookOpenIcon
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
  volumes?: any[]
}

const router = useRouter()
const novels = ref<Novel[]>([])
const viewMode = ref<'grid' | 'list'>('grid')
const showCreateModal = ref(false)
const editModal = ref({ visible: false, novel: null as Novel | null })
const editNovelData = reactive({ title: '', description: '', genre: '', cover: '' })
const coverPreview = ref('')
const newNovel = reactive({
  title: '',
  description: '',
  genre: '',
  cover: ''
})
const currentNav = ref('novels')
const deleteModal = ref({ visible: false, novel: null as Novel | null, input: '' })

onMounted(() => {
  loadNovels()
})

const loadNovels = () => {
  const stored = localStorage.getItem('novels')
  if (stored) {
    novels.value = JSON.parse(stored).map((novel: any) => ({
      ...novel,
      lastEdit: new Date(novel.lastEdit),
      createdAt: new Date(novel.createdAt),
      volumes: novel.volumes || []
    }))
  }
}

function onCoverChange(e: Event, isEdit: boolean) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = ev => {
      coverPreview.value = ev.target?.result as string
      if (isEdit) editNovelData.cover = coverPreview.value
      else newNovel.cover = coverPreview.value
    }
    reader.readAsDataURL(file)
  }
}

function closeNovelModal() {
  showCreateModal.value = false
  editModal.value.visible = false
  coverPreview.value = ''
}

function createNovel() {
  if (!newNovel.title.trim()) return
  const novel: Novel = {
    id: Date.now().toString(),
    title: newNovel.title,
    description: newNovel.description,
    genre: newNovel.genre,
    cover: newNovel.cover || '',
    wordCount: 0,
    lastEdit: new Date(),
    createdAt: new Date(),
    volumes: []
  }
  novels.value.unshift(novel)
  saveNovels()
  Object.assign(newNovel, { title: '', description: '', genre: '', cover: '' })
  showCreateModal.value = false
  openNovel(novel)
}

function editNovelInfo(novel: Novel) {
  editModal.value.visible = true
  editModal.value.novel = novel
  Object.assign(editNovelData, {
    title: novel.title,
    description: novel.description,
    genre: novel.genre,
    cover: novel.cover || ''
  })
  coverPreview.value = novel.cover || ''
}

function updateNovel() {
  if (!editModal.value.novel) return
  editModal.value.novel.title = editNovelData.title
  editModal.value.novel.description = editNovelData.description
  editModal.value.novel.genre = editNovelData.genre
  editModal.value.novel.cover = editNovelData.cover
  saveNovels()
  closeNovelModal()
}

const openNovel = (novel: Novel) => {
  localStorage.setItem('currentNovelId', novel.id)
  // 清除可能存在的章节ID，确保从主页进入时加载第一章
  localStorage.removeItem('currentChapterId')
  router.push('/writing')
}

const openChapters = (novel: Novel) => {
  router.push(`/chapters/${novel.id}`)
}

const deleteNovel = (novel: Novel) => {
  deleteModal.value.visible = true
  deleteModal.value.novel = novel
  deleteModal.value.input = ''
}

const closeDeleteModal = () => {
  deleteModal.value.visible = false
  deleteModal.value.novel = null
  deleteModal.value.input = ''
}

const confirmDeleteNovel = () => {
  if (deleteModal.value.novel && deleteModal.value.input === deleteModal.value.novel.title) {
    novels.value = novels.value.filter(n => n.id !== deleteModal.value.novel!.id)
    saveNovels()
    closeDeleteModal()
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

.header-title {
  font-size: 2.1rem;
  font-weight: bold;
  color: var(--title-color);
  letter-spacing: 2px;
}

.header-actions {
  display: flex;
  gap: 1.2rem;
}

.create-btn {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.9rem 2rem;
  border: none;
  border-radius: 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  background: var(--primary-btn-bg);
  color: var(--primary-btn-color);
  box-shadow: var(--card-shadow);
  transition: all 0.22s cubic-bezier(.4,2,.6,1);
}

.create-btn:hover {
  transform: scale(1.06) translateY(-2px);
  box-shadow: var(--primary-btn-hover);
}

.novels-section {
  margin: 0 auto;
  width: 100%;
  max-width: 1600px;
  background: none;
  border-radius: 0;
  box-shadow: none;
  padding: 2.5rem 2vw 2.5rem 2vw;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  border-bottom: 1.5px solid var(--border);
  padding-bottom: 0.5rem;
}

.section-header h2 {
  font-size: 1.5rem;
  color: var(--title-color);
}

.view-controls {
  display: flex;
  gap: 0.7rem;
}

.view-controls button {
  padding: 0.5rem 1rem;
  border: 2px solid var(--border);
  background: var(--input-bg);
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--accent);
  font-size: 1.1rem;
}

.view-controls button.active {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}

.import-btn {
  background: var(--input-bg);
  color: var(--accent);
  border: 2px solid var(--border);
  font-size: 1.05rem;
}

.import-btn:hover {
  background: var(--accent);
  color: #fff;
}

.novels-container.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 2.5rem 2rem;
  margin-top: 2rem;
}

.novels-container.list {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  margin-top: 2rem;

}

.novel-card {
  background: var(--card-bg);
  border-radius: 2rem;
  padding: 2.2rem 2rem 1.7rem 2rem;
  box-shadow: var(--card-shadow);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(.4,2,.6,1);
  position: relative;
  backdrop-filter: blur(8px);
  border: 2px solid var(--border);
  min-width: 320px;
  max-width: 480px;
  margin: 0 auto;
}

.novel-card:hover {
  transform: translateY(-8px) scale(1.03) rotateZ(-0.5deg);
  box-shadow: var(--card-hover-shadow);
  border-color: var(--accent);
}

.novel-cover {
  width: 80px;
  height: 104px;
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
  width: 36px;
  height: 36px;
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

.action-btn.chapters:hover {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
  box-shadow: 0 0 8px var(--accent);
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

/* 弹窗和表单 */
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

/* 其他功能区占位 */
.placeholder-section {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 60vh;
}

.placeholder-content {
  text-align: center;
  color: var(--subtitle-color);
}

.delete-modal {
  border: 2px solid #dc3545;
}

.delete-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #dc3545;
  border-radius: 0.7rem;
  font-size: 1.1rem;
  margin: 1.2rem 0 0.5rem 0;
  background: var(--input-bg);
  color: #dc3545;
  outline: none;
  transition: border-color 0.2s;
}

.delete-input:focus {
  border-color: #b71c1c;
}

.delete-warn {
  color: #dc3545;
  font-size: 0.98rem;
  margin-bottom: 0.5rem;
}

.confirm-btn.delete {
  background: #dc3545;
  border-color: #dc3545;
}

.confirm-btn.delete:disabled {
  background: #f8d7da;
  color: #fff;
  border-color: #f8d7da;
  cursor: not-allowed;
}

.cover-preview {
  margin-top: 0.5rem;
  max-width: 120px;
  max-height: 160px;
  border-radius: 0.7rem;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.cover-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style> 