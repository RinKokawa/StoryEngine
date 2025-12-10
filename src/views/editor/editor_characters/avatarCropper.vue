<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  image: string
}>()

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'save', dataUrl: string): void
}>()

const cropZoom = ref(1.1)
const cropOffsetX = ref(0)
const cropOffsetY = ref(0)
const naturalWidth = ref(0)
const naturalHeight = ref(0)
const ready = ref(false)

const minZoom = ref(0.1)
const maxZoom = ref(5)
const offsetLimit = ref(200)

const loadImage = () => {
  ready.value = false
  const img = new Image()
  img.onload = () => {
    naturalWidth.value = img.naturalWidth
    naturalHeight.value = img.naturalHeight
    const fit = 256 / Math.max(naturalWidth.value, naturalHeight.value)
    const initialZoom = Math.min(Math.max(fit, minZoom.value), maxZoom.value)
    cropZoom.value = initialZoom
    cropOffsetX.value = 0
    cropOffsetY.value = 0
    offsetLimit.value = Math.max(200, Math.ceil(Math.max(naturalWidth.value, naturalHeight.value) / 2))
    ready.value = true
  }
  img.src = props.image
}

onMounted(loadImage)
watch(
  () => props.image,
  () => loadImage(),
)

const previewStyle = computed(() => ({
  transform: `translate(-50%, -50%) translate(${cropOffsetX.value}px, ${cropOffsetY.value}px) scale(${cropZoom.value})`,
}))

const applyCrop = () => {
  if (!ready.value || !props.image || !naturalWidth.value || !naturalHeight.value) return
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const zoom = cropZoom.value
  const drawW = naturalWidth.value * zoom
  const drawH = naturalHeight.value * zoom
  const dx = size / 2 - drawW / 2 + cropOffsetX.value
  const dy = size / 2 - drawH / 2 + cropOffsetY.value

  const img = new Image()
  img.onload = () => {
    ctx.clearRect(0, 0, size, size)
    ctx.drawImage(img, dx, dy, drawW, drawH)
    const dataUrl = canvas.toDataURL('image/png')
    emit('save', dataUrl)
  }
  img.src = props.image
}
</script>

<template>
  <div class="cropper-overlay">
    <div class="cropper">
      <h4>裁剪头像</h4>
      <div class="preview-box">
        <div class="preview-window">
          <img v-if="image" :src="image" alt="crop" :style="previewStyle" />
        </div>
      </div>
      <div class="controls">
        <label>
          缩放
          <input
            type="range"
            :min="minZoom"
            :max="maxZoom"
            step="0.01"
            v-model.number="cropZoom"
          />
        </label>
        <label>
          横向
          <input
            type="range"
            :min="-offsetLimit"
            :max="offsetLimit"
            step="1"
            v-model.number="cropOffsetX"
          />
        </label>
        <label>
          纵向
          <input
            type="range"
            :min="-offsetLimit"
            :max="offsetLimit"
            step="1"
            v-model.number="cropOffsetY"
          />
        </label>
      </div>
      <div class="crop-actions">
        <button type="button" class="ghost" @click="emit('cancel')">取消</button>
        <button type="button" class="primary" @click="applyCrop">保存裁剪</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cropper-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 60;
}

.cropper {
  background: #fff;
  padding: 1rem;
  border-radius: 6px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  width: 360px;
  box-sizing: border-box;
}

.preview-box {
  display: flex;
  justify-content: center;
  margin: 0.75rem 0;
}

.preview-window {
  width: 256px;
  height: 256px;
  border: 1px dashed #d0d4dd;
  overflow: hidden;
  position: relative;
  background: #f8f9fb;
}

.preview-window img {
  position: absolute;
  top: 50%;
  left: 50%;
  transform-origin: center center;
  user-select: none;
  pointer-events: none;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.95rem;
}

.controls label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.controls input[type='range'] {
  flex: 1;
}

.crop-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.crop-actions button {
  padding: 0.45rem 0.9rem;
  border: 1px solid #d0d4dd;
  background: #f5f6fa;
  cursor: pointer;
}

.crop-actions .primary {
  background: #646cff;
  border-color: #646cff;
  color: #fff;
}

.crop-actions button:focus,
.crop-actions button:focus-visible {
  outline: none;
  box-shadow: none;
}
</style>
