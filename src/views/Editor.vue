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
        :can-add-placeholder="false"
        :can-undo="false"
        :can-redo="false"
        @ai-generate="showAIDialog"
        @download="downloadFile"
      />

      <div class="workspace-content">
        <div class="preview-section">
          <TemplatePreview 
            :content="templateStore.currentTemplate.content"
            :content-type="templateStore.currentTemplate.contentType"
            :placeholders="placeholderStore.placeholders"
            :active-placeholder-id="placeholderStore.activePlaceholderId"
          />
        </div>

        <div class="sidebar">
          <!-- AI 返回数据显示卡片 -->
          <el-card v-if="aiResultData" class="ai-result-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>AI 提取结果</span>
                <el-button size="small" text @click="aiResultData = null">关闭</el-button>
              </div>
            </template>
            <el-scrollbar max-height="200px">
              <pre class="json-display">{{ JSON.stringify(aiResultData, null, 2) }}</pre>
            </el-scrollbar>
            <template #footer>
              <el-button size="small" @click="copyAIResult">复制 JSON</el-button>
              <el-button size="small" type="primary" @click="applyAIResult">应用到表单</el-button>
            </template>
          </el-card>

          <PlaceholderList 
            ref="placeholderListRef"
            :placeholders="placeholderStore.placeholders"
            :active-placeholder-id="placeholderStore.activePlaceholderId"
            @fill-placeholders="handleFillPlaceholders"
          />
        </div>
      </div>
    </div>

    <!-- AI 对话框 -->
    <AIPlaceholderDialog 
      :visible="aiDialogVisible"
      :placeholders="placeholderStore.placeholders"
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
    const aiResultData = ref(null)
    const placeholderListRef = ref(null)

    const handleFileSelected = async (file) => {
      console.log('=== 开始上传文件 ===')
      console.log('文件名:', file.name)
      console.log('文件类型:', file.type)
      console.log('文件大小:', file.size)
      
      try {
        await templateStore.uploadTemplate(file)
        console.log('上传成功，currentTemplate:', templateStore.currentTemplate)
        
        // 自动提取占位符
        extractPlaceholders()
        
        ElMessage.success('文件上传成功')
      } catch (error) {
        console.error('上传失败:', error)
        ElMessage.error('文件上传失败: ' + error.message)
      }
    }

    // 从文档内容中提取占位符
    const extractPlaceholders = () => {
      if (!templateStore.currentTemplate) return

      const content = templateStore.currentTemplate.content
      // 匹配 {xxx} 格式的占位符
      const regex = /\{([^}]+)\}/g
      const matches = content.matchAll(regex)
      const placeholderNames = new Set()

      for (const match of matches) {
        placeholderNames.add(match[1])
      }

      console.log('提取到的占位符:', Array.from(placeholderNames))

      // 直接设置占位符数组，避免使用 addPlaceholder 导致的响应式问题
      const newPlaceholders = Array.from(placeholderNames).map((name, index) => ({
        id: `placeholder_${Date.now()}_${index}`,
        name: name,
        description: `自动提取的占位符`,
        position: {
          startOffset: 0,
          endOffset: 0
        },
        createdAt: new Date()
      }))

      placeholderStore.placeholders = newPlaceholders

      ElMessage.success(`已提取 ${placeholderNames.size} 个占位符`)
    }

    // 处理填充占位符
    const handleFillPlaceholders = (formData) => {
      if (!templateStore.currentTemplate) return

      let content = templateStore.currentTemplate.content

      console.log('开始填充占位符，表单数据:', formData)
      console.log('原始内容长度:', content.length)

      // 替换所有占位符
      let replacedCount = 0
      Object.entries(formData).forEach(([key, value]) => {
        if (value) {
          const regex = new RegExp(`\\{${key}\\}`, 'g')
          const matches = content.match(regex)
          if (matches) {
            content = content.replace(regex, value)
            replacedCount += matches.length
            console.log(`替换 {${key}} -> ${value}, 共 ${matches.length} 处`)
          }
        }
      })

      console.log('替换后内容长度:', content.length)
      console.log('共替换:', replacedCount, '处')

      // 使用 store 的 updateTemplate 方法来触发响应式更新
      console.log('更新前 template content 长度:', templateStore.currentTemplate.content.length)
      templateStore.updateTemplate({ content: content })
      console.log('更新后 template content 长度:', templateStore.currentTemplate.content.length)
      
      // 强制触发视图更新
      console.log('触发视图更新')

      ElMessage.success(`占位符已填充到文档（${replacedCount}处）`)
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
      if (!templateStore.currentTemplate) {
        ElMessage.warning('请先上传模板文档')
        return
      }
      
      if (placeholderStore.placeholders.length === 0) {
        ElMessage.warning('模板中没有占位符')
        return
      }
      
      aiDialogVisible.value = true
    }

    const closeAIDialog = () => {
      aiDialogVisible.value = false
    }

    /**
     * AI 智能填充内容的核心处理函数
     * 
     * 工作流程：
     * 1. 从资料文件中提取纯文本内容
     * 2. 调用 AI 服务从资料中提取信息填充占位符
     * 3. 将 AI 返回的填充结果应用到表单
     * 
     * @param {Object} config - AI 配置对象
     * @param {string} config.dataFileContent - 资料文件的纯文本内容
     * @param {string} config.documentType - 文档类型（如：合同、简历等）
     * @param {Array} config.placeholders - 占位符列表
     */
    const handleAIGenerate = async (config) => {
      const loading = ElMessage({
        message: 'AI 正在提取信息...',
        type: 'info',
        duration: 0
      })

      try {
        // ===== 步骤1: 调用 AI 服务从资料文件中提取数据 =====
        const extractedData = await AIService.extractDataForTemplate(
          config,
          config.dataFileContent,
          placeholderStore.placeholders
        )

        loading.close()
        closeAIDialog()

        console.log('AI 返回的数据:', extractedData)

        // ===== 步骤2: 验证 AI 返回结果 =====
        if (!extractedData || Object.keys(extractedData).length === 0) {
          ElMessage.info('AI 未能从资料中提取到信息')
          return
        }

        // ===== 步骤3: 保存 AI 返回的数据并显示 =====
        aiResultData.value = extractedData
        
        // ===== 步骤4: 应用填充结果到表单 =====
        applyAIResult()
        
        // ===== 步骤5: 显示成功消息 =====
        const filledCount = Object.values(extractedData).filter(v => v && v !== '').length
        ElMessage.success(`AI 成功填充 ${filledCount} 个字段`)
        
      } catch (error) {
        loading.close()
        console.error('AI填充失败:', error)
        ElMessage.error('AI 填充失败: ' + error.message)
        closeAIDialog()
      }
    }

    // 应用 AI 结果到表单
    const applyAIResult = () => {
      console.log('=== 应用 AI 结果 ===')
      console.log('aiResultData:', aiResultData.value)
      console.log('placeholderListRef:', placeholderListRef.value)
      
      if (!aiResultData.value) {
        console.error('没有 AI 结果数据')
        return
      }
      
      if (!placeholderListRef.value) {
        console.error('无法获取 PlaceholderList 组件引用')
        return
      }
      
      // 直接更新 PlaceholderList 组件的 formData
      console.log('更新前 formData:', placeholderListRef.value.formData)
      placeholderListRef.value.formData = { ...aiResultData.value }
      console.log('更新后 formData:', placeholderListRef.value.formData)
      
      // 同时调用 handleFillPlaceholders 来更新文档内容
      console.log('调用 handleFillPlaceholders')
      handleFillPlaceholders(aiResultData.value)
      
      console.log('==================')
      ElMessage.success('已应用到表单')
    }

    // 复制 AI 结果
    const copyAIResult = () => {
      if (!aiResultData.value) return
      
      const jsonString = JSON.stringify(aiResultData.value, null, 2)
      navigator.clipboard.writeText(jsonString).then(() => {
        ElMessage.success('已复制到剪贴板')
      }).catch(() => {
        ElMessage.error('复制失败')
      })
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

        console.log('=== 开始生成 Word 文档 ===')

        // 加载原始Word文档
        const zip = new PizZip(originalArrayBuffer)
        const doc = new Docxtemplater(zip, {
          paragraphLoop: true,
          linebreaks: true,
          delimiters: {
            start: '{',
            end: '}'
          },
          nullGetter: function() {
            // 当值为 null 或 undefined 时，返回空字符串而不是 "undefined"
            return ''
          }
        })

        // 从 PlaceholderList 获取填充的数据
        const rawFillData = placeholderListRef.value?.formData || {}
        console.log('原始填充数据:', rawFillData)

        // 处理填充数据：
        // 1. 将空值、null、undefined 转换为空字符串或默认值
        // 2. 选择框字段空值默认为 □
        // 3. 保留选择框符号（☑ 和 □）
        const fillData = {}
        placeholderStore.placeholders.forEach(placeholder => {
          const key = placeholder.name
          const value = rawFillData[key]
          
          // 判断是否为选择框字段
          const isCheckbox = key.includes('_yes') || key.includes('_no') ||
                            key.includes('_m') || key.includes('_f') ||
                            key.includes('_has') || key.includes('_none') ||
                            key.includes('_male') || key.includes('_female') ||
                            key.includes('_understand') || key.includes('_type_') ||
                            key.includes('_own_') || key.includes('_auth_') ||
                            key.includes('_issue') || key.includes('_claim_') ||
                            key.includes('_registered') || key.includes('_signed') ||
                            key.includes('_sale') || key.includes('_presale')
          
          if (value === null || value === undefined || value === '') {
            // 选择框字段默认为 □，其他字段为空字符串
            fillData[key] = isCheckbox ? '□' : ''
          } else {
            fillData[key] = value
          }
        })

        console.log('处理后填充数据:', fillData)

        // 使用 docxtemplater 填充数据
        doc.setData(fillData)

        try {
          doc.render()
          console.log('文档渲染成功')
        } catch (error) {
          console.error('文档渲染失败:', error)
          loading.close()
          ElMessage.error('文档渲染失败: ' + error.message)
          return
        }

        // 生成新的Word文档
        const blob = doc.getZip().generate({
          type: 'blob',
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        })

        // 生成文件名
        const originalName = templateStore.currentTemplate.name
        const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '')
        const timestamp = new Date().toISOString().slice(0, 10)
        
        saveAs(blob, `${nameWithoutExt}_已填充_${timestamp}.docx`)
        
        loading.close()
        console.log('=== Word 文档生成完成 ===')
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
      aiResultData,
      placeholderListRef,
      handleFileSelected,
      handleError,
      testStore,
      handleTextSelect,
      handleQuickAddPlaceholder,
      showPlaceholderDialog,
      showAIDialog,
      closeAIDialog,
      handleAIGenerate,
      applyAIResult,
      copyAIResult,
      editPlaceholder,
      handlePlaceholderConfirm,
      deletePlaceholder,
      closeDialog,
      downloadFile,
      handleFillPlaceholders
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
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ai-result-card {
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.json-display {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  font-family: 'Consolas', 'Monaco', monospace;
  color: #303133;
  margin: 0;
  overflow-x: auto;
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
