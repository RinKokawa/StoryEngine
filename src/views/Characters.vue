<template>
  <Layout>
    <header class="main-header">
      <div class="header-title">角色管理</div>
      <div class="header-actions">
        <button @click="showAddDialog = true" class="create-btn">
          <Plus class="icon" />
          添加角色
        </button>
      </div>
    </header>

    <div class="characters-content">
      <!-- 搜索和筛选 -->
      <div class="search-section">
        <div class="search-box">
          <Search class="search-icon" />
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="搜索角色名称..." 
            class="search-input"
          />
        </div>
        <div class="filter-buttons">
          <button 
            v-for="filter in filters" 
            :key="filter.value"
            @click="activeFilter = filter.value"
            :class="['filter-btn', { active: activeFilter === filter.value }]"
          >
            {{ filter.label }}
          </button>
        </div>
      </div>

      <!-- 角色列表 -->
      <div class="characters-grid">
        <div 
          v-for="character in filteredCharacters" 
          :key="character.id"
          class="character-card"
          @click="editCharacter(character)"
        >
          <div class="character-avatar">
            <img 
              :src="character.avatar || '/src/assets/default-avatar.svg'" 
              :alt="character.name"
              @error="handleImageError"
            />
          </div>
          <div class="character-info">
            <h3 class="character-name">{{ character.name }}</h3>
            <p class="character-role">{{ character.role }}</p>
            <p class="character-description">{{ character.description }}</p>
            <div class="character-tags">
              <span 
                v-for="tag in character.tags" 
                :key="tag"
                class="tag"
              >
                {{ tag }}
              </span>
            </div>
          </div>
          <div class="character-actions">
            <button @click.stop="editCharacter(character)" class="action-btn edit">
              <Edit class="icon" />
            </button>
            <button @click.stop="deleteCharacter(character.id)" class="action-btn delete">
              <Trash2 class="icon" />
            </button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredCharacters.length === 0" class="empty-state">
        <User class="empty-icon" />
        <h3>暂无角色</h3>
        <p>点击"添加角色"开始创建您的第一个角色</p>
      </div>
    </div>

    <!-- 添加/编辑角色对话框 -->
    <div v-if="showAddDialog || showEditDialog" class="modal-overlay" @click="closeDialog">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h2>{{ showEditDialog ? '编辑角色' : '添加角色' }}</h2>
          <button @click="closeDialog" class="close-btn">
            <X class="icon" />
          </button>
        </div>
        
        <form @submit.prevent="saveCharacter" class="character-form">
          <div class="form-group">
            <label>角色名称 *</label>
            <input 
              v-model="editingCharacter.name" 
              type="text" 
              required 
              placeholder="输入角色名称"
            />
          </div>
          
          <div class="form-group">
            <label>角色类型</label>
            <select v-model="editingCharacter.role">
              <option value="主角">主角</option>
              <option value="配角">配角</option>
              <option value="反派">反派</option>
              <option value="路人">路人</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>头像URL</label>
            <input 
              v-model="editingCharacter.avatar" 
              type="url" 
              placeholder="输入头像图片URL"
            />
          </div>
          
          <div class="form-group">
            <label>角色描述</label>
            <textarea 
              v-model="editingCharacter.description" 
              rows="4"
              placeholder="描述角色的性格、背景、特点等..."
            ></textarea>
          </div>
          
          <div class="form-group">
            <label>标签</label>
            <div class="tags-input">
              <div class="tags-list">
                <span 
                  v-for="(tag, index) in editingCharacter.tags" 
                  :key="index"
                  class="tag-input"
                >
                  {{ tag }}
                  <button type="button" @click="removeTag(index)" class="remove-tag">
                    <X class="icon" />
                  </button>
                </span>
              </div>
              <input 
                v-model="newTag" 
                @keydown.enter.prevent="addTag"
                type="text" 
                placeholder="输入标签后按回车添加"
              />
            </div>
          </div>
          
          <div class="form-group">
            <label>年龄</label>
            <input 
              v-model.number="editingCharacter.age" 
              type="number" 
              min="0"
              placeholder="角色年龄"
            />
          </div>
          
          <div class="form-group">
            <label>性别</label>
            <select v-model="editingCharacter.gender">
              <option value="男">男</option>
              <option value="女">女</option>
              <option value="其他">其他</option>
            </select>
          </div>
          
          <div class="form-actions">
            <button type="button" @click="closeDialog" class="cancel-btn">取消</button>
            <button type="submit" class="save-btn">
              {{ showEditDialog ? '保存修改' : '添加角色' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 删除确认对话框 -->
    <div v-if="showDeleteDialog" class="modal-overlay" @click="showDeleteDialog = false">
      <div class="modal delete-modal" @click.stop>
        <div class="modal-header">
          <h2>确认删除</h2>
          <button @click="showDeleteDialog = false" class="close-btn">
            <X class="icon" />
          </button>
        </div>
        <div class="delete-content">
          <AlertTriangle class="delete-icon" />
          <p>确定要删除角色 "{{ characterToDelete?.name }}" 吗？</p>
          <p class="warning">此操作无法撤销！</p>
        </div>
        <div class="form-actions">
          <button @click="showDeleteDialog = false" class="cancel-btn">取消</button>
          <button @click="confirmDelete" class="delete-confirm-btn">确认删除</button>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Layout from '../components/Layout.vue'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  X, 
  User, 
  AlertTriangle 
} from 'lucide-vue-next'

interface Character {
  id: string
  name: string
  role: string
  avatar?: string
  description: string
  tags: string[]
  age?: number
  gender: string
  createdAt: Date
  updatedAt: Date
}

// 响应式数据
const characters = ref<Character[]>([])
const searchQuery = ref('')
const activeFilter = ref('all')
const showAddDialog = ref(false)
const showEditDialog = ref(false)
const showDeleteDialog = ref(false)
const editingCharacter = ref<Partial<Character>>({})
const characterToDelete = ref<Character | null>(null)
const newTag = ref('')

// 筛选选项
const filters = [
  { label: '全部', value: 'all' },
  { label: '主角', value: '主角' },
  { label: '配角', value: '配角' },
  { label: '反派', value: '反派' },
  { label: '路人', value: '路人' }
]

// 计算属性
const filteredCharacters = computed(() => {
  let filtered = characters.value

  // 按筛选条件过滤
  if (activeFilter.value !== 'all') {
    filtered = filtered.filter(char => char.role === activeFilter.value)
  }

  // 按搜索关键词过滤
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(char => 
      char.name.toLowerCase().includes(query) ||
      char.description.toLowerCase().includes(query) ||
      char.tags.some(tag => tag.toLowerCase().includes(query))
    )
  }

  return filtered
})

const loadCharacters = () => {
  const saved = localStorage.getItem('characters')
  if (saved) {
    characters.value = JSON.parse(saved)
  } else {
    // 添加一些示例角色
    characters.value = [
      {
        id: '1',
        name: '李明',
        role: '主角',
        avatar: '',
        description: '一个勇敢的年轻冒险者，拥有强大的意志力和正义感。从小在乡村长大，对世界充满好奇。',
        tags: ['勇敢', '正义', '冒险'],
        age: 18,
        gender: '男',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: '2',
        name: '艾莉娅',
        role: '主角',
        avatar: '',
        description: '神秘的魔法师，拥有强大的魔法天赋。性格冷静理性，但内心渴望友情和温暖。',
        tags: ['魔法师', '神秘', '理性'],
        age: 20,
        gender: '女',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: '3',
        name: '黑暗领主',
        role: '反派',
        avatar: '',
        description: '强大的黑暗势力领袖，拥有毁灭性的力量。曾经是正义的守护者，但被黑暗力量腐蚀。',
        tags: ['黑暗', '强大', '堕落'],
        age: 35,
        gender: '男',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      }
    ]
    saveCharacters()
  }
}

const saveCharacters = () => {
  localStorage.setItem('characters', JSON.stringify(characters.value))
}

const editCharacter = (character: Character) => {
  editingCharacter.value = { ...character }
  showEditDialog.value = true
}

const deleteCharacter = (id: string) => {
  characterToDelete.value = characters.value.find(c => c.id === id) || null
  showDeleteDialog.value = true
}

const confirmDelete = () => {
  if (characterToDelete.value) {
    characters.value = characters.value.filter(c => c.id !== characterToDelete.value!.id)
    saveCharacters()
    showDeleteDialog.value = false
    characterToDelete.value = null
  }
}

const saveCharacter = () => {
  if (!editingCharacter.value.name?.trim()) return

  const now = new Date()
  
  if (showEditDialog.value) {
    // 编辑现有角色
    const index = characters.value.findIndex(c => c.id === editingCharacter.value.id)
    if (index !== -1) {
      characters.value[index] = {
        ...characters.value[index],
        ...editingCharacter.value,
        updatedAt: now
      } as Character
    }
  } else {
    // 添加新角色
    const newCharacter: Character = {
      id: Date.now().toString(),
      name: editingCharacter.value.name,
      role: editingCharacter.value.role || '配角',
      avatar: editingCharacter.value.avatar,
      description: editingCharacter.value.description || '',
      tags: editingCharacter.value.tags || [],
      age: editingCharacter.value.age,
      gender: editingCharacter.value.gender || '男',
      createdAt: now,
      updatedAt: now
    }
    characters.value.push(newCharacter)
  }

  saveCharacters()
  closeDialog()
}

const closeDialog = () => {
  showAddDialog.value = false
  showEditDialog.value = false
  editingCharacter.value = {}
  newTag.value = ''
}

const addTag = () => {
  if (newTag.value.trim() && !editingCharacter.value.tags?.includes(newTag.value.trim())) {
    if (!editingCharacter.value.tags) {
      editingCharacter.value.tags = []
    }
    editingCharacter.value.tags.push(newTag.value.trim())
    newTag.value = ''
  }
}

const removeTag = (index: number) => {
  if (editingCharacter.value.tags) {
    editingCharacter.value.tags.splice(index, 1)
  }
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = '/src/assets/default-avatar.svg'
}

// 生命周期
onMounted(() => {
  loadCharacters()
})
</script>

<style scoped>
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

.characters-content {
  margin: 0 auto;
  width: 100%;
  max-width: 1600px;
  background: none;
  border-radius: 0;
  box-shadow: none;
  padding: 2.5rem 2vw 2.5rem 2vw;
}

.search-section {
  background: var(--card-bg);
  border-radius: 2rem;
  padding: 2rem;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
  margin-bottom: 2rem;
  box-shadow: var(--card-shadow);
  backdrop-filter: blur(8px);
  border: 2px solid var(--border);
}

.search-box {
  position: relative;
  flex: 1;
  max-width: 400px;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--subtitle-color);
  width: 20px;
  height: 20px;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 3rem;
  border: 2px solid var(--border);
  border-radius: 1rem;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s ease;
  background: var(--input-bg);
  color: var(--title-color);
}

.search-input:focus {
  border-color: var(--accent);
}

.filter-buttons {
  display: flex;
  gap: 0.5rem;
}

.filter-btn {
  padding: 0.5rem 1rem;
  border: 2px solid var(--border);
  background: var(--input-bg);
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--accent);
  font-size: 1rem;
}

.filter-btn.active {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}

.characters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.character-card {
  background: var(--card-bg);
  border-radius: 1.5rem;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid var(--border);
  position: relative;
  box-shadow: var(--card-shadow);
  backdrop-filter: blur(8px);
}

.character-card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: var(--card-hover-shadow);
  border-color: var(--accent);
}

.character-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  margin-bottom: 1rem;
  border: 3px solid var(--border);
}

.character-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.character-info {
  margin-bottom: 1rem;
}

.character-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--title-color);
  margin: 0 0 0.5rem 0;
}

.character-role {
  color: var(--accent);
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
}

.character-description {
  color: var(--subtitle-color);
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0 0 1rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.character-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  background: var(--input-bg);
  color: var(--title-color);
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  border: 1px solid var(--border);
}

.character-actions {
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  gap: 0.5rem;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.character-card:hover .character-actions {
  opacity: 1;
}

.action-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  background: var(--input-bg);
  color: var(--accent);
  border: 2px solid var(--border);
}

.action-btn.edit:hover {
  background: #34c759;
  color: white;
  border-color: #34c759;
}

.action-btn.delete:hover {
  background: #ff3b30;
  color: white;
  border-color: #ff3b30;
}

.empty-state {
  padding: 4rem 2rem;
  text-align: center;
  color: var(--subtitle-color);
  grid-column: 1 / -1;
}

.empty-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 1rem;
  color: var(--subtitle-color);
  opacity: 0.5;
}

.empty-state h3 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: var(--title-color);
}

/* 模态框样式 */
.modal-overlay {
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

.modal {
  background: var(--modal-bg);
  border-radius: 2rem;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--modal-shadow);
  backdrop-filter: blur(12px);
  border: 2px solid var(--border);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--border);
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--title-color);
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 1rem;
  transition: background 0.2s ease;
  color: var(--accent);
}

.close-btn:hover {
  background: var(--input-bg);
}

.character-form {
  padding: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--title-color);
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid var(--border);
  border-radius: 1rem;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s ease;
  background: var(--input-bg);
  color: var(--title-color);
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  border-color: var(--accent);
}

.tags-input {
  border: 2px solid var(--border);
  border-radius: 1rem;
  padding: 0.5rem;
  background: var(--input-bg);
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.tag-input {
  background: var(--accent);
  color: #fff;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.remove-tag {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s ease;
  color: #fff;
}

.remove-tag:hover {
  background: rgba(255,255,255,0.2);
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border);
}

.cancel-btn, .save-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
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

.save-btn {
  background: var(--primary-btn-bg);
  color: var(--primary-btn-color);
}

.save-btn:hover {
  transform: translateY(-1px) scale(1.04);
  box-shadow: var(--primary-btn-hover);
}

/* 删除确认对话框 */
.delete-modal {
  max-width: 400px;
}

.delete-content {
  padding: 2rem;
  text-align: center;
}

.delete-icon {
  width: 48px;
  height: 48px;
  color: #ff3b30;
  margin: 0 auto 1rem;
}

.delete-content p {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  color: var(--title-color);
}

.warning {
  color: #ff3b30;
  font-weight: 600;
}

.delete-confirm-btn {
  background: #ff3b30;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}

.delete-confirm-btn:hover {
  background: #dc3545;
}

.icon {
  width: 1.2rem;
  height: 1.2rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .characters-content {
    padding: 1rem;
  }
  
  .main-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .search-section {
    flex-direction: column;
    gap: 1rem;
  }
  
  .search-box {
    max-width: none;
  }
  
  .filter-buttons {
    justify-content: center;
  }
  
  .characters-grid {
    grid-template-columns: 1fr;
  }
  
  .modal {
    width: 95%;
    margin: 1rem;
  }
  
  .character-form {
    padding: 1rem;
  }
}
</style>