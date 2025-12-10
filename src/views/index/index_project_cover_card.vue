<script setup lang="ts">
const props = defineProps<{
  name: string
  path: string
  cover?: string | null
}>()
</script>

<template>
<article class="card">
  <div class="cover" :class="{ fallback: !props.cover }">
    <img v-if="props.cover" :src="props.cover" :alt="props.name" />
    <span v-else>{{ props.name.charAt(0) || '📖' }}</span>
  </div>
  <div class="meta">
    <h4>{{ props.name }}</h4>
  </div>
</article>
</template>

<style scoped>
.card {
  border: 1px solid #e2e4ea;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  box-sizing: border-box;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.cover {
  width: 100%;
  aspect-ratio: 4 / 3;
  background: linear-gradient(135deg, #f0f2ff, #e5e9ff);
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover.fallback span {
  font-size: 2rem;
  color: #646cff;
}

.cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.meta {
  padding: 0.75rem 0.9rem 0.9rem;
  min-width: 0;
}

h4 {
  margin: 0 0 0.35rem;
}
</style>
