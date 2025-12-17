<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps<{
  title: string
  placeholder: string
  confirmText: string
  initialValue?: string
}>()

const emit = defineEmits<{
  (e: 'submit', value: string): void
  (e: 'close'): void
}>()

const value = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

watch(
  () => props.initialValue,
  (val) => {
    value.value = val ?? ''
  },
  { immediate: true },
)

const submit = () => {
  emit('submit', value.value.trim())
  value.value = ''
}

const close = () => {
  emit('close')
  value.value = ''
}

const onKey = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    e.preventDefault()
    close()
  }
  if (e.key === 'Enter') {
    e.preventDefault()
    submit()
  }
}

onMounted(() => {
  inputRef.value?.focus()
  window.addEventListener('keydown', onKey, true)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey, true)
})
</script>

<template>
  <div class="overlay" @click.self="close">
    <div class="modal">
      <header>
        <h4>{{ title }}</h4>
      </header>
      <div class="body">
        <input
          ref="inputRef"
          v-model="value"
          type="text"
          :placeholder="placeholder"
        />
      </div>
      <footer>
        <button type="button" class="ghost" @click="close">取消</button>
        <button type="button" class="primary" @click="submit">{{ confirmText }}</button>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.modal {
  background: #fff;
  padding: 1rem;
  width: 360px;
  max-width: 92vw;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  box-sizing: border-box;
}

header h4 {
  margin: 0 0 0.5rem;
}

.body input {
  width: 100%;
  padding: 0.45rem 0.55rem;
  border: 1px solid #d0d4dd;
  border-radius: 0;
  box-sizing: border-box;
}

.body input:focus,
.body input:focus-visible {
  outline: none;
  box-shadow: none;
  border-color: #646cff;
}

footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.ghost {
  padding: 0.35rem 0.65rem;
  border: 1px solid #d0d4dd;
  background: #f5f6fa;
  cursor: pointer;
  border-radius: 0;
}

.primary {
  padding: 0.35rem 0.75rem;
  border: 1px solid #646cff;
  background: #646cff;
  color: #fff;
  cursor: pointer;
  border-radius: 0;
}

.ghost:focus,
.ghost:focus-visible,
.primary:focus,
.primary:focus-visible {
  outline: none;
  box-shadow: none;
}
</style>
