<template>
  <div class="file-uploader">
    <el-upload
      class="upload-area"
      drag
      :accept="acceptedTypes.join(',')"
      :on-change="handleFileChange"
      :auto-upload="false"
      :show-file-list="false"
    >
      <el-icon class="el-icon--upload"><upload-filled /></el-icon>
      <div class="el-upload__text">
        将文件拖到此处，或<em>点击上传</em>
      </div>
      <template #tip>
        <div class="el-upload__tip">
          支持 .doc 和 .docx 格式，最大 {{ maxSize }}MB
        </div>
      </template>
    </el-upload>
  </div>
</template>

<script>
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
    const handleFileChange = (uploadFile) => {
      console.log('[FileUploader] 文件选择:', uploadFile)
      
      // uploadFile 是 Element Plus 的文件对象，需要获取原始文件
      const file = uploadFile.raw
      
      if (!file) {
        console.error('[FileUploader] 无法获取原始文件')
        return
      }
      
      console.log('[FileUploader] 原始文件:', file.name, file.type, file.size)
      
      const validation = FileService.validateFile(file, {
        maxSize: props.maxSize,
        acceptedTypes: props.acceptedTypes
      })

      if (!validation.valid) {
        console.log('[FileUploader] 验证失败:', validation.error)
        emit('error', validation.error)
        return
      }

      console.log('[FileUploader] 验证通过，触发 file-selected 事件')
      emit('file-selected', file)
    }

    return {
      handleFileChange
    }
  }
}
</script>

<style scoped>
.file-uploader {
  width: 100%;
}

.upload-area {
  width: 100%;
}
</style>
