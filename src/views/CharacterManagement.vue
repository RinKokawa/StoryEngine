<template>
  <div class="character-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1>角色管理</h1>
      <div class="header-actions">
        <ProjectSelector 
          v-model="selectedProjectId"
          :projects="projects"
          @change="handleProjectChange"
        />
        <button @click="showCreateDialog = true" class="btn btn-primary">
          <i class="icon-plus"></i>
          新建角色
        </button>
      </div>
    </div>

    <!-- 角色列表 -->
    <div class="character-list" v-if="currentProject">
      <div class="list-header">
        <div class="search-bar">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="搜索角色..." 
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
      <div v-if="viewMode === 'grid'" class="character-grid">
        <div 
          v-for="character in filteredCharacters" 
          :key="character.id"
          class="character-card"
          @click="selectCharacter(character)"
        >
          <div class="character-avatar">
            <img v-if="character.avatar" :src="character.avatar" :alt="character.name">
            <div v-else class="avatar-placeholder">
              {{ character.name.charAt(0) }}
            </div>
          </div>
          <div class="character-info">
            <h3 class="character-name">{{ character.name }}</h3>
            <p class="character-role">{{ character.role || '未设定' }}</p>
            <p class="character-description">{{ character.description || '暂无描述' }}</p>
          </div>
          <div class="character-actions">
            <button @click.stop="editCharacter(character)" class="btn-icon" title="编辑">
              <i class="icon-edit"></i>
            </button>
            <button @click.stop="deleteCharacter(character)" class="btn-icon btn-danger" title="删除">
              <i class="icon-delete"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- 列表视图 -->
      <div v-if="viewMode === 'list'" class="character-table">
        <table>
          <thead>
            <tr>
              <th>头像</th>
              <th>姓名</th>
              <th>角色</th>
              <th>年龄</th>
              <th>性别</th>
              <th>描述</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="character in filteredCharacters" 
              :key="character.id"
              @click="selectCharacter(character)"
              class="character-row"
            >
              <td>
                <div class="table-avatar">
                  <img v-if="character.avatar" :src="character.avatar" :alt="character.name">
                  <div v-else class="avatar-placeholder small">
                    {{ character.name.charAt(0) }}
                  </div>
                </div>
              </td>
              <td class="character-name">{{ character.name }}</td>
              <td>{{ character.role || '未设定' }}</td>
              <td>{{ character.age || '未知' }}</td>
              <td>{{ character.gender || '未知' }}</td>
              <td class="character-description">{{ character.description || '暂无描述' }}</td>
              <td>{{ formatDate(character.createdAt) }}</td>
              <td>
                <div class="table-actions">
                  <button @click.stop="editCharacter(character)" class="btn-icon" title="编辑">
                    <i class="icon-edit"></i>
                  </button>
                  <button @click.stop="deleteCharacter(character)" class="btn-icon btn-danger" title="删除">
                    <i class="icon-delete"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredCharacters.length === 0" class="empty-state">
        <div class="empty-icon">👤</div>
        <h3>暂无角色</h3>
        <p v-if="searchQuery">没有找到匹配的角色</p>
        <p v-else>开始创建你的第一个角色吧！</p>
        <button v-if="!searchQuery" @click="showCreateDialog = true" class="btn btn-primary">
          创建角色
        </button>
      </div>
    </div>

    <!-- 未选择项目状态 -->
    <div v-else class="no-project">
      <div class="empty-icon">📁</div>
      <h3>请选择一个项目</h3>
      <p>选择项目后即可管理该项目的角色</p>
    </div>

    <!-- 角色创建/编辑对话框 -->
    <div v-if="showCreateDialog || showEditDialog" class="dialog-overlay" @click="closeDialogs">
      <div class="dialog" @click.stop>
        <div class="dialog-header">
          <h2>{{ showCreateDialog ? '新建角色' : '编辑角色' }}</h2>
          <button @click="closeDialogs" class="btn-close">×</button>
        </div>
        <div class="dialog-body">
          <form @submit.prevent="saveCharacter">
            <div class="form-group">
              <label>角色姓名 *</label>
              <input 
                v-model="characterForm.name" 
                type="text" 
                required 
                placeholder="输入角色姓名"
                class="form-input"
              >
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>角色定位</label>
                <select v-model="characterForm.role" class="form-select">
                  <option value="">选择角色定位</option>
                  <option value="主角">主角</option>
                  <option value="配角">配角</option>
                  <option value="反派">反派</option>
                  <option value="路人">路人</option>
                </select>
              </div>
              <div class="form-group">
                <label>年龄</label>
                <input 
                  v-model="characterForm.age" 
                  type="number" 
                  placeholder="年龄"
                  class="form-input"
                >
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>性别</label>
                <select v-model="characterForm.gender" class="form-select">
                  <option value="">选择性别</option>
                  <option value="男">男</option>
                  <option value="女">女</option>
                  <option value="其他">其他</option>
                </select>
              </div>
              <div class="form-group">
                <label>职业</label>
                <input 
                  v-model="characterForm.occupation" 
                  type="text" 
                  placeholder="职业"
                  class="form-input"
                >
              </div>
            </div>
            <div class="form-group">
              <label>外貌描述</label>
              <textarea 
                v-model="characterForm.appearance" 
                placeholder="描述角色的外貌特征..."
                rows="4"
                class="form-textarea"
              ></textarea>
            </div>
            <div class="form-group">
              <label>性格特点</label>
              <textarea 
                v-model="characterForm.personality" 
                placeholder="描述角色的性格特点..."
                rows="4"
                class="form-textarea"
              ></textarea>
            </div>
            <div class="form-group">
              <label>背景故事</label>
              <textarea 
                v-model="characterForm.background" 
                placeholder="角色的背景故事..."
                rows="6"
                class="form-textarea"
              ></textarea>
            </div>
            <div class="form-group">
              <label>角色描述</label>
              <textarea 
                v-model="characterForm.description" 
                placeholder="角色的简要描述..."
                rows="4"
                class="form-textarea"
              ></textarea>
            </div>
          </form>
        </div>
        <div class="dialog-footer">
          <button @click="closeDialogs" class="btn btn-secondary">取消</button>
          <button @click="saveCharacter" class="btn btn-primary" :disabled="!characterForm.name">
            {{ showCreateDialog ? '创建' : '保存' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 角色详情侧边栏 -->
    <div v-if="selectedCharacter" class="character-sidebar" :class="{ open: sidebarOpen }">
      <div class="sidebar-header">
        <h2>角色详情</h2>
        <button @click="closeSidebar" class="btn-close">×</button>
      </div>
      <div class="sidebar-content">
        <div class="character-profile">
          <div class="profile-avatar">
            <img v-if="selectedCharacter.avatar" :src="selectedCharacter.avatar" :alt="selectedCharacter.name">
            <div v-else class="avatar-placeholder large">
              {{ selectedCharacter.name.charAt(0) }}
            </div>
          </div>
          <h3>{{ selectedCharacter.name }}</h3>
          <p class="profile-role">{{ selectedCharacter.role || '未设定角色' }}</p>
        </div>
        
        <div class="profile-details">
          <div class="detail-item" v-if="selectedCharacter.age">
            <label>年龄：</label>
            <span>{{ selectedCharacter.age }}</span>
          </div>
          <div class="detail-item" v-if="selectedCharacter.gender">
            <label>性别：</label>
            <span>{{ selectedCharacter.gender }}</span>
          </div>
          <div class="detail-item" v-if="selectedCharacter.occupation">
            <label>职业：</label>
            <span>{{ selectedCharacter.occupation }}</span>
          </div>
          <div class="detail-item" v-if="selectedCharacter.appearance">
            <label>外貌：</label>
            <p>{{ selectedCharacter.appearance }}</p>
          </div>
          <div class="detail-item" v-if="selectedCharacter.personality">
            <label>性格：</label>
            <p>{{ selectedCharacter.personality }}</p>
          </div>
          <div class="detail-item" v-if="selectedCharacter.background">
            <label>背景：</label>
            <p>{{ selectedCharacter.background }}</p>
          </div>
          <div class="detail-item" v-if="selectedCharacter.description">
            <label>描述：</label>
            <p>{{ selectedCharacter.description }}</p>
          </div>
        </div>

        <div class="sidebar-actions">
          <button @click="editCharacter(selectedCharacter)" class="btn btn-primary">
            编辑角色
          </button>
          <button @click="deleteCharacter(selectedCharacter)" class="btn btn-danger">
            删除角色
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
  name: 'CharacterManagement',
  components: {

    ProjectSelector
  },
  setup() {
    const selectedProjectId = ref('')
    const projects = ref([])
    const characters = ref([])
    const searchQuery = ref('')
    const viewMode = ref('grid')
    const showCreateDialog = ref(false)
    const showEditDialog = ref(false)
    const selectedCharacter = ref(null)
    const sidebarOpen = ref(false)
    
    const characterForm = reactive({
      name: '',
      role: '',
      age: '',
      gender: '',
      occupation: '',
      appearance: '',
      personality: '',
      background: '',
      description: ''
    })

    // 计算属性
    const currentProject = computed(() => {
      return projects.value.find(p => p.id === selectedProjectId.value)
    })

    const filteredCharacters = computed(() => {
      if (!searchQuery.value) return characters.value
      
      const query = searchQuery.value.toLowerCase()
      return characters.value.filter(character => 
        character.name.toLowerCase().includes(query) ||
        (character.role && character.role.toLowerCase().includes(query)) ||
        (character.description && character.description.toLowerCase().includes(query))
      )
    })

    // 方法
    const loadProjects = () => {
      projects.value = storageManager.getProjects()
    }

    const loadCharacters = () => {
      if (selectedProjectId.value) {
        characters.value = storageManager.getProjectCharacters(selectedProjectId.value) || []
      } else {
        characters.value = []
      }
    }

    const handleProjectChange = (project) => {
      if (project) {
        selectedProjectId.value = project.id
        loadCharacters()
        closeSidebar()
      }
    }

    const selectCharacter = (character) => {
      selectedCharacter.value = character
      sidebarOpen.value = true
    }

    const closeSidebar = () => {
      sidebarOpen.value = false
      selectedCharacter.value = null
    }

    const resetForm = () => {
      Object.assign(characterForm, {
        name: '',
        role: '',
        age: '',
        gender: '',
        occupation: '',
        appearance: '',
        personality: '',
        background: '',
        description: ''
      })
    }

    const editCharacter = (character) => {
      Object.assign(characterForm, { ...character })
      showEditDialog.value = true
      showCreateDialog.value = false
    }

    const closeDialogs = () => {
      showCreateDialog.value = false
      showEditDialog.value = false
      resetForm()
    }

    const saveCharacter = () => {
      if (!characterForm.name.trim()) {
        alert('请输入角色姓名')
        return
      }

      if (!selectedProjectId.value) {
        alert('请先选择项目')
        return
      }

      const characterData = {
        ...characterForm,
        projectId: selectedProjectId.value,
        createdAt: showCreateDialog.value ? new Date().toISOString() : characterForm.createdAt,
        updatedAt: new Date().toISOString()
      }

      if (showCreateDialog.value) {
        // 创建新角色
        characterData.id = Date.now().toString()
        const success = storageManager.createCharacter(selectedProjectId.value, characterData)
        if (success) {
          // 重新加载角色列表以确保数据同步
          loadCharacters()
          closeDialogs()
        } else {
          alert('创建角色失败')
        }
      } else {
        // 更新角色
        const success = storageManager.updateCharacter(selectedProjectId.value, characterData)
        if (success) {
          // 重新加载角色列表以确保数据同步
          loadCharacters()
          if (selectedCharacter.value && selectedCharacter.value.id === characterData.id) {
            selectedCharacter.value = characterData
          }
          closeDialogs()
        } else {
          alert('更新角色失败')
        }
      }
    }

    const deleteCharacter = (character) => {
      if (confirm(`确定要删除角色"${character.name}"吗？此操作不可恢复。`)) {
        const success = storageManager.deleteCharacter(selectedProjectId.value, character.id)
        if (success) {
          // 重新加载角色列表以确保数据同步
          loadCharacters()
          if (selectedCharacter.value && selectedCharacter.value.id === character.id) {
            closeSidebar()
          }
        } else {
          alert('删除角色失败')
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
      const currentProject = storageManager.getCurrentProject()
      if (currentProject) {
        selectedProjectId.value = currentProject.id
        loadCharacters()
      }
    })

    return {
      selectedProjectId,
      projects,
      characters,
      searchQuery,
      viewMode,
      showCreateDialog,
      showEditDialog,
      selectedCharacter,
      sidebarOpen,
      characterForm,
      currentProject,
      filteredCharacters,
      loadProjects,
      loadCharacters,
      handleProjectChange,
      selectCharacter,
      closeSidebar,
      resetForm,
      editCharacter,
      closeDialogs,
      saveCharacter,
      deleteCharacter,
      formatDate
    }
  }
}
</script>

<style scoped>
.character-management {
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
.character-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.character-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.character-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.character-avatar {
  width: 60px;
  height: 60px;
  margin: 0 auto 15px;
}

.character-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #007bff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
}

.avatar-placeholder.small {
  width: 40px;
  height: 40px;
  font-size: 16px;
}

.avatar-placeholder.large {
  width: 80px;
  height: 80px;
  font-size: 32px;
}

.character-info {
  text-align: center;
  margin-bottom: 15px;
}

.character-name {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin: 0 0 5px;
}

.character-role {
  color: #666;
  font-size: 14px;
  margin: 0 0 10px;
}

.character-description {
  color: #888;
  font-size: 13px;
  line-height: 1.4;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.character-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  opacity: 0;
  transition: opacity 0.3s;
}

.character-card:hover .character-actions {
  opacity: 1;
}

/* 列表视图 */
.character-table {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.character-table table {
  width: 100%;
  border-collapse: collapse;
}

.character-table th {
  background: #f8f9fa;
  padding: 15px;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 1px solid #e0e0e0;
}

.character-table td {
  padding: 15px;
  border-bottom: 1px solid #f0f0f0;
  vertical-align: middle;
}

.character-row {
  cursor: pointer;
  transition: background-color 0.3s;
}

.character-row:hover {
  background: #f8f9fa;
}

.table-avatar {
  display: flex;
  align-items: center;
}

.table-avatar img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
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
  max-width: 600px;
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

/* 侧边栏 */
.character-sidebar {
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

.character-sidebar.open {
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

.character-profile {
  text-align: center;
  margin-bottom: 30px;
}

.profile-avatar {
  margin: 0 auto 15px;
  width: 80px;
  height: 80px;
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.character-profile h3 {
  font-size: 20px;
  margin: 0 0 5px;
  color: #333;
}

.profile-role {
  color: #666;
  font-size: 14px;
  margin: 0;
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

.sidebar-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .character-management {
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
  
  .list-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .character-grid {
    grid-template-columns: 1fr;
  }
  
  .character-table {
    overflow-x: auto;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .character-sidebar {
    width: 100%;
    right: -100%;
  }
  
  .dialog {
    width: 95%;
    margin: 20px;
  }
}
</style>