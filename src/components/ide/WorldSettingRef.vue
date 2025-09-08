<template>
  <div class="world-setting-ref">
    <div class="ref-header">
      <h3>世界设定</h3>
      <div class="header-actions">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="搜索设定..." 
          class="search-input"
        >
        <button @click="showCreateDialog = true" class="add-btn" title="新建设定">
          <span class="icon">+</span>
        </button>
      </div>
    </div>

    <div class="setting-list">
      <!-- 分类显示 -->
      <div v-for="category in categories" :key="category.name" class="category-section">
        <div class="category-header" @click="toggleCategory(category.name)">
          <span class="icon">{{ category.collapsed ? '▶' : '▼' }}</span>
          <span class="category-icon">{{ category.icon }}</span>
          <span class="category-name">{{ category.name }}</span>
          <span class="category-count">({{ getCategoryItems(category.name).length }})</span>
        </div>
        
        <div v-show="!category.collapsed" class="category-items">
          <div 
            v-for="item in getCategoryItems(category.name)" 
            :key="item.id"
            class="setting-item"
            @click="selectSetting(item)"
          >
            <div class="item-header">
              <div class="item-title">{{ item.title }}</div>
              <div class="item-actions">
                <button @click.stop="insertSettingReference(item)" class="action-btn" title="插入引用">
                  <span class="icon">#</span>
                </button>
                <button @click.stop="showSettingDetail(item)" class="action-btn" title="查看详情">
                  <span class="icon">👁</span>
                </button>
              </div>
            </div>
            <div class="item-description">
              {{ truncateText(item.description, 50) }}
            </div>
            <div v-if="item.tags && item.tags.length" class="item-tags">
              <span v-for="tag in item.tags.slice(0, 3)" :key="tag" class="tag">{{ tag }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 无数据提示 -->
      <div v-if="filteredSettings.length === 0" class="empty-state">
        <div class="empty-icon">🌍</div>
        <p>暂无世界设定</p>
        <button @click="showCreateDialog = true" class="btn btn-primary">
          创建第一个设定
        </button>
      </div>
    </div>

    <!-- 设定详情弹窗 -->
    <div v-if="selectedSetting" class="setting-detail-overlay" @click="closeSettingDetail">
      <div class="setting-detail" @click.stop>
        <div class="detail-header">
          <div class="header-info">
            <h3>{{ selectedSetting.title }}</h3>
            <span class="category-badge">{{ selectedSetting.category }}</span>
          </div>
          <button @click="closeSettingDetail" class="close-btn">×</button>
        </div>
        
        <div class="detail-content">
          <div class="detail-section">
            <h4>基本描述</h4>
            <p>{{ selectedSetting.description || '暂无描述' }}</p>
          </div>
          
          <div v-if="selectedSetting.details" class="detail-section">
            <h4>详细信息</h4>
            <div class="detail-text" v-html="formatText(selectedSetting.details)"></div>
          </div>
          
          <div v-if="selectedSetting.tags && selectedSetting.tags.length" class="detail-section">
            <h4>标签</h4>
            <div class="tags-container">
              <span v-for="tag in selectedSetting.tags" :key="tag" class="tag">{{ tag }}</span>
            </div>
          </div>
          
          <div class="detail-section">
            <h4>创建信息</h4>
            <p class="meta-info">
              创建时间: {{ formatDate(selectedSetting.createdAt) }}<br>
              最后修改: {{ formatDate(selectedSetting.lastModified) }}
            </p>
          </div>
        </div>
        
        <div class="detail-actions">
          <button @click="insertSettingReference(selectedSetting)" class="btn btn-primary">
            插入引用
          </button>
          <button @click="editSetting(selectedSetting)" class="btn btn-secondary">
            编辑设定
          </button>
        </div>
      </div>
    </div>

    <!-- 新建设定对话框 -->
    <div v-if="showCreateDialog" class="create-dialog-overlay" @click="showCreateDialog = false">
      <div class="create-dialog" @click.stop>
        <div class="dialog-header">
          <h3>新建世界设定</h3>
          <button @click="showCreateDialog = false" class="close-btn">×</button>
        </div>
        
        <div class="dialog-content">
          <div class="form-group">
            <label>设定标题</label>
            <input v-model="newSetting.title" type="text" placeholder="输入设定标题">
          </div>
          
          <div class="form-group">
            <label>分类</label>
            <select v-model="newSetting.category">
              <option value="">选择分类</option>
              <option v-for="cat in defaultCategories" :key="cat" :value="cat">{{ cat }}</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>基本描述</label>
            <textarea v-model="newSetting.description" placeholder="简要描述这个设定"></textarea>
          </div>
          
          <div class="form-group">
            <label>标签 (用逗号分隔)</label>
            <input v-model="newSetting.tagsInput" type="text" placeholder="例如: 魔法, 古代, 神秘">
          </div>
        </div>
        
        <div class="dialog-actions">
          <button @click="createSetting" class="btn btn-primary" :disabled="!newSetting.title || !newSetting.category">
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
  name: 'WorldSettingRef',
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
  emits: ['setting-selected'],
  setup(props, { emit }) {
    const settings = ref([])
    const searchQuery = ref('')
    const selectedSetting = ref(null)
    const showCreateDialog = ref(false)
    const loading = ref(false)

    // 分类状态
    const categories = ref([
      { name: '地理环境', icon: '🏔️', collapsed: false },
      { name: '历史背景', icon: '📜', collapsed: false },
      { name: '社会制度', icon: '🏛️', collapsed: false },
      { name: '魔法系统', icon: '✨', collapsed: false },
      { name: '科技水平', icon: '⚙️', collapsed: false },
      { name: '文化习俗', icon: '🎭', collapsed: false },
      { name: '其他', icon: '📋', collapsed: false }
    ])

    const defaultCategories = ['地理环境', '历史背景', '社会制度', '魔法系统', '科技水平', '文化习俗', '其他']

    // 新建设定表单
    const newSetting = ref({
      title: '',
      category: '',
      description: '',
      tagsInput: ''
    })

    // 过滤后的设定列表
    const filteredSettings = computed(() => {
      if (!searchQuery.value) return settings.value
      
      const query = searchQuery.value.toLowerCase()
      return settings.value.filter(setting => 
        setting.title.toLowerCase().includes(query) ||
        setting.description?.toLowerCase().includes(query) ||
        setting.category.toLowerCase().includes(query) ||
        setting.tags?.some(tag => tag.toLowerCase().includes(query))
      )
    })

    // 获取分类下的设定项
    const getCategoryItems = (categoryName) => {
      return filteredSettings.value.filter(setting => setting.category === categoryName)
    }

    // 切换分类折叠状态
    const toggleCategory = (categoryName) => {
      const category = categories.value.find(cat => cat.name === categoryName)
      if (category) {
        category.collapsed = !category.collapsed
      }
    }

    // 加载世界设定
    const loadSettings = async () => {
      if (!props.projectId) return
      
      loading.value = true
      try {
        const projectSettings = await storageService.getProjectWorldSettings(props.projectId)
        settings.value = projectSettings || []
      } catch (error) {
        console.error('加载世界设定失败:', error)
      } finally {
        loading.value = false
      }
    }

    // 选择设定
    const selectSetting = (setting) => {
      emit('setting-selected', setting)
    }

    // 插入设定引用
    const insertSettingReference = (setting) => {
      console.log('插入设定引用:', setting.title)
      emit('setting-selected', { ...setting, action: 'reference' })
    }

    // 显示设定详情
    const showSettingDetail = (setting) => {
      selectedSetting.value = setting
    }

    // 关闭设定详情
    const closeSettingDetail = () => {
      selectedSetting.value = null
    }

    // 编辑设定
    const editSetting = (setting) => {
      console.log('编辑设定:', setting.title)
      closeSettingDetail()
    }

    // 创建新设定
    const createSetting = async () => {
      if (!newSetting.value.title.trim() || !newSetting.value.category) return
      
      try {
        const tags = newSetting.value.tagsInput 
          ? newSetting.value.tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag)
          : []

        const settingData = {
          title: newSetting.value.title.trim(),
          category: newSetting.value.category,
          description: newSetting.value.description.trim(),
          tags,
          projectId: props.projectId
        }
        
        const createdSetting = await storageService.createWorldSetting(settingData)
        settings.value.push(createdSetting)
        
        // 重置表单
        newSetting.value = { title: '', category: '', description: '', tagsInput: '' }
        showCreateDialog.value = false
        
        console.log('世界设定创建成功:', createdSetting.title)
      } catch (error) {
        console.error('创建世界设定失败:', error)
        alert('创建世界设定失败，请重试')
      }
    }

    // 截断文本
    const truncateText = (text, maxLength) => {
      if (!text) return ''
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
    }

    // 格式化文本（简单的换行处理）
    const formatText = (text) => {
      if (!text) return ''
      return text.replace(/\n/g, '<br>')
    }

    // 格式化日期
    const formatDate = (dateString) => {
      if (!dateString) return ''
      return new Date(dateString).toLocaleString('zh-CN')
    }

    // 监听项目变化
    watch(() => props.projectId, () => {
      loadSettings()
    }, { immediate: true })

    onMounted(() => {
      loadSettings()
    })

    return {
      settings,
      searchQuery,
      selectedSetting,
      showCreateDialog,
      newSetting,
      loading,
      categories,
      defaultCategories,
      filteredSettings,
      getCategoryItems,
      toggleCategory,
      selectSetting,
      insertSettingReference,
      showSettingDetail,
      closeSettingDetail,
      editSetting,
      createSetting,
      truncateText,
      formatText,
      formatDate
    }
  }
}
</script>

<style scoped>
.world-setting-ref {
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

.setting-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.category-section {
  margin-bottom: 16px;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f6f8fa;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: #24292e;
  transition: all 0.2s;
}

.category-header:hover {
  background: #e1e4e8;
}

.category-count {
  margin-left: auto;
  font-size: 12px;
  color: #586069;
  font-weight: normal;
}

.category-items {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-item {
  padding: 12px;
  background: white;
  border: 1px solid #e1e4e8;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.setting-item:hover {
  border-color: #0366d6;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.item-title {
  font-weight: 600;
  color: #24292e;
  font-size: 14px;
}

.item-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.setting-item:hover .item-actions {
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

.item-description {
  font-size: 12px;
  color: #586069;
  line-height: 1.4;
  margin-bottom: 6px;
}

.item-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.tag {
  display: inline-block;
  padding: 2px 6px;
  background: #f1f8ff;
  color: #0366d6;
  border-radius: 12px;
  font-size: 11px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
  color: #586069;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

/* 设定详情弹窗 */
.setting-detail-overlay {
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

.setting-detail {
  width: 90%;
  max-width: 600px;
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

.header-info h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
  color: #24292e;
}

.category-badge {
  display: inline-block;
  padding: 2px 8px;
  background: #e1f5fe;
  color: #0277bd;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
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

.detail-text {
  font-size: 14px;
  color: #586069;
  line-height: 1.5;
}

.tags-container {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.meta-info {
  font-size: 12px;
  color: #8b949e;
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
  max-width: 500px;
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
.form-group textarea,
.form-group select {
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
.form-group textarea:focus,
.form-group select:focus {
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
.setting-list::-webkit-scrollbar,
.detail-content::-webkit-scrollbar {
  width: 6px;
}

.setting-list::-webkit-scrollbar-track,
.detail-content::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.setting-list::-webkit-scrollbar-thumb,
.detail-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.setting-list::-webkit-scrollbar-thumb:hover,
.detail-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>