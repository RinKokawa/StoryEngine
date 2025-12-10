<script setup lang="ts">
type NavKey = 'home' | 'projects' | 'feed' | 'settings'

const props = defineProps<{
  active: NavKey
}>()

const emit = defineEmits<{
  (e: 'select', key: NavKey): void
}>()

const menu: Array<{ key: NavKey; label: string }> = [
  { key: 'home', label: '首页' },
  { key: 'projects', label: '项目' },
  { key: 'feed', label: '动态' },
  { key: 'settings', label: '设置' },
]
</script>

<template>
  <aside class="sidebar">
    <h2 class="brand">Novel Editor</h2>
    <nav>
      <ul>
        <li v-for="item in menu" :key="item.key">
          <a
            href="#"
            :class="{ active: item.key === props.active }"
            @click.prevent="emit('select', item.key)"
          >
            {{ item.label }}
          </a>
        </li>
      </ul>
    </nav>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 220px;
  padding: 0.5rem 1rem;
  position: fixed;
  left: 0;
  top: 32px;
  bottom: 0;
  border-right: 1px solid #e2e4ea;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  padding-top: 0.5rem;
  background: #fff;
  text-align: left;
}

.sidebar h2 {
  margin: 0 0 1rem;
  font-size: 1.1rem;
}

.sidebar .brand {
  text-align: center;
}

.sidebar nav {
  flex: 1;
  display: flex;
}

.sidebar ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex: 1;
}

.sidebar li:last-child {
  margin-top: auto;
}

.sidebar a {
  color: #2c2f36;
  text-decoration: none;
  display: block;
  padding: 0.6rem 0.75rem;
  border: 1px solid transparent;
  border-radius: 10px;
  transition: border-color 0.2s ease, background-color 0.2s ease;
}

.sidebar a:hover {
  border-color: #646cff;
  background-color: #f3f4ff;
}

.sidebar a.active {
  border-color: #646cff;
  background-color: #eef0ff;
}
</style>
