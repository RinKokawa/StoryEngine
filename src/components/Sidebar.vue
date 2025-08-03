<template>
  <aside class="sidebar">
    <div class="sidebar-title">📕 StoryEngine</div>
    <nav class="sidebar-nav">
      <button :class="{active: currentNav==='novels'}" @click="goToHome">
        我的项目
      </button>
      <button :class="{active: currentNav==='outline'}" @click="goToOutline">
        大纲
      </button>
      <button :class="{active: currentNav==='characters'}" @click="goToCharacters">
        角色
      </button>
      <button :class="{active: currentNav==='world'}" @click="goToWorldMap">
        世界观
      </button>
      <button :class="{active: currentNav==='writing'}" @click="goToWriting">
        写作
      </button>
      <button @click="goAiTest" class="ai-menu-btn">
        AI测试
      </button>
    </nav>
    <div class="sidebar-theme-switcher">
      <label>主题：</label>
      <select v-model="theme" @change="applyTheme">
        <option value="modern">现代极简</option>
        <option value="cyber">酷炫赛博</option>
        <option value="glass">玻璃拟态</option>
        <option value="dark">暗黑极简</option>
        <option value="retro">复古打字机</option>
        <option value="green">绿色护眼</option>
        <option value="sunset">日落橙紫</option>
        <option value="neon">极客霓虹</option>
      </select>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const theme = ref('modern')
const currentNav = ref('novels')

// 根据当前路由设置导航状态
const updateCurrentNav = () => {
  const path = route.path
  if (path === '/') {
    currentNav.value = 'novels'
  } else if (path === '/outline') {
    currentNav.value = 'outline'
  } else if (path === '/characters') {
    currentNav.value = 'characters'
  } else if (path === '/worldmap') {
    currentNav.value = 'world'
  } else if (path === '/writing') {
    currentNav.value = 'writing'
  } else if (path === '/ai-test') {
    currentNav.value = 'ai-test'
  }
}

const applyTheme = () => {
  const root = document.documentElement
  if (theme.value === 'modern') {
    root.setAttribute('data-theme', 'modern')
  } else if (theme.value === 'cyber') {
    root.setAttribute('data-theme', 'cyber')
  } else if (theme.value === 'glass') {
    root.setAttribute('data-theme', 'glass')
  } else if (theme.value === 'dark') {
    root.setAttribute('data-theme', 'dark')
  } else if (theme.value === 'retro') {
    root.setAttribute('data-theme', 'retro')
  } else if (theme.value === 'green') {
    root.setAttribute('data-theme', 'green')
  } else if (theme.value === 'sunset') {
    root.setAttribute('data-theme', 'sunset')
  } else if (theme.value === 'neon') {
    root.setAttribute('data-theme', 'neon')
  }
  localStorage.setItem('novel-theme', theme.value)
}

// 导航方法
const goToHome = () => {
  router.push('/')
}

const goToOutline = () => {
  router.push('/outline')
}

const goToCharacters = () => {
  router.push('/characters')
}

const goToWorldMap = () => {
  router.push('/worldmap')
}

const goToWriting = () => {
  router.push('/writing')
}

const goAiTest = () => {
  router.push('/ai-test')
}

onMounted(() => {
  // 主题初始化
  const saved = localStorage.getItem('novel-theme')
  if (saved) {
    theme.value = saved
    applyTheme()
  } else {
    applyTheme()
  }
  
  // 更新当前导航状态
  updateCurrentNav()
})

watch(theme, applyTheme)

// 监听路由变化
watch(() => route.path, updateCurrentNav)
</script>

<style scoped>
.sidebar {
  width: 220px;
  background: var(--sidebar-bg);
  box-shadow: 2px 0 12px rgba(0,0,0,0.04);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 2.5rem 0 2rem 0;
  border-right: 2px solid var(--border);
  z-index: 10;
}

.sidebar-title {
  font-size: 1.3rem;
  font-weight: bold;
  color: var(--accent);
  text-align: center;
  margin-bottom: 2.5rem;
  letter-spacing: 2px;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  padding: 0 1.5rem;
}

.sidebar-nav button {
  background: none;
  border: none;
  font-size: 1.08rem;
  color: var(--title-color);
  padding: 0.7rem 1.2rem;
  border-radius: 1rem;
  text-align: left;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.sidebar-nav button.active, .sidebar-nav button:hover {
  background: var(--sidebar-active);
  color: #fff;
}

.sidebar-theme-switcher {
  margin-top: auto;
  padding: 2rem 1.5rem 1.5rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 1rem;
  background: none;
}

.sidebar-theme-switcher label {
  color: var(--accent);
  font-weight: bold;
  margin-bottom: 0.2rem;
}

.sidebar-theme-switcher select {
  border: 1.5px solid var(--border);
  background: var(--input-bg);
  font-size: 1rem;
  color: var(--accent);
  outline: none;
  font-weight: 600;
  border-radius: 0.7rem;
  padding: 0.3rem 1.2rem 0.3rem 0.7rem;
  margin-top: 0.1rem;
  transition: border-color 0.18s;
}

.sidebar-theme-switcher select:focus {
  border-color: var(--accent);
}

.ai-menu-btn {
  margin-top: 2rem;
  background: linear-gradient(90deg, #00fff7 0%, #ff00cc 100%);
  color: #fff;
  font-weight: bold;
  border: none;
  border-radius: 1rem;
  padding: 0.7rem 1.2rem;
  cursor: pointer;
  transition: background 0.18s, color 0.18s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.ai-menu-btn:hover {
  background: linear-gradient(90deg, #ff00cc 0%, #00fff7 100%);
  color: #fff;
}
</style> 