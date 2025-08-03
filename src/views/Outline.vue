<template>
  <Layout>
    <header class="main-header">
      <div class="header-title">大纲管理</div>
      <div class="header-actions">
        <button class="create-btn">
          <PlusIcon class="icon" /> 新建大纲
        </button>
      </div>
    </header>

    <div class="outline-content">
      <div class="outline-section">
        <div class="section-header">
          <h2>我的大纲</h2>
          <div class="view-controls">
            <button class="import-btn">
              <UploadIcon class="icon" /> 导入
            </button>
          </div>
        </div>
        
        <div class="outline-container">
          <div class="outline-card">
            <div class="outline-info">
              <h3 class="outline-title">示例大纲</h3>
              <p class="outline-description">这是一个示例大纲，展示了如何组织你的故事结构。</p>
              <div class="outline-stats">
                <span class="chapter-count">12 章节</span>
                <span class="last-edit">今天</span>
              </div>
            </div>
            <div class="outline-actions">
              <button class="action-btn">
                <EditIcon class="icon" />
              </button>
              <button class="action-btn delete">
                <TrashIcon class="icon" />
              </button>
            </div>
          </div>
          
          <div class="empty-state">
            <BookOpenIcon class="empty-icon" />
            <h3>还没有大纲</h3>
            <p>点击"新建大纲"开始规划你的故事结构</p>
          </div>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import Layout from '../components/Layout.vue'
import { 
  PlusIcon, 
  UploadIcon, 
  EditIcon, 
  TrashIcon,
  BookOpenIcon
} from 'lucide-vue-next'
</script>

<style scoped>
.main-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2.2rem 3vw 1.2rem 3vw;
  background: var(--header-bg);
  border-bottom: 2px solid var(--border);
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  position: sticky;
  top: 0;
  z-index: 2;
}

.header-title {
  font-size: 2.1rem;
  font-weight: bold;
  color: var(--title-color);
  letter-spacing: 2px;
}

.header-actions {
  display: flex;
  gap: 1.2rem;
}

.create-btn {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.9rem 2rem;
  border: none;
  border-radius: 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  background: var(--primary-btn-bg);
  color: var(--primary-btn-color);
  box-shadow: var(--card-shadow);
  transition: all 0.22s cubic-bezier(.4,2,.6,1);
}

.create-btn:hover {
  transform: scale(1.06) translateY(-2px);
  box-shadow: var(--primary-btn-hover);
}

.outline-content {
  margin: 0 auto;
  width: 100%;
  max-width: 1600px;
  background: none;
  border-radius: 0;
  box-shadow: none;
  padding: 2.5rem 2vw 2.5rem 2vw;
}

.outline-section {
  background: var(--card-bg);
  border-radius: 2rem;
  padding: 2.2rem 2rem 1.7rem 2rem;
  box-shadow: var(--card-shadow);
  backdrop-filter: blur(8px);
  border: 2px solid var(--border);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  border-bottom: 1.5px solid var(--border);
  padding-bottom: 0.5rem;
}

.section-header h2 {
  font-size: 1.5rem;
  color: var(--title-color);
}

.view-controls {
  display: flex;
  gap: 0.7rem;
}

.import-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 2px solid var(--border);
  background: var(--input-bg);
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--accent);
  font-size: 1.1rem;
}

.import-btn:hover {
  background: var(--accent);
  color: #fff;
}

.outline-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.outline-card {
  background: var(--input-bg);
  border-radius: 1.5rem;
  padding: 1.5rem;
  box-shadow: var(--card-shadow);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(.4,2,.6,1);
  position: relative;
  border: 2px solid var(--border);
}

.outline-card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: var(--card-hover-shadow);
  border-color: var(--accent);
}

.outline-info {
  margin-bottom: 1rem;
}

.outline-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--title-color);
  margin-bottom: 0.5rem;
  line-height: 1.2;
  letter-spacing: 1px;
}

.outline-description {
  color: var(--subtitle-color);
  font-size: 1rem;
  line-height: 1.5;
  margin-bottom: 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.outline-stats {
  display: flex;
  justify-content: space-between;
  font-size: 0.95rem;
  color: var(--subtitle-color);
}

.outline-actions {
  position: absolute;
  top: 1.2rem;
  right: 1.2rem;
  display: flex;
  gap: 0.7rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.outline-card:hover .outline-actions {
  opacity: 1;
}

.action-btn {
  padding: 0.6rem;
  border: 2px solid var(--border);
  background: var(--input-bg);
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--accent);
  font-size: 1.1rem;
}

.action-btn:hover {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
  box-shadow: 0 0 8px var(--accent);
}

.action-btn.delete:hover {
  background: #dc3545;
  color: #fff;
  border-color: #dc3545;
  box-shadow: 0 0 8px #dc3545;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--subtitle-color);
}

.empty-icon {
  width: 4rem;
  height: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
  filter: drop-shadow(0 0 8px var(--accent));
}

.icon {
  width: 1.2rem;
  height: 1.2rem;
}
</style> 