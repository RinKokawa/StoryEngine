import axios from 'axios'

// 检测是否在Electron环境中运行
const isElectron = () => {
  return window && window.electron && window.electron.isElectron
}

class QwenApiService {
  constructor() {
    this.apiKey = null
    this.baseURL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation'
    this.model = 'qwen-turbo'
    this.maxTokens = 2000
    this.temperature = 0.7
    
    // 创建axios实例，配置默认值
    this.client = axios.create({
      timeout: 60000, // 增加超时时间到60秒
      headers: {
        'Content-Type': 'application/json',
        'X-DashScope-SSE': 'disable'
      }
    })
    
    // 配置axios拦截器，添加CORS相关头部
    this.client.interceptors.request.use(config => {
      config.headers = {
        ...config.headers,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Origin, Content-Type, Accept, Authorization, X-Request-With'
      }
      return config
    })
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
      console.log('准备发送请求到通义千问API...')
      
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

      let response;
      
      // 检查是否在Electron环境中
      if (isElectron()) {
        console.log('使用Electron IPC发送请求...')
        // 使用Electron的IPC通道发送请求
        response = await window.electronAPI.qwenApiRequest({
          url: this.baseURL,
          apiKey: this.apiKey,
          data: requestData
        })
      } else {
        console.log('使用Axios发送请求...')
        // 使用配置好的client实例发送请求
        const axiosResponse = await this.client.post(this.baseURL, requestData, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          },
          // 添加代理配置，尝试解决CORS问题
          proxy: false
        })
        response = axiosResponse.data
      }
      
      console.log('通义千问API请求成功')

      // 根据响应格式处理结果
      if (isElectron()) {
        // 处理Electron IPC返回的结果
        if (response.output && response.output.text) {
          return {
            success: true,
            content: response.output.text,
            usage: response.usage
          }
        } else if (response.error) {
          throw new Error(response.error)
        } else {
          throw new Error('API返回格式异常')
        }
      } else if (response.data && response.data.output && response.data.output.text) {
        // 处理Axios返回的结果
        return {
          success: true,
          content: response.data.output.text,
          usage: response.data.usage
        }
      } else if (response.output && response.output.text) {
        // 直接返回的结果
        return {
          success: true,
          content: response.output.text,
          usage: response.usage
        }
      } else {
        throw new Error('API返回格式异常')
      }
    } catch (error) {
      console.error('Qwen API调用失败:', error)
      
      // 详细的错误处理
      if (error.response) {
        // 服务器返回了错误状态码
        const status = error.response.status
        const message = error.response.data?.message || error.response.statusText
        
        if (status === 401) {
          throw new Error('API密钥无效，请检查密钥是否正确')
        } else if (status === 429) {
          throw new Error('请求过于频繁，请稍后再试')
        } else if (status === 400) {
          throw new Error(`请求参数错误: ${message}`)
        } else if (status === 403) {
          throw new Error(`访问被拒绝: ${message}`)
        } else if (status >= 500) {
          throw new Error(`服务器错误 (${status}): 请稍后重试`)
        } else {
          throw new Error(`API调用失败 (${status}): ${message}`)
        }
      } else if (error.request) {
        // 请求已发送但没有收到响应
        if (error.code === 'ECONNABORTED') {
          throw new Error('请求超时，请检查网络连接和API服务状态')
        } else if (error.code === 'ERR_NETWORK') {
          throw new Error('网络连接失败，请检查您的网络连接')
        } else {
          throw new Error(`网络请求失败: ${error.message || '未知错误'}`)
        }
      } else {
        // 请求设置时发生错误
        throw new Error(`请求配置错误: ${error.message || '未知错误'}`)
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
    try {
      const systemPrompt = this.createWritingSystemPrompt(project, chapter)
      
      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.slice(-10), // 保留最近10条对话历史
        { role: 'user', content: userMessage }
      ]

      console.log('发送带上下文的消息到通义千问API...')
      return await this.sendMessage(messages)
    } catch (error) {
      console.error('发送带上下文的消息失败:', error)
      throw error
    }
  }
  
  // 测试API连接
  async testConnection() {
    if (!this.apiKey) {
      return {
        success: false,
        message: '请先设置API密钥'
      }
    }
    
    try {
      // 发送一个简单的测试请求
      const testMessage = [
        { role: 'system', content: '你是一个写作助手' },
        { role: 'user', content: '你好' }
      ]
      
      const response = await this.sendMessage(testMessage, { maxTokens: 10 })
      return {
        success: true,
        message: '连接成功'
      }
    } catch (error) {
      return {
        success: false,
        message: `连接测试失败: ${error.message}`
      }
    }
  }
}

// 创建单例实例
const qwenApiService = new QwenApiService()

export default qwenApiService