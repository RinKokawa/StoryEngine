<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1>写作仪表盘</h1>
      <div class="project-selector">
        <select v-model="currentProject" @change="switchProject">
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
            <div class="calendar-grid">
              <div 
                v-for="day in calendarDays" 
                :key="day.date"
                class="calendar-day"
                :class="{ 
                  'has-writing': day.wordCount > 0,
                  'today': day.isToday,
                  'future': day.isFuture
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
</template>

<script>
export default {
  name: 'Dashboard',
  data() {
    return {
      currentProject: 1,
      activeTab: 'characters',
      projects: [],
      totalWords: 0,
      targetWords: 50000,
      todayWords: 0,
      weekWords: 0
    }
  },
  computed: {
    progressPercentage() {
      return Math.min((this.totalWords / this.targetWords) * 100, 100)
    },
    activeEntries() {
      return this.activeTab === 'characters' ? this.characters : this.worldview
    },
    calendarDays() {
      const days = []
      const today = new Date()
      const currentMonth = today.getMonth()
      const currentYear = today.getFullYear()
      
      // 生成当月日历数据（空数据）
      for (let i = 1; i <= 30; i++) {
        const date = new Date(currentYear, currentMonth, i)
        const isToday = i === today.getDate()
        const isFuture = i > today.getDate()
        
        days.push({
          day: i,
          date: date.toLocaleDateString(),
          wordCount: 0,
          isToday,
          isFuture
        })
      }
      
      return days
    }
  },
  methods: {
    switchProject() {
      // 切换项目逻辑
      console.log('切换到项目:', this.currentProject)
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

.day-number {
  font-weight: 500;
}

.day-words {
  font-size: 10px;
  color: #666;
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
}
</style>