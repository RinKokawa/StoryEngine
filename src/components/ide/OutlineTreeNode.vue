<template>
  <div class="outline-tree-node" :style="{ paddingLeft: (node.level * 20) + 'px' }">
    <div 
      class="node-content"
      :class="{ 
        active: selectedNode?.id === node.id,
        current: isCurrentChapterNode(node)
      }"
      @click="selectNode"
    >
      <div class="node-toggle" @click.stop="toggleNode" v-if="node.children.length > 0">
        <span class="toggle-icon">{{ node.expanded ? '▼' : '▶' }}</span>
      </div>
      <div class="node-spacer" v-else></div>
      
      <div class="node-info">
        <div class="node-title">{{ node.title }}</div>
        <div class="node-meta">
          <span class="node-order">{{ node.order }}</span>
          <span class="node-status" :class="node.status">{{ getStatusText(node.status) }}</span>
        </div>
      </div>
      
      <div class="node-actions">
        <button @click.stop="showNodeDetail" class="action-btn" title="查看详情">
          <span class="icon">👁</span>
        </button>
        <button @click.stop="jumpToNode" class="action-btn" title="跳转到相关内容">
          <span class="icon">🔗</span>
        </button>
      </div>
    </div>
    
    <!-- 子节点 -->
    <div v-if="node.expanded && node.children.length > 0" class="child-nodes">
      <OutlineTreeNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :current-chapter="currentChapter"
        :selected-node="selectedNode"
        @node-selected="$emit('node-selected', $event)"
        @node-toggle="$emit('node-toggle', $event)"
      />
    </div>
  </div>
</template>

<script>
export default {
  name: 'OutlineTreeNode',
  props: {
    node: {
      type: Object,
      required: true
    },
    currentChapter: {
      type: Object,
      default: null
    },
    selectedNode: {
      type: Object,
      default: null
    }
  },
  emits: ['node-selected', 'node-toggle'],
  setup(props, { emit }) {
    // 选择节点
    const selectNode = () => {
      emit('node-selected', props.node)
    }

    // 切换节点展开状态
    const toggleNode = () => {
      emit('node-toggle', props.node)
    }

    // 显示节点详情
    const showNodeDetail = () => {
      // 可以显示大纲详情弹窗
      console.log('显示节点详情:', props.node.title)
    }

    // 跳转到节点相关内容
    const jumpToNode = () => {
      // 可以跳转到相关章节或内容位置
      console.log('跳转到节点:', props.node.title)
      emit('node-selected', { ...props.node, action: 'jump' })
    }

    // 判断是否为当前章节相关节点
    const isCurrentChapterNode = (node) => {
      if (!props.currentChapter) return false
      // 这里可以根据实际需求实现判断逻辑
      // 比如根据节点标题、内容或者关联关系
      return false
    }

    // 获取状态文本
    const getStatusText = (status) => {
      const statusMap = {
        draft: '草稿',
        completed: '完成',
        reviewing: '审阅中'
      }
      return statusMap[status] || status
    }

    return {
      selectNode,
      toggleNode,
      showNodeDetail,
      jumpToNode,
      isCurrentChapterNode,
      getStatusText
    }
  }
}
</script>

<style scoped>
.outline-tree-node {
  user-select: none;
}

.node-content {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  margin-bottom: 2px;
  background: white;
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.node-content:hover {
  background: #f6f8fa;
  border-color: #d1d5da;
}

.node-content.active {
  background: #f1f8ff;
  border-color: #0366d6;
}

.node-content.current {
  background: #fff8f0;
  border-color: #f66a0a;
}

.node-toggle {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 3px;
  transition: background 0.2s;
}

.node-toggle:hover {
  background: #e1e4e8;
}

.toggle-icon {
  font-size: 10px;
  color: #586069;
}

.node-spacer {
  width: 16px;
  height: 16px;
}

.node-info {
  flex: 1;
  min-width: 0;
}

.node-title {
  font-size: 14px;
  font-weight: 500;
  color: #24292e;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
}

.node-order {
  color: #8b949e;
}

.node-status {
  padding: 1px 4px;
  border-radius: 8px;
  font-weight: 500;
}

.node-status.draft {
  background: #f1f8ff;
  color: #0366d6;
}

.node-status.completed {
  background: #dcfce7;
  color: #16a34a;
}

.node-status.reviewing {
  background: #fef3c7;
  color: #d97706;
}

.node-actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.2s;
}

.node-content:hover .node-actions {
  opacity: 1;
}

.action-btn {
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  border-radius: 3px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #586069;
  transition: all 0.2s;
  font-size: 10px;
}

.action-btn:hover {
  background: #e1e4e8;
  color: #24292e;
}

.child-nodes {
  margin-left: 8px;
  border-left: 1px solid #e1e4e8;
  padding-left: 8px;
}
</style>