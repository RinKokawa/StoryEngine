// qwenApi.js 的类型声明

declare module '@/utils/qwenApi.js' {
  interface QwenApiService {
    setApiKey(apiKey: string): void
    hasApiKey(): boolean
    sendMessageWithContext(
      userMessage: string,
      project?: any,
      chapter?: any,
      conversationHistory?: any[]
    ): Promise<{
      success: boolean
      content: string
      usage?: any
    }>
  }

  const qwenApiService: QwenApiService
  export default qwenApiService
}