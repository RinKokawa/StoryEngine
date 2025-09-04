<template>
  <div 
    v-if="visible" 
    class="character-selector" 
    :style="{ top: position.y + 'px', left: position.x + 'px' }"
  >
    <div v-if="characters.length === 0" class="no-characters">
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

    // 从存储中加载角色
    const loadCharacters = () => {
      if (!props.projectId) return
      
      try {
        // 这里应该从存储管理器中获取角色列表
        // 假设storageManager有一个getCharacters方法
        // characters.value = storageManager.getCharacters(props.projectId)
        
        // 临时模拟数据，实际应该从存储中获取
        characters.value = [
          { id: '1', name: '张三', alias: '小张' },
          { id: '2', name: '李四', alias: '阿四' },
          { id: '3', name: '王五', alias: '' }
        ]
      } catch (error) {
        console.error('加载角色失败:', error)
        characters.value = []
      }
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
      selectCharacter,
      createCharacter,
      loadCharacters
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

.no-characters {
  padding: 16px;
  text-align: center;
}

.create-btn {
  margin-top: 8px;
  padding: 6px 12px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.create-btn:hover {
  background: #0056b3;
}
</style>