<script setup lang="ts">
import { ref } from 'vue'

const qwenApiKey = ref('')
const saving = ref(false)
const savingMsg = ref('')

const save = async () => {
  if (!qwenApiKey.value.trim()) {
    window.alert('请输入 Qwen API Key')
    return
  }
  saving.value = true
  savingMsg.value = ''
  try {
    await window.ipcRenderer.invoke('settings:save-qwen-key', qwenApiKey.value.trim())
    savingMsg.value = '已写入应用数据目录 (.env)'
  } catch (err) {
    console.error('保存 Qwen Key 失败', err)
    window.alert('保存失败，请检查权限')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="settings">
    <h3>设置</h3>
    <div class="field">
      <label for="qwen">Qwen API Key</label>
      <div class="input-row">
        <input
          id="qwen"
          v-model="qwenApiKey"
          type="password"
          placeholder="sk-..."
        />
        <button type="button" class="primary" :disabled="saving" @click="save">
          {{ saving ? '保存中...' : '保存' }}
        </button>
      </div>
      <p class="hint">保存后写入应用 userData 目录下的 .env 中的 QWEN_API_KEY，仅存本地。</p>
      <p v-if="savingMsg" class="success">{{ savingMsg }}</p>
    </div>
  </section>
</template>

<style scoped>
h3 {
  margin: 0 0 0.5rem;
  font-size: 1.1rem;
  line-height: 1.4;
}

p {
  margin: 0;
  color: #6c7180;
}

.settings {
  width: min(560px, calc(100% - 32px));
  padding: 0.5rem 0;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-top: 1rem;
}

label {
  font-weight: 600;
}

.input-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  width: 100%;
}

input {
  padding: 0.55rem 0.75rem;
  border: 1px solid #d0d4dd;
  border-radius: 8px;
  font-size: 0.95rem;
  flex: 1;
  width: 100%;
  box-sizing: border-box;
}

.hint {
  font-size: 0.85rem;
}

.primary {
  padding: 0.55rem 1rem;
  border: 1px solid #646cff;
  background: #646cff;
  color: #fff;
  border-radius: 8px;
  cursor: pointer;
  flex-shrink: 0;
}

.primary:hover {
  background: #535bf2;
  border-color: #535bf2;
}

.ghost {
  padding: 0.55rem 1rem;
  border: 1px solid #d0d4dd;
  background: #f5f6fa;
  color: #2c2f36;
  border-radius: 8px;
  cursor: pointer;
  flex-shrink: 0;
}

.success {
  color: #2e7d32;
  font-size: 0.9rem;
  margin-top: 0.25rem;
}
</style>
