<template>
  <el-dialog
    v-model="dialogVisible"
    title="AI 智能填充内容"
    width="650px"
    @close="handleClose"
  >
    <el-form :model="formData" label-width="120px">
      <el-form-item label="上传资料文件" required>
        <el-upload
          ref="uploadRef"
          :auto-upload="false"
          :show-file-list="true"
          :limit="1"
          accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          :on-change="handleFileChange"
          :on-remove="handleFileRemove"
        >
          <el-button :icon="Upload">选择 Word 文件</el-button>
          <template #tip>
            <div class="el-upload__tip">
              上传包含实际数据的 Word 文档，AI 将从中提取信息填充到表单
            </div>
          </template>
        </el-upload>
      </el-form-item>

      <el-form-item label="AI 提供商" required>
        <el-select v-model="formData.provider" placeholder="请选择AI提供商" @change="handleProviderChange">
          <el-option label="DeepSeek - 推荐" value="deepseek" />
          <el-option label="Kimi (月之暗面)" value="kimi" />
          <el-option label="Gemini (Google) - 需要代理" value="gemini" />
        </el-select>
      </el-form-item>
      
      <el-alert
        v-if="formData.provider === 'gemini'"
        type="warning"
        :closable="false"
        show-icon
        style="margin-bottom: 16px;"
      >
        <template #title>
          Gemini API在中国大陆可能无法直接访问，需要使用代理或VPN
        </template>
      </el-alert>

      <el-form-item label="API Key" required>
        <el-input
          v-model="formData.apiKey"
          type="password"
          show-password
          placeholder="请输入API密钥"
        />
      </el-form-item>

      <el-form-item label="模型">
        <el-input
          v-model="formData.model"
          placeholder="留空使用默认模型"
        />
      </el-form-item>

      <el-form-item label="文档类型">
        <el-input
          v-model="formData.documentType"
          placeholder="例如：个人简历、合同资料、案件材料（可选）"
        >
          <template #append>
            <el-button :icon="InfoFilled" @click="showDocTypeHelp" />
          </template>
        </el-input>
      </el-form-item>

      <el-alert
        type="info"
        :closable="false"
        show-icon
      >
        <template #title>
          AI 将从资料文件中提取信息，自动填充到模板的占位符中
        </template>
      </el-alert>

      <el-divider content-position="left">资料文件预览</el-divider>

      <el-input
        v-model="previewContent"
        type="textarea"
        :rows="8"
        readonly
        placeholder="请先上传资料文件"
        class="preview-textarea"
      />
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button
        type="primary"
        @click="handleGenerate"
        :loading="isGenerating"
        :disabled="!dataFile"
      >
        {{ isGenerating ? 'AI 分析中...' : '开始填充' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { InfoFilled, Upload } from '@element-plus/icons-vue'
import { DocumentService } from '@/services/documentService'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  placeholders: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['confirm', 'cancel'])

const formData = ref({
  provider: 'deepseek',
  apiKey: 'sk-94498aa676b64586ab39474fefbba9bb',
  apiUrl: '',
  model: '',
  documentType: ''
})

const isGenerating = ref(false)
const previewContent = ref('')
const dataFile = ref(null)
const uploadRef = ref(null)

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => {
    if (!val) {
      emit('cancel')
    }
  }
})

watch(() => props.visible, (newVal) => {
  if (newVal) {
    // 重置状态
    dataFile.value = null
    previewContent.value = ''
    formData.value.documentType = ''
  }
})

const handleFileChange = async (uploadFile) => {
  const file = uploadFile.raw
  if (!file) return

  try {
    // 读取 Word 文档内容
    const result = await DocumentService.parseWordDocument(file)
    previewContent.value = result.html

    // 提取纯文本
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = result.html
    const plainText = tempDiv.textContent || tempDiv.innerText || ''

    dataFile.value = {
      file: file,
      content: plainText,
      html: result.html
    }

    ElMessage.success('资料文件读取成功')
  } catch (error) {
    console.error('文件读取失败:', error)
    ElMessage.error('文件读取失败: ' + error.message)
    dataFile.value = null
    previewContent.value = ''
  }
}

const handleFileRemove = () => {
  dataFile.value = null
  previewContent.value = ''
}

const showDocTypeHelp = () => {
  ElMessageBox.alert(
    '常见文档类型：个人简历、劳动合同、销售合同、租赁合同、案件材料、证明文件等。\n\n提供文档类型有助于 AI 更准确地提取信息。',
    '文档类型说明',
    { confirmButtonText: '知道了' }
  )
}

const handleGenerate = () => {
  if (!dataFile.value) {
    ElMessage.warning('请先上传资料文件')
    return
  }

  isGenerating.value = true

  // 传递给 AI 的数据
  const aiData = {
    ...formData.value,
    dataFileContent: dataFile.value.content,
    placeholders: props.placeholders,
    documentType: formData.value.documentType
  }

  emit('confirm', aiData)
}

const handleProviderChange = (provider) => {
  // 切换提供商时更新默认配置
  if (provider === 'deepseek') {
    formData.value.apiKey = 'sk-94498aa676b64586ab39474fefbba9bb'
    formData.value.model = 'deepseek-chat'
    formData.value.apiUrl = ''
  } else if (provider === 'kimi') {
    formData.value.apiKey = 'sk-Y1Aby7GAeIqfxU7MbwBWRno8F6oHfDmy02hREFSKDM5rTiCO'
    formData.value.model = 'moonshot-v1-8k'
    formData.value.apiUrl = ''
  } else if (provider === 'gemini') {
    formData.value.apiKey = 'AIzaSyDjDiBhXDcoIgllDcb5vUb80wuRajea2B8'
    formData.value.model = 'gemini-pro'
    formData.value.apiUrl = ''
  }
}

const handleClose = () => {
  isGenerating.value = false
  emit('cancel')
}
</script>


<style scoped>
.preview-textarea {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
}
</style>
