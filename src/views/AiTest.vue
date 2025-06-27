<template>
  <div class="ai-test-section">
    <div class="ai-test-window">
      <h2>AI 测试窗口</h2>
      <div class="ai-chat-area">
        <div v-for="(msg, idx) in aiMessages" :key="idx" :class="['ai-msg', msg.role]">
          <span class="ai-msg-role">{{ msg.role === 'user' ? '你' : 'AI' }}：</span>
          <span class="ai-msg-content">{{ msg.content }}</span>
        </div>
      </div>
      <form class="ai-input-bar" @submit.prevent="sendAiMsg">
        <input v-model="aiInput" placeholder="输入内容测试AI..." />
        <button type="submit">发送</button>
      </form>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
const aiMessages = ref([
  { role: 'ai', content: '你好，我是StoryEngine的AI助手，有什么可以帮你？' }
])
const aiInput = ref('')
function sendAiMsg() {
  if (!aiInput.value.trim()) return
  aiMessages.value.push({ role: 'user', content: aiInput.value })
  // 模拟AI回复
  setTimeout(() => {
    aiMessages.value.push({ role: 'ai', content: '（模拟AI回复）你刚才说：' + aiInput.value })
  }, 600)
  aiInput.value = ''
}
</script>
<style>
.ai-test-section {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 70vh;
}
.ai-test-window {
  width: 480px;
  background: var(--card-bg, #fff);
  border-radius: 1.5rem;
  box-shadow: 0 2px 16px rgba(0,0,0,0.08);
  padding: 2.5rem 2rem 1.5rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}
.ai-chat-area {
  flex: 1;
  min-height: 180px;
  max-height: 320px;
  overflow-y: auto;
  background: var(--input-bg, #f8fafc);
  border-radius: 1rem;
  padding: 1rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}
.ai-msg {
  margin-bottom: 0.7rem;
  display: flex;
  align-items: flex-start;
}
.ai-msg.user .ai-msg-role {
  color: var(--accent, #667eea);
  font-weight: bold;
}
.ai-msg.ai .ai-msg-role {
  color: #4caf50;
  font-weight: bold;
}
.ai-msg-content {
  margin-left: 0.5rem;
  word-break: break-all;
}
.ai-input-bar {
  display: flex;
  gap: 0.7rem;
}
.ai-input-bar input {
  flex: 1;
  padding: 0.7rem 1rem;
  border-radius: 1rem;
  border: 1.5px solid var(--border, #dee2e6);
  font-size: 1rem;
  background: var(--input-bg, #f8fafc);
  outline: none;
}
.ai-input-bar button {
  padding: 0.7rem 1.5rem;
  border-radius: 1rem;
  border: none;
  background: var(--accent, #667eea);
  color: #fff;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.18s;
}
.ai-input-bar button:hover {
  background: var(--primary-btn-bg, #667eea);
}
</style> 