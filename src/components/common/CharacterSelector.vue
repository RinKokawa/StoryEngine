<template>
  <div 
    v-if="visible" 
    class="character-selector" 
    :style="{ top: position.y + 'px', left: position.x + 'px' }"
  >
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>加载角色中...</p>
    </div>
    <div v-else-if="loadError" class="error-state">
      <p>{{ loadError }}</p>
      <button @click="retryLoad" class="retry-btn">重试</button>
    </div>
    <div v-else-if="characters.length === 0" class="no-characters">
      <p>暂无角色</p>
      <button @click="createCharacter" class="create-btn">创建角色</button>
    </div>
    <ul v-else class="character-list">
      <li 
        v-for="character in characters" 
        :key="character.id"
        @click="selectCharacter(character)"
        class="character-item"
      >
        <span class="character-name">{{ character.name }}</span>
        <span v-if="character.alias" class="character-alias">({{ character.alias }})</span>
      </li>
    </ul>
  </div>
</template>

<script>
import { ref, defineComponent, watch, onMounted } from 'vue'
import storageManager from '../../utils/storage.js'

export default defineComponent({
  name: 'CharacterSelector',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    position: {
      type: Object,
      default: () => ({ x: 0, y: 0 })
    },
    projectId: {
      type: String,
      default: ''
    }
  },
  emits: ['select', 'create', 'close'],
  setup(props, { emit }) {
    // 角色列表
    const characters = ref([])
    const isLoading = ref(false)
    const loadError = ref(null)
    const loadAttempts = ref(0)
    const maxLoadAttempts = 3

    // 从存储中加载角色
    const loadCharacters = async () => {
      if (!props.projectId) {
        console.warn('未提供项目ID，无法加载角色')
        return
      }
      
      isLoading.value = true
      loadError.value = null
      
      try {
        console.log('开始加载项目角色，项目ID:', props.projectId)
        // 使用storageManager加载真实角色数据
        const projectCharacters = await storageManager.getProjectCharacters(props.projectId)
        
        if (projectCharacters && Array.isArray(projectCharacters)) {
          characters.value = projectCharacters
          console.log(`成功加载${projectCharacters.length}个角色`)
        } else {
          console.warn('未找到角色数据或数据格式不正确')
          characters.value = []
        }
        
        // 重置加载尝试次数
        loadAttempts.value = 0
      } catch (error) {
        console.error('加载角色失败:', error)
        loadError.value = '加载角色失败'
        
        // 增加加载尝试次数
        loadAttempts.value++
        
        // 如果尝试次数小于最大尝试次数，自动重试
        if (loadAttempts.value < maxLoadAttempts) {
          console.log(`自动重试加载角色 (${loadAttempts.value}/${maxLoadAttempts})...`)
          setTimeout(() => {
            loadCharacters()
          }, 1000) // 1秒后重试
        }
      } finally {
        isLoading.value = false
      }
    }

    // 手动重试加载
    const retryLoad = () => {
      loadAttempts.value = 0
      loadCharacters()
    }

    // 选择角色
    const selectCharacter = (character) => {
      emit('select', character)
    }

    // 创建角色
    const createCharacter = () => {
      emit('create')
    }

    // 监听props变化
    watch(() => props.projectId, (newId) => {
      if (newId) {
        loadCharacters()
      } else {
        characters.value = []
      }
    })
    
    // 监听可见性变化
    watch(() => props.visible, (isVisible) => {
      if (isVisible && props.projectId) {
        console.log('角色选择器变为可见，加载角色列表')
        loadCharacters()
      }
    })
    
    // 组件挂载时加载角色
    onMounted(() => {
      if (props.visible && props.projectId) {
        console.log('角色选择器挂载，加载角色列表')
        loadCharacters()
      }
    })

    // 导出方法
    return {
      characters,
      isLoading,
      loadError,
      selectCharacter,
      createCharacter,
      loadCharacters,
      retryLoad
    }
  }
})
</script>

<style scoped>
.character-selector {
  position: absolute;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  min-width: 200px;
  max-width: 300px;
  max-height: 300px;
  overflow-y: auto;
  z-index: 1000;
}

.character-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.character-item {
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.character-item:hover {
  background-color: #f5f5f5;
}

.character-name {
  font-weight: 500;
}

.character-alias {
  margin-left: 8px;
  color: #666;
  font-size: 0.9em;
}

.no-characters, .loading-state, .error-state {
  padding: 16px;
  text-align: center;
}

.create-btn, .retry-btn {
  margin-top: 8px;
  padding: 6px 12px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.create-btn:hover, .retry-btn:hover {
  background: #0056b3;
}

/* 加载状态样式 */
.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(0, 123, 255, 0.1);
  border-radius: 50%;
  border-top-color: #007bff;
  animation: spin 1s linear infinite;
  margin: 0 auto 8px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-state p {
  color: #dc3545;
  margin-bottom: 8px;
}
</style>