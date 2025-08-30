<template>
  <div class="dashboard">
    <!-- 项目头部 -->
    <div class="project-header">
      <div class="project-info">
        <div class="project-title">
          <h1>{{ currentProject?.name || '未选择项目' }}</h1>
          <span class="status-badge" :class="currentProject?.status">
            {{ getStatusText(currentProject?.status) }}
          </span>
        </div>
        <p class="project-description">{{ currentProject?.description }}</p>
        <div class="project-meta">
          <span v-if="currentProject?.genre" class="genre-tag">{{ currentProject.genre }}</span>
          <span class="update-time">
            更新于 {{ formatDate(currentProject?.updatedAt) }}
          </span>
        </div>
      </div>
      <div class="project-actions">
        <button @click="changeProject" class="btn-change">
          <ArrowLeft :size="16" />
          切换项目
        </button>
        <button @click="editProject" class="btn-edit">
          <Settings :size="16" />
          项目设置
        </button>
      </div>
    </div>

    <!-- 功能导航 -->
    <div class="feature-nav">
      <router-link
        v-for="feature in features"
        :key="feature.path"
        :to="feature.path"
        class="feature-card"
        :class="{ active: $route.path === feature.path }"
      >
        <div class="feature-icon">
          <component :is="feature.icon" :size="32" />
        </div>
        <div class="feature-info">
          <h3>{{ feature.title }}</h3>
          <p>{{ feature.description }}</p>
        </div>
        <div class="feature-arrow">
          <ChevronRight :size="20" />
        </div>
      </router-link>
    </div>

    <!-- 快速统计 -->
    <div class="stats-section">
      <h2>项目概览</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📝</div>
          <div class="stat-info">
            <div class="stat-number">{{ outlineCount }}</div>
            <div class="stat-label">大纲章节</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-info">
            <div class="stat-number">{{ characterCount }}</div>
            <div class="stat-label">角色设定</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🌍</div>
          <div class="stat-info">
            <div class="stat-number">{{ worldCount }}</div>
            <div class="stat-label">世界观设定</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-info">
            <div class="stat-number">{{ progressPercent }}%</div>
            <div class="stat-label">完成进度</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 最近活动 -->
    <div class="recent-section">
      <h2>最近活动</h2>
      <div class="activity-list">
        <div class="activity-item">
          <div class="activity-icon">📝</div>
          <div class="activity-content">
            <div class="activity-title">更新了第三章大纲</div>
            <div class="activity-time">2小时前</div>
          </div>
        </div>
        <div class="activity-item">
          <div class="activity-icon">👤</div>
          <div class="activity-content">
            <div class="activity-title">添加了新角色"李明"</div>
            <div class="activity-time">1天前</div>
          </div>
        </div>
        <div class="activity-item">
          <div class="activity-icon">🌍</div>
          <div class="activity-content">
            <div class="activity-title">完善了世界观设定</div>
            <div class="activity-time">3天前</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  ArrowLeft, 
  Settings, 
  ChevronRight, 
  FileText, 
  Users, 
  Globe,
  Edit
} from 'lucide-vue-next'
import { useProjectStore } from '@/application/stores/projectStore'

const router = useRouter()
const projectStore = useProjectStore()

// 计算属性
const currentProject = computed(() => projectStore.currentProject)

// 功能导航配置
const features = [
  {
    path: '/outline',
    title: '故事大纲',
    description: '规划你的故事结构和章节安排',
    icon: FileText
  },
  {
    path: '/characters',
    title: '角色管理',
    description: '创建和管理故事中的角色',
    icon: Users
  },
  {
    path: '/worldbuilding',
    title: '世界观设定',
    description: '构建故事的世界观和背景设定',
    icon: Globe
  },
  {
    path: '/writing',
    title: '写作工具',
    description: '开始写作你的故事',
    icon: Edit
  }
]

// 模拟统计数据
const outlineCount = computed(() => 12)
const characterCount = computed(() => 8)
const worldCount = computed(() => 5)
const progressPercent = computed(() => 65)

// 方法
const changeProject = () => {
  router.push('/projects')
}

const editProject = () => {
  // TODO: 实现项目编辑功能
  console.log('编辑项目')
}

const getStatusText = (status?: string) => {
  if (!status) return ''
  const statusMap = {
    planning: '策划中',
    writing: '写作中',
    paused: '暂停',
    completed: '已完成'
  }
  return statusMap[status as keyof typeof statusMap] || ''
}

const formatDate = (date?: Date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN')
}

// 生命周期
onMounted(() => {
  // 如果没有选择项目，跳转到项目选择页面
  if (!currentProject.value) {
    router.push('/projects')
  }
})
</script>

<style scoped>
.dashboard {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.project-title {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.project-title h1 {
  margin: 0;
  color: #2d3748;
  font-size: 1.8rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-badge.planning { background: #fed7d7; color: #c53030; }
.status-badge.writing { background: #c6f6d5; color: #2f855a; }
.status-badge.paused { background: #feebc8; color: #c05621; }
.status-badge.completed { background: #bee3f8; color: #2b6cb0; }

.project-description {
  color: #718096;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.project-meta {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.genre-tag {
  background: #e2e8f0;
  color: #4a5568;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
}

.update-time {
  color: #a0aec0;
  font-size: 0.9rem;
}

.project-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-change, .btn-edit {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  color: #4a5568;
}

.btn-change:hover, .btn-edit:hover {
  background: #f7fafc;
  border-color: #cbd5e0;
}

.feature-nav {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.feature-card {
  display: flex;
  align-items: center;
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-decoration: none;
  color: inherit;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.feature-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.feature-card.active {
  border-color: #667eea;
  background: #f7fafc;
}

.feature-icon {
  color: #667eea;
  margin-right: 1rem;
}

.feature-info {
  flex: 1;
}

.feature-info h3 {
  margin: 0 0 0.5rem 0;
  color: #2d3748;
  font-size: 1.1rem;
}

.feature-info p {
  margin: 0;
  color: #718096;
  font-size: 0.9rem;
}

.feature-arrow {
  color: #a0aec0;
}

.stats-section, .recent-section {
  margin-bottom: 2rem;
}

.stats-section h2, .recent-section h2 {
  margin-bottom: 1rem;
  color: #2d3748;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 2rem;
  margin-right: 1rem;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2d3748;
}

.stat-label {
  color: #718096;
  font-size: 0.9rem;
}

.activity-list {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.activity-item {
  display: flex;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  font-size: 1.5rem;
  margin-right: 1rem;
}

.activity-content {
  flex: 1;
}

.activity-title {
  color: #2d3748;
  margin-bottom: 0.25rem;
}

.activity-time {
  color: #a0aec0;
  font-size: 0.8rem;
}
</style>