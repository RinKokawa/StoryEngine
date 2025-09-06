// AI 助手状态管理

import { defineStore } from 'pinia'
import type { 
  AIStoreState,
  AIMessage,
  Project,
  Chapter
} from '@/types'
import { ErrorHandler } from '@/utils/errorHandler'

// 这里暂时使用现有的 qwenApi，后续会重构为新的 AI 服务
import qwenApiService from '@/utils/qwenApi.js'

export const useAIStore = defineStore('ai', {
  state: (): AIStoreState => ({
    messages: [],
    isTyping: false,
    hasApiKey: false,
    error: null,
    conversationId: null,
    lastMessageId: null
  }),

  getters: {
    // 消息相关
    messageCount: (state): number => state.messages.length,
    
    lastMessage: (state): AIMessage | null => 
      state.messages.length > 0 ? state.messages[state.messages.length - 1] : null,
    
    conversationHistory: (state): AIMessage[] => 
      state.messages.filter(m => m.role === 'user' || m.role === 'assistant'),
    
    // 状态检查
    canSendMessage: (state): boolean => 
      state.hasApiKey && !state.isTyping,
    
    hasError: (state): boolean => state.error !== null,
    
    hasMessages: (state): boolean => state.messages.length > 0
  },

  actions: {
    // 初始化
    initialize(): void {
      this.hasApiKey = qwenApiService.hasApiKey()
      this.loadWelcomeMessage()
    },

    // API 密钥管理
    setApiKey(apiKey: string): void {
      try {
        qwenApiService.setApiKey(apiKey)
        this.hasApiKey = true
        this.error = null
        
        // 保存到 localStorage
        localStorage.setItem('qwen_api_key', apiKey)
        
        // 重新加载欢迎消息
        this.loadWelcomeMessage()
      } catch (error) {
        this.error = '设置 API 密钥失败'
        ErrorHandler.handleError(error, 'setApiKey')
      }
    },

    getApiKey(): string | null {
      try {
        return localStorage.getItem('qwen_api_key')
      } catch (error) {
        return null
      }
    },

    // 消息管理
    addMessage(message: Omit<AIMessage, 'timestamp'>): void {
      const newMessage: AIMessage = {
        ...message,
        timestamp: new Date()
      }
      
      this.messages.push(newMessage)
      this.lastMessageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    },

    loadWelcomeMessage(project?: Project, chapter?: Chapter): void {
      // 清空现有消息
      this.messages = []
      
      if (!this.hasApiKey) {
        this.addMessage({
          id: crypto.randomUUID(),
          role: 'assistant',
          content: '你好！我是基于Qwen的AI写作助手。请先设置API密钥以开始使用。'
        })
        return
      }
      
      let welcomeMessage = '你好！我是你的AI写作助手，基于通义千问(Qwen)模型。我可以帮你构思情节、完善角色或解答写作问题。'
      
      if (project) {
        welcomeMessage = `你好！我正在协助你创作《${project.name}》`
        if (chapter) {
          welcomeMessage += `的${chapter.title || `第${chapter.order}章`}`
        }
        welcomeMessage += '。有什么可以帮到你的吗？'
      }
      
      this.addMessage({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: welcomeMessage
      })
    },

    // 发送消息
    async sendMessage(
      content: string, 
      project?: Project, 
      chapter?: Chapter
    ): Promise<void> {
      if (!this.hasApiKey || this.isTyping || !content.trim()) {
        return
      }

      // 添加用户消息
      this.addMessage({
        id: crypto.randomUUID(),
        role: 'user',
        content: content.trim()
      })

      this.isTyping = true
      this.error = null

      try {
        // 获取对话历史（排除系统消息）
        const conversationHistory = this.messages
          .filter(msg => msg.role === 'user' || msg.role === 'assistant')
          .slice(0, -1) // 排除刚添加的用户消息

        const response = await qwenApiService.sendMessageWithContext(
          content.trim(),
          project,
          chapter,
          conversationHistory
        )

        if (response.success) {
          this.addMessage({
            id: crypto.randomUUID(),
            role: 'assistant',
            content: response.content
          })
        } else {
          throw new Error('API 返回异常')
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : '发送消息失败，请重试'
        ErrorHandler.handleError(error, 'sendMessage')
      } finally {
        this.isTyping = false
      }
    },

    // 重试最后一条消息
    async retryLastMessage(project?: Project, chapter?: Chapter): Promise<void> {
      if (this.messages.length === 0 || this.isTyping) {
        return
      }

      // 找到最后一条用户消息
      const lastUserMessage = [...this.messages]
        .reverse()
        .find(msg => msg.role === 'user')

      if (!lastUserMessage) {
        return
      }

      // 移除最后一条 AI 回复（如果存在错误）
      if (this.messages[this.messages.length - 1].role === 'assistant') {
        this.messages.pop()
      }

      this.isTyping = true
      this.error = null

      try {
        // 获取对话历史
        const conversationHistory = this.messages
          .filter(msg => msg.role === 'user' || msg.role === 'assistant')

        const response = await qwenApiService.sendMessageWithContext(
          lastUserMessage.content,
          project,
          chapter,
          conversationHistory
        )

        if (response.success) {
          this.addMessage({
            id: crypto.randomUUID(),
            role: 'assistant',
            content: response.content
          })
        } else {
          throw new Error('API 返回异常')
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : '重试失败，请检查网络连接'
        ErrorHandler.handleError(error, 'retryLastMessage')
      } finally {
        this.isTyping = false
      }
    },

    // 清空对话
    clearConversation(project?: Project, chapter?: Chapter): void {
      this.messages = []
      this.error = null
      this.conversationId = null
      this.lastMessageId = null
      
      // 重新加载欢迎消息
      this.loadWelcomeMessage(project, chapter)
    },

    // 错误处理
    clearError(): void {
      this.error = null
    },

    setError(error: string): void {
      this.error = error
    },

    // 导出对话
    exportConversation(): string {
      const exportData = {
        conversationId: this.conversationId,
        exportDate: new Date().toISOString(),
        messages: this.messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp.toISOString()
        }))
      }
      
      return JSON.stringify(exportData, null, 2)
    },

    // 导入对话
    importConversation(jsonData: string): void {
      try {
        const data = JSON.parse(jsonData)
        
        if (data.messages && Array.isArray(data.messages)) {
          this.messages = data.messages.map((msg: any) => ({
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.timestamp)
          }))
          
          this.conversationId = data.conversationId || null
        }
      } catch (error) {
        this.error = '导入对话失败'
        ErrorHandler.handleError(error, 'importConversation')
      }
    }
  }
})