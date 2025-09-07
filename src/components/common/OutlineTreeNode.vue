<template>
  <div class="outline-tree-node" :style="{ paddingLeft: `${node.level * 20}px` }">
    <div class="node-content" :class="{ expanded: isExpanded }">
      <div class="node-header" @click="toggleExpanded">
        <div class="node-left">
          <button 
            v-if="node.children && node.children.length > 0" 
            class="expand-btn"
            :class="{ expanded: isExpanded }"
          >
            <i class="icon">▶</i>
          </button>
          <div class="node-info">
            <h4 class="node-title">{{ node.title }}</h4>
            <div class="node-meta">
              <span class="status" :class="node.status">{{ getStatusText(node.status) }}</span>
              <span class="date">{{ formatDate(node.lastModified) }}</span>
            </div>
          </div>
        </div>
        <div class="node-actions" @click.stop>
          <button class="action-btn" @click="$emit('add-child', node)" title="添加子大纲">
            <i class="icon">➕</i>
          </button>
          <button class="action-btn" @click="$emit('edit', node)" title="编辑">
            <i class="icon">✏️</i>
          </button>
          <button class="action-btn delete-btn" @click="$emit('delete', node)" title="删除">
            <i class="icon">🗑️</i>
          </button>
        </div>
      </div>
      
      <div v-if="isExpanded" class="node-body">
        <div class="node-content-preview">
          {{ node.content || '暂无内容' }}
        </div>
        <div v-if="node.notes" class="node-notes">
          <strong>备注：</strong>{{ node.notes }}
        </div>
      </div>
    </div>
    
    <!-- 递归渲染子节点 -->
    <div v-if="isExpanded && node.children && node.children.length > 0" class="child-nodes">
      <OutlineTreeNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        @edit="$emit('edit', $event)"
        @delete="$emit('delete', $event)"
        @add-child="$emit('add-child', $event)"
      />
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  name: 'OutlineTreeNode',
  props: {
    node: {
      type: Object,
      required: true
    }
  },
  emits: ['edit', 'delete', 'add-child'],
  setup(props) {
    const isExpanded = ref(true)
    
    const toggleExpanded = () => {
      if (props.node.children && props.node.children.length > 0) {
        isExpanded.value = !isExpanded.value
      }
    }
    
    const getStatusText = (status) => {
      const statusMap = {
        draft: '草稿',
        completed: '完成',
        reviewing: '审阅中'
      }
      return statusMap[status] || status
    }
    
    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('zh-CN')
    }
    
    return {
      isExpanded,
      toggleExpanded,
      getStatusText,
      formatDate
    }
  }
}
</script>

<style scoped>
.outline-tree-node {
  margin-bottom: 12px;
}

.node-content {
  background: white;
  border: 2px solid transparent;
  border-radius: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.node-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: -1;
}

.node-content:hover {
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.15);
}

.node-content:hover::before {
  opacity: 0.03;
}

.node-content.expanded {
  border-color: #667eea;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.1);
}

.node-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  cursor: pointer;
  user-select: none;
}

.node-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.expand-btn {
  background: rgba(102, 126, 234, 0.1);
  border: none;
  padding: 8px;
  cursor: pointer;
  border-radius: 50%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: #667eea;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.expand-btn:hover {
  background: #667eea;
  color: white;
  transform: scale(1.1);
}

.expand-btn.expanded {
  background: #667eea;
  color: white;
}

.expand-btn.expanded .icon {
  transform: rotate(90deg);
}

.expand-btn .icon {
  font-size: 12px;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.node-info {
  flex: 1;
}

.node-title {
  margin: 0 0 8px 0;
  color: #2d3748;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
}

.node-meta {
  display: flex;
  gap: 16px;
  align-items: center;
}

.status {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status.draft {
  background: linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%);
  color: #d63031;
}

.status.completed {
  background: linear-gradient(135deg, #55efc4 0%, #81ecec 100%);
  color: #00b894;
}

.status.reviewing {
  background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%);
  color: white;
}

.date {
  font-size: 13px;
  color: #718096;
  font-weight: 500;
}

.node-actions {
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: all 0.3s ease;
  transform: translateX(10px);
}

.node-content:hover .node-actions {
  opacity: 1;
  transform: translateX(0);
}

.action-btn {
  background: rgba(102, 126, 234, 0.1);
  border: none;
  padding: 8px;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: #667eea;
  font-size: 14px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background: #667eea;
  color: white;
  transform: scale(1.1);
}

.delete-btn:hover {
  background: linear-gradient(135deg, #ff7675 0%, #e17055 100%);
  color: white;
}

.node-body {
  padding: 0 20px 20px 20px;
  border-top: 1px solid rgba(102, 126, 234, 0.1);
  margin-top: 16px;
  animation: expandContent 0.3s ease;
}

@keyframes expandContent {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 500px;
  }
}

.node-content-preview {
  background: rgba(102, 126, 234, 0.05);
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 12px;
  color: #4a5568;
  line-height: 1.7;
  font-size: 15px;
  white-space: pre-wrap;
  max-height: 150px;
  overflow-y: auto;
  border-left: 4px solid #667eea;
}

.node-notes {
  font-size: 14px;
  color: #718096;
  font-style: italic;
  background: rgba(168, 237, 234, 0.1);
  padding: 12px;
  border-radius: 8px;
  border-left: 3px solid #a8edea;
}

.child-nodes {
  margin-top: 16px;
  position: relative;
  margin-left: 24px;
  padding-left: 24px;
}

.child-nodes::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
  border-radius: 2px;
  opacity: 0.3;
}

.icon {
  display: inline-block;
}

/* 滚动条样式 */
.node-content-preview::-webkit-scrollbar {
  width: 4px;
}

.node-content-preview::-webkit-scrollbar-track {
  background: rgba(102, 126, 234, 0.1);
  border-radius: 2px;
}

.node-content-preview::-webkit-scrollbar-thumb {
  background: #667eea;
  border-radius: 2px;
}
</style>