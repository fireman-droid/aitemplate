<template>
  <div v-if="visible" class="dialog-overlay" @click.self="$emit('cancel')">
    <div class="dialog">
      <div class="dialog-header">
        <h2>AI 自动生成占位符</h2>
        <button @click="$emit('cancel')" class="btn-close">×</button>
      </div>

      <div class="dialog-body">
        <div class="form-group">
          <label>模式选择</label>
          <select v-model="formData.mode" class="select-input">
            <option value="mock">模拟模式（无需API Key，用于测试）</option>
            <option value="real">真实API模式</option>
          </select>
        </div>

        <div v-if="formData.mode === 'real'">
          <div class="form-group">
            <label>API 配置</label>
            <select v-model="formData.provider" class="select-input">
              <option value="kimi">Kimi (Moonshot AI)</option>
              <option value="openrouter">OpenRouter</option>
              <option value="openai">OpenAI</option>
              <option value="azure">Azure OpenAI</option>
              <option value="custom">自定义接口</option>
            </select>
          </div>

          <div class="form-group">
            <label>API Key *</label>
            <input 
              v-model="formData.apiKey"
              type="password"
              placeholder="输入你的 API Key"
            />
          </div>
        </div>

        <div v-if="formData.mode === 'real'">
          <div class="form-group" v-if="formData.provider === 'custom'">
            <label>API 地址</label>
            <input 
              v-model="formData.apiUrl"
              type="text"
              placeholder="https://api.example.com/v1/chat/completions"
            />
          </div>

          <div class="form-group">
            <label>模型</label>
            <input 
              v-model="formData.model"
              type="text"
              :placeholder="formData.provider === 'kimi' ? 'moonshot-v1-8k' : (formData.provider === 'openrouter' ? 'deepseek/deepseek-r1:free' : 'gpt-4o-mini')"
            />
          </div>
        </div>

        <div class="form-group">
          <label>文档用途说明（可选，有助于提高识别准确度）</label>
          <input 
            v-model="formData.documentType"
            type="text"
            placeholder="例如：离婚起诉状、销售合同、邀请函"
            list="document-types"
          />
          <datalist id="document-types">
            <option value="离婚起诉状"></option>
            <option value="民事起诉状"></option>
            <option value="劳动合同"></option>
            <option value="销售合同"></option>
            <option value="租赁合同"></option>
            <option value="邀请函"></option>
            <option value="通知书"></option>
            <option value="证明文件"></option>
          </datalist>
        </div>

        <div class="info-box" v-if="formData.mode === 'mock'">
          <p>🎯 模拟模式：将使用内置规则分析文档，识别常见的可变信息（姓名、日期、金额、地址等）</p>
        </div>
        <div class="info-box" v-else>
          <p>💡 AI 将分析文档内容，自动识别需要替换的可变信息并生成占位符建议</p>
        </div>

        <div class="preview-section">
          <div class="preview-header">
            <label>预览发送给AI的内容</label>
            <button @click="copyToClipboard" class="btn-copy" type="button">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
              </svg>
              复制
            </button>
          </div>
          <textarea 
            ref="previewTextarea"
            v-model="previewContent" 
            readonly
            class="preview-textarea"
            rows="8"
          ></textarea>
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>
      </div>

      <div class="dialog-footer">
        <button @click="$emit('cancel')" class="btn-secondary">
          取消
        </button>
        <button @click="handleGenerate" class="btn-primary" :disabled="isGenerating">
          {{ isGenerating ? '生成中...' : '开始生成' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch } from 'vue'

export default {
  name: 'AIPlaceholderDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    documentContent: {
      type: String,
      default: ''
    }
  },
  emits: ['confirm', 'cancel'],
  setup(props, { emit }) {
    const formData = ref({
      mode: 'mock',
      provider: 'kimi',
      apiKey: '',
      apiUrl: '',
      model: 'moonshot-v1-8k',
      documentType: ''
    })
    const error = ref(null)
    const isGenerating = ref(false)
    const previewTextarea = ref(null)
    const previewContent = ref('')

    // 从本地存储加载配置
    watch(() => props.visible, (newVal) => {
      if (newVal) {
        const saved = localStorage.getItem('ai_config')
        if (saved) {
          const config = JSON.parse(saved)
          formData.value = { ...formData.value, ...config }
        }
        error.value = null
        updatePreview()
      }
    })

    // 监听文档类型变化，更新预览
    watch(() => formData.value.documentType, () => {
      updatePreview()
    })

    // 监听 provider 变化，自动更新模型
    watch(() => formData.value.provider, (newProvider) => {
      if (newProvider === 'kimi') {
        formData.value.model = 'moonshot-v1-8k'
      } else if (newProvider === 'openrouter') {
        formData.value.model = 'deepseek/deepseek-r1:free'
      } else if (newProvider === 'openai') {
        formData.value.model = 'gpt-4o-mini'
      }
    })

    // 更新预览内容
    const updatePreview = () => {
      if (formData.value.documentType) {
        previewContent.value = `文档类型：${formData.value.documentType}\n\n文档内容：\n${props.documentContent}`
      } else {
        previewContent.value = `文档内容：\n${props.documentContent}`
      }
    }

    // 复制到剪贴板
    const copyToClipboard = async () => {
      try {
        await navigator.clipboard.writeText(previewContent.value)
        // 临时显示复制成功提示
        const btn = event.target.closest('button')
        const originalText = btn.innerHTML
        btn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> 已复制'
        setTimeout(() => {
          btn.innerHTML = originalText
        }, 2000)
      } catch (err) {
        // 降级方案：选中文本
        if (previewTextarea.value) {
          previewTextarea.value.select()
          document.execCommand('copy')
        }
      }
    }

    const handleGenerate = () => {
      error.value = null

      // 真实模式需要验证API Key
      if (formData.value.mode === 'real') {
        if (!formData.value.apiKey.trim()) {
          error.value = '请输入 API Key'
          return
        }

        if (formData.value.provider === 'custom' && !formData.value.apiUrl.trim()) {
          error.value = '请输入 API 地址'
          return
        }
      }

      // 保存配置（不保存 API Key）
      const configToSave = {
        mode: formData.value.mode,
        provider: formData.value.provider,
        apiUrl: formData.value.apiUrl,
        model: formData.value.model
      }
      localStorage.setItem('ai_config', JSON.stringify(configToSave))

      isGenerating.value = true
      emit('confirm', { ...formData.value })
    }

    return {
      formData,
      error,
      isGenerating,
      previewTextarea,
      previewContent,
      handleGenerate,
      copyToClipboard
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
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
}

.dialog-header h2 {
  margin: 0;
  color: #2c3e50;
}

.btn-close {
  background: none;
  border: none;
  font-size: 2rem;
  color: #999;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  width: 32px;
  height: 32px;
  transition: color 0.2s;
}

.btn-close:hover {
  color: #333;
}

.dialog-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #555;
}

.form-group input,
.select-input {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-group input:focus,
.select-input:focus {
  outline: none;
  border-color: #42b983;
}

.info-box {
  background: #e8f5e9;
  border-left: 4px solid #42b983;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.info-box p {
  margin: 0;
  color: #2c3e50;
  font-size: 0.9rem;
}

.preview-section {
  margin-bottom: 1.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem 1rem;
  background: #f5f5f5;
  border-bottom: 1px solid #ddd;
}

.preview-header label {
  margin: 0;
  font-weight: 500;
  color: #555;
  font-size: 0.9rem;
}

.btn-copy {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  background: white;
  color: #42b983;
  border: 1px solid #42b983;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-copy:hover {
  background: #42b983;
  color: white;
}

.preview-textarea {
  width: 100%;
  padding: 1rem;
  border: none;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 0.85rem;
  line-height: 1.6;
  resize: vertical;
  background: #fafafa;
  color: #333;
}

.preview-textarea:focus {
  outline: none;
  background: #fff;
}

.error-message {
  padding: 0.8rem;
  background: #ffebee;
  color: #c62828;
  border-radius: 4px;
  font-size: 0.9rem;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #eee;
}

.btn-secondary {
  background: white;
  color: #666;
  border: 1px solid #ddd;
  padding: 0.8rem 1.5rem;
  border-radius: 6px;
  transition: all 0.2s;
  cursor: pointer;
}

.btn-secondary:hover {
  background: #f5f5f5;
}

.btn-primary {
  background: #42b983;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 6px;
  transition: background 0.3s;
  cursor: pointer;
}

.btn-primary:hover:not(:disabled) {
  background: #359268;
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
