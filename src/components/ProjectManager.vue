<template>
  <div class="project-manager">
    <div class="page-header">
      <h1>项目管理</h1>
      <button class="create-project-btn" @click="showCreateDialog = true">
        <i class="icon">+</i>
        新建项目
      </button>
    </div>

    <div class="projects-grid">
      <div 
        v-for="project in projects" 
        :key="project.id"
        class="project-card"
        @click="selectProject(project)"
      >
        <div class="project-header">
          <div class="project-info">
            <h3>{{ project.name }}</h3>
            <p class="project-genre">{{ project.genre }}</p>
          </div>
          <div class="project-actions">
            <button class="action-btn" @click.stop="editProject(project)" title="编辑">
              <i class="icon">✏️</i>
            </button>
            <button class="action-btn delete" @click.stop="deleteProject(project)" title="删除">
              <i class="icon">🗑️</i>
            </button>
          </div>
        </div>

        <div class="project-stats">
          <div class="stat-item">
            <span class="stat-number">{{ project.wordCount.toLocaleString() }}</span>
            <span class="stat-label">字数</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ project.chapters }}</span>
            <span class="stat-label">章节</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ project.characters }}</span>
            <span class="stat-label">人物</span>
          </div>
        </div>

        <div class="project-progress">
          <div class="progress-info">
            <span>进度</span>
            <span>{{ Math.round((project.wordCount / project.targetWords) * 100) }}%</span>
          </div>
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: Math.min((project.wordCount / project.targetWords) * 100, 100) + '%' }"
            ></div>
          </div>
          <div class="target-words">目标：{{ project.targetWords.toLocaleString() }} 字</div>
        </div>

        <div class="project-footer">
          <div class="project-status" :class="project.status">
            {{ getStatusText(project.status) }}
          </div>
          <div class="last-modified">
            {{ project.lastModified }}
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="projects.length === 0" class="empty-state">
        <div class="empty-icon">📚</div>
        <h3>还没有项目</h3>
        <p>点击"新建项目"开始你的创作之旅</p>
      </div>
    </div>

    <!-- 创建/编辑项目对话框 -->
    <div v-if="showCreateDialog || editingProject" class="dialog-overlay" @click="closeDialog">
      <div class="dialog" @click.stop>
        <div class="dialog-header">
          <h3>{{ editingProject ? '编辑项目' : '新建项目' }}</h3>
          <button class="close-btn" @click="closeDialog">×</button>
        </div>
        
        <div class="dialog-content">
          <div class="form-group">
            <label>项目名称</label>
            <input 
              v-model="projectForm.name" 
              type="text" 
              placeholder="请输入项目名称"
              class="form-input"
            >
          </div>
          
          <div class="form-group">
            <label>类型</label>
            <select v-model="projectForm.genre" class="form-select">
              <option value="">请选择类型</option>
              <option value="小说">小说</option>
              <option value="散文">散文</option>
              <option value="诗歌">诗歌</option>
              <option value="剧本">剧本</option>
              <option value="其他">其他</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>目标字数</label>
            <input 
              v-model.number="projectForm.targetWords" 
              type="number" 
              placeholder="例如：100000"
              class="form-input"
            >
          </div>
          
          <div class="form-group">
            <label>简介</label>
            <textarea 
              v-model="projectForm.description" 
              placeholder="简单描述一下你的作品..."
              class="form-textarea"
              rows="3"
            ></textarea>
          </div>
        </div>
        
        <div class="dialog-footer">
          <button class="cancel-btn" @click="closeDialog">取消</button>
          <button class="confirm-btn" @click="saveProject" :disabled="!projectForm.name">
            {{ editingProject ? '保存' : '创建' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import storageManager from '../utils/storage.js'

export default {
  name: 'ProjectManager',
  data() {
    return {
      showCreateDialog: false,
      editingProject: null,
      projectForm: {
        name: '',
        genre: '',
        targetWords: 50000,
        description: ''
      },
      projects: []
    }
  },
  mounted() {
    this.loadProjects()
  },
  methods: {
    loadProjects() {
      this.projects = storageManager.getProjects()
    },
    selectProject(project) {
      // 保存当前项目到存储
      storageManager.setCurrentProject(project)
      // 切换到选中的项目
      this.$emit('project-selected', project)
      // 可以跳转到仪表盘
      this.$emit('navigate', 'dashboard')
    },
    editProject(project) {
      this.editingProject = project
      this.projectForm = {
        name: project.name,
        genre: project.genre,
        targetWords: project.targetWords,
        description: project.description || ''
      }
    },
    deleteProject(project) {
      if (confirm(`确定要删除项目"${project.name}"吗？此操作不可恢复。`)) {
        if (storageManager.deleteProject(project.id)) {
          this.loadProjects()
        }
      }
    },
    saveProject() {
      if (!this.projectForm.name.trim()) return

      if (this.editingProject) {
        // 编辑现有项目
        const updatedProject = {
          ...this.editingProject,
          name: this.projectForm.name,
          genre: this.projectForm.genre,
          targetWords: this.projectForm.targetWords,
          description: this.projectForm.description
        }
        storageManager.saveProject(updatedProject)
      } else {
        // 创建新项目
        const newProject = {
          id: Date.now(),
          name: this.projectForm.name,
          genre: this.projectForm.genre,
          wordCount: 0,
          targetWords: this.projectForm.targetWords,
          chapters: 0,
          characters: 0,
          status: 'draft',
          description: this.projectForm.description,
          createdAt: new Date().toISOString()
        }
        storageManager.saveProject(newProject)
      }

      this.loadProjects()
      this.closeDialog()
    },
    closeDialog() {
      this.showCreateDialog = false
      this.editingProject = null
      this.projectForm = {
        name: '',
        genre: '',
        targetWords: 50000,
        description: ''
      }
    },
    getStatusText(status) {
      const statusMap = {
        draft: '草稿',
        active: '进行中',
        completed: '已完成',
        paused: '暂停'
      }
      return statusMap[status] || status
    }
  }
}
</script>

<style scoped>
.project-manager {
  padding: 20px;
  background: #f8f9fa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.page-header h1 {
  color: #2c3e50;
  margin: 0;
}

.create-project-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #007bff;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.3s;
}

.create-project-btn:hover {
  background: #0056b3;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.project-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.project-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  border-color: #007bff;
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.project-info h3 {
  margin: 0 0 4px 0;
  color: #2c3e50;
  font-size: 18px;
}

.project-genre {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.project-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  background: none;
  border: none;
  padding: 6px;
  border-radius: 4px;
  cursor: pointer;
  color: #666;
  transition: all 0.3s;
}

.action-btn:hover {
  background: #f8f9fa;
  color: #007bff;
}

.action-btn.delete:hover {
  color: #dc3545;
}

.project-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 16px;
  padding: 12px 0;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
}

.stat-item {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 18px;
  font-weight: bold;
  color: #007bff;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

.project-progress {
  margin-bottom: 16px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.progress-bar {
  height: 6px;
  background: #e9ecef;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #007bff, #28a745);
  transition: width 0.3s;
}

.target-words {
  text-align: center;
  font-size: 12px;
  color: #666;
  margin-top: 6px;
}

.project-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.project-status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.project-status.draft {
  background: #fff3cd;
  color: #856404;
}

.project-status.active {
  background: #d1ecf1;
  color: #0c5460;
}

.project-status.completed {
  background: #d4edda;
  color: #155724;
}

.project-status.paused {
  background: #f8d7da;
  color: #721c24;
}

.last-modified {
  font-size: 12px;
  color: #999;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.empty-state h3 {
  margin: 0 0 10px 0;
  color: #2c3e50;
}

/* 对话框样式 */
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
  z-index: 2000;
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
  padding: 20px 20px 0;
}

.dialog-header h3 {
  margin: 0;
  color: #2c3e50;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog-content {
  padding: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #2c3e50;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #007bff;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 0 20px 20px;
}

.cancel-btn,
.confirm-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.cancel-btn {
  background: #f8f9fa;
  color: #666;
}

.cancel-btn:hover {
  background: #e9ecef;
}

.confirm-btn {
  background: #007bff;
  color: white;
}

.confirm-btn:hover:not(:disabled) {
  background: #0056b3;
}

.confirm-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* 响应式 */
@media (max-width: 768px) {
  .projects-grid {
    grid-template-columns: 1fr;
  }
  
  .page-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .project-stats {
    flex-direction: column;
    gap: 8px;
  }
  
  .stat-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}
</style>