<template>
  <div class="editor">
    <div v-if="!templateStore.currentTemplate" class="upload-section">
      <h2>上传模板文件</h2>
      <FileUploader 
        @file-selected="handleFileSelected"
        @error="handleError"
      />
      <!-- 调试信息 -->
      <div style="margin-top: 20px; padding: 10px; background: #f0f0f0; border-radius: 4px; font-size: 12px;">
        <p><strong>调试信息:</strong></p>
        <p>currentTemplate: {{ templateStore.currentTemplate ? '已设置 ✓' : '未设置 ✗' }}</p>
        <p>isLoading: {{ templateStore.isLoading ? '加载中...' : '空闲' }}</p>
        <p>error: {{ templateStore.error || '无' }}</p>
        <el-button size="small" @click="testStore" style="margin-top: 10px;">测试 Store</el-button>
      </div>
    </div>

    <div v-else class="editor-workspace">
      <PlaceholderToolbar 
        :can-add-placeholder="!!selectedText"
        :can-undo="placeholderStore.canUndo"
        :can-redo="placeholderStore.canRedo"
        @ai-generate="showAIDialog"
        @add-placeholder="showPlaceholderDialog"
        @undo="placeholderStore.undo()"
        @redo="placeholderStore.redo()"
        @download="downloadFile"
      />

      <div class="workspace-content">
        <div class="preview-section">
          <TemplatePreview 
            :content="templateStore.currentTemplate.content"
            :content-type="templateStore.currentTemplate.contentType"
            :placeholders="placeholderStore.placeholders"
            :active-placeholder-id="placeholderStore.activePlaceholderId"
            @text-select="handleTextSelect"
            @placeholder-click="placeholderStore.setActivePlaceholder"
            @add-placeholder="handleQuickAddPlaceholder"
          />
        </div>

        <div class="sidebar">
          <PlaceholderList 
            :placeholders="placeholderStore.placeholders"
            :active-placeholder-id="placeholderStore.activePlaceholderId"
            @select="placeholderStore.setActivePlaceholder"
            @edit="editPlaceholder"
            @delete="deletePlaceholder"
          />
        </div>
      </div>
    </div>

    <PlaceholderDialog 
      :visible="dialogVisible"
      :placeholder="editingPlaceholder"
      :mode="dialogMode"
      @confirm="handlePlaceholderConfirm"
      @cancel="closeDialog"
    />

    <AIPlaceholderDialog 
      :visible="aiDialogVisible"
      :document-content="documentContent"
      @confirm="handleAIGenerate"
      @cancel="closeAIDialog"
    />
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useTemplateStore } from '@/stores/template'
import { usePlaceholderStore } from '@/stores/placeholder'
import { StorageService } from '@/services/storageService'
import FileUploader from '@/components/FileUploader.vue'
import TemplatePreview from '@/components/TemplatePreview.vue'
import PlaceholderToolbar from '@/components/PlaceholderToolbar.vue'
import PlaceholderList from '@/components/PlaceholderList.vue'
import PlaceholderDialog from '@/components/PlaceholderDialog.vue'
import AIPlaceholderDialog from '@/components/AIPlaceholderDialog.vue'
import { AIService } from '@/services/aiService'
import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
import { saveAs } from 'file-saver'

export default {
  name: 'Editor',
  components: {
    FileUploader,
    TemplatePreview,
    PlaceholderToolbar,
    PlaceholderList,
    PlaceholderDialog,
    AIPlaceholderDialog
  },
  setup() {
    const route = useRoute()
    const templateStore = useTemplateStore()
    const placeholderStore = usePlaceholderStore()

    const selectedText = ref(null)
    const dialogVisible = ref(false)
    const dialogMode = ref('create')
    const editingPlaceholder = ref(null)
    const aiDialogVisible = ref(false)
    const documentContent = ref('')
    const currentProjectId = ref(null)

    const handleFileSelected = async (file) => {
      console.log('=== 开始上传文件 ===')
      console.log('文件名:', file.name)
      console.log('文件类型:', file.type)
      console.log('文件大小:', file.size)
      
      try {
        await templateStore.uploadTemplate(file)
        console.log('上传成功，currentTemplate:', templateStore.currentTemplate)
        ElMessage.success('文件上传成功')
      } catch (error) {
        console.error('上传失败:', error)
        ElMessage.error('文件上传失败: ' + error.message)
      }
    }

    const handleError = (error) => {
      ElMessage.error(error)
    }

    const testStore = () => {
      console.log('=== 测试 Store ===')
      console.log('templateStore:', templateStore)
      console.log('currentTemplate:', templateStore.currentTemplate)
      console.log('isLoading:', templateStore.isLoading)
      console.log('error:', templateStore.error)
      
      // 手动设置一个测试模板
      templateStore.currentTemplate = {
        id: 'test',
        name: '测试模板.docx',
        content: '<p>这是测试内容</p>',
        contentType: 'document',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      console.log('设置后 currentTemplate:', templateStore.currentTemplate)
      ElMessage.success('已设置测试模板')
    }

    const handleTextSelect = (selection) => {
      selectedText.value = selection
    }

    const handleQuickAddPlaceholder = (selection) => {
      selectedText.value = selection
      // 确保是创建模式，清空编辑状态
      dialogMode.value = 'create'
      editingPlaceholder.value = null
      dialogVisible.value = true
    }

    const showPlaceholderDialog = () => {
      if (!selectedText.value) {
        ElMessage.warning('请先选择文本')
        return
      }
      // 确保是创建模式，清空编辑状态
      dialogMode.value = 'create'
      editingPlaceholder.value = null
      dialogVisible.value = true
    }

    const editPlaceholder = (placeholderId) => {
      const placeholder = placeholderStore.placeholders.find(p => p.id === placeholderId)
      if (placeholder) {
        dialogMode.value = 'edit'
        editingPlaceholder.value = placeholder
        dialogVisible.value = true
      }
    }

    const handlePlaceholderConfirm = (data) => {
      if (dialogMode.value === 'create') {
        if (!selectedText.value) {
          ElMessage.error('选中的文本信息丢失，请重新选择')
          closeDialog()
          return
        }
        
        console.log('=== 添加占位符 ===')
        console.log('占位符名称:', data.name)
        console.log('选中文本:', selectedText.value.text)
        console.log('位置信息:', selectedText.value.startOffset, '-', selectedText.value.endOffset)
        console.log('当前已有占位符数量:', placeholderStore.placeholders.length)
        
        const newPlaceholder = placeholderStore.addPlaceholder({
          ...data,
          position: {
            startOffset: selectedText.value.startOffset,
            endOffset: selectedText.value.endOffset
          }
        })
        
        console.log('新增占位符ID:', newPlaceholder.id)
        console.log('添加后占位符总数:', placeholderStore.placeholders.length)
        console.log('==================')
        
        ElMessage.success('占位符添加成功')
      } else {
        placeholderStore.updatePlaceholder(editingPlaceholder.value.id, data)
        ElMessage.success('占位符更新成功')
      }
      closeDialog()
      
      // 清除页面上的文本选中状态
      if (window.getSelection) {
        window.getSelection().removeAllRanges()
      }
    }

    const deletePlaceholder = async (placeholderId) => {
      try {
        await ElMessageBox.confirm('确定要删除这个占位符吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        placeholderStore.deletePlaceholder(placeholderId)
        ElMessage.success('占位符已删除')
      } catch {
        // 用户取消删除
      }
    }

    const closeDialog = () => {
      dialogVisible.value = false
      editingPlaceholder.value = null
      selectedText.value = null
      dialogMode.value = 'create'
    }

    /**
     * 显示 AI 智能生成对话框
     * 
     * 这是 AI 功能的入口点，用户点击"AI 生成"按钮时触发
     * 主要职责：
     * 1. 验证是否已上传文档
     * 2. 提取文档内容供 AI 分析预览
     * 3. 打开配置对话框让用户设置 AI 参数
     */
    const showAIDialog = () => {
      // ===== 前置检查：确保已上传文档 =====
      if (!templateStore.currentTemplate) {
        ElMessage.warning('请先上传文档')
        return
      }
      
      // ===== 提取文档纯文本内容 =====
      // 这里提取的内容会传递给 AIPlaceholderDialog 组件
      // 用于在对话框中显示文档预览，让用户了解 AI 将分析的内容
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = templateStore.currentTemplate.content
      documentContent.value = tempDiv.textContent || tempDiv.innerText || ''
      
      // ===== 显示 AI 配置对话框 =====
      // 用户可以在对话框中：
      // - 选择文档类型（合同、简历等）
      // - 输入自定义提示词
      // - 指定需要识别的字段
      aiDialogVisible.value = true
    }

    const closeAIDialog = () => {
      aiDialogVisible.value = false
    }

    /**
     * AI 智能生成占位符的核心处理函数
     * 
     * 工作流程：
     * 1. 提取文档纯文本内容
     * 2. 调用 AI 服务分析文档，识别需要替换的字段
     * 3. 将 AI 返回的建议转换为占位符对象
     * 4. 在文档中定位每个建议文本的位置
     * 5. 批量添加占位符到 store 中
     * 
     * @param {Object} config - AI 生成配置对象
     * @param {string} config.documentType - 文档类型（如：合同、简历等）
     * @param {string} config.customPrompt - 用户自定义的提示词
     * @param {Array} config.fields - 用户指定的字段列表
     */
    const handleAIGenerate = async (config) => {
      const loading = ElMessage({
        message: 'AI 正在分析文档...',
        type: 'info',
        duration: 0
      })

      try {
        // ===== 步骤1: 提取文档纯文本内容 =====
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = templateStore.currentTemplate.content
        const documentContent = tempDiv.textContent || tempDiv.innerText || ''

        // ===== 步骤2: 调用 AI 服务生成占位符建议 =====
        const suggestions = await AIService.generatePlaceholders(
          config,
          documentContent,
          config.documentType
        )

        loading.close()
        closeAIDialog()

        // ===== 步骤3: 验证 AI 返回结果 =====
        if (!suggestions || suggestions.length === 0) {
          ElMessage.info('AI 未识别到需要添加占位符的内容')
          return
        }

        // ===== 步骤4: 批量处理 AI 建议，转换为占位符 =====
        let addedCount = 0
        
        for (const suggestion of suggestions) {
          const startOffset = documentContent.indexOf(suggestion.text)
          
          if (startOffset !== -1) {
            placeholderStore.addPlaceholder({
              name: suggestion.name,
              description: suggestion.reason || '',
              position: {
                startOffset: startOffset,
                endOffset: startOffset + suggestion.text.length
              }
            })
            addedCount++
          }
        }

        // ===== 步骤5: 显示成功消息 =====
        ElMessage.success(`AI 成功生成 ${addedCount} 个占位符`)
        
      } catch (error) {
        loading.close()
        console.error('AI生成失败:', error)
        ElMessage.error('AI 生成失败: ' + error.message)
        closeAIDialog()
      }
    }

    const downloadFile = async () => {
      if (!templateStore.currentTemplate) return

      const loading = ElMessage({
        message: '正在生成文档...',
        type: 'info',
        duration: 0
      })

      try {
        const originalArrayBuffer = templateStore.currentTemplate.originalArrayBuffer
        
        if (!originalArrayBuffer) {
          loading.close()
          ElMessage.error('原始文件数据丢失，请重新上传')
          return
        }

        // 加载原始Word文档
        const zip = new PizZip(originalArrayBuffer)
        const doc = new Docxtemplater(zip, {
          paragraphLoop: true,
          linebreaks: true,
        })

        // 获取文档的XML内容
        let xmlContent = zip.files['word/document.xml'].asText()
        
        // 按位置倒序排列，从后往前替换
        const sortedPlaceholders = [...placeholderStore.placeholders].sort(
          (a, b) => b.position.startOffset - a.position.startOffset
        )

        // 提取纯文本用于定位
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = templateStore.currentTemplate.content
        let plainText = tempDiv.textContent || tempDiv.innerText || ''

        // 创建替换映射
        const replacements = []
        for (const placeholder of sortedPlaceholders) {
          const originalText = plainText.substring(
            placeholder.position.startOffset,
            placeholder.position.endOffset
          )
          replacements.push({
            original: originalText,
            replacement: `{${placeholder.name}}`
          })
        }

        // 在XML中进行替换
        for (const { original, replacement } of replacements) {
          const escapedOriginal = original
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
          
          const escapedReplacement = replacement
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
          
          xmlContent = xmlContent.replace(
            new RegExp(`(<w:t[^>]*>)([^<]*${escapedOriginal}[^<]*)(<\\/w:t>)`, 'g'),
            (match, openTag, text, closeTag) => {
              return openTag + text.replace(escapedOriginal, escapedReplacement) + closeTag
            }
          )
        }

        // 更新ZIP中的文档内容
        zip.file('word/document.xml', xmlContent)

        // 生成新的Word文档
        const blob = zip.generate({
          type: 'blob',
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        })

        // 生成文件名
        const originalName = templateStore.currentTemplate.name
        const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '')
        
        saveAs(blob, `${nameWithoutExt}_占位符.docx`)
        
        loading.close()
        ElMessage.success('Word文档下载成功')
      } catch (error) {
        loading.close()
        console.error('生成Word文档失败:', error)
        ElMessage.error('生成Word文档失败: ' + error.message)
      }
    }

    const loadProject = (projectId) => {
      const project = StorageService.loadProject(projectId)
      if (project) {
        templateStore.currentTemplate = project.template
        placeholderStore.placeholders = project.placeholders || []
        currentProjectId.value = project.id
        ElMessage.success('项目加载成功')
      }
    }

    onMounted(() => {
      const projectId = route.params.projectId
      if (projectId) {
        loadProject(projectId)
      }
    })

    return {
      templateStore,
      placeholderStore,
      selectedText,
      dialogVisible,
      dialogMode,
      editingPlaceholder,
      aiDialogVisible,
      documentContent,
      handleFileSelected,
      handleError,
      testStore,
      handleTextSelect,
      handleQuickAddPlaceholder,
      showPlaceholderDialog,
      showAIDialog,
      closeAIDialog,
      handleAIGenerate,
      editPlaceholder,
      handlePlaceholderConfirm,
      deletePlaceholder,
      closeDialog,
      downloadFile
    }
  }
}
</script>

<style scoped>
.editor {
  min-height: calc(100vh - 200px);
}

.upload-section {
  max-width: 700px;
  margin: 0 auto;
  padding: 3rem 0;
}

.upload-section h2 {
  text-align: center;
  margin-bottom: 2rem;
  color: #303133;
  font-size: 24px;
}

.editor-workspace {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.workspace-content {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 16px;
}

.preview-section {
  min-height: 500px;
}

.sidebar {
  position: sticky;
  top: 24px;
  height: fit-content;
  max-height: calc(100vh - 120px);
}

@media (max-width: 1024px) {
  .workspace-content {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: static;
    max-height: none;
  }
}
</style>
