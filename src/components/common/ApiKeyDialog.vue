<template>
  <div v-if="visible" class="dialog-overlay" @click="handleOverlayClick">
    <div class="dialog" @click.stop>
      <div class="dialog-header">
        <h3>设置Qwen API密钥</h3>
        <button @click="close" class="close-btn">&times;</button>
      </div>
      
      <div class="dialog-content">
        <p class="description">
          请输入你的Qwen API密钥以启用AI助手功能。
          <a href="https://help.aliyun.com/zh/dashscope/developer-reference/activate-dashscope-and-create-an-api-key" 
             target="_blank" class="help-link">
            如何获取API密钥？
          </a>
        </p>
        
        <div class="input-group">
          <label for="apiKey">API密钥：</label>
          <input 
            id="apiKey"
            v-model="apiKey" 
            type="password" 
            placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
            @keydown.enter="save"
          />
        </div>
        
        <div class="checkbox-group">
          <label>
            <input type="checkbox" v-model="saveToLocal" />
            保存到本地（下次自动加载）
          </label>
        </div>
        
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
      </div>
      
      <div class="dialog-actions">
        <button @click="close" class="cancel-btn">取消</button>
        <button @click="save" :disabled="!apiKey.trim()" class="save-btn">保存</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch } from 'vue'

export default {
  name: 'ApiKeyDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'save'],
  setup(props, { emit }) {
    const apiKey = ref('')
    const saveToLocal = ref(true)
    const error = ref('')
    
    // 当对话框显示时，尝试加载已保存的API密钥
    watch(() => props.visible, (visible) => {
      if (visible) {
        loadSavedApiKey()
        error.value = ''
      }
    })
    
    const loadSavedApiKey = () => {
      try {
        const saved = localStorage.getItem('qwen_api_key')
        if (saved) {
          apiKey.value = saved
          saveToLocal.value = true
        }
      } catch (e) {
        console.warn('无法加载已保存的API密钥:', e)
      }
    }
    
    const save = () => {
      if (!apiKey.value.trim()) {
        error.value = '请输入API密钥'
        return
      }
      
      try {
        if (saveToLocal.value) {
          localStorage.setItem('qwen_api_key', apiKey.value.trim())
        } else {
          localStorage.removeItem('qwen_api_key')
        }
        
        emit('save', apiKey.value.trim())
        close()
      } catch (e) {
        error.value = '保存失败，请重试'
        console.error('保存API密钥失败:', e)
      }
    }
    
    const close = () => {
      apiKey.value = ''
      error.value = ''
      emit('close')
    }
    
    const handleOverlayClick = () => {
      close()
    }
    
    return {
      apiKey,
      saveToLocal,
      error,
      save,
      close,
      handleOverlayClick
    }
  }
}
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 16px;
  border-bottom: 1px solid #e0e0e0;
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f5f5f5;
  color: #666;
}

.dialog-content {
  padding: 20px 24px;
}

.description {
  margin: 0 0 20px 0;
  color: #666;
  line-height: 1.5;
}

.help-link {
  color: #007bff;
  text-decoration: none;
}

.help-link:hover {
  text-decoration: underline;
}

.input-group {
  margin-bottom: 16px;
}

.input-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #333;
}

.input-group input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.input-group input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.1);
}

.checkbox-group {
  margin-bottom: 16px;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
}

.checkbox-group input[type="checkbox"] {
  margin: 0;
}

.error-message {
  color: #dc3545;
  font-size: 14px;
  margin-top: 8px;
  padding: 8px 12px;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px 20px;
  border-top: 1px solid #e0e0e0;
}

.cancel-btn, .save-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.cancel-btn {
  background: white;
  color: #666;
}

.cancel-btn:hover {
  background: #f8f9fa;
  border-color: #999;
}

.save-btn {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.save-btn:hover:not(:disabled) {
  background: #0056b3;
  border-color: #0056b3;
}

.save-btn:disabled {
  background: #cccccc;
  border-color: #cccccc;
  cursor: not-allowed;
}
</style>