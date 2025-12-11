<script setup lang="ts">
defineProps<{
  projectPath: string
}>()
</script>

<template>
  <section class="worldview">
    <header class="head">
      <h3>世界观</h3>
      <p class="hint">这里将用于维护世界观设定，后续可添加板块与条目。</p>
    </header>
    <div class="body">
      <p class="placeholder">暂未实现，未来可在此添加世界观条目、设定分类等内容。</p>
    </div>
  </section>
</template>

<style scoped>
.worldview {
  color: #2c2f36;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.head h3 {
  margin: 0 0 0.1rem;
}

.hint {
  margin: 0;
  color: #6c7180;
  font-size: 0.95rem;
}

.body {
  border: 1px dashed #d0d4dd;
  padding: 1rem;
  background: #fff;
  min-height: 240px;
}

.placeholder {
  margin: 0;
  color: #6c7180;
}
</style>
