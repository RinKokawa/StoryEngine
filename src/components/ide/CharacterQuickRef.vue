<template>
  <div class="character-quick-ref">
    <div class="ref-header">
      <h3>人物引用</h3>
      <div class="header-actions">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="搜索人物..." 
          class="search-input"
        >
        <button @click="showCreateDialog = true" class="add-btn" title="新建人物">
          <span class="icon">+</span>
        </button>
      </div>
    </div>

    <div class="character-list">
      <!-- 当前章节相关人物 -->
      <div v-if="relevantCharacters.length > 0" class="character-section">
        <h4 class="section-title">
          <span class="icon">⭐</span>
          本章相关
        </h4>
        <div class="character-items">
          <div 
            v-for="character in relevantCharacters" 
            :key="character.id"
            class="character-item relevant"
            @click="selectCharacter(character)"
          >
            <div class="character-avatar">
              {{ character.name.charAt(0) }}
            </div>
            <div class="character-info">
              <div class="character-name">{{ character.name }}</div>
              <div class="character-desc">{{ truncateText(character.description, 30) }}</div>
            </div>
            <div class="character-actions">
              <button @click.stop="insertCharacterMention(character)" class="action-btn" title="插入提及">
                <span class="icon">@</span>
              </button>
              <button @click.stop="showCharacterDetail(character)" class="action-btn" title="查看详情">
                <span class="icon">👁</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 所有人物 -->
      <div class="character-section">
        <h4 class="section-title">
          <span class="icon">👥</span>
          所有人物 ({{ filteredCharacters.length }})
        </h4>
        <div class="character-items">
          <div 
            v-for="character in filteredCharacters" 
            :key="character.id"
            class="character-item"
            @click="selectCharacter(character)"
          >
            <div class="character-avatar">
              {{ character.name.charAt(0) }}
            </div>
            <div class="character-info">
              <div class="character-name">{{ character.name }}</div>
              <div class="character-desc">{{ truncateText(character.description, 30) }}</div>
              <div class="character-tags">
                <span v-if="character.personality" class="tag">{{ character.personality.split('，')[0] }}</span>
              </div>
            </div>
            <div class="character-actions">
              <button @click.stop="insertCharacterMention(character)" class="action-btn" title="插入提及">
                <span class="icon">@</span>
              </button>
              <button @click.stop="showCharacterDetail(character)" class="action-btn" title="查看详情">
                <span class="icon">👁</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 人物详情弹窗 -->
    <div v-if="selectedCharacter" class="character-detail-overlay" @click="closeCharacterDetail">
      <div class="character-detail" @click.stop>
        <div class="detail-header">
          <h3>{{ selectedCharacter.name }}</h3>
          <button @click="closeCharacterDetail" class="close-btn">×</button>
        </div>
        <div class="detail-content">
          <div class="detail-section">
            <h4>基本信息</h4>
            <p>{{ selectedCharacter.description || '暂无描述' }}</p>
          </div>
          
          <div v-if="selectedCharacter.appearance" class="detail-section">
            <h4>外貌特征</h4>
            <p>{{ selectedCharacter.appearance }}</p>
          </div>
          
          <div v-if="selectedCharacter.personality" class="detail-section">
            <h4>性格特点</h4>
            <p>{{ selectedCharacter.personality }}</p>
          </div>
          
          <div v-if="selectedCharacter.background" class="detail-section">
            <h4>背景故事</h4>
            <p>{{ selectedCharacter.background }}</p>
          </div>
          
          <div v-if="selectedCharacter.relationships" class="detail-section">
            <h4>人物关系</h4>
            <p>{{ selectedCharacter.relationships }}</p>
          </div>
        </div>
        <div class="detail-actions">
          <button @click="insertCharacterMention(selectedCharacter)" class="btn btn-primary">
            插入提及
          </button>
          <button @click="editCharacter(selectedCharacter)" class="btn btn-secondary">
            编辑人物
          </button>
        </div>
      </div>
    </div>

    <!-- 新建人物对话框 -->
    <div v-if="showCreateDialog" class="create-dialog-overlay" @click="showCreateDialog = false">
      <div class="create-dialog" @click.stop>
        <div class="dialog-header">
          <h3>新建人物</h3>
          <button @click="showCreateDialog = false" class="close-btn">×</button>
        </div>
        <div class="dialog-content">
          <div class="form-group">
            <label>人物姓名</label>
            <input v-model="newCharacter.name" type="text" placeholder="输入人物姓名">
          </div>
          <div class="form-group">
            <label>基本描述</label>
            <textarea v-model="newCharacter.description" placeholder="简要描述这个人物"></textarea>
          </div>
        </div>
        <div class="dialog-actions">
          <button @click="createCharacter" class="btn btn-primary" :disabled="!newCharacter.name">
            创建
          </button>
          <button @click="showCreateDialog = false" class="btn btn-secondary">
            取消
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { storageService } from '@/services/storage'

export default {
  name: 'CharacterQuickRef',
  props: {
    projectId: {
      type: String,
      required: true
    },
    currentChapter: {
      type: Object,
      default: null
    }
  },
  emits: ['character-selected'],
  setup(props, { emit }) {
    const characters = ref([])
    const searchQuery = ref('')
    const selectedCharacter = ref(null)
    const showCreateDialog = ref(false)
    const loading = ref(false)

    // 新建人物表单
    const newCharacter = ref({
      name: '',
      description: ''
    })

    // 过滤后的人物列表
    const filteredCharacters = computed(() => {
      if (!searchQuery.value) return characters.value
      
      const query = searchQuery.value.toLowerCase()
      return characters.value.filter(character => 
        character.name.toLowerCase().includes(query) ||
        character.description?.toLowerCase().includes(query) ||
        character.personality?.toLowerCase().includes(query)
      )
    })

    // 当前章节相关人物（这里可以根据章节内容智能推荐）
    const relevantCharacters = computed(() => {
      if (!props.currentChapter || !characters.value.length) return []
      
      // 简单实现：如果章节内容中提到了人物名字，就认为是相关的
      const chapterContent = props.currentChapter.content || ''
      return characters.value.filter(character => 
        chapterContent.includes(character.name)
      ).slice(0, 3) // 最多显示3个
    })

    // 加载人物列表
    const loadCharacters = async () => {
      if (!props.projectId) return
      
      loading.value = true
      try {
        const projectCharacters = await storageService.getProjectCharacters(props.projectId)
        characters.value = projectCharacters || []
      } catch (error) {
        console.error('加载人物列表失败:', error)
      } finally {
        loading.value = false
      }
    }

    // 选择人物
    const selectCharacter = (character) => {
      emit('character-selected', character)
    }

    // 插入人物提及
    const insertCharacterMention = (character) => {
      // 这里可以触发编辑器插入 @人物名 的功能
      console.log('插入人物提及:', character.name)
      // 可以通过事件总线或者直接调用编辑器方法
      emit('character-selected', { ...character, action: 'mention' })
    }

    // 显示人物详情
    const showCharacterDetail = (character) => {
      selectedCharacter.value = character
    }

    // 关闭人物详情
    const closeCharacterDetail = () => {
      selectedCharacter.value = null
    }

    // 编辑人物
    const editCharacter = (character) => {
      // 这里可以打开编辑对话框或跳转到人物管理页面
      console.log('编辑人物:', character.name)
      closeCharacterDetail()
    }

    // 创建新人物
    const createCharacter = async () => {
      if (!newCharacter.value.name.trim()) return
      
      try {
        const characterData = {
          name: newCharacter.value.name.trim(),
          description: newCharacter.value.description.trim(),
          projectId: props.projectId
        }
        
        const createdCharacter = await storageService.createCharacter(characterData)
        characters.value.push(createdCharacter)
        
        // 重置表单
        newCharacter.value = { name: '', description: '' }
        showCreateDialog.value = false
        
        console.log('人物创建成功:', createdCharacter.name)
      } catch (error) {
        console.error('创建人物失败:', error)
        alert('创建人物失败，请重试')
      }
    }

    // 截断文本
    const truncateText = (text, maxLength) => {
      if (!text) return ''
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
    }

    // 监听项目变化
    watch(() => props.projectId, () => {
      loadCharacters()
    }, { immediate: true })

    onMounted(() => {
      loadCharacters()
    })

    return {
      characters,
      searchQuery,
      selectedCharacter,
      showCreateDialog,
      newCharacter,
      loading,
      filteredCharacters,
      relevantCharacters,
      selectCharacter,
      insertCharacterMention,
      showCharacterDetail,
      closeCharacterDetail,
      editCharacter,
      createCharacter,
      truncateText
    }
  }
}
</script>

<style scoped>
.character-quick-ref {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.ref-header {
  padding: 16px;
  border-bottom: 1px solid #e1e4e8;
  background: #f6f8fa;
}

.ref-header h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #24292e;
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.search-input {
  flex: 1;
  padding: 6px 12px;
  border: 1px solid #d1d5da;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
}

.search-input:focus {
  border-color: #0366d6;
  box-shadow: 0 0 0 3px rgba(3, 102, 214, 0.1);
}

.add-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #d1d5da;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #586069;
  transition: all 0.2s;
}

.add-btn:hover {
  background: #f6f8fa;
  border-color: #0366d6;
  color: #0366d6;
}

.character-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.character-section {
  margin-bottom: 24px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #586069;
}

.character-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.character-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border: 1px solid #e1e4e8;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.character-item:hover {
  border-color: #0366d6;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.character-item.relevant {
  border-color: #f66a0a;
  background: #fff8f0;
}

.character-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #0366d6;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
  flex-shrink: 0;
}

.character-info {
  flex: 1;
  min-width: 0;
}

.character-name {
  font-weight: 600;
  color: #24292e;
  margin-bottom: 4px;
}

.character-desc {
  font-size: 12px;
  color: #586069;
  line-height: 1.4;
}

.character-tags {
  margin-top: 4px;
}

.tag {
  display: inline-block;
  padding: 2px 6px;
  background: #f1f8ff;
  color: #0366d6;
  border-radius: 12px;
  font-size: 11px;
}

.character-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.character-item:hover .character-actions {
  opacity: 1;
}

.action-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: #f6f8fa;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #586069;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #e1e4e8;
  color: #24292e;
}

/* 人物详情弹窗 */
.character-detail-overlay {
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

.character-detail {
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #e1e4e8;
  background: #f6f8fa;
}

.detail-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #24292e;
}

.close-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 18px;
  color: #586069;
  border-radius: 4px;
  transition: background 0.2s;
}

.close-btn:hover {
  background: #e1e4e8;
}

.detail-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.detail-section {
  margin-bottom: 16px;
}

.detail-section h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #24292e;
}

.detail-section p {
  margin: 0;
  font-size: 14px;
  color: #586069;
  line-height: 1.5;
}

.detail-actions {
  display: flex;
  gap: 8px;
  padding: 16px;
  border-top: 1px solid #e1e4e8;
  background: #f6f8fa;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary {
  background: #0366d6;
  color: white;
}

.btn-primary:hover {
  background: #0256cc;
}

.btn-secondary {
  background: #f6f8fa;
  color: #24292e;
  border: 1px solid #d1d5da;
}

.btn-secondary:hover {
  background: #e1e4e8;
}

/* 新建对话框 */
.create-dialog-overlay {
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

.create-dialog {
  width: 90%;
  max-width: 400px;
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #e1e4e8;
  background: #f6f8fa;
}

.dialog-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #24292e;
}

.dialog-content {
  padding: 16px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #24292e;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5da;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
}

.form-group textarea {
  height: 80px;
  resize: vertical;
}

.form-group input:focus,
.form-group textarea:focus {
  border-color: #0366d6;
  box-shadow: 0 0 0 3px rgba(3, 102, 214, 0.1);
}

.dialog-actions {
  display: flex;
  gap: 8px;
  padding: 16px;
  border-top: 1px solid #e1e4e8;
  background: #f6f8fa;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 滚动条样式 */
.character-list::-webkit-scrollbar,
.detail-content::-webkit-scrollbar {
  width: 6px;
}

.character-list::-webkit-scrollbar-track,
.detail-content::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.character-list::-webkit-scrollbar-thumb,
.detail-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.character-list::-webkit-scrollbar-thumb:hover,
.detail-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>