<template>
  <div class="editor">
    <div v-if="!templateStore.currentTemplate" class="upload-section">
      <h2>上传模板文件</h2>
      <FileUploader 
        @file-selected="handleFileSelected"
        @error="handleError"
      />
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

    <div v-if="notification" class="notification" :class="notification.type">
      {{ notification.message }}
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
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
    const notification = ref(null)
    const currentProjectId = ref(null)

    const handleFileSelected = async (file) => {
      try {
        await templateStore.uploadTemplate(file)
        showNotification('文件上传成功', 'success')
      } catch (error) {
        showNotification('文件上传失败: ' + error.message, 'error')
      }
    }

    const handleError = (error) => {
      showNotification(error, 'error')
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
        showNotification('请先选择文本', 'error')
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
          showNotification('选中的文本信息丢失，请重新选择', 'error')
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
        
        showNotification('占位符添加成功', 'success')
      } else {
        placeholderStore.updatePlaceholder(editingPlaceholder.value.id, data)
        showNotification('占位符更新成功', 'success')
      }
      closeDialog()
      
      // 清除页面上的文本选中状态
      if (window.getSelection) {
        window.getSelection().removeAllRanges()
      }
    }

    const deletePlaceholder = (placeholderId) => {
      if (confirm('确定要删除这个占位符吗？')) {
        placeholderStore.deletePlaceholder(placeholderId)
        showNotification('占位符已删除', 'success')
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
        showNotification('请先上传文档', 'error')
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
      try {
        // 显示加载提示，让用户知道 AI 正在工作
        showNotification('AI 正在分析文档...', 'info')

        // ===== 步骤1: 提取文档纯文本内容 =====
        // 因为 templateStore 中存储的是 HTML 格式的内容，
        // 我们需要将其转换为纯文本，以便 AI 分析和后续的文本定位
        const tempDiv = document.createElement('div')  // 创建临时 DOM 元素
        tempDiv.innerHTML = templateStore.currentTemplate.content  // 将 HTML 内容注入
        // 提取纯文本：textContent 优先，兼容 innerText
        const documentContent = tempDiv.textContent || tempDiv.innerText || ''

        // ===== 步骤2: 调用 AI 服务生成占位符建议 =====
        // AIService.generatePlaceholders 会：
        // - 将文档内容和配置发送给 AI 模型
        // - AI 分析文档结构，识别需要动态替换的字段
        // - 返回建议列表，每个建议包含：name（占位符名称）、text（原文本）、reason（原因）
        const suggestions = await AIService.generatePlaceholders(
          config,
          documentContent,
          config.documentType
        )

        // 关闭 AI 配置对话框
        closeAIDialog()

        // ===== 步骤3: 验证 AI 返回结果 =====
        if (!suggestions || suggestions.length === 0) {
          showNotification('AI 未识别到需要添加占位符的内容', 'info')
          return
        }

        // ===== 步骤4: 批量处理 AI 建议，转换为占位符 =====
        let addedCount = 0  // 记录成功添加的占位符数量
        
        for (const suggestion of suggestions) {
          // ===== 步骤4.1: 在文档中定位建议文本的位置 =====
          // indexOf 返回文本首次出现的位置索引
          // 注意：如果文档中有重复文本，这里只会找到第一个
          // 更复杂的实现可能需要考虑上下文或使用更精确的定位算法
          const startOffset = documentContent.indexOf(suggestion.text)
          
          // ===== 步骤4.2: 验证文本是否找到 =====
          if (startOffset !== -1) {
            // ===== 步骤4.3: 创建占位符对象并添加到 store =====
            placeholderStore.addPlaceholder({
              name: suggestion.name,           // AI 建议的占位符名称（如：甲方名称）
              description: suggestion.reason || '',  // AI 给出的建议原因
              position: {
                startOffset: startOffset,      // 文本在文档中的起始位置
                endOffset: startOffset + suggestion.text.length  // 结束位置 = 起始位置 + 文本长度
              }
            })
            addedCount++  // 成功添加计数
          }
          // 如果 startOffset === -1，说明在文档中没找到该文本，跳过此建议
        }

        // ===== 步骤5: 显示成功消息 =====
        showNotification(`AI 成功生成 ${addedCount} 个占位符`, 'success')
        
      } catch (error) {
        // ===== 错误处理 =====
        // 可能的错误：网络问题、AI 服务异常、解析失败等
        console.error('AI生成失败:', error)
        showNotification('AI 生成失败: ' + error.message, 'error')
        closeAIDialog()
      }
    }

    const downloadFile = async () => {
      if (!templateStore.currentTemplate) return

      try {
        const originalArrayBuffer = templateStore.currentTemplate.originalArrayBuffer
        
        if (!originalArrayBuffer) {
          showNotification('原始文件数据丢失，请重新上传', 'error')
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
        // 需要处理Word的XML格式，文本可能被分割在多个<w:t>标签中
        for (const { original, replacement } of replacements) {
          // 转义XML特殊字符
          const escapedOriginal = original
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
          
          const escapedReplacement = replacement
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
          
          // 简单替换（可能需要更复杂的逻辑处理跨标签的文本）
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
        
        showNotification('Word文档下载成功', 'success')
      } catch (error) {
        console.error('生成Word文档失败:', error)
        showNotification('生成Word文档失败: ' + error.message, 'error')
      }
    }

    const loadProject = (projectId) => {
      const project = StorageService.loadProject(projectId)
      if (project) {
        templateStore.currentTemplate = project.template
        placeholderStore.placeholders = project.placeholders || []
        currentProjectId.value = project.id
        showNotification('项目加载成功', 'success')
      }
    }

    const showNotification = (message, type = 'info') => {
      notification.value = { message, type }
      setTimeout(() => {
        notification.value = null
      }, 3000)
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
      notification,
      handleFileSelected,
      handleError,
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
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem 0;
}

.upload-section h2 {
  text-align: center;
  margin-bottom: 2rem;
  color: #2c3e50;
}

.editor-workspace {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.workspace-content {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 1rem;
}

.preview-section {
  min-height: 500px;
}

.sidebar {
  position: sticky;
  top: 1rem;
  height: fit-content;
}

.notification {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  padding: 1rem 1.5rem;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  animation: slideIn 0.3s ease;
  z-index: 1000;
}

.notification.success {
  background: #4caf50;
  color: white;
}

.notification.error {
  background: #f44336;
  color: white;
}

.notification.info {
  background: #2196f3;
  color: white;
}

@keyframes slideIn {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@media (max-width: 1024px) {
  .workspace-content {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: static;
  }
}
</style>
