<script setup lang="ts">
import { ref } from 'vue'

type NavItem = { key: string; label: string; icon: string }

const navItems: NavItem[] = [
  { key: 'dashboard', label: '仪表盘', icon: '📊' },
  { key: 'manuscript', label: '正文', icon: '📖' },
  { key: 'outline', label: '大纲', icon: '📋' },
  { key: 'characters', label: '角色', icon: '👥' },
  { key: 'world', label: '设定', icon: '🌍' },
  { key: 'notes', label: '笔记', icon: '📝' },
]

const props = defineProps<{
  active: string
  initialCollapsed?: boolean
}>()

const emit = defineEmits<{
  (e: 'select', key: string): void
  (e: 'toggle', collapsed: boolean): void
  (e: 'open-external', url: string): void
}>()

const collapsed = ref(!!props.initialCollapsed)

const toggle = () => {
  collapsed.value = !collapsed.value
  emit('toggle', collapsed.value)
}
</script>

<template>
  <aside class="sidebar" :class="{ collapsed }">
    <div class="sidebar-header">
      <h3 v-show="!collapsed">编辑器</h3>
      <button type="button" class="collapse-btn" @click="toggle">
        <span v-if="!collapsed">‹</span>
        <span v-else>›</span>
      </button>
    </div>
    <nav class="sidebar-nav">
      <ul>
        <li v-for="item in navItems" :key="item.key" class="nav-item">
          <button
            type="button"
            class="nav-link"
            :class="{ active: props.active === item.key }"
            :data-label="item.label"
            @click="emit('select', item.key)"
          >
            <span class="icon">{{ item.icon }}</span>
            <span class="label" v-show="!collapsed">{{ item.label }}</span>
          </button>
        </li>
      </ul>
    </nav>
    <footer class="sidebar-footer">
      <a
        class="github-link"
        href="https://github.com/RinKokawa/StoryEngine"
        @click.prevent="emit('open-external', 'https://github.com/RinKokawa/StoryEngine')"
      >
        <img src="/github.svg" alt="GitHub" class="github-icon" />
        <span v-show="!collapsed">GitHub</span>
      </a>
    </footer>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 220px;
  background: #2c3e50;
  color: #bdc3c7;
  position: fixed;
  top: 32px;
  bottom: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #34495e;
  transition: width 0.2s ease;
}

.sidebar.collapsed {
  width: 64px;
}

.sidebar-header {
  padding: 12px 12px 8px;
  border-bottom: 1px solid #34495e;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.collapsed .sidebar-header {
  padding: 8px 0;
  justify-content: center;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 15px;
}

.collapse-btn {
  background: none;
  border: none;
  color: #bdc3c7;
  font-size: 16px;
  cursor: pointer;
  width: 28px;
  height: 28px;
  padding: 0;
  border-radius: 4px;
  outline: none;
}

.collapsed .collapse-btn {
  width: 100%;
  height: 40px;
  border-radius: 0;
}

.collapse-btn:hover {
  background: #34495e;
  color: #fff;
}

.collapse-btn:focus-visible {
  outline: none;
  box-shadow: none;
}

.sidebar-nav {
  flex: 1;
  padding: 8px 0;
}

ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-item {
  margin-bottom: 4px;
}

.nav-link {
  width: 100%;
  border: none;
  background: transparent;
  color: #bdc3c7;
  display: flex;
  align-items: center;
  padding: 10px 16px;
  text-align: left;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
  border-radius: 0;
  outline: none;
  position: relative;
}

.collapsed .nav-link {
  justify-content: center;
  padding: 10px 12px;
}

.collapsed .nav-link::after {
  content: attr(data-label);
  position: absolute;
  left: 100%;
  top: 50%;
  transform: translate(8px, -50%);
  white-space: nowrap;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
}

.collapsed .nav-link:hover::after {
  opacity: 1;
  transform: translate(12px, -50%);
}

.nav-link.active {
  background: #3498db;
  color: #fff;
  border-radius: 0;
}

.nav-link:hover:not(.active) {
  background: #34495e;
  color: #ecf0f1;
  border-radius: 0;
}

.nav-link:focus-visible {
  outline: none;
  box-shadow: none;
}

.icon {
  width: 20px;
  text-align: center;
  margin-right: 10px;
  font-size: 15px;
}

.collapsed .icon {
  margin-right: 0;
}

.label {
  font-size: 14px;
}

.sidebar-footer {
  margin-top: auto;
  border-top: 1px solid #34495e;
}

.github-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  color: #95a5a6;
  text-decoration: none;
  transition: background 0.2s ease, color 0.2s ease;
}

.collapsed .github-link {
  justify-content: center;
  padding: 10px 12px;
}

.github-link:hover {
  background: #34495e;
  color: #ecf0f1;
}

.github-icon {
  width: 20px;
  height: 20px;
  filter: brightness(0.7);
}

.github-link:hover .github-icon {
  filter: brightness(1);
}
</style>
