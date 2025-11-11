<template>
  <div class="file-uploader">
    <div 
      class="upload-area"
      :class="{ 'drag-over': isDragOver }"
      @drop.prevent="handleDrop"
      @dragover.prevent="isDragOver = true"
      @dragleave="isDragOver = false"
      @click="triggerFileInput"
    >
      <input 
        ref="fileInput"
        type="file"
        :accept="acceptedTypes.join(',')"
        @change="handleFileSelect"
        style="display: none"
      />
      
      <div class="upload-content">
        <svg class="upload-icon" viewBox="0 0 24 24" width="48" height="48">
          <path fill="currentColor" d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>
        </svg>
        <p class="upload-text">点击或拖拽Word文档到这里上传</p>
        <p class="upload-hint">支持 .doc 和 .docx 格式，最大 {{ maxSize }}MB</p>
      </div>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { FileService } from '@/services/fileService'

export default {
  name: 'FileUploader',
  props: {
    acceptedTypes: {
      type: Array,
      default: () => [
        'text/plain', 
        'text/html', 
        'image/*',
        '.doc',
        '.docx',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.pdf',
        'application/pdf'
      ]
    },
    maxSize: {
      type: Number,
      default: 10
    }
  },
  emits: ['file-selected', 'error'],
  setup(props, { emit }) {
    const fileInput = ref(null)
    const isDragOver = ref(false)
    const error = ref(null)

    const triggerFileInput = () => {
      fileInput.value?.click()
    }

    const handleFileSelect = (event) => {
      const file = event.target.files[0]
      if (file) {
        validateAndEmit(file)
      }
    }

    const handleDrop = (event) => {
      isDragOver.value = false
      const file = event.dataTransfer.files[0]
      if (file) {
        validateAndEmit(file)
      }
    }

    const validateAndEmit = (file) => {
      error.value = null
      
      const validation = FileService.validateFile(file, {
        maxSize: props.maxSize,
        acceptedTypes: props.acceptedTypes
      })

      if (!validation.valid) {
        error.value = validation.error
        emit('error', validation.error)
        return
      }

      emit('file-selected', file)
    }

    return {
      fileInput,
      isDragOver,
      error,
      triggerFileInput,
      handleFileSelect,
      handleDrop
    }
  }
}
</script>

<style scoped>
.file-uploader {
  width: 100%;
}

.upload-area {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  background: white;
}

.upload-area:hover {
  border-color: #42b983;
  background: #f9f9f9;
}

.upload-area.drag-over {
  border-color: #42b983;
  background: #e8f5e9;
}

.upload-content {
  pointer-events: none;
}

.upload-icon {
  color: #42b983;
  margin-bottom: 1rem;
}

.upload-text {
  font-size: 1.1rem;
  color: #333;
  margin-bottom: 0.5rem;
}

.upload-hint {
  font-size: 0.9rem;
  color: #999;
}

.error-message {
  margin-top: 1rem;
  padding: 0.8rem;
  background: #ffebee;
  color: #c62828;
  border-radius: 4px;
  text-align: center;
}
</style>
