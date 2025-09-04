<template>
  <div class="dashboard">
    <!-- 加载中状态 -->
    <div v-if="isLoading" class="loading-dashboard">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>
    
    <!-- 无项目引导界面 -->
    <div v-else-if="!hasProjects" class="empty-dashboard">
      <div class="empty-state-container">
        <div class="empty-icon">📝</div>
        <h2>欢迎使用故事引擎</h2>
        <p>看起来您还没有创建任何项目</p>
        <button class="create-project-btn" @click="createNewProject">创建第一个项目</button>
        <div class="empty-tips">
          <h3>开始您的写作之旅</h3>
          <ul>
            <li>创建一个新项目来组织您的故事</li>
            <li>添加卷和章节来构建故事结构</li>
            <li>使用编辑器开始您的创作</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 有项目时显示仪表盘 -->
    <div v-else>
      <div class="dashboard-header">
        <h1>写作仪表盘</h1>
        <div class="project-selector">
          <select :value="currentProject?.id || ''" @change="switchProject">
            <option value="" disabled>选择项目</option>
            <option v-for="project in projects" :key="project.id" :value="project.id">
              {{ project.name }}
            </option>
          </select>
        </div>
      </div>

      <div class="dashboard-grid">
      <!-- 写作进度和写作日历并排 -->
      <div class="stats-row">
        <!-- 字数统计 -->
        <div class="card word-stats">
          <div class="card-header">
            <h3>写作进度</h3>
          </div>
          <div class="card-content">
            <div class="stat-item">
              <div class="stat-number">{{ totalWords.toLocaleString() }}</div>
              <div class="stat-label">总字数</div>
            </div>
            <div class="progress-section">
              <div class="progress-info">
                <span>目标进度</span>
                <span>{{ Math.round(progressPercentage) }}%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
              </div>
              <div class="progress-target">目标：{{ targetWords.toLocaleString() }} 字</div>
            </div>
            <div class="daily-stats">
              <div class="daily-item">
                <span class="daily-number">{{ todayWords }}</span>
                <span class="daily-label">今日</span>
              </div>
              <div class="daily-item">
                <span class="daily-number">{{ weekWords }}</span>
                <span class="daily-label">本周</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 写作日历 -->
        <div class="card writing-calendar">
          <div class="card-header">
            <h3>写作日历</h3>
          </div>
          <div class="card-content">
            <!-- 年月选择器 -->
            <div class="calendar-header">
              <button class="nav-btn" @click="previousMonth" title="上一月">
                <i class="icon">‹</i>
              </button>
              <div class="date-selector" @click.stop="toggleDatePicker">
                <span class="current-date">{{ currentYearMonth }}</span>
                <i class="icon dropdown-icon" :class="{ 'rotated': showDatePicker }">▼</i>
                
                <!-- 日期选择器下拉 -->
                <div v-if="showDatePicker" class="date-picker-dropdown" @click.stop>
                  <div class="year-month-selector">
                    <div class="year-selector">
                      <label>年份</label>
                      <select v-model="selectedYear" @change="updateCalendar">
                        <option v-for="year in availableYears" :key="year" :value="year">
                          {{ year }}
                        </option>
                      </select>
                    </div>
                    <div class="month-selector">
                      <label>月份</label>
                      <select v-model="selectedMonth" @change="updateCalendar">
                        <option v-for="(month, index) in monthNames" :key="index" :value="index">
                          {{ month }}
                        </option>
                      </select>
                    </div>
                  </div>
                  <div class="date-picker-actions">
                    <button class="today-btn" @click="goToToday">今天</button>
                    <button class="close-btn" @click.stop="showDatePicker = false">关闭</button>
                  </div>
                </div>
              </div>
              <button class="nav-btn" @click="nextMonth" title="下一月">
                <i class="icon">›</i>
              </button>
            </div>

            <!-- 星期标题 -->
            <div class="weekdays">
              <div v-for="day in weekdayNames" :key="day" class="weekday">{{ day }}</div>
            </div>

            <!-- 日历网格 -->
            <div class="calendar-grid">
              <div 
                v-for="day in calendarDays" 
                :key="day.date"
                class="calendar-day"
                :class="{ 
                  'has-writing': day.wordCount > 0,
                  'today': day.isToday,
                  'future': day.isFuture,
                  'other-month': day.isOtherMonth
                }"
                :title="`${day.date}: ${day.wordCount} 字`"
              >
                <div class="day-number">{{ day.day }}</div>
                <div v-if="day.wordCount > 0" class="day-words">{{ day.wordCount }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 最近更新占位 -->
      <div class="card recent-updates">
        <div class="card-header">
          <h3>最近更新</h3>
        </div>
        <div class="card-content">
          <div class="placeholder-content">
            <div class="placeholder-icon">📝</div>
            <p>人物、世界观等内容管理功能</p>
            <p class="placeholder-subtitle">即将上线...</p>
          </div>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script>
import storageManager from '../utils/storage.js'

export default {
  name: 'Dashboard',
  props: {
    currentProject: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      activeTab: 'characters',
      projects: [],
      totalWords: 0,
      targetWords: 50000,
      todayWords: 0,
      weekWords: 0,
      writingStats: null,
      selectedYear: new Date().getFullYear(),
      selectedMonth: new Date().getMonth(),
      showDatePicker: false,
      monthNames: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
      weekdayNames: ['日', '一', '二', '三', '四', '五', '六'],
      isLoading: true
    }
  },
  mounted() {
    this.loadData()
    // 添加事件监听，当存储变化时重新加载数据
    window.addEventListener('storage-changed', this.handleStorageChange)
  },
  beforeUnmount() {
    // 移除事件监听
    window.removeEventListener('storage-changed', this.handleStorageChange)
  },
  watch: {
    currentProject: {
      handler(newProject) {
        if (newProject) {
          this.loadProjectStats(newProject.id)
        }
      },
      immediate: true
    }
  },
  computed: {
    hasProjects() {
      // 确保projects数组已经加载完成并且有项目
      return Array.isArray(this.projects) && this.projects.length > 0
    },
    progressPercentage() {
      return Math.min((this.totalWords / this.targetWords) * 100, 100)
    },
    currentYearMonth() {
      return `${this.selectedYear}年${this.monthNames[this.selectedMonth]}`
    },
    availableYears() {
      const currentYear = new Date().getFullYear()
      const years = []
      for (let i = currentYear - 5; i <= currentYear + 1; i++) {
        years.push(i)
      }
      return years
    },
    calendarDays() {
      const days = []
      const today = new Date()
      const firstDay = new Date(this.selectedYear, this.selectedMonth, 1)
      const lastDay = new Date(this.selectedYear, this.selectedMonth + 1, 0)
      const startDate = new Date(firstDay)
      
      // 调整到周日开始
      startDate.setDate(startDate.getDate() - startDate.getDay())
      
      // 生成6周的日历（42天）
      for (let i = 0; i < 42; i++) {
        const currentDate = new Date(startDate)
        currentDate.setDate(startDate.getDate() + i)
        
        const isCurrentMonth = currentDate.getMonth() === this.selectedMonth
        const isToday = currentDate.toDateString() === today.toDateString()
        const isFuture = currentDate > today
        const dateString = currentDate.toDateString()
        
        // 从写作统计中获取当日字数
        const dayWords = this.writingStats && this.writingStats.dailyWords 
          ? (this.writingStats.dailyWords[dateString] || 0) 
          : 0
        
        days.push({
          day: currentDate.getDate(),
          date: currentDate.toLocaleDateString(),
          wordCount: dayWords,
          isToday,
          isFuture,
          isOtherMonth: !isCurrentMonth
        })
      }
      
      return days
    }
  },
  methods: {
    loadData() {
      // 设置加载状态
      this.isLoading = true
      
      // 使用setTimeout确保UI先更新为加载状态
      setTimeout(() => {
        try {
          // 获取所有项目
          this.projects = storageManager.getProjects() || []
          
          // 获取当前项目
          const current = storageManager.getCurrentProject()
          
          // 如果有当前项目，加载其统计数据
          if (current && current.id) {
            this.loadProjectStats(current.id)
          } else if (this.projects.length > 0) {
            // 如果没有当前项目但有项目列表，设置第一个项目为当前项目
            storageManager.setCurrentProject(this.projects[0])
            this.$emit('project-changed', this.projects[0])
            this.loadProjectStats(this.projects[0].id)
          }
        } catch (error) {
          console.error('加载数据失败:', error)
        } finally {
          // 完成加载
          this.isLoading = false
        }
      }, 300) // 短暂延迟以确保UI更新
    },
    handleStorageChange() {
      // 当存储变化时重新加载数据
      this.loadData()
    },
    loadProjectStats(projectId) {
      if (!projectId) return
      
      const project = storageManager.getProject(projectId)
      if (project) {
        this.totalWords = project.wordCount || 0
        this.targetWords = project.targetWords || 50000
      }
      
      this.writingStats = storageManager.getWritingStats(projectId) || {}
      this.todayWords = this.writingStats.todayWords || 0
      this.weekWords = this.writingStats.weekWords || 0
    },
    switchProject(event) {
      const projectId = parseInt(event.target.value)
      if (projectId) {
        const project = this.projects.find(p => p.id === projectId)
        if (project) {
          storageManager.setCurrentProject(project)
          this.$emit('project-changed', project)
          this.loadProjectStats(projectId)
        }
      }
    },
    previousMonth() {
      if (this.selectedMonth === 0) {
        this.selectedMonth = 11
        this.selectedYear--
      } else {
        this.selectedMonth--
      }
    },
    nextMonth() {
      if (this.selectedMonth === 11) {
        this.selectedMonth = 0
        this.selectedYear++
      } else {
        this.selectedMonth++
      }
    },
    toggleDatePicker() {
      this.showDatePicker = !this.showDatePicker
    },
    updateCalendar() {
      this.showDatePicker = false
    },
    goToToday() {
      const today = new Date()
      this.selectedYear = today.getFullYear()
      this.selectedMonth = today.getMonth()
      this.showDatePicker = false
    },
    createNewChapter() {
      this.$emit('navigate', 'editor')
    },
    editChapter(chapter) {
      this.$emit('navigate', 'editor', { chapterId: chapter.id })
    },
    editEntry(entry) {
      console.log('编辑条目:', entry)
    },
    createNewProject() {
      this.$emit('navigate', 'projects', { action: 'create' })
    },
    addTask() {
      const text = prompt('请输入任务内容:')
      if (text) {
        this.tasks.push({
          id: Date.now(),
          text,
          completed: false,
          priority: 'medium'
        })
      }
    },
    updateTask(task) {
      // 任务状态更新逻辑
      console.log('任务更新:', task)
    },
    getStatusText(status) {
      const statusMap = {
        draft: '草稿',
        reviewing: '修改中',
        completed: '已完成'
      }
      return statusMap[status] || status
    }
  }
}
</script>

<style scoped>
.dashboard {
  padding: 20px;
  background: #f8f9fa;
  min-height: 100vh;
  overflow-y: auto;
  height: 100vh;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.dashboard-header h1 {
  color: #2c3e50;
  margin: 0;
}

.project-selector select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  font-size: 14px;
}

.dashboard-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stats-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
}

.card.writing-calendar {
  overflow: hidden;
}

.writing-calendar.card {
  overflow: visible;
}

.card-header {
  padding: 20px 20px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 18px;
}

.card-content {
  padding: 20px;
}

/* 最近章节 */
.new-chapter-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
}

.chapter-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 8px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.3s;
}

.chapter-item:hover {
  background: #f8f9fa;
  border-color: #007bff;
}

.chapter-info h4 {
  margin: 0 0 4px 0;
  color: #2c3e50;
}

.chapter-meta {
  margin: 0;
  font-size: 12px;
  color: #666;
}

.chapter-status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.chapter-status.draft {
  background: #fff3cd;
  color: #856404;
}

.chapter-status.reviewing {
  background: #d1ecf1;
  color: #0c5460;
}

.chapter-status.completed {
  background: #d4edda;
  color: #155724;
}

/* 字数统计 */
.stat-item {
  text-align: center;
  margin-bottom: 20px;
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  color: #007bff;
}

.stat-label {
  color: #666;
  font-size: 14px;
}

.progress-section {
  margin-bottom: 20px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.progress-bar {
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #007bff, #28a745);
  transition: width 0.3s;
}

.progress-target {
  text-align: center;
  font-size: 12px;
  color: #666;
  margin-top: 8px;
}

.daily-stats {
  display: flex;
  justify-content: space-around;
}

.daily-item {
  text-align: center;
}

.daily-number {
  display: block;
  font-size: 20px;
  font-weight: bold;
  color: #28a745;
}

.daily-label {
  font-size: 12px;
  color: #666;
}

/* 写作日历 */
.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
  padding: 0 5px;
  position: relative;
}

.nav-btn {
  background: none;
  border: 1px solid #ddd;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #666;
  transition: all 0.3s;
}

.nav-btn:hover {
  background: #f8f9fa;
  border-color: #007bff;
  color: #007bff;
}

.date-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  transition: background-color 0.3s;
  position: relative;
}

.date-selector:hover {
  background: #f8f9fa;
}

.current-date {
  font-weight: 500;
  color: #2c3e50;
}

.dropdown-icon {
  font-size: 12px;
  color: #666;
  transition: transform 0.3s;
}

.dropdown-icon.rotated {
  transform: rotate(180deg);
}

.date-picker-dropdown {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 1000;
  padding: 15px;
  margin-top: 5px;
  min-width: 250px;
  width: 280px;
  max-height: 200px;
}

.year-month-selector {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
}

.year-selector,
.month-selector {
  flex: 1;
}

.year-selector label,
.month-selector label {
  display: block;
  margin-bottom: 5px;
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.year-selector select,
.month-selector select {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.date-picker-actions {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.today-btn,
.close-btn {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s;
}

.today-btn {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.today-btn:hover {
  background: #0056b3;
}

.close-btn {
  background: #f8f9fa;
  color: #666;
}

.close-btn:hover {
  background: #e9ecef;
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 8px;
}

.weekday {
  text-align: center;
  font-size: 12px;
  font-weight: 500;
  color: #666;
  padding: 8px 4px;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.calendar-day {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid #eee;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.calendar-day.has-writing {
  background: #e3f2fd;
  border-color: #2196f3;
}

.calendar-day.today {
  background: #007bff;
  color: white;
}

.calendar-day.future {
  color: #ccc;
}

.calendar-day.other-month {
  color: #ccc;
  background: #fafafa;
}

.calendar-day.other-month.has-writing {
  background: #f0f8ff;
}

.day-number {
  font-weight: 500;
}

.day-words {
  font-size: 10px;
  color: #666;
  margin-top: 2px;
}

.calendar-day.today .day-words {
  color: rgba(255,255,255,0.8);
}

.writing-calendar {
  position: relative;
}

.writing-calendar.card {
  overflow: visible;
}

/* 待办任务 */
.add-task-btn {
  background: #28a745;
  color: white;
  border: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.task-item.completed .task-text {
  text-decoration: line-through;
  color: #666;
}

.task-text {
  flex: 1;
}

.task-priority {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
}

.task-priority.high {
  background: #f8d7da;
  color: #721c24;
}

.task-priority.medium {
  background: #fff3cd;
  color: #856404;
}

.task-priority.low {
  background: #d4edda;
  color: #155724;
}

/* 最近更新 */
.entry-tabs {
  display: flex;
  margin-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.tab-btn {
  background: none;
  border: none;
  padding: 8px 16px;
  cursor: pointer;
  color: #666;
  border-bottom: 2px solid transparent;
}

.tab-btn.active {
  color: #007bff;
  border-bottom-color: #007bff;
}

.entry-item {
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 8px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.3s;
}

.entry-item:hover {
  background: #f8f9fa;
  border-color: #007bff;
}

.entry-info h4 {
  margin: 0 0 4px 0;
  color: #2c3e50;
}

.entry-desc {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #666;
}

.entry-time {
  font-size: 12px;
  color: #999;
}

.empty-state {
  text-align: center;
  color: #666;
  font-style: italic;
  padding: 20px;
}

/* 占位内容样式 */
.placeholder-content {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.placeholder-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.placeholder-content p {
  margin: 8px 0;
  font-size: 16px;
}

.placeholder-subtitle {
  font-size: 14px !important;
  color: #999 !important;
  font-style: italic;
}

/* 加载中状态 */
.loading-dashboard {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: #f8f9fa;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-dashboard p {
  color: #666;
  font-size: 16px;
}

/* 空项目状态 */
.empty-dashboard {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: #f8f9fa;
}

.empty-state-container {
  text-align: center;
  max-width: 500px;
  padding: 40px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.empty-state-container h2 {
  margin: 0 0 10px;
  color: #2c3e50;
}

.empty-state-container p {
  margin: 0 0 30px;
  color: #666;
  font-size: 16px;
}

.create-project-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.create-project-btn:hover {
  background: #0056b3;
}

.empty-tips {
  margin-top: 40px;
  text-align: left;
  border-top: 1px solid #eee;
  padding-top: 20px;
}

.empty-tips h3 {
  margin: 0 0 15px;
  color: #2c3e50;
  font-size: 16px;
}

.empty-tips ul {
  padding-left: 20px;
  margin: 0;
}

.empty-tips li {
  margin-bottom: 8px;
  color: #666;
}

/* 响应式 */
@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: 1fr;
  }
  
  .dashboard-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .empty-state-container {
    margin: 20px;
    padding: 30px;
  }
}
</style>