<script setup lang="ts">
const props = defineProps<{
  characters: Array<{ id: string; name: string; gender?: string; avatar?: string | null }>
  activeIndex: number
}>()

const emit = defineEmits<{
  (e: 'select', idx: number): void
  (e: 'hover', idx: number): void
}>()
</script>

<template>
  <div class="picker">
    <p class="title">选择角色</p>
    <ul>
      <li
        v-for="(item, idx) in props.characters"
        :key="item.id"
        :class="{ active: idx === props.activeIndex }"
        @mouseenter="emit('hover', idx)"
        @mousedown.prevent="emit('select', idx)"
      >
        <span class="name">{{ item.name }}</span>
        <span class="sub" v-if="item.gender">{{ item.gender }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.picker {
  background: #fff;
  border: 1px solid #d0d4dd;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  overflow: hidden;
}

.title {
  margin: 0;
  padding: 6px 10px;
  background: #f5f6fa;
  color: #4a5a7d;
  font-size: 12px;
  border-bottom: 1px solid #e5e7ec;
}

ul {
  list-style: none;
  margin: 0;
  padding: 4px;
  max-height: 160px;
  overflow-y: auto;
}

li {
  padding: 6px 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  border-radius: 4px;
}

li:hover,
li.active {
  background: #e8ecf9;
}

.name {
  font-weight: 600;
  color: #2c2f36;
}

.sub {
  color: #6c7180;
  font-size: 12px;
}
</style>
