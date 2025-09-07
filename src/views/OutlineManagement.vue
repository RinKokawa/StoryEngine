<template>
  <div class="outline-management">
    <div class="outline-header">
      <div class="header-left">
        <h2>大纲管理</h2>
        <ProjectSelector 
          v-model="selectedProjectId"
          :projects="projects"
          @change="handleProjectChange"
        />
        <div class="outline-type-tabs">
          <button 
            class="tab-btn" 
            :class="{ active: currentType === 'main' }"
            @click="switchType('main')"
            :disabled="!currentProject"
          >
            主要大纲
          </button>
          <button 
            class="tab-btn" 
            :class="{ active: currentType === 'detailed' }"
            @click="switchType('detailed')"
            :disabled="!currentProject"
          >
            详细大纲
          </button>
        </div>
      </div>
      <div class="header-actions">
        <button 
          class="btn btn-primary" 
          @click="showCreateDialog = true"
          :disabled="!currentProject"
        >
          <i class="icon">➕</i>
          新建大纲
        </button>
        <button 
          class="btn btn-secondary" 
          @click="toggleView"
          :disabled="!currentProject"
        >
          <i class="icon">{{ isTreeView ? '📋' : '🌳' }}</i>
          {{ isTreeView ? '列表视图' : '树形视图' }}
        </button>
      </div>
    </div>

    <div class="outline-content">
      <!-- 未选择项目提示 -->
      <div v-if="!currentProject" class="no-project-state">
        <div class="empty-icon">📁</div>
        <h3>请选择一个项目</h3>
        <p>选择一个项目来管理其大纲内容</p>
      </div>
      
      <!-- 树形视图 -->
      <div v-else-if="isTreeView" class="tree-view">
        <div v-if="outlineTree.length === 0" class="empty-state">
          <div class="empty-icon">📝</div>
          <h3>还没有{{ currentType === 'main' ? '主要' : '详细' }}大纲</h3>
          <p>创建你的第一个大纲来开始规划你的故事</p>
          <button class="btn btn-primary" @click="showCreateDialog = true">
            创建大纲
          </button>
        </div>
        <div v-else class="outline-tree">
          <OutlineTreeNode
            v-for="node in outlineTree"
            :key="node.id"
            :node="node"
            @edit="editOutline"
            @delete="deleteOutline"
            @add-child="addChildOutline"
          />
        </div>
      </div>

      <!-- 列表视图 -->
      <div v-else-if="currentProject" class="list-view">
        <div v-if="currentOutlines.length === 0" class="empty-state">
          <div class="empty-icon">📝</div>
          <h3>还没有{{ currentType === 'main' ? '主要' : '详细' }}大纲</h3>
          <p>创建你的第一个大纲来开始规划你的故事</p>
          <button class="btn btn-primary" @click="showCreateDialog = true">
            创建大纲
          </button>
        </div>
        <div v-else class="outline-list">
          <div
            v-for="outline in currentOutlines"
            :key="outline.id"
            class="outline-item"
            :class="{ active: selectedOutline?.id === outline.id }"
            @click="selectOutline(outline)"
          >
            <div class="outline-item-header">
              <h4>{{ outline.title }}</h4>
              <div class="outline-actions">
                <button class="action-btn" @click.stop="editOutline(outline)">
                  <i class="icon">✏️</i>
                </button>
                <button class="action-btn" @click.stop="deleteOutline(outline)">
                  <i class="icon">🗑️</i>
                </button>
              </div>
            </div>
            <div class="outline-meta">
              <span class="status" :class="outline.status">{{ getStatusText(outline.status) }}</span>
              <span class="date">{{ formatDate(outline.lastModified) }}</span>
            </div>
            <div class="outline-preview">
              {{ outline.content || '暂无内容' }}
            </div>
          </div>
        </div>
      </div>

      <!-- 大纲详情面板 -->
      <div v-if="selectedOutline && !isTreeView" class="outline-detail">
        <div class="detail-header">
          <h3>{{ selectedOutline.title }}</h3>
          <button class="btn btn-primary" @click="editOutline(selectedOutline)">
            编辑大纲
          </button>
        </div>
        <div class="detail-content">
          <div class="detail-section">
            <h4>状态</h4>
            <span class="status" :class="selectedOutline.status">
              {{ getStatusText(selectedOutline.status) }}
            </span>
          </div>
          <div class="detail-section">
            <h4>内容</h4>
            <div class="content-display">
              {{ selectedOutline.content || '暂无内容' }}
            </div>
          </div>
          <div v-if="selectedOutline.notes" class="detail-section">
            <h4>备注</h4>
            <div class="notes-display">
              {{ selectedOutline.notes }}
            </div>
          </div>
          <div class="detail-section">
            <h4>创建时间</h4>
            <span>{{ formatDate(selectedOutline.createdAt) }}</span>
          </div>
          <div class="detail-section">
            <h4>最后修改</h4>
            <span>{{ formatDate(selectedOutline.lastModified) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建/编辑大纲对话框 -->
    <div v-if="showCreateDialog || showEditDialog" class="modal-overlay" @click="closeDialogs">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ showEditDialog ? '编辑大纲' : '创建大纲' }}</h3>
          <button class="close-btn" @click="closeDialogs">×</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveOutline">
            <div class="form-group">
              <label>标题</label>
              <input
                v-model="outlineForm.title"
                type="text"
                class="form-control"
                placeholder="输入大纲标题"
                required
              />
            </div>
            <div class="form-group">
              <label>类型</label>
              <select v-model="outlineForm.type" class="form-control">
                <option value="main">主要大纲</option>
                <option value="detailed">详细大纲</option>
              </select>
            </div>
            <div class="form-group">
              <label>状态</label>
              <select v-model="outlineForm.status" class="form-control">
                <option value="draft">草稿</option>
                <option value="completed">完成</option>
                <option value="reviewing">审阅中</option>
              </select>
            </div>
            <div class="form-group">
              <label>内容</label>
              <textarea
                v-model="outlineForm.content"
                class="form-control"
                rows="8"
                placeholder="输入大纲内容..."
              ></textarea>
            </div>
            <div class="form-group">
              <label>备注</label>
              <textarea
                v-model="outlineForm.notes"
                class="form-control"
                rows="3"
                placeholder="添加备注..."
              ></textarea>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" @click="closeDialogs">
                取消
              </button>
              <button type="submit" class="btn btn-primary">
                {{ showEditDialog ? '保存' : '创建' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useProjectStore } from '../stores/project'
import OutlineTreeNode from '../components/common/OutlineTreeNode.vue'
import ProjectSelector from '../components/common/ProjectSelector.vue'
import { storageService } from '@/services/storage'

export default {
  name: 'OutlineManagement',
  components: {
    OutlineTreeNode,
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
    const projectStore = useProjectStore()
    
    // 响应式数据
    const currentType = ref('main')
    const isTreeView = ref(true)
    const selectedOutline = ref(null)
    const showCreateDialog = ref(false)
    const showEditDialog = ref(false)
    const outlines = ref([])
    const projects = ref([])
    const selectedProjectId = ref('')
    
    // 表单数据
    const outlineForm = ref({
      title: '',
      type: 'main',
      content: '',
      status: 'draft',
      notes: '',
      parentId: null
    })
    
    // 计算属性
    const currentProject = computed(() => {
      return projects.value.find(p => p.id === selectedProjectId.value) || props.currentProject
    })
    
    const currentOutlines = computed(() => {
      if (!currentProject.value) return []
      return outlines.value.filter(outline => 
        outline.type === currentType.value && 
        outline.projectId === currentProject.value.id
      )
    })
    
    const outlineTree = computed(() => {
      const typeOutlines = currentOutlines.value
      const rootOutlines = typeOutlines.filter(outline => !outline.parentId)
      
      function buildTree(parentOutlines, level = 0) {
        return parentOutlines.map(outline => {
          const children = typeOutlines.filter(child => child.parentId === outline.id)
          return {
            ...outline,
            level,
            children: children.length > 0 ? buildTree(children, level + 1) : []
          }
        })
      }
      
      return buildTree(rootOutlines)
    })
    
    // 方法
    const handleProjectChange = (project) => {
      if (project) {
        selectedProjectId.value = project.id
        emit('project-changed', project)
        loadOutlines(project.id)
        selectedOutline.value = null
      }
    }
    
    const loadProjects = async () => {
      try {
        projects.value = await storageService.getProjects() || []
        
        // 如果有当前项目，自动选择
        const currentProject = await storageService.getCurrentProject()
        if (currentProject) {
          selectedProjectId.value = currentProject.id
          loadOutlines(currentProject.id)
        } else if (props.currentProject) {
          selectedProjectId.value = props.currentProject.id
          loadOutlines(props.currentProject.id)
        }
      } catch (error) {
        console.error('加载项目失败:', error)
      }
    }
    
    const loadOutlines = async (projectId) => {
      if (!projectId) return
      try {
        outlines.value = await storageService.getProjectOutlines(projectId) || []
      } catch (error) {
        console.error('加载大纲失败:', error)
        outlines.value = []
      }
    }
    
    const switchType = (type) => {
      currentType.value = type
      selectedOutline.value = null
    }
    
    const toggleView = () => {
      isTreeView.value = !isTreeView.value
      selectedOutline.value = null
    }
    
    const selectOutline = (outline) => {
      selectedOutline.value = outline
    }
    
    const editOutline = (outline) => {
      outlineForm.value = {
        title: outline.title,
        type: outline.type,
        content: outline.content || '',
        status: outline.status,
        notes: outline.notes || '',
        parentId: outline.parentId || null
      }
      showEditDialog.value = true
      selectedOutline.value = outline
    }
    
    const addChildOutline = (parentOutline) => {
      outlineForm.value = {
        title: '',
        type: currentType.value,
        content: '',
        status: 'draft',
        notes: '',
        parentId: parentOutline.id
      }
      showCreateDialog.value = true
    }
    
    const deleteOutline = async (outline) => {
      if (confirm(`确定要删除大纲"${outline.title}"吗？此操作不可恢复。`)) {
        try {
          await storageService.deleteOutline(currentProject.value.id, outline.id)
          
          // 重新加载大纲列表
          await loadOutlines(currentProject.value.id)
          
          if (selectedOutline.value?.id === outline.id) {
            selectedOutline.value = null
          }
        } catch (error) {
          console.error('删除大纲失败:', error)
          alert('删除大纲失败，请重试')
        }
      }
    }
    
    const saveOutline = async () => {
      if (!currentProject.value) {
        alert('请先选择一个项目')
        return
      }
      
      try {
        if (showEditDialog.value && selectedOutline.value) {
          // 更新现有大纲
          await storageService.updateOutline(currentProject.value.id, {
            id: selectedOutline.value.id,
            ...outlineForm.value
          })
        } else {
          // 创建新大纲
          await storageService.createOutline(currentProject.value.id, outlineForm.value)
        }
        
        // 重新加载大纲列表
        await loadOutlines(currentProject.value.id)
        closeDialogs()
      } catch (error) {
        console.error('保存大纲失败:', error)
        alert('保存大纲失败，请重试')
      }
    }
    
    const closeDialogs = () => {
      showCreateDialog.value = false
      showEditDialog.value = false
      outlineForm.value = {
        title: '',
        type: 'main',
        content: '',
        status: 'draft',
        notes: '',
        parentId: null
      }
    }
    
    const getStatusText = (status) => {
      const statusMap = {
        draft: '草稿',
        completed: '完成',
        reviewing: '审阅中'
      }
      return statusMap[status] || status
    }
    
    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleString('zh-CN')
    }
    
    // 监听项目变化
    watch(() => props.currentProject, (newProject) => {
      if (newProject) {
        selectedProjectId.value = newProject.id
        loadOutlines(newProject.id)
      }
    }, { immediate: true })
    
    // 生命周期
    onMounted(async () => {
      await loadProjects()
      if (currentProject.value) {
        await loadOutlines(currentProject.value.id)
      }
    })
    
    return {
      currentType,
      isTreeView,
      selectedOutline,
      showCreateDialog,
      showEditDialog,
      outlineForm,
      projects,
      selectedProjectId,
      currentProject,
      currentOutlines,
      outlineTree,
      handleProjectChange,
      loadProjects,
      loadOutlines,
      switchType,
      toggleView,
      selectOutline,
      editOutline,
      addChildOutline,
      deleteOutline,
      saveOutline,
      closeDialogs,
      getStatusText,
      formatDate
    }
  }
}
</script>

<style scoped>
.outline-management {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background-attachment: fixed;
}

.outline-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 24px 32px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 32px;
}

.header-left h2 {
  margin: 0;
  color: #2d3748;
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.outline-type-tabs {
  display: flex;
  gap: 4px;
  background: rgba(102, 126, 234, 0.1);
  padding: 4px;
  border-radius: 12px;
}

.tab-btn {
  padding: 12px 20px;
  border: none;
  background: transparent;
  color: #667eea;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 500;
  font-size: 14px;
}

.tab-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  transform: translateY(-1px);
}

.tab-btn:hover:not(.active) {
  background: rgba(102, 126, 234, 0.1);
  transform: translateY(-1px);
}

.header-actions {
  display: flex;
  gap: 12px;
}

.btn {
  padding: 12px 20px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 500;
  font-size: 14px;
  position: relative;
  overflow: hidden;
}

.btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.btn:hover::before {
  left: 100%;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.6);
}

.btn-secondary {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  color: #2d3748;
  box-shadow: 0 4px 15px rgba(168, 237, 234, 0.4);
}

.btn-secondary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(168, 237, 234, 0.6);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
  transform: none;
  box-shadow: none;
}

.tab-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.outline-content {
  flex: 1;
  display: flex;
  overflow: hidden;
  margin: 20px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.tree-view, .list-view {
  flex: 1;
  padding: 32px;
  overflow-y: auto;
}

.empty-state, .no-project-state {
  text-align: center;
  padding: 80px 40px;
  color: #718096;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 24px;
  opacity: 0.8;
}

.empty-state h3, .no-project-state h3 {
  margin: 0 0 16px 0;
  color: #2d3748;
  font-size: 24px;
  font-weight: 600;
}

.empty-state p, .no-project-state p {
  font-size: 16px;
  line-height: 1.6;
  margin-bottom: 32px;
}

.no-project-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 400px;
}

.outline-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.outline-item {
  background: white;
  border-radius: 16px;
  padding: 24px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.outline-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: -1;
}

.outline-item:hover {
  border-color: #667eea;
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(102, 126, 234, 0.2);
}

.outline-item:hover::before {
  opacity: 0.05;
}

.outline-item.active {
  border-color: #667eea;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(102, 126, 234, 0.3);
}

.outline-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.outline-item-header h4 {
  margin: 0;
  color: #2d3748;
  font-size: 18px;
  font-weight: 600;
}

.outline-actions {
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.outline-item:hover .outline-actions {
  opacity: 1;
}

.action-btn {
  background: rgba(102, 126, 234, 0.1);
  border: none;
  padding: 8px;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.3s ease;
  color: #667eea;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background: #667eea;
  color: white;
  transform: scale(1.1);
}

.outline-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  font-size: 13px;
}

.status {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status.draft {
  background: linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%);
  color: #d63031;
}

.status.completed {
  background: linear-gradient(135deg, #55efc4 0%, #81ecec 100%);
  color: #00b894;
}

.status.reviewing {
  background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%);
  color: white;
}

.outline-preview {
  color: #718096;
  font-size: 15px;
  line-height: 1.6;
  max-height: 72px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.outline-detail {
  width: 400px;
  background: rgba(255, 255, 255, 0.95);
  border-left: 1px solid rgba(102, 126, 234, 0.2);
  padding: 32px;
  overflow-y: auto;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 2px solid rgba(102, 126, 234, 0.1);
}

.detail-header h3 {
  margin: 0;
  color: #2d3748;
  font-size: 20px;
  font-weight: 600;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section h4 {
  margin: 0 0 12px 0;
  color: #4a5568;
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.content-display, .notes-display {
  background: rgba(102, 126, 234, 0.05);
  padding: 16px;
  border-radius: 12px;
  line-height: 1.7;
  white-space: pre-wrap;
  border-left: 4px solid #667eea;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal {
  background: white;
  border-radius: 20px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  border-bottom: 1px solid rgba(102, 126, 234, 0.1);
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
}

.modal-header h3 {
  margin: 0;
  color: #2d3748;
  font-size: 20px;
  font-weight: 600;
}

.close-btn {
  background: rgba(102, 126, 234, 0.1);
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #667eea;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: #667eea;
  color: white;
  transform: rotate(90deg);
}

.modal-body {
  padding: 32px;
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #4a5568;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-control {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid rgba(102, 126, 234, 0.2);
  border-radius: 12px;
  font-size: 14px;
  transition: all 0.3s ease;
  background: rgba(102, 126, 234, 0.02);
}

.form-control:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
  background: white;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid rgba(102, 126, 234, 0.1);
}

.icon {
  font-size: 14px;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(102, 126, 234, 0.1);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
}
</style>