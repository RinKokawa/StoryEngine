<template>
  <div 
    class="resizable-sidebar" 
    :class="{ 'right-sidebar': position === 'right' }"
    :style="{ width: `${width}px` }"
  >
    <div class="sidebar-content">
      <slot></slot>
    </div>
    <div 
      class="resize-handle"
      @mousedown="startResize"
      @dblclick="resetWidth"
      :title="title || '拖动调整宽度'"
    ></div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue';

export default {
  name: 'ResizableSidebar',
  props: {
    position: {
      type: String,
      default: 'left',
      validator: (value) => ['left', 'right'].includes(value)
    },
    defaultWidth: {
      type: Number,
      default: 300
    },
    minWidth: {
      type: Number,
      default: 200
    },
    maxWidth: {
      type: Number,
      default: 500
    },
    storageKey: {
      type: String,
      default: null
    },
    title: {
      type: String,
      default: null
    }
  },
  emits: ['resize'],
  setup(props, { emit }) {
    const width = ref(props.defaultWidth);
    const storageKey = props.storageKey || `sidebar-width-${props.position}`;
    
    // 从本地存储加载宽度
    onMounted(() => {
      try {
        const savedWidth = localStorage.getItem(storageKey);
        if (savedWidth) {
          const parsedWidth = parseInt(savedWidth);
          if (!isNaN(parsedWidth)) {
            width.value = Math.max(props.minWidth, Math.min(props.maxWidth, parsedWidth));
          }
        }
      } catch (e) {
        console.warn('无法从本地存储加载侧边栏宽度', e);
      }
    });
    
    // 保存宽度到本地存储
    const saveWidth = (newWidth) => {
      try {
        localStorage.setItem(storageKey, newWidth.toString());
      } catch (e) {
        console.warn('无法保存侧边栏宽度到本地存储', e);
      }
    };
    
    // 重置为默认宽度
    const resetWidth = () => {
      width.value = props.defaultWidth;
      emit('resize', width.value);
      saveWidth(width.value);
    };
    
    // 开始调整大小
    let startX = 0;
    let startWidth = 0;
    let isResizing = false;
    
    const startResize = (e) => {
      e.preventDefault();
      isResizing = true;
      startX = e.clientX;
      startWidth = width.value;
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', stopResize);
      document.body.style.cursor = props.position === 'left' ? 'e-resize' : 'w-resize';
      document.body.style.userSelect = 'none';
    };
    
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      
      let delta;
      if (props.position === 'left') {
        // 左侧面板：向右拖动增加宽度
        delta = e.clientX - startX;
      } else {
        // 右侧面板：向左拖动增加宽度
        delta = startX - e.clientX;
      }
      
      let newWidth = startWidth + delta;
      newWidth = Math.max(props.minWidth, Math.min(props.maxWidth, newWidth));
      
      width.value = newWidth;
      emit('resize', newWidth);
    };
    
    const stopResize = () => {
      if (!isResizing) return;
      
      isResizing = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', stopResize);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      
      saveWidth(width.value);
    };
    
    // 清理事件监听器
    onUnmounted(() => {
      if (isResizing) {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', stopResize);
      }
    });
    
    return {
      width,
      startResize,
      resetWidth
    };
  }
};
</script>

<style scoped>
.resizable-sidebar {
  position: relative;
  height: 100%;
  overflow: hidden;
  flex-shrink: 0;
  background: #f8f9fa;
}

.sidebar-content {
  height: 100%;
  width: 100%;
  overflow: auto;
}

.resize-handle {
  position: absolute;
  top: 0;
  width: 6px;
  height: 100%;
  background-color: transparent;
  cursor: col-resize;
  z-index: 10;
  transition: background-color 0.2s;
}

/* 左侧面板的调整手柄在右侧 */
.resizable-sidebar:not(.right-sidebar) .resize-handle {
  right: 0;
}

/* 右侧面板的调整手柄在左侧 */
.resizable-sidebar.right-sidebar .resize-handle {
  left: 0;
}

.resize-handle:hover {
  background-color: rgba(0, 123, 255, 0.2);
}

.resize-handle:active {
  background-color: rgba(0, 123, 255, 0.4);
}
</style>