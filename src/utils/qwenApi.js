/**
 * Qwen API 服务工具类
 * 用于调用通义千问 API 进行 AI 辅助写作
 */

import storageManager from './storage.js'

class QwenApiService {
  constructor() {
    this.baseUrl = ''
    this.apiKey = ''
    this.model = 'qwen-turbo'
    this.maxTokens = 2000
    this.temperature = 0.7
    this.enabled = false
    
    // 初始化配置
    this.loadConfig()
  }

  /**
   * 加载 API 配置
   */
  loadConfig() {
    const settings = storageManager.getSettings()
    this.baseUrl = settings.qwenApiBase || 'https://dashscope.aliyuncs.com/compatible-mode/v1'
    this.apiKey = settings.qwenApiKey || ''
    this.model = settings.qwenModel || 'qwen-plus'
    this.maxTokens = settings.qwenMaxTokens || 2000
    this.temperature = settings.qwenTemperature || 0.7
    this.enabled = settings.enableAiAssistant && !!this.apiKey
  }

  /**
   * 检查 API 是否可用
   */
  isAvailable() {
    return this.enabled && !!this.apiKey
  }

  /**
   * 发送聊天请求
   * @param {Array} messages - 消息数组
   * @param {Object} options - 可选参数
   * @returns {Promise<string>} 生成的文本
   */
  async chat(messages, options = {}) {
    if (!this.isAvailable()) {
      throw new Error('Qwen API 未配置或未启用')
    }

    const requestBody = {
      model: options.model || this.model,
      messages: messages,
      max_tokens: options.maxTokens || this.maxTokens,
      temperature: options.temperature || this.temperature,
      top_p: options.topP || 0.8,
      stream: false
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`API 请求失败: ${response.status} ${errorData.message || response.statusText}`)
      }

      const data = await response.json()
      
      if (data.choices && data.choices.length > 0 && data.choices[0].message) {
        return data.choices[0].message.content.trim()
      } else {
        throw new Error('API 响应格式错误')
      }
    } catch (error) {
      console.error('Qwen API 调用失败:', error)
      throw error
    }
  }

  /**
   * 续写文本
   * @param {string} context - 上下文文本
   * @param {Object} options - 可选参数
   * @returns {Promise<string>} 续写的文本
   */
  async continueWriting(context, options = {}) {
    const messages = [
      {
        role: 'system',
        content: '你是一个专业的小说写作助手。请根据给定的上下文，自然地续写故事内容。保持文风一致，情节连贯，人物性格鲜明。'
      },
      {
        role: 'user',
        content: `请续写以下内容：\n\n${context}\n\n请直接输出续写内容，不要添加任何解释或标记。`
      }
    ]

    return await this.chat(messages, {
      maxTokens: options.maxTokens || 1000,
      temperature: options.temperature || 0.8
    })
  }

  /**
   * 润色文本
   * @param {string} text - 需要润色的文本
   * @param {string} style - 润色风格 (formal, casual, literary, etc.)
   * @returns {Promise<string>} 润色后的文本
   */
  async polishText(text, style = 'literary') {
    const stylePrompts = {
      formal: '请将文本润色得更加正式和严谨',
      casual: '请将文本润色得更加轻松和口语化',
      literary: '请将文本润色得更加文学化和优美',
      concise: '请将文本润色得更加简洁明了',
      vivid: '请将文本润色得更加生动形象'
    }

    const messages = [
      {
        role: 'system',
        content: '你是一个专业的文本润色助手。请根据要求对文本进行润色，保持原意不变，提升表达效果。'
      },
      {
        role: 'user',
        content: `${stylePrompts[style] || stylePrompts.literary}：\n\n${text}\n\n请直接输出润色后的文本，不要添加任何解释或标记。`
      }
    ]

    return await this.chat(messages, {
      maxTokens: Math.max(text.length * 2, 500),
      temperature: 0.5
    })
  }

  /**
   * 生成角色对话
   * @param {string} character - 角色信息
   * @param {string} situation - 情境描述
   * @param {string} previousDialogue - 之前的对话
   * @returns {Promise<string>} 生成的对话
   */
  async generateDialogue(character, situation, previousDialogue = '') {
    const messages = [
      {
        role: 'system',
        content: '你是一个专业的对话写作助手。请根据角色设定和情境，生成符合角色性格的自然对话。'
      },
      {
        role: 'user',
        content: `角色信息：${character}\n\n情境：${situation}\n\n${previousDialogue ? `之前的对话：\n${previousDialogue}\n\n` : ''}请生成这个角色在当前情境下的对话，要符合角色性格特点。直接输出对话内容，不要添加任何解释或标记。`
      }
    ]

    return await this.chat(messages, {
      maxTokens: 800,
      temperature: 0.9
    })
  }

  /**
   * 生成情节大纲
   * @param {string} premise - 故事前提
   * @param {string} genre - 故事类型
   * @param {number} chapters - 章节数量
   * @returns {Promise<string>} 生成的大纲
   */
  async generateOutline(premise, genre = '小说', chapters = 10) {
    const messages = [
      {
        role: 'system',
        content: '你是一个专业的故事大纲创作助手。请根据故事前提和类型，创作结构完整、情节紧凑的故事大纲。'
      },
      {
        role: 'user',
        content: `故事前提：${premise}\n\n故事类型：${genre}\n\n章节数量：${chapters}\n\n请创作一个完整的故事大纲，包含主要情节点和章节安排。`
      }
    ]

    return await this.chat(messages, {
      maxTokens: 2000,
      temperature: 0.7
    })
  }

  /**
   * 分析文本内容
   * @param {string} text - 需要分析的文本
   * @param {string} analysisType - 分析类型 (plot, character, style, etc.)
   * @returns {Promise<string>} 分析结果
   */
  async analyzeText(text, analysisType = 'general') {
    const analysisPrompts = {
      plot: '请分析这段文本的情节结构、冲突设置和发展脉络',
      character: '请分析这段文本中的人物塑造、性格特点和人物关系',
      style: '请分析这段文本的写作风格、语言特色和表现手法',
      theme: '请分析这段文本的主题思想和深层含义',
      general: '请对这段文本进行综合分析，包括情节、人物、风格等方面'
    }

    const messages = [
      {
        role: 'system',
        content: '你是一个专业的文学分析助手。请对给定的文本进行深入分析，提供有价值的见解和建议。'
      },
      {
        role: 'user',
        content: `${analysisPrompts[analysisType] || analysisPrompts.general}：\n\n${text}`
      }
    ]

    return await this.chat(messages, {
      maxTokens: 1500,
      temperature: 0.3
    })
  }

  /**
   * 获取写作建议
   * @param {string} context - 写作上下文
   * @param {string} problem - 遇到的问题
   * @returns {Promise<string>} 写作建议
   */
  async getWritingAdvice(context, problem) {
    const messages = [
      {
        role: 'system',
        content: '你是一个经验丰富的写作导师。请根据具体情况，提供实用的写作建议和解决方案。'
      },
      {
        role: 'user',
        content: `写作背景：${context}\n\n遇到的问题：${problem}\n\n请提供具体的写作建议和解决方案。`
      }
    ]

    return await this.chat(messages, {
      maxTokens: 1200,
      temperature: 0.6
    })
  }

  /**
   * 测试 API 连接
   * @returns {Promise<{success: boolean, message: string, details?: any}>} 连接测试结果
   */
  async testConnection() {
    if (!this.apiKey) {
      return {
        success: false,
        message: 'API Key 未配置'
      }
    }

    try {
      // 使用最小的请求来测试连接和认证
      const requestBody = {
        model: this.model,
        messages: [
          {
            role: 'user',
            content: 'test'
          }
        ],
        max_tokens: 1,
        temperature: 0.1,
        stream: false
      }

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      })

      if (response.ok) {
        const data = await response.json()
        
        // 检查响应格式是否正确（OpenAI兼容格式）
        if (data.choices || data.error) {
          return {
            success: true,
            message: 'API 连接成功',
            details: {
              status: response.status,
              model: this.model,
              baseUrl: this.baseUrl,
              usage: data.usage || null
            }
          }
        } else {
          return {
            success: false,
            message: 'API 响应格式异常',
            details: data
          }
        }
      } else {
        // 解析错误响应
        let errorMessage = `HTTP ${response.status}`
        let errorDetails = null
        
        try {
          const errorData = await response.json()
          errorDetails = errorData
          
          if (errorData.error && errorData.error.message) {
            errorMessage = errorData.error.message
          } else if (errorData.message) {
            errorMessage = errorData.message
          } else if (errorData.error && errorData.error.code) {
            errorMessage = `错误代码: ${errorData.error.code}`
          }
        } catch (e) {
          errorMessage = `HTTP ${response.status} ${response.statusText}`
        }

        // 根据状态码提供更具体的错误信息
        switch (response.status) {
          case 401:
            errorMessage = 'API Key 无效或已过期'
            break
          case 403:
            errorMessage = 'API Key 权限不足或账户余额不足'
            break
          case 404:
            errorMessage = 'API 端点不存在，请检查基础地址配置'
            break
          case 429:
            errorMessage = 'API 调用频率超限，请稍后重试'
            break
          case 500:
          case 502:
          case 503:
          case 504:
            errorMessage = 'API 服务暂时不可用，请稍后重试'
            break
        }

        return {
          success: false,
          message: errorMessage,
          details: {
            status: response.status,
            statusText: response.statusText,
            error: errorDetails
          }
        }
      }
    } catch (error) {
      console.error('API 连接测试失败:', error)
      
      let errorMessage = '连接失败'
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = '网络连接失败，请检查网络设置和API地址'
      } else if (error.name === 'AbortError') {
        errorMessage = '请求超时，请检查网络连接'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      return {
        success: false,
        message: errorMessage,
        details: {
          error: error.name,
          message: error.message
        }
      }
    }
  }
}

// 创建单例实例
const qwenApiService = new QwenApiService()

export default qwenApiService