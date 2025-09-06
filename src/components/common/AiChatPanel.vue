<template>
  <div class="ai-chat-panel">
    <div class="chat-header">
      <h3>AI助手</h3>
    </div>
    
    <div class="chat-messages" ref="messagesContainer">
      <div v-for="(message, index) in messages" :key="index" 
           :class="['message', message.role === 'user' ? 'user-message' : 'ai-message']">
        <div class="message-content">{{ message.content }}</div>
        <div class="message-time">{{ formatTime(message.timestamp) }}</div>
      </div>
      <div v-if="isTyping" class="message ai-message typing">
        <div class="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
    
    <div class="chat-input">
      <textarea 
        v-model="userInput" 
        placeholder="输入消息与AI对话..." 
        @keydown.enter.prevent="sendMessage"
        rows="3"
      ></textarea>
      <button @click="sendMessage" :disabled="!userInput.trim() || isTyping">
        发送
      </button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, nextTick, watch } from 'vue'

export default {
  name: 'AiChatPanel',
  props: {
    currentProject: Object,
    currentChapter: Object
  },
  setup(props) {
    const userInput = ref('')
    const messages = ref([
      { 
        role: 'ai', 
        content: '你好！我是你的AI写作助手。我可以帮你构思情节、完善角色或解答写作问题。请告诉我你需要什么帮助？', 
        timestamp: new Date() 
      }
    ])
    const isTyping = ref(false)
    const messagesContainer = ref(null)
    
    // 监听项目或章节变化
    watch([() => props.currentProject, () => props.currentChapter], () => {
      if (props.currentProject && messages.value.length <= 1) {
        let welcomeMessage = `你好！我正在协助你创作《${props.currentProject.name}》`
        if (props.currentChapter) {
          welcomeMessage += `的${props.currentChapter.title || `第${props.currentChapter.order}章`}`
        }
        welcomeMessage += '。有什么可以帮到你的吗？'
        
        messages.value = [{ 
          role: 'ai', 
          content: welcomeMessage, 
          timestamp: new Date() 
        }]
      }
    }, { immediate: true })
    
    // 发送消息
    const sendMessage = async () => {
      if (!userInput.value.trim() || isTyping.value) return
      
      // 添加用户消息
      const userMessage = {
        role: 'user',
        content: userInput.value,
        timestamp: new Date()
      }
      messages.value.push(userMessage)
      userInput.value = ''
      
      // 滚动到底部
      await nextTick()
      scrollToBottom()
      
      // 模拟AI思考
      isTyping.value = true
      
      // 模拟AI回复（实际项目中这里应该调用AI API）
      setTimeout(() => {
        simulateAiResponse(userMessage.content)
      }, 1000)
    }
    
    // 模拟AI回复
    const simulateAiResponse = (userMessage) => {
      // 这里是模拟回复，实际项目中应该替换为真实的AI API调用
      let response = ''
      
      if (userMessage.includes('情节') || userMessage.includes('剧情')) {
        response = '对于情节发展，你可以考虑增加一些冲突或转折，让故事更加吸引人。比如主角可能面临一个意想不到的挑战，或者发现一个重要的秘密。'
      } else if (userMessage.includes('角色')) {
        response = '塑造丰满的角色需要考虑他们的背景、动机、性格特点和成长弧线。你可以给角色设置一些独特的习惯或缺陷，让他们更加真实。'
      } else if (userMessage.includes('写作') || userMessage.includes('技巧')) {
        response = '写作时可以尝试"展示而不是讲述"的技巧，通过具体的场景、对话和行动来展现情节和角色，而不是直接告诉读者。这样能让读者更加投入故事。'
      } else {
        response = '我理解你的问题。在创作过程中，保持灵感和动力很重要。你可以尝试从不同角度思考故事，或者暂时放下，稍后再回来看可能会有新的想法。'
      }
      
      // 添加AI回复
      messages.value.push({
        role: 'ai',
        content: response,
        timestamp: new Date()
      })
      
      isTyping.value = false
      
      // 滚动到底部
      nextTick(() => {
        scrollToBottom()
      })
    }
    
    // 滚动到底部
    const scrollToBottom = () => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      }
    }
    
    // 格式化时间
    const formatTime = (timestamp) => {
      const date = new Date(timestamp)
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    }
    
    onMounted(() => {
      scrollToBottom()
    })
    
    return {
      userInput,
      messages,
      isTyping,
      messagesContainer,
      sendMessage,
      formatTime
    }
  }
}
</script>

<style scoped>
.ai-chat-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  border-left: 1px solid #e0e0e0;
}

.chat-header {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f9fa;
}

.chat-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message {
  max-width: 80%;
  padding: 10px 14px;
  border-radius: 12px;
  position: relative;
  word-break: break-word;
}

.user-message {
  align-self: flex-end;
  background: #007bff;
  color: white;
  border-bottom-right-radius: 4px;
}

.ai-message {
  align-self: flex-start;
  background: #f1f1f1;
  color: #333;
  border-bottom-left-radius: 4px;
}

.message-time {
  font-size: 11px;
  opacity: 0.7;
  margin-top: 4px;
  text-align: right;
}

.user-message .message-time {
  color: rgba(255, 255, 255, 0.8);
}

.chat-input {
  padding: 12px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chat-input textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: none;
  font-family: inherit;
  font-size: 14px;
}

.chat-input button {
  align-self: flex-end;
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.chat-input button:hover:not(:disabled) {
  background: #0056b3;
}

.chat-input button:disabled {
  background: #cccccc;
  cursor: not-allowed;
}

/* 打字指示器 */
.typing-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #999;
  border-radius: 50%;
  display: inline-block;
  animation: typing 1.4s infinite ease-in-out both;
}

.typing-indicator span:nth-child(1) {
  animation-delay: 0s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 80%, 100% { 
    transform: scale(0.6);
    opacity: 0.6;
  }
  40% { 
    transform: scale(1);
    opacity: 1;
  }
}

/* 滚动条样式 */
.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>