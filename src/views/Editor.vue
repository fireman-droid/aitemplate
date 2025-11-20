<template>
  <div class="editor">
    <!-- 模板选择界面 -->
    <div v-if="!templateStore.currentTemplate && !showCustomUpload" class="selection-section">
      <TemplateSelector 
        @template-selected="handleTemplateSelected"
        @upload-custom="showCustomUpload = true"
      />
    </div>

    <!-- 自定义上传界面 -->
    <div v-else-if="!templateStore.currentTemplate && showCustomUpload" class="upload-section">
      <el-button 
        text 
        @click="showCustomUpload = false" 
        class="back-button"
        :icon="ArrowLeft"
      >
        返回模板选择
      </el-button>
      <h2>上传自定义模板</h2>
      <FileUploader 
        @file-selected="handleFileSelected"
        @error="handleError"
      />
    </div>

    <div v-else class="editor-workspace">
      <!-- 顶部工具栏 -->
      <div class="top-toolbar">
        <h2>{{ currentTemplateConfig?.template_config?.template_name || templateStore.currentTemplate.name }}</h2>
        <div class="toolbar-actions">
          <el-button type="success" @click="showAIDialog" :icon="MagicStick">AI 智能提取</el-button>
          <el-button @click="showPreviewDrawer = true" :icon="View">预览模板</el-button>
          <el-button type="primary" @click="downloadFile" :icon="Download">生成文档</el-button>
        </div>
      </div>

      <div class="workspace-content">
        <!-- 主要区域：填写表单 -->
        <div class="form-section">
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

          <!-- 如果有模板配置，使用动态表单；否则使用原来的表单 -->
          <DynamicPlaceholderForm
            v-if="currentTemplateConfig"
            ref="placeholderListRef"
            :placeholders="placeholderStore.placeholders"
            :template-config="currentTemplateConfig"
            :placeholder-mapping="currentPlaceholderMapping"
            @preview-update="handlePreviewUpdate"
          />
          <PlaceholderList 
            v-else
            ref="placeholderListRef"
            :placeholders="placeholderStore.placeholders"
            :active-placeholder-id="placeholderStore.activePlaceholderId"
            :template-config="currentTemplateConfig"
            :placeholder-mapping="currentPlaceholderMapping"
            @fill-placeholders="handleFillPlaceholders"
            @preview-update="handlePreviewUpdate"
          />
        </div>
      </div>
    </div>

    <!-- 预览抽屉 -->
    <el-drawer
      v-model="showPreviewDrawer"
      title="模板预览"
      direction="rtl"
      size="60%"
    >
      <TemplatePreview 
        :content="templateStore.currentTemplate.content"
        :content-type="templateStore.currentTemplate.contentType"
        :placeholders="placeholderStore.placeholders"
        :active-placeholder-id="placeholderStore.activePlaceholderId"
      />
    </el-drawer>

    <!-- AI 对话框 -->
    <AIPlaceholderDialog 
      :visible="aiDialogVisible"
      :placeholders="placeholderStore.placeholders"
      @confirm="handleAIGenerate"
      @cancel="closeAIDialog"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { View, Download, MagicStick, Close, ArrowLeft } from '@element-plus/icons-vue'
import { useTemplateStore } from '@/stores/template'
import { usePlaceholderStore } from '@/stores/placeholder'
import { StorageService } from '@/services/storageService'
import TemplateSelector from '@/components/TemplateSelector.vue'
import FileUploader from '@/components/FileUploader.vue'
import TemplatePreview from '@/components/TemplatePreview.vue'
import PlaceholderList from '@/components/PlaceholderList.vue'
import DynamicPlaceholderForm from '@/components/DynamicPlaceholderForm.vue'
import AIPlaceholderDialog from '@/components/AIPlaceholderDialog.vue'
import { AIService } from '@/services/aiService'
import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
import { saveAs } from 'file-saver'

const route = useRoute()
const templateStore = useTemplateStore()
const placeholderStore = usePlaceholderStore()
const aiDialogVisible = ref(false)
const currentProjectId = ref(null)
const aiResultData = ref(null)
const placeholderListRef = ref(null)
const showPreviewDrawer = ref(false)
const showCustomUpload = ref(false)
const currentTemplateConfig = ref(null)
const currentPlaceholderMapping = ref(null)
const originalTemplateContent = ref('') // 保存原始模板内容

// 处理模板选择
const handleTemplateSelected = async (completeTemplate) => {
  console.log('=== 选择模板 ===', completeTemplate)
  
  try {
    // 保存模板配置和映射
    currentTemplateConfig.value = completeTemplate.config
    currentPlaceholderMapping.value = completeTemplate.placeholderMapping
    
    // 上传模板文件
    await templateStore.uploadTemplate(completeTemplate.file)
    
    // 保存原始模板内容
    originalTemplateContent.value = templateStore.currentTemplate.content
    
    // 提取占位符
    extractPlaceholders()
    
    ElMessage.success(`模板"${completeTemplate.config.lawsuit_template?.name || '未命名'}"加载成功`)
  } catch (error) {
    console.error('加载模板失败:', error)
    ElMessage.error('加载模板失败: ' + error.message)
  }
}

const handleFileSelected = async (file) => {
  console.log('=== 开始上传自定义文件 ===')
  console.log('文件名:', file.name)
  console.log('文件类型:', file.type)
  console.log('文件大小:', file.size)
  
  try {
    // 清空模板配置（自定义上传不使用配置）
    currentTemplateConfig.value = null
    currentPlaceholderMapping.value = null
    
    await templateStore.uploadTemplate(file)
    console.log('上传成功，currentTemplate:', templateStore.currentTemplate)
    
    // 保存原始模板内容
    originalTemplateContent.value = templateStore.currentTemplate.content
    
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

// 处理填充占位符（点击"填充到文档"按钮时调用）
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

// 处理预览更新（实时预览，带防抖）
const handlePreviewUpdate = (formData) => {
  if (!templateStore.currentTemplate) return
  if (!originalTemplateContent.value) return

  // 从保存的原始模板内容开始，重新应用所有填充
  let content = originalTemplateContent.value

  // 替换所有占位符
  Object.entries(formData).forEach(([key, value]) => {
    const regex = new RegExp(`\\{${key}\\}`, 'g')
    if (value && value !== '' && value !== '□') {
      // 有值且不是未选中的复选框：替换为实际值
      content = content.replace(regex, value)
    } else {
      // 无值或未选中：替换为空字符串
      content = content.replace(regex, '')
    }
  })

  // 清除所有剩余的占位符（那些不在 formData 中的）
  content = content.replace(/\{[^}]+\}/g, '')

  // 更新预览内容
  templateStore.updateTemplate({ content: content })
}

const handleError = (error) => {
  ElMessage.error(error)
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
</script>

<style scoped>
.editor {
  min-height: 100vh;
}

.selection-section {
  min-height: calc(100vh - 60px);
}

.upload-section {
  max-width: 700px;
  margin: 0 auto;
  padding: 3rem 0;
  position: relative;
}

.back-button {
  position: absolute;
  top: 0;
  left: 0;
  margin-bottom: 1rem;
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
  min-height: 100vh;
}

.top-toolbar {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid #ebeef5;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.top-toolbar h2 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.toolbar-actions {
  display: flex;
  gap: 12px;
}

.workspace-content {
  flex: 1;
  display: flex;
  justify-content: center;
  background: #f5f7fa;
  padding: 24px;
}

.form-section {
  width: 100%;
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  margin-bottom: 24px;
}

.ai-result-card {
  margin: 16px;
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
  .form-section {
    max-width: 100%;
  }
  
  .top-toolbar {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .toolbar-actions {
    width: 100%;
  }
  
  .toolbar-actions button {
    flex: 1;
  }
}
</style>
