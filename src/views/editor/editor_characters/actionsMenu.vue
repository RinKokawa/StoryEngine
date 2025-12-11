<script setup lang="ts">
const emit = defineEmits<{
  (e: 'edit'): void
  (e: 'view'): void
  (e: 'close'): void
}>()

const onEdit = () => emit('edit')
const onView = () => emit('view')
</script>

<template>
  <div class="menu" @click.stop>
    <button type="button" class="view" @click="onView">查看详细</button>
    <button type="button" @click="onEdit">编辑</button>
  </div>
</template>

<style scoped>
.menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background: #fff;
  border: 1px solid #e2e4ea;
  border-radius: 6px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  padding: 4px;
  z-index: 10;
  min-width: 120px;
}

button {
  width: 100%;
  border: none;
  background: transparent;
  padding: 8px 10px;
  text-align: left;
  cursor: pointer;
  border-radius: 4px;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
}

button:hover {
  background: #f0f2f5;
}

button.view:hover {
  background: #e8f0ff;
  color: #1f5fbf;
  cursor: pointer;
}

button:focus {
  outline: none;
}
</style>
