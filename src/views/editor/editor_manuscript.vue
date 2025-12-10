<script setup lang="ts">
defineProps<{
  projectPath: string
}>()
</script>

<template>
  <section class="manuscript">
    <header class="head">
      <h3>正文</h3>
    </header>
    <div class="body">
      <p class="placeholder">这里将是正文编辑区域，后续可以在此编写与预览内容。</p>
    </div>
  </section>
</template>

<style scoped>
.manuscript {
  color: #2c2f36;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.head h3 {
  margin: 0 0 0.15rem;
}

.body {
  border: 1px dashed #d0d4dd;
  padding: 1rem;
  min-height: 240px;
  background: #fff;
}

.placeholder {
  margin: 0;
  color: #6c7180;
}
</style>
