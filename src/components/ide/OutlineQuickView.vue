<template>
  <div class="outline-quick-view">
    <div class="view-header">
      <h3>大纲导航</h3>
      <div class="header-actions">
        <button 
          @click="viewMode = 'tree'" 
          :class="{ active: viewMode === 'tree' }"
          class="view-btn"
          title="树形视图"
        >
          <span class="icon">🌳</span>
        </button>
        <button 
          @click="viewMode = 'list'" 
          :class="{ active: viewMode === 'list' }"
          class="view-btn"
          title="列表视图"
        >
          <span class="icon">📋</span>
        </button>
        <button @click="showCreateDialog = true" class="add-btn" title="新建大纲">
          <span class="icon">+</span>
        </button>
      </div>
    </div>

    <div class="outline-content">
      <!-- 大纲类型切换 -->
      <div class="outline-types">
        <button 
          v-for="type in outlineTypes" 
          :key="type.id"
          @click="activeType = type.id"
          class="type-btn"
          :class="{ active: activeType === type.id }"
        >
          <span class="icon">{{ type.icon }}</span>
          <span>{{ type.name }}</span>
        </button>
      </div>

      <!-- 树形视图 -->
      <div v-if="viewMode === 'tree'" class="tree-view">
        <div v-if="outlineTree.length === 0" class="empty-state">
          <div class="empty-icon">📋</div>
          <p>暂无{{ getCurrentTypeName() }}大纲</p>
          <button @click="showCreateDialog = true" class="btn btn-primary">
            创建大纲
          </button>
        </div>
        <OutlineTreeNode
          v-for="node in outlineTree"
          :key="node.id"
          :node="node"
          :current-chapter="currentChapter"
          @node-selected="handleNodeSelected"
          @node-toggle="handleNodeToggle"
        />
      </div>

      <!-- 列表视图 -->
      <div v-if="viewMode === 'list'" class="list-view">
        <div v-if="filteredOutlines.length === 0" class="empty-state">
          <div class="empty-icon">📋</div>
          <p>暂无{{ getCurrentTypeName() }}大纲</p>
          <button @click="showCreateDialog = true" class="btn btn-primary">
            创建大纲
          </button>
        </div>
        <div 
          v-for="outline in filteredOutlines" 
          :key="outline.id"
          class="outline-item"
          :class="{ 
            active: selectedOutline?.id === outline.id,
            current: isCurrentChapterOutline(outline)
          }"
          @click="selectOutline(outline)"
        >
          <div class="item-header">
            <div class="item-title">{{ outline.title }}</div>
            <div class="item-status">
              <span class="status-badge" :class="outline.status">{{ getStatusText(outline.status) }}</span>
            </div>
          </div>
          <div class="item-content">
            {{ truncateText(outline.content, 80) }}
          </div>
          <div class="item-meta">
            <span class="order">序号: {{ outline.order }}</span>
            <span class="modified">{{ formatDate(outline.lastModified) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 新建大纲对话框 -->
    <div v-if="showCreateDialog" class="create-dialog-overlay" @click="showCreateDialog = false">
      <div class="create-dialog" @click.stop>
        <div class="dialog-header">
          <h3>新建大纲</h3>
          <button @click="showCreateDialog = false" class="close-btn">×</button>
        </div>
        
        <div class="dialog-content">
          <div class="form-group">
            <label>大纲类型</label>
            <select v-model="newOutline.type">
              <option value="main">主要大纲</option>
              <option value="detailed">详细大纲</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>标题</label>
            <input v-model="newOutline.title" type="text" placeholder="输入大纲标题">
          </div>
          
          <div class="form-group">
            <label>内容</label>
            <textarea v-model="newOutline.content" placeholder="输入大纲内容" rows="4"></textarea>
          </div>
          
          <div class="form-group">
            <label>父级大纲</label>
            <select v-model="newOutline.parentId">
              <option value="">无 (顶级大纲)</option>
              <option v-for="outline in availableParents" :key="outline.id" :value="outline.id">
                {{ outline.title }}
              </option>
            </select>
          </div>
        </div>
        
        <div class="dialog-actions">
          <button @click="createOutline" class="btn btn-primary" :disabled="!newOutline.title">
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
  name: 'OutlineQuickView',
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
  emits: ['outline-selected'],
  setup(props, { emit }) {
    const outlines = ref([])
    const selectedOutline = ref(null)
    const showCreateDialog = ref(false)
    const viewMode = ref('tree') // 'tree' | 'list'
    const activeType = ref('main') // 'main' | 'detailed'
    const loading = ref(false)

    // 大纲类型配置
    const outlineTypes = [
      { id: 'main', name: '主要', icon: '📋' },
      { id: 'detailed', name: '详细', icon: '📝' }
    ]

    // 新建大纲表单
    const newOutline = ref({
      type: 'main',
      title: '',
      content: '',
      parentId: ''
    })

    // 过滤当前类型的大纲
    const filteredOutlines = computed(() => {
      return outlines.value
        .filter(outline => outline.type === activeType.value)
        .sort((a, b) => a.order - b.order)
    })

    // 可用的父级大纲
    const availableParents = computed(() => {
      return filteredOutlines.value.filter(outline => !outline.parentId)
    })

    // 构建树形结构
    const outlineTree = computed(() => {
      const filtered = filteredOutlines.value
      const tree = []
      const nodeMap = new Map()

      // 创建节点映射
      filtered.forEach(outline => {
        nodeMap.set(outline.id, {
          ...outline,
          children: [],
          level: 0,
          expanded: true
        })
      })

      // 构建树形结构
      filtered.forEach(outline => {
        const node = nodeMap.get(outline.id)
        if (outline.parentId && nodeMap.has(outline.parentId)) {
          const parent = nodeMap.get(outline.parentId)
          node.level = parent.level + 1
          parent.children.push(node)
        } else {
          tree.push(node)
        }
      })

      return tree
    })

    // 获取当前类型名称
    const getCurrentTypeName = () => {
      const type = outlineTypes.find(t => t.id === activeType.value)
      return type ? type.name : ''
    }

    // 判断是否为当前章节相关大纲
    const isCurrentChapterOutline = (outline) => {
      if (!props.currentChapter) return false
      // 这里可以根据实际需求实现判断逻辑
      // 比如根据大纲标题、内容或者关联关系
      return false
    }

    // 加载大纲列表
    const loadOutlines = async () => {
      if (!props.projectId) return
      
      loading.value = true
      try {
        const projectOutlines = await storageService.getProjectOutlines(props.projectId)
        outlines.value = projectOutlines || []
      } catch (error) {
        console.error('加载大纲失败:', error)
      } finally {
        loading.value = false
      }
    }

    // 选择大纲
    const selectOutline = (outline) => {
      selectedOutline.value = outline
      emit('outline-selected', outline)
    }

    // 处理节点选择
    const handleNodeSelected = (node) => {
      selectOutline(node)
    }

    // 处理节点展开/折叠
    const handleNodeToggle = (node) => {
      node.expanded = !node.expanded
    }

    // 创建新大纲
    const createOutline = async () => {
      if (!newOutline.value.title.trim()) return
      
      try {
        const outlineData = {
          type: newOutline.value.type,
          title: newOutline.value.title.trim(),
          content: newOutline.value.content.trim(),
          parentId: newOutline.value.parentId || null,
          projectId: props.projectId,
          order: getNextOrder()
        }
        
        const createdOutline = await storageService.createOutline(outlineData)
        outlines.value.push(createdOutline)
        
        // 重置表单
        newOutline.value = { type: 'main', title: '', content: '', parentId: '' }
        showCreateDialog.value = false
        
        console.log('大纲创建成功:', createdOutline.title)
      } catch (error) {
        console.error('创建大纲失败:', error)
        alert('创建大纲失败，请重试')
      }
    }

    // 获取下一个序号
    const getNextOrder = () => {
      const sameTypeOutlines = outlines.value.filter(o => o.type === newOutline.value.type)
      return sameTypeOutlines.length > 0 
        ? Math.max(...sameTypeOutlines.map(o => o.order)) + 1 
        : 1
    }

    // 获取状态文本
    const getStatusText = (status) => {
      const statusMap = {
        draft: '草稿',
        completed: '完成',
        reviewing: '审阅中'
      }
      return statusMap[status] || status
    }

    // 截断文本
    const truncateText = (text, maxLength) => {
      if (!text) return ''
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
    }

    // 格式化日期
    const formatDate = (dateString) => {
      if (!dateString) return ''
      const date = new Date(dateString)
      const now = new Date()
      const diffTime = now - date
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays === 0) {
        return '今天'
      } else if (diffDays === 1) {
        return '昨天'
      } else if (diffDays < 7) {
        return `${diffDays}天前`
      } else {
        return date.toLocaleDateString('zh-CN')
      }
    }

    // 监听项目变化
    watch(() => props.projectId, () => {
      loadOutlines()
    }, { immediate: true })

    onMounted(() => {
      loadOutlines()
    })

    return {
      outlines,
      selectedOutline,
      showCreateDialog,
      viewMode,
      activeType,
      newOutline,
      loading,
      outlineTypes,
      filteredOutlines,
      availableParents,
      outlineTree,
      getCurrentTypeName,
      isCurrentChapterOutline,
      selectOutline,
      handleNodeSelected,
      handleNodeToggle,
      createOutline,
      getStatusText,
      truncateText,
      formatDate
    }
  }
}
</script>

<style scoped>
.outline-quick-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.view-header {
  padding: 16px;
  border-bottom: 1px solid #e1e4e8;
  background: #f6f8fa;
}

.view-header h3 {
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

.view-btn {
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

.view-btn:hover {
  background: #f6f8fa;
  border-color: #0366d6;
  color: #0366d6;
}

.view-btn.active {
  background: #0366d6;
  border-color: #0366d6;
  color: white;
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
  margin-left: auto;
}

.add-btn:hover {
  background: #f6f8fa;
  border-color: #28a745;
  color: #28a745;
}

.outline-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.outline-types {
  display: flex;
  gap: 4px;
  margin-bottom: 16px;
}

.type-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  background: white;
  border: 1px solid #d1d5da;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #586069;
  transition: all 0.2s;
}

.type-btn:hover {
  background: #f6f8fa;
  border-color: #0366d6;
}

.type-btn.active {
  background: #0366d6;
  border-color: #0366d6;
  color: white;
}

.tree-view, .list-view {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.outline-item {
  padding: 12px;
  background: white;
  border: 1px solid #e1e4e8;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.outline-item:hover {
  border-color: #0366d6;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.outline-item.active {
  border-color: #0366d6;
  background: #f1f8ff;
}

.outline-item.current {
  border-color: #f66a0a;
  background: #fff8f0;
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

.status-badge {
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.status-badge.draft {
  background: #f1f8ff;
  color: #0366d6;
}

.status-badge.completed {
  background: #dcfce7;
  color: #16a34a;
}

.status-badge.reviewing {
  background: #fef3c7;
  color: #d97706;
}

.item-content {
  font-size: 12px;
  color: #586069;
  line-height: 1.4;
  margin-bottom: 6px;
}

.item-meta {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #8b949e;
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

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 滚动条样式 */
.outline-content::-webkit-scrollbar {
  width: 6px;
}

.outline-content::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.outline-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.outline-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>