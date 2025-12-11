<script setup lang="ts">
import Titlebar from '../../components/titlebar.vue'

const props = defineProps<{
  projectName: string
  character: {
    id?: string
    name?: string
    gender?: string
    birthday?: string
    age?: string | number
    height?: string
    weight?: string
    blood?: string
    avatar?: string | null
    synopsis?: string
  }
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const close = () => emit('close')
</script>

<template>
  <div class="viewer">
    <Titlebar
      :name="`${projectName} | 角色详情`"
      :status-text="character.name || '角色'"
      :status-color="'#4a5a7d'"
      @close="close"
      @minimize="() => {}"
      @maximize="() => {}"
    />
    <div class="content">
      <div class="avatar">
        <img v-if="character.avatar" :src="character.avatar" :alt="character.name" />
        <div v-else class="placeholder">无头像</div>
      </div>
      <div class="info">
        <h3>{{ character.name || '未命名角色' }}</h3>
        <p v-if="character.gender">性别：{{ character.gender }}</p>
        <p v-if="character.birthday">出生日期：{{ character.birthday }}</p>
        <p v-if="character.age">年龄：{{ character.age }}</p>
        <p v-if="character.height">身高：{{ character.height }}</p>
        <p v-if="character.weight">体重：{{ character.weight }}</p>
        <p v-if="character.blood">血型：{{ character.blood }}</p>
        <p v-if="character.synopsis">简介：{{ character.synopsis }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.viewer {
  position: fixed;
  inset: 0;
  background: #f5f6fa;
  z-index: 50;
  display: flex;
  flex-direction: column;
}

.content {
  flex: 1;
  display: flex;
  gap: 1rem;
  padding: 1rem 1.5rem;
  color: #2c2f36;
}

.avatar {
  width: 140px;
  height: 140px;
  border: 1px solid #d0d4dd;
  border-radius: 6px;
  overflow: hidden;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder {
  color: #6c7180;
}

.info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.info h3 {
  margin: 0 0 0.35rem;
}
</style>
