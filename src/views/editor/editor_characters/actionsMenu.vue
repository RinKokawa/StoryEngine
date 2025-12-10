<script setup lang="ts">
const emit = defineEmits<{
  (e: 'edit'): void
  (e: 'close'): void
}>()

const onEdit = () => emit('edit')
</script>

<template>
  <div class="menu" @click.stop>
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
}

button:hover {
  background: #f0f2f5;
}

button:focus {
  outline: none;
}
</style>
