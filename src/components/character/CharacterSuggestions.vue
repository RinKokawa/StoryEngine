<template>
  <div v-if="show" class="character-suggestions" :style="position">
    <div 
      v-for="(character, index) in characters" 
      :key="character.id"
      class="character-suggestion-item"
      :class="{ active: selectedIndex === index }"
      @click="$emit('select', character)"
      @mouseenter="$emit('updateSelection', index)"
    >
      <div class="character-avatar">
        <img 
          :src="character.avatar || '/avatar_default.png'" 
          :alt="character.name"
          @error="handleImageError"
        />
      </div>
      <div class="character-info">
        <div class="character-name">{{ character.name }}</div>
        <div class="character-role">{{ character.role }}</div>
      </div>
    </div>
    <div v-if="characters.length === 0" class="no-characters">
      没有找到角色，请先在角色管理页面添加角色
    </div>
  </div>
</template>

<script setup lang="ts">
import { Character } from '../../domain/entities/Character'

interface Props {
  show: boolean
  characters: Character[]
  selectedIndex: number
  position: { top: string; left: string }
}

interface Emits {
  (e: 'select', character: Character): void
  (e: 'updateSelection', index: number): void
}

defineProps<Props>()
defineEmits<Emits>()

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = '/avatar_default.png'
}
</script>

<style scoped>
.character-suggestions {
  position: fixed;
  background: var(--modal-bg);
  border-radius: 1rem;
  box-shadow: var(--modal-shadow);
  border: 2px solid var(--border);
  max-height: 300px;
  overflow-y: auto;
  z-index: 1000;
  min-width: 250px;
  backdrop-filter: blur(12px);
}

.character-suggestion-item {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.8rem 1rem;
  cursor: pointer;
  transition: background 0.2s ease;
  border-bottom: 1px solid var(--border);
}

.character-suggestion-item:last-child {
  border-bottom: none;
}

.character-suggestion-item:hover,
.character-suggestion-item.active {
  background: var(--accent);
  color: #fff;
}

.character-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid var(--border);
  flex-shrink: 0;
}

.character-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.character-info {
  flex: 1;
  min-width: 0;
}

.character-name {
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 0.2rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.character-role {
  font-size: 0.8rem;
  opacity: 0.8;
}

.no-characters {
  padding: 1rem;
  text-align: center;
  color: var(--subtitle-color);
  font-size: 0.9rem;
}
</style>