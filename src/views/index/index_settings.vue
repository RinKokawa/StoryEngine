<script setup lang="ts">
import { ref } from 'vue'

const qwenApiKey = ref('')

const save = () => {
  // 在此处接入真实的持久化逻辑（例如写入本地配置或调用后端 API）
  console.log('保存 Qwen API Key:', qwenApiKey.value)
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
        <button type="button" class="primary" @click="save">保存</button>
      </div>
      <p class="hint">仅存本地。不要泄露给他人。</p>
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
</style>
