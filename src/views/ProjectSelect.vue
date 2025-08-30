<template>
  <div class="project-select">
    <div class="header">
      <h1>选择项目</h1>
      <p class="subtitle">选择一个小说项目来管理大纲、角色和世界观</p>
    </div>

    <div class="content">
      <!-- 项目列表 -->
      <div v-if="hasProjects" class="projects-grid">
        <div
          v-for="project in projects"
          :key="project.id"
          class="project-card"
          @click="selectProject(project.id)"
        >
          <div class="project-cover">
            <div class="project-icon">📚</div>
          </div>
          <div class="project-info">
            <h3>{{ project.name }}</h3>
            <p class="description">{{ project.description }}</p>
            <div class="project-meta">
              <span class="genre" v-if="project.genre">{{ project.genre }}</span>
              <span class="status" :class="project.status">{{ getStatusText(project.status) }}</span>
            </div>
            <div class="project-date">
              更新于 {{ formatDate(project.updatedAt) }}
            </div>
          </div>
          <div class="project-actions">
            <button @click.stop="editProject(project)" class="btn-edit">
              <Edit2 :size="16" />
            </button>
            <button @click.stop="deleteProjectConfirm(project)" class="btn-delete">
              <Trash2 :size="16" />
            </button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <div class="empty-icon">📝</div>
        <h3>还没有项目</h3>
        <p>创建你的第一个小说项目开始写作之旅</p>
      </div>

      <!-- 创建新项目按钮 -->
      <button @click="showCreateDialog = true" class="btn-create">
        <Plus :size="20" />
        创建新项目
      </button>
    </div>

    <!-- 创建/编辑项目对话框 -->
    <div v-if="showCreateDialog" class="dialog-overlay" @click="closeDialog">
      <div class="dialog" @click.stop>
        <div class="dialog-header">
          <h3>{{ editingProject ? '编辑项目' : '创建新项目' }}</h3>
          <button @click="closeDialog" class="btn-close">
            <X :size="20" />
          </button>
        </div>
        <div class="dialog-content">
          <div class="form-group">
            <label>项目名称</label>
            <input
              v-model="formData.name"
              type="text"
              placeholder="输入项目名称"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>项目描述</label>
            <textarea
              v-model="formData.description"
              placeholder="简单描述你的小说..."
              class="form-textarea"
              rows="3"
            ></textarea>
          </div>
          <div class="form-group">
            <label>类型</label>
            <select v-model="formData.genre" class="form-select">
              <option value="">选择类型</option>
              <option value="科幻">科幻</option>
              <option value="奇幻">奇幻</option>
              <option value="武侠">武侠</option>
              <option value="言情">言情</option>
              <option value="悬疑">悬疑</option>
              <option value="历史">历史</option>
              <option value="其他">其他</option>
            </select>
          </div>
          <div class="form-group">
            <label>状态</label>
            <select v-model="formData.status" class="form-select">
              <option value="planning">策划中</option>
              <option value="writing">写作中</option>
              <option value="paused">暂停</option>
              <option value="completed">已完成</option>
            </select>
          </div>
        </div>
        <div class="dialog-actions">
          <button @click="closeDialog" class="btn-cancel">取消</button>
          <button @click="saveProject" class="btn-save">
            {{ editingProject ? '保存' : '创建' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Edit2, Trash2, X } from 'lucide-vue-next'
import { useProjectStore, type Project } from '@/application/stores/projectStore'

const router = useRouter()
const projectStore = useProjectStore()

// 响应式数据
const showCreateDialog = ref(false)
const editingProject = ref<Project | null>(null)
const formData = ref({
  name: '',
  description: '',
  genre: '',
  status: 'planning' as Project['status']
})

// 计算属性
const projects = computed(() => projectStore.projects)
const hasProjects = computed(() => projectStore.hasProjects)

// 方法
const selectProject = (projectId: string) => {
  projectStore.selectProject(projectId)
  router.push('/dashboard')
}

const editProject = (project: Project) => {
  editingProject.value = project
  formData.value = {
    name: project.name,
    description: project.description,
    genre: project.genre || '',
    status: project.status
  }
  showCreateDialog.value = true
}

const deleteProjectConfirm = (project: Project) => {
  if (confirm(`确定要删除项目"${project.name}"吗？此操作不可撤销。`)) {
    projectStore.deleteProject(project.id)
  }
}

const saveProject = () => {
  if (!formData.value.name.trim()) {
    alert('请输入项目名称')
    return
  }

  if (editingProject.value) {
    projectStore.updateProject(editingProject.value.id, formData.value)
  } else {
    projectStore.createProject(formData.value)
  }

  closeDialog()
}

const closeDialog = () => {
  showCreateDialog.value = false
  editingProject.value = null
  formData.value = {
    name: '',
    description: '',
    genre: '',
    status: 'planning'
  }
}

const getStatusText = (status: Project['status']) => {
  const statusMap = {
    planning: '策划中',
    writing: '写作中',
    paused: '暂停',
    completed: '已完成'
  }
  return statusMap[status]
}

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('zh-CN')
}

// 生命周期
onMounted(() => {
  projectStore.initializeWithSampleData()
})
</script>

<style scoped>
.project-select {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.header {
  text-align: center;
  margin-bottom: 3rem;
  color: white;
}

.header h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  font-weight: 700;
}

.subtitle {
  font-size: 1.1rem;
  opacity: 0.9;
}

.content {
  max-width: 1200px;
  margin: 0 auto;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.project-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  position: relative;
}

.project-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.project-cover {
  text-align: center;
  margin-bottom: 1rem;
}

.project-icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

.project-info h3 {
  font-size: 1.3rem;
  margin-bottom: 0.5rem;
  color: #2d3748;
}

.description {
  color: #718096;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.project-meta {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.genre {
  background: #e2e8f0;
  color: #4a5568;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
}

.status {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status.planning { background: #fed7d7; color: #c53030; }
.status.writing { background: #c6f6d5; color: #2f855a; }
.status.paused { background: #feebc8; color: #c05621; }
.status.completed { background: #bee3f8; color: #2b6cb0; }

.project-date {
  font-size: 0.8rem;
  color: #a0aec0;
}

.project-actions {
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  gap: 0.5rem;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.project-card:hover .project-actions {
  opacity: 1;
}

.btn-edit, .btn-delete {
  background: none;
  border: none;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn-edit:hover { background: #e2e8f0; }
.btn-delete:hover { background: #fed7d7; color: #c53030; }

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: white;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.btn-create {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  color: #667eea;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  margin: 2rem auto 0;
  transition: all 0.3s ease;
}

.btn-create:hover {
  background: #f7fafc;
  transform: translateY(-2px);
}

/* 对话框样式 */
.dialog-overlay {
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

.dialog {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.dialog-header h3 {
  margin: 0;
  color: #2d3748;
}

.btn-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
}

.btn-close:hover {
  background: #f7fafc;
}

.dialog-content {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #2d3748;
}

.form-input, .form-textarea, .form-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.form-input:focus, .form-textarea:focus, .form-select:focus {
  outline: none;
  border-color: #667eea;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #e2e8f0;
}

.btn-cancel, .btn-save {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel {
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  color: #4a5568;
}

.btn-cancel:hover {
  background: #edf2f7;
}

.btn-save {
  background: #667eea;
  border: none;
  color: white;
}

.btn-save:hover {
  background: #5a67d8;
}
</style>