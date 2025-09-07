<template>
  <div class="world-building">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1>世界设定</h1>
      <div class="header-actions">
        <ProjectSelector 
          v-model="selectedProjectId"
          :projects="projects"
          @change="handleProjectChange"
        />
        <button @click="showCreateDialog = true" class="btn btn-primary">
          <i class="icon-plus"></i>
          新建设定
        </button>
      </div>
    </div>

    <!-- 世界设定内容 -->
    <div class="world-content" v-if="currentProject">
      <!-- 分类标签 -->
      <div class="category-tabs">
        <button 
          v-for="category in categories" 
          :key="category.key"
          @click="activeCategory = category.key"
          :class="{ active: activeCategory === category.key }"
          class="category-tab"
        >
          <i :class="category.icon"></i>
          {{ category.name }}
          <span class="count">{{ getCategoryCount(category.key) }}</span>
        </button>
      </div>

      <!-- 搜索和视图控制 -->
      <div class="list-header">
        <div class="search-bar">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="搜索世界设定..." 
            class="search-input"
          >
        </div>
        <div class="view-controls">
          <button 
            @click="viewMode = 'grid'" 
            :class="{ active: viewMode === 'grid' }"
            class="view-btn"
          >
            网格视图
          </button>
          <button 
            @click="viewMode = 'list'" 
            :class="{ active: viewMode === 'list' }"
            class="view-btn"
          >
            列表视图
          </button>
        </div>
      </div>

      <!-- 网格视图 -->
      <div v-if="viewMode === 'grid'" class="world-grid">
        <div 
          v-for="item in filteredWorldItems" 
          :key="item.id"
          class="world-card"
          @click="selectWorldItem(item)"
        >
          <div class="card-header">
            <div class="card-info">
              <h3 class="item-name">{{ item.name }}</h3>
              <p class="item-category">{{ getCategoryName(item.category) }}</p>
            </div>
            <div class="card-actions">
              <button @click.stop="editWorldItem(item)" class="btn-icon" title="编辑">
                <i class="icon-edit">✏️</i>
              </button>
              <button @click.stop="deleteWorldItem(item)" class="btn-icon btn-danger" title="删除">
                <i class="icon-delete">🗑️</i>
              </button>
            </div>
          </div>
          
          <div class="card-content">
            <p class="item-description">{{ item.description || '暂无描述' }}</p>
            <div class="item-tags" v-if="item.tags && item.tags.length > 0">
              <span v-for="tag in item.tags" :key="tag" class="tag">{{ tag }}</span>
            </div>
          </div>
          
          <div class="card-footer">
            <div class="item-status" :class="item.status">
              {{ getStatusText(item.status) }}
            </div>
            <div class="last-modified">
              {{ formatDate(item.lastModified) }}
            </div>
          </div>
        </div>
      </div>

      <!-- 列表视图 -->
      <div v-if="viewMode === 'list'" class="world-table">
        <table>
          <thead>
            <tr>
              <th>名称</th>
              <th>分类</th>
              <th>描述</th>
              <th>标签</th>
              <th>状态</th>
              <th>修改时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="item in filteredWorldItems" 
              :key="item.id"
              @click="selectWorldItem(item)"
              class="world-row"
            >
              <td class="item-name">{{ item.name }}</td>
              <td>{{ getCategoryName(item.category) }}</td>
              <td class="item-description">{{ item.description || '暂无描述' }}</td>
              <td>
                <div class="item-tags">
                  <span v-for="tag in item.tags" :key="tag" class="tag small">{{ tag }}</span>
                </div>
              </td>
              <td>
                <div class="item-status" :class="item.status">
                  {{ getStatusText(item.status) }}
                </div>
              </td>
              <td>{{ formatDate(item.lastModified) }}</td>
              <td>
                <div class="table-actions">
                  <button @click.stop="editWorldItem(item)" class="btn-icon" title="编辑">
                    <i class="icon-edit">✏️</i>
                  </button>
                  <button @click.stop="deleteWorldItem(item)" class="btn-icon btn-danger" title="删除">
                    <i class="icon-delete">🗑️</i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredWorldItems.length === 0" class="empty-state">
        <div class="empty-icon">🌍</div>
        <h3>暂无世界设定</h3>
        <p v-if="searchQuery">没有找到匹配的设定</p>
        <p v-else>开始构建你的世界吧！</p>
        <button v-if="!searchQuery" @click="showCreateDialog = true" class="btn btn-primary">
          创建设定
        </button>
      </div>
    </div>

    <!-- 未选择项目状态 -->
    <div v-else class="no-project">
      <div class="empty-icon">📁</div>
      <h3>请选择一个项目</h3>
      <p>选择项目后即可管理该项目的世界设定</p>
    </div>

    <!-- 创建/编辑对话框 -->
    <div v-if="showCreateDialog || showEditDialog" class="dialog-overlay" @click="closeDialogs">
      <div class="dialog" @click.stop>
        <div class="dialog-header">
          <h2>{{ showCreateDialog ? '新建世界设定' : '编辑世界设定' }}</h2>
          <button @click="closeDialogs" class="btn-close">×</button>
        </div>
        <div class="dialog-body">
          <form @submit.prevent="saveWorldItem">
            <div class="form-group">
              <label>设定名称 *</label>
              <input 
                v-model="worldForm.name" 
                type="text" 
                required 
                placeholder="输入设定名称"
                class="form-input"
              >
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>分类</label>
                <select v-model="worldForm.category" class="form-select">
                  <option value="">选择分类</option>
                  <option v-for="category in categories" :key="category.key" :value="category.key">
                    {{ category.name }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label>状态</label>
                <select v-model="worldForm.status" class="form-select">
                  <option value="draft">草稿</option>
                  <option value="developing">开发中</option>
                  <option value="completed">已完成</option>
                </select>
              </div>
            </div>
            
            <div class="form-group">
              <label>标签</label>
              <input 
                v-model="worldForm.tagsInput" 
                type="text" 
                placeholder="输入标签，用逗号分隔"
                class="form-input"
              >
              <small class="form-hint">例如：魔法,王国,战争</small>
            </div>
            
            <div class="form-group">
              <label>简要描述</label>
              <textarea 
                v-model="worldForm.description" 
                placeholder="简要描述这个世界设定..."
                rows="3"
                class="form-textarea"
              ></textarea>
            </div>
            
            <div class="form-group">
              <label>详细内容</label>
              <textarea 
                v-model="worldForm.content" 
                placeholder="详细描述世界设定的内容..."
                rows="8"
                class="form-textarea content-textarea"
              ></textarea>
            </div>
            
            <div class="form-group">
              <label>相关信息</label>
              <textarea 
                v-model="worldForm.notes" 
                placeholder="其他相关信息或备注..."
                rows="4"
                class="form-textarea"
              ></textarea>
            </div>
          </form>
        </div>
        <div class="dialog-footer">
          <button @click="closeDialogs" class="btn btn-secondary">取消</button>
          <button @click="saveWorldItem" class="btn btn-primary" :disabled="!worldForm.name">
            {{ showCreateDialog ? '创建' : '保存' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 详情侧边栏 -->
    <div v-if="selectedWorldItem" class="world-sidebar" :class="{ open: sidebarOpen }">
      <div class="sidebar-header">
        <h2>设定详情</h2>
        <button @click="closeSidebar" class="btn-close">×</button>
      </div>
      <div class="sidebar-content">
        <div class="world-profile">
          <h3>{{ selectedWorldItem.name }}</h3>
          <p class="profile-category">{{ getCategoryName(selectedWorldItem.category) }}</p>
          <div class="profile-status" :class="selectedWorldItem.status">
            {{ getStatusText(selectedWorldItem.status) }}
          </div>
        </div>
        
        <div class="profile-details">
          <div class="detail-item" v-if="selectedWorldItem.description">
            <label>描述：</label>
            <p>{{ selectedWorldItem.description }}</p>
          </div>
          
          <div class="detail-item" v-if="selectedWorldItem.tags && selectedWorldItem.tags.length > 0">
            <label>标签：</label>
            <div class="item-tags">
              <span v-for="tag in selectedWorldItem.tags" :key="tag" class="tag">{{ tag }}</span>
            </div>
          </div>
          
          <div class="detail-item" v-if="selectedWorldItem.content">
            <label>详细内容：</label>
            <div class="content-preview">{{ selectedWorldItem.content }}</div>
          </div>
          
          <div class="detail-item" v-if="selectedWorldItem.notes">
            <label>相关信息：</label>
            <p>{{ selectedWorldItem.notes }}</p>
          </div>
          
          <div class="detail-item">
            <label>创建时间：</label>
            <span>{{ formatDate(selectedWorldItem.createdAt) }}</span>
          </div>
          
          <div class="detail-item">
            <label>修改时间：</label>
            <span>{{ formatDate(selectedWorldItem.lastModified) }}</span>
          </div>
        </div>

        <div class="sidebar-actions">
          <button @click="editWorldItem(selectedWorldItem)" class="btn btn-primary">
            编辑设定
          </button>
          <button @click="deleteWorldItem(selectedWorldItem)" class="btn btn-danger">
            删除设定
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'

import ProjectSelector from '../components/common/ProjectSelector.vue'
import storageManager from '../utils/storage.js'

export default {
  name: 'WorldBuilding',
  components: {

    ProjectSelector
  },
  props: {
    currentProject: {
      type: Object,
      default: null
    }
  },
  emits: ['project-changed'],
  setup(props, { emit }) {
    const selectedProjectId = ref('')
    const projects = ref([])
    const worldItems = ref([])
    const searchQuery = ref('')
    const viewMode = ref('grid')
    const activeCategory = ref('all')
    const showCreateDialog = ref(false)
    const showEditDialog = ref(false)
    const selectedWorldItem = ref(null)
    const sidebarOpen = ref(false)
    
    // 世界设定分类
    const categories = ref([
      { key: 'all', name: '全部', icon: '🌍' },
      { key: 'geography', name: '地理', icon: '🗺️' },
      { key: 'culture', name: '文化', icon: '🏛️' },
      { key: 'history', name: '历史', icon: '📜' },
      { key: 'politics', name: '政治', icon: '👑' },
      { key: 'religion', name: '宗教', icon: '⛪' },
      { key: 'magic', name: '魔法', icon: '✨' },
      { key: 'technology', name: '科技', icon: '⚙️' },
      { key: 'society', name: '社会', icon: '🏘️' },
      { key: 'economy', name: '经济', icon: '💰' },
      { key: 'other', name: '其他', icon: '📝' }
    ])
    
    const worldForm = reactive({
      name: '',
      category: '',
      description: '',
      content: '',
      notes: '',
      status: 'draft',
      tagsInput: '',
      tags: []
    })

    // 计算属性
    const currentProject = computed(() => {
      return projects.value.find(p => p.id === selectedProjectId.value) || props.currentProject
    })

    const filteredWorldItems = computed(() => {
      let items = worldItems.value
      
      // 按分类过滤
      if (activeCategory.value !== 'all') {
        items = items.filter(item => item.category === activeCategory.value)
      }
      
      // 按搜索关键词过滤
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        items = items.filter(item => 
          item.name.toLowerCase().includes(query) ||
          (item.description && item.description.toLowerCase().includes(query)) ||
          (item.content && item.content.toLowerCase().includes(query)) ||
          (item.tags && item.tags.some(tag => tag.toLowerCase().includes(query)))
        )
      }
      
      return items
    })

    // 方法
    const loadProjects = () => {
      projects.value = storageManager.getProjects()
    }

    const loadWorldItems = () => {
      if (selectedProjectId.value) {
        worldItems.value = storageManager.getProjectWorldItems(selectedProjectId.value) || []
      } else {
        worldItems.value = []
      }
    }

    const handleProjectChange = (project) => {
      if (project) {
        selectedProjectId.value = project.id
        loadWorldItems()
        closeSidebar()
        emit('project-changed', project)
      }
    }

    const selectWorldItem = (item) => {
      selectedWorldItem.value = item
      sidebarOpen.value = true
    }

    const closeSidebar = () => {
      sidebarOpen.value = false
      selectedWorldItem.value = null
    }

    const getCategoryCount = (categoryKey) => {
      if (categoryKey === 'all') {
        return worldItems.value.length
      }
      return worldItems.value.filter(item => item.category === categoryKey).length
    }

    const getCategoryName = (categoryKey) => {
      const category = categories.value.find(c => c.key === categoryKey)
      return category ? category.name : '未分类'
    }

    const getStatusText = (status) => {
      const statusMap = {
        draft: '草稿',
        developing: '开发中',
        completed: '已完成'
      }
      return statusMap[status] || status
    }

    const resetForm = () => {
      Object.assign(worldForm, {
        name: '',
        category: '',
        description: '',
        content: '',
        notes: '',
        status: 'draft',
        tagsInput: '',
        tags: []
      })
    }

    const editWorldItem = (item) => {
      Object.assign(worldForm, {
        ...item,
        tagsInput: item.tags ? item.tags.join(', ') : ''
      })
      showEditDialog.value = true
      showCreateDialog.value = false
    }

    const closeDialogs = () => {
      showCreateDialog.value = false
      showEditDialog.value = false
      resetForm()
    }

    const saveWorldItem = () => {
      if (!worldForm.name.trim()) {
        alert('请输入设定名称')
        return
      }

      if (!selectedProjectId.value) {
        alert('请先选择项目')
        return
      }

      // 处理标签
      const tags = worldForm.tagsInput
        ? worldForm.tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag)
        : []

      const worldData = {
        ...worldForm,
        tags,
        projectId: selectedProjectId.value,
        createdAt: showCreateDialog.value ? new Date().toISOString() : worldForm.createdAt,
        lastModified: new Date().toISOString()
      }

      if (showCreateDialog.value) {
        // 创建新设定
        worldData.id = Date.now().toString()
        const success = storageManager.createWorldItem(selectedProjectId.value, worldData)
        if (success) {
          loadWorldItems()
          closeDialogs()
        } else {
          alert('创建世界设定失败')
        }
      } else {
        // 更新设定
        const success = storageManager.updateWorldItem(selectedProjectId.value, worldData)
        if (success) {
          loadWorldItems()
          if (selectedWorldItem.value && selectedWorldItem.value.id === worldData.id) {
            selectedWorldItem.value = worldData
          }
          closeDialogs()
        } else {
          alert('更新世界设定失败')
        }
      }
    }

    const deleteWorldItem = (item) => {
      if (confirm(`确定要删除世界设定"${item.name}"吗？此操作不可恢复。`)) {
        const success = storageManager.deleteWorldItem(selectedProjectId.value, item.id)
        if (success) {
          loadWorldItems()
          if (selectedWorldItem.value && selectedWorldItem.value.id === item.id) {
            closeSidebar()
          }
        } else {
          alert('删除世界设定失败')
        }
      }
    }

    const formatDate = (dateString) => {
      if (!dateString) return '未知'
      return new Date(dateString).toLocaleDateString('zh-CN')
    }

    // 生命周期
    onMounted(() => {
      loadProjects()
      
      // 如果有当前项目，自动选择
      if (props.currentProject) {
        selectedProjectId.value = props.currentProject.id
        loadWorldItems()
      } else {
        const currentProject = storageManager.getCurrentProject()
        if (currentProject) {
          selectedProjectId.value = currentProject.id
          loadWorldItems()
        }
      }
    })

    return {
      selectedProjectId,
      projects,
      worldItems,
      searchQuery,
      viewMode,
      activeCategory,
      showCreateDialog,
      showEditDialog,
      selectedWorldItem,
      sidebarOpen,
      categories,
      worldForm,
      currentProject,
      filteredWorldItems,
      loadProjects,
      loadWorldItems,
      handleProjectChange,
      selectWorldItem,
      closeSidebar,
      getCategoryCount,
      getCategoryName,
      getStatusText,
      resetForm,
      editWorldItem,
      closeDialogs,
      saveWorldItem,
      deleteWorldItem,
      formatDate
    }
  }
}
</script>

<style scoped>
.world-building {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
}

/* 页面头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e0e0e0;
}

.page-header h1 {
  font-size: 28px;
  color: #333;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 15px;
  align-items: center;
}

/* 分类标签 */
.category-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.category-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.category-tab:hover {
  background: #e9ecef;
}

.category-tab.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.category-tab .count {
  background: rgba(0,0,0,0.1);
  color: inherit;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 12px;
  min-width: 20px;
  text-align: center;
}

.category-tab.active .count {
  background: rgba(255,255,255,0.2);
}

/* 列表头部 */
.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.search-bar {
  flex: 1;
  max-width: 300px;
}

.search-input {
  width: 100%;
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.view-controls {
  display: flex;
  gap: 5px;
}

.view-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.view-btn:first-child {
  border-radius: 6px 0 0 6px;
}

.view-btn:last-child {
  border-radius: 0 6px 6px 0;
}

.view-btn.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

/* 网格视图 */
.world-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.world-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.world-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.card-info h3 {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 18px;
}

.item-category {
  color: #666;
  font-size: 14px;
  margin: 0;
}

.card-actions {
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.3s;
}

.world-card:hover .card-actions {
  opacity: 1;
}

.card-content {
  margin-bottom: 15px;
}

.item-description {
  color: #666;
  font-size: 14px;
  line-height: 1.4;
  margin: 0 0 10px 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.tag {
  background: #e9ecef;
  color: #495057;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.tag.small {
  padding: 1px 6px;
  font-size: 11px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 15px;
  border-top: 1px solid #f0f0f0;
}

.item-status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.item-status.draft {
  background: #fff3cd;
  color: #856404;
}

.item-status.developing {
  background: #d1ecf1;
  color: #0c5460;
}

.item-status.completed {
  background: #d4edda;
  color: #155724;
}

.last-modified {
  font-size: 12px;
  color: #999;
}

/* 列表视图 */
.world-table {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.world-table table {
  width: 100%;
  border-collapse: collapse;
}

.world-table th {
  background: #f8f9fa;
  padding: 15px;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 1px solid #e0e0e0;
}

.world-table td {
  padding: 15px;
  border-bottom: 1px solid #f0f0f0;
  vertical-align: middle;
}

.world-row {
  cursor: pointer;
  transition: background-color 0.3s;
}

.world-row:hover {
  background: #f8f9fa;
}

.table-actions {
  display: flex;
  gap: 5px;
}

/* 按钮样式 */
.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #545b62;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
}

.btn-icon {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  color: #666;
  transition: all 0.3s;
}

.btn-icon:hover {
  background: #e9ecef;
  color: #333;
}

.btn-icon.btn-danger {
  background: #f8d7da;
  color: #721c24;
}

.btn-icon.btn-danger:hover {
  background: #f5c6cb;
  color: #491217;
}

/* 空状态 */
.empty-state, .no-project {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.empty-state h3, .no-project h3 {
  font-size: 24px;
  margin: 0 0 10px;
  color: #333;
}

.empty-state p, .no-project p {
  font-size: 16px;
  margin: 0 0 20px;
}

/* 对话框 */
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
  width: 90%;
  max-width: 700px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.dialog-header h2 {
  margin: 0;
  font-size: 20px;
  color: #333;
}

.btn-close {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close:hover {
  color: #333;
}

.dialog-body {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #e0e0e0;
}

/* 表单样式 */
.form-group {
  margin-bottom: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #333;
}

.form-input, .form-select, .form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.form-input:focus, .form-select:focus, .form-textarea:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-hint {
  color: #666;
  font-size: 12px;
  margin-top: 5px;
}

/* 侧边栏 */
.world-sidebar {
  position: fixed;
  top: 0;
  right: -400px;
  width: 400px;
  height: 100vh;
  background: white;
  box-shadow: -2px 0 8px rgba(0,0,0,0.1);
  transition: right 0.3s ease;
  z-index: 999;
  display: flex;
  flex-direction: column;
}

.world-sidebar.open {
  right: 0;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.sidebar-header h2 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.sidebar-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.world-profile {
  text-align: center;
  margin-bottom: 30px;
}

.world-profile h3 {
  font-size: 20px;
  margin: 0 0 5px;
  color: #333;
}

.profile-category {
  color: #666;
  font-size: 14px;
  margin: 0 0 10px;
}

.profile-status {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.profile-details {
  margin-bottom: 30px;
}

.detail-item {
  margin-bottom: 15px;
}

.detail-item label {
  font-weight: 600;
  color: #333;
  display: block;
  margin-bottom: 5px;
}

.detail-item span {
  color: #666;
}

.detail-item p {
  color: #666;
  line-height: 1.5;
  margin: 0;
}

.content-preview {
  color: #666;
  line-height: 1.5;
  max-height: 200px;
  overflow-y: auto;
  background: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
  white-space: pre-wrap;
}

.sidebar-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .world-building {
    padding: 15px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: space-between;
  }
  
  .category-tabs {
    justify-content: center;
  }
  
  .list-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .world-grid {
    grid-template-columns: 1fr;
  }
  
  .world-table {
    overflow-x: auto;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .world-sidebar {
    width: 100%;
    right: -100%;
  }
  
  .dialog {
    width: 95%;
    margin: 20px;
  }
}
</style>