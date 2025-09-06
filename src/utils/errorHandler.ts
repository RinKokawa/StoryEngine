// 统一错误处理工具

import type { RetryOptions } from '@/types'
import { AppError } from '@/types'

export class ErrorHandler {
  /**
   * 带重试机制的异步操作执行
   */
  static async withRetry<T>(
    fn: () => Promise<T>, 
    options: Partial<RetryOptions> = {}
  ): Promise<T> {
    const { 
      maxRetries = 3, 
      baseDelay = 1000, 
      maxDelay = 10000,
      backoffFactor = 2 
    } = options
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        if (attempt === maxRetries) {
          throw new AppError('操作失败', error)
        }
        
        // 等待后重试
        const currentDelay = Math.min(
          baseDelay * Math.pow(backoffFactor, attempt - 1),
          maxDelay
        )
        await new Promise(resolve => 
          setTimeout(resolve, currentDelay)
        )
      }
    }
    
    throw new Error('Unreachable')
  }

  /**
   * 处理错误并显示用户友好的错误信息
   */
  static handleError(error: unknown, context?: string): void {
    const appError = error instanceof AppError 
      ? error 
      : new AppError('未知错误', error, context)
    
    // 记录错误日志
    console.error('[ErrorHandler]', {
      message: appError.message,
      userMessage: appError.userMessage,
      context: appError.context,
      originalError: appError.originalError,
      stack: appError.stack,
      timestamp: new Date().toISOString()
    })
    
    // 这里可以集成通知系统显示错误
    // 暂时使用 console.error，后续会通过 store 显示通知
    console.error('用户错误:', appError.userMessage)
  }

  /**
   * 包装异步函数，自动处理错误
   */
  static wrapAsync<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    context?: string
  ): (...args: T) => Promise<R | null> {
    return async (...args: T): Promise<R | null> => {
      try {
        return await fn(...args)
      } catch (error) {
        ErrorHandler.handleError(error, context)
        return null
      }
    }
  }

  /**
   * 创建防抖函数
   */
  static debounce<T extends any[]>(
    fn: (...args: T) => void,
    delay: number
  ): (...args: T) => void {
    let timeoutId: NodeJS.Timeout | null = null
    
    return (...args: T) => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      
      timeoutId = setTimeout(() => {
        fn(...args)
        timeoutId = null
      }, delay)
    }
  }

  /**
   * 创建节流函数
   */
  static throttle<T extends any[]>(
    fn: (...args: T) => void,
    delay: number
  ): (...args: T) => void {
    let lastCall = 0
    
    return (...args: T) => {
      const now = Date.now()
      
      if (now - lastCall >= delay) {
        lastCall = now
        fn(...args)
      }
    }
  }

  /**
   * 安全的 JSON 解析
   */
  static safeJsonParse<T>(json: string, defaultValue: T): T {
    try {
      return JSON.parse(json)
    } catch (error) {
      console.warn('JSON 解析失败:', error)
      return defaultValue
    }
  }

  /**
   * 安全的 JSON 字符串化
   */
  static safeJsonStringify(obj: any, defaultValue = '{}'): string {
    try {
      return JSON.stringify(obj, null, 2)
    } catch (error) {
      console.warn('JSON 字符串化失败:', error)
      return defaultValue
    }
  }

  /**
   * 验证必需字段
   */
  static validateRequired(obj: any, fields: string[], context?: string): void {
    const missing = fields.filter(field => {
      const value = obj[field]
      return value === undefined || value === null || value === ''
    })
    
    if (missing.length > 0) {
      throw new AppError(
        `缺少必需字段: ${missing.join(', ')}`,
        new Error(`Missing required fields: ${missing.join(', ')}`),
        context
      )
    }
  }

  /**
   * 创建超时 Promise
   */
  static timeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new AppError('操作超时')), ms)
      )
    ])
  }
}