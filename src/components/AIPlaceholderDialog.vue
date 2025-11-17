<template>
  <el-dialog
    v-model="dialogVisible"
    title="AI 自动生成占位符"
    width="600px"
    @close="handleClose"
  >
    <el-form :model="formData" label-width="100px">
      <el-form-item label="文档用途">
        <el-input
          v-model="formData.documentType"
          placeholder="例如：离婚起诉状、销售合同、邀请函（可选）"
        >
          <template #append>
            <el-button :icon="InfoFilled" @click="showDocTypeHelp" />
          </template>
        </el-input>
      </el-form-item>

      <el-alert
        type="success"
        :closable="false"
        show-icon
      >
        <template #title>
          AI 将分析文档内容，自动识别需要替换的可变信息并生成占位符建议
        </template>
      </el-alert>

      <el-divider content-position="left">文档内容预览</el-divider>

      <el-input
        v-model="previewContent"
        type="textarea"
        :rows="8"
        readonly
        class="preview-textarea"
      />
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button
        type="primary"
        @click="handleGenerate"
        :loading="isGenerating"
      >
        {{ isGenerating ? '生成中...' : '开始生成' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script>
import { ref, watch, computed } from 'vue'
import { ElMessageBox } from 'element-plus'
import { InfoFilled } from '@element-plus/icons-vue'

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
      mode: 'real',
      provider: 'kimi',
      apiKey: 'sk-Y1Aby7GAeIqfxU7MbwBWRno8F6oHfDmy02hREFSKDM5rTiCO',
      apiUrl: '',
      model: 'moonshot-v1-8k',
      documentType: ''
    })
    const isGenerating = ref(false)
    const previewContent = ref('')

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
        updatePreview()
      }
    })

    watch(() => formData.value.documentType, () => {
      updatePreview()
    })

    const updatePreview = () => {
      if (formData.value.documentType) {
        previewContent.value = `文档类型：${formData.value.documentType}\n\n${props.documentContent}`
      } else {
        previewContent.value = props.documentContent
      }
    }

    const showDocTypeHelp = () => {
      ElMessageBox.alert(
        '常见文档类型：离婚起诉状、民事起诉状、劳动合同、销售合同、租赁合同、邀请函、通知书、证明文件等。\n\n提供文档类型有助于 AI 更准确地识别占位符。',
        '文档类型说明',
        { confirmButtonText: '知道了' }
      )
    }

    const handleGenerate = () => {
      isGenerating.value = true
      emit('confirm', { ...formData.value })
    }

    const handleClose = () => {
      isGenerating.value = false
      emit('cancel')
    }

    return {
      formData,
      dialogVisible,
      isGenerating,
      previewContent,
      InfoFilled,
      handleGenerate,
      handleClose,
      showDocTypeHelp
    }
  }
}
</script>

<style scoped>
.preview-textarea {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
}
</style>
