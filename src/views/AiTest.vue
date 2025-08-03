<template>
  <Layout>
    <header class="main-header">
      <div class="header-title">AI测试</div>
      <div class="header-actions">
        <button class="create-btn">
          <PlusIcon class="icon" /> 新建对话
        </button>
      </div>
    </header>

    <div class="ai-test-content">
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
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Layout from '../components/Layout.vue'
import { PlusIcon } from 'lucide-vue-next'

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

<style scoped>
.main-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2.2rem 3vw 1.2rem 3vw;
  background: var(--header-bg);
  border-bottom: 2px solid var(--border);
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  position: sticky;
  top: 0;
  z-index: 2;
}

.header-title {
  font-size: 2.1rem;
  font-weight: bold;
  color: var(--title-color);
  letter-spacing: 2px;
}

.header-actions {
  display: flex;
  gap: 1.2rem;
}

.create-btn {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.9rem 2rem;
  border: none;
  border-radius: 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  background: var(--primary-btn-bg);
  color: var(--primary-btn-color);
  box-shadow: var(--card-shadow);
  transition: all 0.22s cubic-bezier(.4,2,.6,1);
}

.create-btn:hover {
  transform: scale(1.06) translateY(-2px);
  box-shadow: var(--primary-btn-hover);
}

.ai-test-content {
  margin: 0 auto;
  width: 100%;
  max-width: 1600px;
  background: none;
  border-radius: 0;
  box-shadow: none;
  padding: 2.5rem 2vw 2.5rem 2vw;
}

.ai-test-section {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 70vh;
}

.ai-test-window {
  width: 480px;
  background: var(--card-bg);
  border-radius: 1.5rem;
  box-shadow: var(--card-shadow);
  padding: 2.5rem 2rem 1.5rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  backdrop-filter: blur(8px);
  border: 2px solid var(--border);
}

.ai-test-window h2 {
  color: var(--title-color);
  margin: 0;
  text-align: center;
  font-size: 1.5rem;
}

.ai-chat-area {
  flex: 1;
  min-height: 180px;
  max-height: 320px;
  overflow-y: auto;
  background: var(--input-bg);
  border-radius: 1rem;
  padding: 1rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  border: 2px solid var(--border);
}

.ai-msg {
  margin-bottom: 0.7rem;
  display: flex;
  align-items: flex-start;
}

.ai-msg.user .ai-msg-role {
  color: var(--accent);
  font-weight: bold;
}

.ai-msg.ai .ai-msg-role {
  color: #4caf50;
  font-weight: bold;
}

.ai-msg-content {
  margin-left: 0.5rem;
  word-break: break-all;
  color: var(--title-color);
}

.ai-input-bar {
  display: flex;
  gap: 0.7rem;
}

.ai-input-bar input {
  flex: 1;
  padding: 0.7rem 1rem;
  border-radius: 1rem;
  border: 2px solid var(--border);
  font-size: 1rem;
  background: var(--input-bg);
  outline: none;
  color: var(--title-color);
  transition: border-color 0.2s;
}

.ai-input-bar input:focus {
  border-color: var(--accent);
}

.ai-input-bar button {
  padding: 0.7rem 1.5rem;
  border-radius: 1rem;
  border: none;
  background: var(--accent);
  color: #fff;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.18s;
}

.ai-input-bar button:hover {
  background: var(--primary-btn-bg);
}

.icon {
  width: 1.2rem;
  height: 1.2rem;
}
</style> 