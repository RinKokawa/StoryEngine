import axios from 'axios'

class QwenApiService {
  constructor() {
    this.apiKey = null
    this.baseURL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation'
    this.model = 'qwen-turbo'
    this.maxTokens = 2000
    this.temperature = 0.7
  }

  // 设置API密钥
  setApiKey(apiKey) {
    this.apiKey = apiKey
  }

  // 检查API密钥是否已设置
  hasApiKey() {
    return !!this.apiKey
  }

  // 发送消息到Qwen API
  async sendMessage(messages, options = {}) {
    if (!this.apiKey) {
      throw new Error('请先设置Qwen API密钥')
    }

    try {
      const requestData = {
        model: options.model || this.model,
        input: {
          messages: this.formatMessages(messages)
        },
        parameters: {
          max_tokens: options.maxTokens || this.maxTokens,
          temperature: options.temperature || this.temperature,
          top_p: 0.8,
          repetition_penalty: 1.1
        }
      }

      const response = await axios.post(this.baseURL, requestData, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'X-DashScope-SSE': 'disable'
        },
        timeout: 30000 // 30秒超时
      })

      if (response.data && response.data.output && response.data.output.text) {
        return {
          success: true,
          content: response.data.output.text,
          usage: response.data.usage
        }
      } else {
        throw new Error('API返回格式异常')
      }
    } catch (error) {
      console.error('Qwen API调用失败:', error)
      
      if (error.response) {
        const status = error.response.status
        const message = error.response.data?.message || error.response.statusText
        
        if (status === 401) {
          throw new Error('API密钥无效，请检查密钥是否正确')
        } else if (status === 429) {
          throw new Error('请求过于频繁，请稍后再试')
        } else if (status === 400) {
          throw new Error(`请求参数错误: ${message}`)
        } else {
          throw new Error(`API调用失败 (${status}): ${message}`)
        }
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('请求超时，请检查网络连接')
      } else {
        throw new Error(`网络错误: ${error.message}`)
      }
    }
  }

  // 格式化消息为Qwen API格式
  formatMessages(messages) {
    return messages.map(msg => ({
      role: msg.role === 'ai' ? 'assistant' : msg.role,
      content: msg.content
    }))
  }

  // 创建写作助手的系统提示
  createWritingSystemPrompt(project, chapter) {
    let prompt = `你是一个专业的小说写作助手，擅长帮助作者进行创作。你的任务是：

1. 协助情节构思和发展
2. 帮助完善角色设定
3. 提供写作技巧建议
4. 解答创作过程中的问题
5. 保持创作的连贯性和逻辑性

请用友好、专业的语气回答，提供具体可行的建议。`

    if (project) {
      prompt += `\n\n当前项目：《${project.name}》`
      if (project.description) {
        prompt += `\n项目简介：${project.description}`
      }
    }

    if (chapter) {
      prompt += `\n当前章节：${chapter.title || `第${chapter.order}章`}`
      if (chapter.content && chapter.content.length > 0) {
        const preview = chapter.content.substring(0, 200)
        prompt += `\n章节内容预览：${preview}${chapter.content.length > 200 ? '...' : ''}`
      }
    }

    return prompt
  }

  // 发送带上下文的消息
  async sendMessageWithContext(userMessage, project, chapter, conversationHistory = []) {
    const systemPrompt = this.createWritingSystemPrompt(project, chapter)
    
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10), // 保留最近10条对话历史
      { role: 'user', content: userMessage }
    ]

    return await this.sendMessage(messages)
  }
}

// 创建单例实例
const qwenApiService = new QwenApiService()

export default qwenApiService