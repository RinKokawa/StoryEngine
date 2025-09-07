<template>
  <div class="ai-chat-panel">
    <div class="chat-header">
      <h3>AI助手 (Qwen)</h3>
      <div class="header-actions">
        <button @click="showApiKeyDialog" class="api-key-btn" :class="{ 'configured': hasApiKey }">
          <span v-if="hasApiKey">✓</span>
          <span v-else>⚙</span>
        </button>
        <button @click="clearChat" class="clear-btn" title="清空对话">
          🗑
        </button>
      </div>
    </div>
    
    <div v-if="!hasApiKey" class="api-key-notice">
      <p>请先设置Qwen API密钥以使用AI助手功能</p>
      <button @click="showApiKeyDialog" class="setup-btn">设置API密钥</button>
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
      <div v-if="error" class="error-message">
        <div class="error-content">
          <strong>错误：</strong>{{ error }}
        </div>
        <button @click="retryLastMessage" class="retry-btn">重试</button>
      </div>
    </div>
    
    <div class="chat-input">
      <div class="chat-textarea-wrapper">
        <TextEditor
          v-model="userInput"
          placeholder="输入消息与AI对话..."
          :wordWrap="true"
          :autofocus="false"
          :readOnly="!hasApiKey || isTyping"
        />
      </div>
      <button @click="sendMessage" :disabled="!userInput.trim() || isTyping || !hasApiKey">
        发送
      </button>
    </div>
    
    <!-- API密钥设置对话框 -->
    <ApiKeyDialog 
      :visible="apiKeyDialogVisible" 
      @close="apiKeyDialogVisible = false"
      @save="handleApiKeySaved"
    />
  </div>
</template>

<script>
import { ref, onMounted, nextTick, watch } from 'vue'
import TextEditor from './TextEditor.vue'
import qwenApiService from '../../utils/qwenApi.js'
import ApiKeyDialog from './ApiKeyDialog.vue'

export default {
  name: 'AiChatPanel',
  components: {
    ApiKeyDialog
  },
  props: {
    currentProject: Object,
    currentChapter: Object
  },
  setup(props) {
    const userInput = ref('')
    const messages = ref([])
    const isTyping = ref(false)
    const messagesContainer = ref(null)
    const hasApiKey = ref(false)
    const apiKeyDialogVisible = ref(false)
    const error = ref('')
    const lastUserMessage = ref('')
    
    // 初始化API密钥
    const initializeApiKey = () => {
      try {
        const savedApiKey = localStorage.getItem('qwen_api_key')
        if (savedApiKey) {
          qwenApiService.setApiKey(savedApiKey)
          hasApiKey.value = true
        }
      } catch (e) {
        console.warn('无法加载已保存的API密钥:', e)
      }
    }
    
    // 初始化欢迎消息
    const initializeWelcomeMessage = () => {
      if (!hasApiKey.value) {
        messages.value = [{
          role: 'ai',
          content: '你好！我是基于Qwen的AI写作助手。请先设置API密钥以开始使用。',
          timestamp: new Date()
        }]
        return
      }
      
      let welcomeMessage = '你好！我是你的AI写作助手，基于通义千问(Qwen)模型。我可以帮你构思情节、完善角色或解答写作问题。'
      
      if (props.currentProject) {
        welcomeMessage = `你好！我正在协助你创作《${props.currentProject.name}》`
        if (props.currentChapter) {
          welcomeMessage += `的${props.currentChapter.title || `第${props.currentChapter.order}章`}`
        }
        welcomeMessage += '。有什么可以帮到你的吗？'
      }
      
      messages.value = [{ 
        role: 'ai', 
        content: welcomeMessage, 
        timestamp: new Date() 
      }]
    }
    
    // 监听项目或章节变化
    watch([() => props.currentProject, () => props.currentChapter], () => {
      if (hasApiKey.value && messages.value.length <= 1) {
        initializeWelcomeMessage()
      }
    })
    
    // 发送消息
    const sendMessage = async () => {
      if (!userInput.value.trim() || isTyping.value || !hasApiKey.value) return
      
      const messageContent = userInput.value.trim()
      lastUserMessage.value = messageContent
      
      // 添加用户消息
      const userMessage = {
        role: 'user',
        content: messageContent,
        timestamp: new Date()
      }
      messages.value.push(userMessage)
      userInput.value = ''
      error.value = ''
      
      // 滚动到底部
      await nextTick()
      scrollToBottom()
      
      // 调用Qwen API
      isTyping.value = true
      
      try {
        // 获取对话历史（排除系统消息和错误消息）
        const conversationHistory = messages.value
          .filter(msg => msg.role === 'user' || msg.role === 'ai')
          .slice(0, -1) // 排除刚添加的用户消息
        
        const response = await qwenApiService.sendMessageWithContext(
          messageContent,
          props.currentProject,
          props.currentChapter,
          conversationHistory
        )
        
        if (response.success) {
          // 添加AI回复
          messages.value.push({
            role: 'ai',
            content: response.content,
            timestamp: new Date()
          })
        } else {
          throw new Error('API返回异常')
        }
      } catch (err) {
        console.error('发送消息失败:', err)
        error.value = err.message || '发送消息失败，请重试'
      } finally {
        isTyping.value = false
        
        // 滚动到底部
        await nextTick()
        scrollToBottom()
      }
    }
    
    // 重试最后一条消息
    const retryLastMessage = async () => {
      if (!lastUserMessage.value || isTyping.value) return
      
      error.value = ''
      isTyping.value = true
      
      try {
        // 获取对话历史（排除错误消息）
        const conversationHistory = messages.value
          .filter(msg => msg.role === 'user' || msg.role === 'ai')
        
        const response = await qwenApiService.sendMessageWithContext(
          lastUserMessage.value,
          props.currentProject,
          props.currentChapter,
          conversationHistory
        )
        
        if (response.success) {
          // 添加AI回复
          messages.value.push({
            role: 'ai',
            content: response.content,
            timestamp: new Date()
          })
        } else {
          throw new Error('API返回异常')
        }
      } catch (err) {
        console.error('重试失败:', err)
        error.value = err.message || '重试失败，请检查网络连接'
      } finally {
        isTyping.value = false
        
        // 滚动到底部
        await nextTick()
        scrollToBottom()
      }
    }
    
    // 显示API密钥设置对话框
    const showApiKeyDialog = () => {
      apiKeyDialogVisible.value = true
    }
    
    // 处理API密钥保存
    const handleApiKeySaved = (apiKey) => {
      qwenApiService.setApiKey(apiKey)
      hasApiKey.value = true
      error.value = ''
      
      // 重新初始化欢迎消息
      initializeWelcomeMessage()
    }
    
    // 清空对话
    const clearChat = () => {
      messages.value = []
      error.value = ''
      initializeWelcomeMessage()
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
      initializeApiKey()
      initializeWelcomeMessage()
      scrollToBottom()
    })
    
    return {
      userInput,
      messages,
      isTyping,
      messagesContainer,
      hasApiKey,
      apiKeyDialogVisible,
      error,
      sendMessage,
      retryLastMessage,
      showApiKeyDialog,
      handleApiKeySaved,
      clearChat,
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
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.api-key-btn, .clear-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #666;
  transition: all 0.2s;
}

.api-key-btn:hover, .clear-btn:hover {
  background: #f8f9fa;
  border-color: #007bff;
  color: #007bff;
}

.api-key-btn.configured {
  background: #d4edda;
  border-color: #28a745;
  color: #28a745;
}

.api-key-notice {
  padding: 20px;
  text-align: center;
  background: #fff3cd;
  border-bottom: 1px solid #ffeaa7;
  color: #856404;
}

.api-key-notice p {
  margin: 0 0 12px 0;
  font-size: 14px;
}

.setup-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.setup-btn:hover {
  background: #0056b3;
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
/*
 错误消息样式 */
.error-message {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 8px;
  padding: 12px;
  margin: 8px 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.error-content {
  flex: 1;
  color: #721c24;
  font-size: 14px;
  line-height: 1.4;
}

.retry-btn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  white-space: nowrap;
  transition: background 0.2s;
}

.retry-btn:hover {
  background: #c82333;
}