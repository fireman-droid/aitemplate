<template>
  <div v-if="visible" class="dialog-overlay" @click.self="$emit('cancel')">
    <div class="dialog">
      <div class="dialog-header">
        <h2>{{ mode === 'create' ? '添加占位符' : '编辑占位符' }}</h2>
        <button @click="$emit('cancel')" class="btn-close">×</button>
      </div>

      <div class="dialog-body">
        <div class="form-group">
          <label>名称 *</label>
          <input 
            v-model="formData.name"
            type="text"
            placeholder="例如：客户姓名"
            @keyup.enter="handleConfirm"
          />
        </div>

        <div class="form-group">
          <label>描述</label>
          <textarea 
            v-model="formData.description"
            placeholder="描述这个占位符的用途"
            rows="3"
          ></textarea>
        </div>

        <div class="form-group">
          <label>AI提示词（可选）</label>
          <textarea 
            v-model="formData.aiPrompt"
            placeholder="为AI填充提供提示，例如：生成一个正式的称呼"
            rows="2"
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
        <button @click="handleConfirm" class="btn-primary">
          {{ mode === 'create' ? '添加' : '保存' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch } from 'vue'

export default {
  name: 'PlaceholderDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    placeholder: {
      type: Object,
      default: null
    },
    mode: {
      type: String,
      default: 'create'
    }
  },
  emits: ['confirm', 'cancel'],
  setup(props, { emit }) {
    const formData = ref({
      name: '',
      description: '',
      aiPrompt: ''
    })
    const error = ref(null)

    // 监听 visible 变化，重置表单
    watch(() => props.visible, (newVal) => {
      if (newVal) {
        // 对话框打开时，根据 mode 和 placeholder 初始化表单
        if (props.mode === 'edit' && props.placeholder) {
          formData.value = {
            name: props.placeholder.name || '',
            description: props.placeholder.description || '',
            aiPrompt: props.placeholder.aiPrompt || ''
          }
        } else {
          // 创建模式，清空表单
          formData.value = {
            name: '',
            description: '',
            aiPrompt: ''
          }
        }
        error.value = null
      }
    })

    watch(() => props.placeholder, (newVal) => {
      if (newVal && props.mode === 'edit') {
        formData.value = {
          name: newVal.name || '',
          description: newVal.description || '',
          aiPrompt: newVal.aiPrompt || ''
        }
      }
      error.value = null
    })

    const handleConfirm = () => {
      error.value = null

      if (!formData.value.name.trim()) {
        error.value = '请输入占位符名称'
        return
      }

      emit('confirm', { ...formData.value })
    }

    return {
      formData,
      error,
      handleConfirm
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
.form-group textarea {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #42b983;
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
}

.btn-primary:hover {
  background: #359268;
}
</style>
