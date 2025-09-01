<template>
  <div
    v-if="visible"
    ref="menuRef"
    class="context-menu"
    :style="menuStyle"
    @click.stop
  >
    <div class="menu-item" @click="handleCopy">
      <span class="menu-icon">📋</span>
      复制
      <span class="menu-shortcut">Ctrl+C</span>
    </div>
    <div class="menu-item" @click="handleCut">
      <span class="menu-icon">✂️</span>
      剪切
      <span class="menu-shortcut">Ctrl+X</span>
    </div>
    <div class="menu-item" @click="handlePaste">
      <span class="menu-icon">📄</span>
      粘贴
      <span class="menu-shortcut">Ctrl+V</span>
    </div>
    <div class="menu-divider"></div>
    <div class="menu-item" @click="handleSelectAll">
      <span class="menu-icon">🔘</span>
      全选
      <span class="menu-shortcut">Ctrl+A</span>
    </div>
    <div class="menu-divider"></div>
    <div class="menu-item" @click="handleFindReplace">
      <span class="menu-icon">🔍</span>
      查找替换
      <span class="menu-shortcut">Ctrl+F</span>
    </div>
    <div class="menu-item" @click="handleInsertDateTime">
      <span class="menu-icon">📅</span>
      插入日期时间
    </div>
    <div class="menu-divider"></div>
    <div class="menu-item" @click="handleWordCount">
      <span class="menu-icon">📊</span>
      字数统计
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  position: {
    type: Object,
    default: () => ({ x: 0, y: 0 })
  }
})

const emit = defineEmits([
  'close', 
  'copy', 
  'cut', 
  'paste', 
  'select-all', 
  'find-replace', 
  'insert-datetime', 
  'word-count'
])

const menuRef = ref(null)
const adjustedPosition = ref({ x: 0, y: 0 })

// 计算菜单样式，包括位置调整
const menuStyle = computed(() => ({
  left: adjustedPosition.value.x + 'px',
  top: adjustedPosition.value.y + 'px'
}))

// 调整菜单位置
const adjustMenuPosition = async () => {
  if (!props.visible || !menuRef.value) return
  
  await nextTick()
  
  const menu = menuRef.value
  const menuRect = menu.getBoundingClientRect()
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  
  let { x, y } = props.position
  
  // 检查右边界，如果超出则向左调整
  if (x + menuRect.width > viewportWidth) {
    x = viewportWidth - menuRect.width - 10
  }
  
  // 检查下边界，如果超出则向上调整
  if (y + menuRect.height > viewportHeight) {
    y = y - menuRect.height
    // 如果向上调整后仍然超出上边界，则贴着上边界显示
    if (y < 0) {
      y = 10
    }
  }
  
  // 确保不超出左边界和上边界
  x = Math.max(10, x)
  y = Math.max(10, y)
  
  adjustedPosition.value = { x, y }
}

// 监听visible和position变化，重新调整位置
watch([() => props.visible, () => props.position], () => {
  if (props.visible) {
    adjustedPosition.value = { ...props.position }
    adjustMenuPosition()
  }
}, { immediate: true })

const handleCopy = () => {
  emit('copy')
  emit('close')
}

const handleCut = () => {
  emit('cut')
  emit('close')
}

const handlePaste = () => {
  emit('paste')
  emit('close')
}

const handleSelectAll = () => {
  emit('select-all')
  emit('close')
}

const handleFindReplace = () => {
  emit('find-replace')
  emit('close')
}

const handleInsertDateTime = () => {
  emit('insert-datetime')
  emit('close')
}

const handleWordCount = () => {
  emit('word-count')
  emit('close')
}

const handleClickOutside = (event) => {
  if (props.visible) {
    emit('close')
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.context-menu {
  position: fixed;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 4px 0;
  min-width: 180px;
  z-index: 1000;
  font-size: 14px;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  user-select: none;
}

.menu-item:hover {
  background: #f5f5f5;
}

.menu-icon {
  margin-right: 8px;
  font-size: 16px;
  width: 20px;
  text-align: center;
}

.menu-shortcut {
  margin-left: auto;
  color: #999;
  font-size: 12px;
}

.menu-divider {
  height: 1px;
  background: #e0e0e0;
  margin: 4px 0;
}
</style>