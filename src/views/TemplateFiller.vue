<template>
  <div class="template-filler">
    <h1>模板智能填充</h1>
    
    <div class="steps">
      <div class="step" :class="{ active: currentStep >= 1, completed: currentStep > 1 }">
        <div class="step-number">1</div>
        <div class="step-title">选择表单</div>
      </div>
      <div class="step" :class="{ active: currentStep >= 2, completed: currentStep > 2 }">
        <div class="step-number">2</div>
        <div class="step-title">填写信息</div>
      </div>
      <div class="step" :class="{ active: currentStep >= 3, completed: currentStep > 3 }">
        <div class="step-number">3</div>
        <div class="step-title">上传模板</div>
      </div>
      <div class="step" :class="{ active: currentStep >= 4 }">
        <div class="step-number">4</div>
        <div class="step-title">生成文档</div>
      </div>
    </div>

    <!-- 步骤1: 选择表单 -->
    <div v-if="currentStep === 1" class="step-content">
      <h2>选择表单类型</h2>
      <p class="hint">选择您需要填写的表单类型</p>
      
      <div class="form-categories">
        <div 
          v-for="category in categories" 
          :key="category"
          class="category-section"
        >
          <h3>{{ category }}</h3>
          <div class="form-templates">
            <div 
              v-for="template in getTemplatesByCategory(category)" 
              :key="template.id"
              class="template-card"
              :class="{ selected: selectedTemplate?.id === template.id }"
              @click="selectTemplate(template)"
            >
              <div class="template-icon">📋</div>
              <div class="template-name">{{ template.name }}</div>
              <div class="template-fields">
                {{ template.groups ? template.groups.length + ' 个分组' : (template.sections ? template.sections.length + ' 个部分' : (template.fields?.length || 0) + ' 个字段') }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <button 
        v-if="selectedTemplate" 
        @click="currentStep = 2" 
        class="btn-primary btn-next"
      >
        下一步
      </button>
    </div>

    <!-- 步骤2: 填写信息 -->
    <div v-if="currentStep === 2" class="step-content">
      <div class="form-header">
        <h2>{{ selectedTemplate.name }}</h2>
        <div class="form-actions">
          <button @click="showAIDialog" class="btn-ai">
            <span class="ai-icon">🤖</span>
            AI智能填充
          </button>
          <button @click="clearForm" class="btn-clear">清空</button>
        </div>
      </div>
      
      <!-- 分组和分节表格布局 -->
      <div v-if="selectedTemplate.groups">
        <div 
          v-for="(group, groupIndex) in selectedTemplate.groups" 
          :key="groupIndex"
          class="form-group-container"
        >
          <h2 class="group-title">{{ group.groupTitle }}</h2>
          <div 
            v-for="(section, sectionIndex) in group.sections" 
            :key="sectionIndex"
            class="form-section"
          >
            <h3 class="section-title">{{ section.title }}</h3>
            <table class="form-table">
              <tbody>
                <tr v-for="field in section.fields" :key="field.key">
                  <td class="label-cell" :class="{ required: field.required }">
                    {{ field.label }}
                    <span v-if="field.required" class="required-mark">*</span>
                  </td>
                  <td class="input-cell">
                    <!-- 文本输入 -->
                    <input 
                      v-if="field.type === 'text' || field.type === 'tel' || field.type === 'email'"
                      v-model="formData[field.key]"
                      :type="field.type"
                      :placeholder="'请输入' + field.label"
                      class="table-input"
                    />
                    
                    <!-- 日期输入 -->
                    <input 
                      v-else-if="field.type === 'date'"
                      v-model="formData[field.key]"
                      type="text"
                      :placeholder="'例如：1990年1月1日'"
                      class="table-input"
                    />
                    
                    <!-- 多行文本 -->
                    <textarea 
                      v-else-if="field.type === 'textarea'"
                      v-model="formData[field.key]"
                      :placeholder="'请输入' + field.label"
                      rows="2"
                      class="table-textarea"
                    ></textarea>
                    
                    <!-- 下拉选择 -->
                    <select 
                      v-else-if="field.type === 'select'"
                      v-model="formData[field.key]"
                      class="table-select"
                    >
                      <option value="">请选择</option>
                      <option v-for="opt in field.options" :key="opt" :value="opt">{{ opt }}</option>
                    </select>
                    
                    <!-- 性别选择 -->
                    <div v-else-if="field.type === 'gender'" class="checkbox-inline">
                      <label class="checkbox-option">
                        <input 
                          type="radio"
                          :name="field.key"
                          value="男"
                          v-model="formData[field.key]"
                        />
                        <span>男 □</span>
                      </label>
                      <label class="checkbox-option">
                        <input 
                          type="radio"
                          :name="field.key"
                          value="女"
                          v-model="formData[field.key]"
                        />
                        <span>女 □</span>
                      </label>
                    </div>
                    
                    <!-- 是否选择 -->
                    <div v-else-if="field.type === 'yesno'" class="checkbox-inline">
                      <label class="checkbox-option">
                        <input 
                          type="radio"
                          :name="field.key"
                          value="有"
                          v-model="formData[field.key]"
                        />
                        <span>有 □</span>
                      </label>
                      <label class="checkbox-option">
                        <input 
                          type="radio"
                          :name="field.key"
                          value="无"
                          v-model="formData[field.key]"
                        />
                        <span>无 □</span>
                      </label>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 兼容旧格式（没有groups的） -->
      <div v-else-if="selectedTemplate.sections">
        <div 
          v-for="(section, sectionIndex) in selectedTemplate.sections" 
          :key="sectionIndex"
          class="form-section"
        >
          <h3 class="section-title">{{ section.title }}</h3>
          <table class="form-table">
            <tbody>
              <tr v-for="field in section.fields" :key="field.key">
                <td class="label-cell" :class="{ required: field.required }">
                  {{ field.label }}
                  <span v-if="field.required" class="required-mark">*</span>
                </td>
                <td class="input-cell">
                  <!-- 文本输入 -->
                  <input 
                    v-if="field.type === 'text' || field.type === 'tel' || field.type === 'email'"
                    v-model="formData[field.key]"
                    :type="field.type"
                    :placeholder="'请输入' + field.label"
                    class="table-input"
                  />
                  
                  <!-- 日期输入 -->
                  <input 
                    v-else-if="field.type === 'date'"
                    v-model="formData[field.key]"
                    type="text"
                    :placeholder="'例如：1990年1月1日'"
                    class="table-input"
                  />
                  
                  <!-- 多行文本 -->
                  <textarea 
                    v-else-if="field.type === 'textarea'"
                    v-model="formData[field.key]"
                    :placeholder="'请输入' + field.label"
                    rows="2"
                    class="table-textarea"
                  ></textarea>
                  
                  <!-- 下拉选择 -->
                  <select 
                    v-else-if="field.type === 'select'"
                    v-model="formData[field.key]"
                    class="table-select"
                  >
                    <option value="">请选择</option>
                    <option v-for="opt in field.options" :key="opt" :value="opt">{{ opt }}</option>
                  </select>
                  
                  <!-- 性别选择 -->
                  <div v-else-if="field.type === 'gender'" class="checkbox-inline">
                    <label class="checkbox-option">
                      <input 
                        type="radio"
                        :name="field.key"
                        value="男"
                        v-model="formData[field.key]"
                      />
                      <span>男 □</span>
                    </label>
                    <label class="checkbox-option">
                      <input 
                        type="radio"
                        :name="field.key"
                        value="女"
                        v-model="formData[field.key]"
                      />
                      <span>女 □</span>
                    </label>
                  </div>
                  
                  <!-- 性别复选框（用于模板） -->
                  <div v-else-if="field.type === 'checkbox-gender'" class="checkbox-inline">
                    <label v-if="field.label.includes('男')" class="checkbox-option">
                      <input 
                        type="radio"
                        :name="field.group"
                        value="☑"
                        v-model="formData[field.key]"
                        @change="handleGenderChange(field.group, field.key)"
                      />
                      <span>男 □</span>
                    </label>
                    <label v-else-if="field.label.includes('女')" class="checkbox-option">
                      <input 
                        type="radio"
                        :name="field.group"
                        value="☑"
                        v-model="formData[field.key]"
                        @change="handleGenderChange(field.group, field.key)"
                      />
                      <span>女 □</span>
                    </label>
                  </div>
                  
                  <!-- 是否选择 -->
                  <div v-else-if="field.type === 'yesno'" class="checkbox-inline">
                    <label class="checkbox-option">
                      <input 
                        type="radio"
                        :name="field.key"
                        value="有"
                        v-model="formData[field.key]"
                      />
                      <span>有 □</span>
                    </label>
                    <label class="checkbox-option">
                      <input 
                        type="radio"
                        :name="field.key"
                        value="无"
                        v-model="formData[field.key]"
                      />
                      <span>无 □</span>
                    </label>
                  </div>
                  
                  <!-- 单个复选框 -->
                  <div v-else-if="field.type === 'checkbox-single'" class="checkbox-single">
                    <label class="checkbox-single-label">
                      <input 
                        type="checkbox"
                        v-model="formData[field.key]"
                        true-value="是"
                        false-value=""
                      />
                      <span>{{ field.label }}</span>
                    </label>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="button-group">
        <button @click="currentStep = 1" class="btn-secondary">上一步</button>
        <button @click="currentStep = 3" class="btn-primary">下一步</button>
      </div>
    </div>

    <!-- AI填充对话框 -->
    <div v-if="aiDialogVisible" class="dialog-overlay" @click.self="closeAIDialog">
      <div class="dialog">
        <div class="dialog-header">
          <h3>AI智能填充</h3>
          <button @click="closeAIDialog" class="btn-close">×</button>
        </div>
        <div class="dialog-body">
          <p class="hint">上传包含信息的文件，AI将自动提取并填充表单</p>
          
          <div class="upload-area-small" @click="$refs.aiContentInput.click()">
            <input 
              ref="aiContentInput" 
              type="file" 
              accept=".docx,.txt"
              multiple
              @change="handleAIContentUpload"
              style="display: none"
            />
            <div class="upload-icon-small">📁</div>
            <p>点击上传文件</p>
          </div>

          <div v-if="aiContentFiles.length > 0" class="ai-files">
            <div v-for="(file, index) in aiContentFiles" :key="index" class="file-item-small">
              <span>{{ file.name }}</span>
              <button @click="removeAIFile(index)" class="btn-remove-tiny">×</button>
            </div>
          </div>

          <AIPlaceholderDialog 
            v-if="showAIConfig"
            :visible="showAIConfig"
            :document-content="''"
            @confirm="handleAIExtract"
            @cancel="showAIConfig = false"
          />
        </div>
        <div class="dialog-footer">
          <button @click="closeAIDialog" class="btn-secondary">取消</button>
          <button 
            v-if="aiContentFiles.length > 0 && !extracting"
            @click="showAIConfig = true" 
            class="btn-primary"
          >
            开始提取
          </button>
          <button v-if="extracting" class="btn-primary" disabled>
            提取中...
          </button>
        </div>
      </div>
    </div>

    <!-- 步骤3: 上传模板 -->
    <div v-if="currentStep === 3" class="step-content">
      <h2>上传Word模板文件</h2>
      <p class="hint">模板中应包含对应的占位符，例如：{plaintiff_individual_name}</p>
      
      <div class="upload-area" @click="$refs.templateInput.click()">
        <input 
          ref="templateInput" 
          type="file" 
          accept=".docx"
          @change="handleTemplateUpload"
          style="display: none"
        />
        <div v-if="!templateFile">
          <div class="upload-icon">📄</div>
          <p>点击上传模板文件</p>
          <p class="file-types">支持 .docx 格式</p>
        </div>
        <div v-else class="file-info">
          <div class="file-icon">✓</div>
          <p class="file-name">{{ templateFile.name }}</p>
          <button @click.stop="removeTemplate" class="btn-remove">移除</button>
        </div>
      </div>

      <div class="button-group">
        <button @click="currentStep = 2" class="btn-secondary">上一步</button>
        <button 
          v-if="templateFile" 
          @click="currentStep = 4" 
          class="btn-primary"
        >
          下一步
        </button>
      </div>
    </div>

    <!-- 步骤4: 生成文档 -->
    <div v-if="currentStep === 4" class="step-content">
      <h2>生成填充后的文档</h2>
      
      <div class="summary-card">
        <h3>填充信息摘要</h3>
        
        <!-- 新格式：有groups -->
        <div v-if="selectedTemplate.groups">
          <div 
            v-for="(group, groupIndex) in selectedTemplate.groups" 
            :key="groupIndex"
            class="summary-group"
          >
            <h3 class="summary-group-title">{{ group.groupTitle }}</h3>
            <div 
              v-for="(section, sectionIndex) in group.sections" 
              :key="sectionIndex"
              class="summary-section"
            >
              <h4>{{ section.title }}</h4>
              <div class="summary-grid">
                <template v-for="field in section.fields" :key="field.key">
                  <div 
                    v-if="formData[field.key] && formData[field.key] !== '□' && formData[field.key] !== '' && field.label && !field.label.includes('性别-')"
                    class="summary-item"
                  >
                    <span class="summary-label">{{ field.label }}:</span>
                    <span class="summary-value">{{ formData[field.key] }}</span>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 旧格式：只有sections -->
        <div v-else-if="selectedTemplate.sections">
          <div 
            v-for="(section, sectionIndex) in selectedTemplate.sections" 
            :key="sectionIndex"
            class="summary-section"
          >
            <h4>{{ section.title }}</h4>
            <div class="summary-grid">
              <template v-for="field in section.fields" :key="field.key">
                <div 
                  v-if="formData[field.key] && formData[field.key] !== '□' && formData[field.key] !== '' && field.label && !field.label.includes('性别-')"
                  class="summary-item"
                >
                  <span class="summary-label">{{ field.label }}:</span>
                  <span class="summary-value">{{ formData[field.key] }}</span>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>

      <div class="button-group">
        <button @click="currentStep = 3" class="btn-secondary">返回修改</button>
        <button @click="downloadFilledDocument" class="btn-primary btn-large">
          <span class="download-icon">⬇</span>
          下载填充后的文档
        </button>
      </div>
    </div>

    <div v-if="notification" class="notification" :class="notification.type">
      {{ notification.message }}
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { DocumentService } from '@/services/documentService'
import { AIService } from '@/services/aiService'
import AIPlaceholderDialog from '@/components/AIPlaceholderDialog.vue'
import { formTemplates, getCategories, getTemplatesByCategory, getAllFields } from '@/data/formTemplates'
import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
import { saveAs } from 'file-saver'

export default {
  name: 'TemplateFiller',
  components: {
    AIPlaceholderDialog
  },
  setup() {
    const currentStep = ref(1)
    const categories = ref(getCategories())
    const selectedTemplate = ref(null)
    const formData = ref({})
    const templateFile = ref(null)
    const templateArrayBuffer = ref(null)
    const aiDialogVisible = ref(false)
    const aiContentFiles = ref([])
    const showAIConfig = ref(false)
    const extracting = ref(false)
    const notification = ref(null)

    const selectTemplate = (template) => {
      selectedTemplate.value = template
      // 初始化表单数据
      formData.value = {}
      const allFields = getAllFields(template)
      allFields.forEach(field => {
        if (field.type === 'checkbox-gender') {
          formData.value[field.key] = '□'
        } else {
          formData.value[field.key] = ''
        }
      })
    }

    const clearForm = () => {
      if (confirm('确定要清空所有填写的内容吗？')) {
        const allFields = getAllFields(selectedTemplate.value)
        allFields.forEach(field => {
          formData.value[field.key] = ''
        })
      }
    }

    const handleGenderChange = (group, selectedKey) => {
      // 当选择一个性别时，将另一个设为未选中
      const allFields = getAllFields(selectedTemplate.value)
      allFields.forEach(field => {
        if (field.type === 'checkbox-gender' && field.group === group && field.key !== selectedKey) {
          formData.value[field.key] = '□'
        }
      })
    }

    const showAIDialog = () => {
      aiDialogVisible.value = true
    }

    const closeAIDialog = () => {
      aiDialogVisible.value = false
      aiContentFiles.value = []
    }

    const handleAIContentUpload = async (event) => {
      const files = Array.from(event.target.files)
      if (files.length === 0) return

      aiContentFiles.value.push(...files)
      event.target.value = ''
    }

    const removeAIFile = (index) => {
      aiContentFiles.value.splice(index, 1)
    }

    /**
     * AI智能提取数据的核心方法
     * 
     * 工作流程：
     * 1. 读取用户上传的内容文件（可能是Word或文本文件）
     * 2. 提取文件中的纯文本内容
     * 3. 将文本和表单字段列表发送给AI
     * 4. AI分析文本，提取出每个字段对应的值
     * 5. 将AI提取的数据填充到表单中
     * 
     * @param {Object} config - AI配置（包含API Key、模型等）
     */
    const handleAIExtract = async (config) => {
      showAIConfig.value = false
      extracting.value = true
      
      try {
        // ========== 步骤1: 提取所有上传文件的文本内容 ==========
        const texts = []
        for (const file of aiContentFiles.value) {
          if (file.name.endsWith('.docx')) {
            // Word文档需要先解析成HTML，再提取纯文本
            const result = await DocumentService.parseWordDocument(file)
            const tempDiv = document.createElement('div')
            tempDiv.innerHTML = result.html
            // 使用textContent获取纯文本，去除所有HTML标签
            texts.push(tempDiv.textContent || tempDiv.innerText || '')
          } else {
            // 文本文件直接读取内容
            const text = await file.text()
            texts.push(text)
          }
        }
        
        // 将多个文件的内容用两个换行符连接起来
        const contentText = texts.join('\n\n')
        
        // ========== 步骤2: 构建占位符列表 ==========
        // 获取当前表单模板的所有字段
        const allFields = getAllFields(selectedTemplate.value)
        // 将字段转换为占位符格式：[{ name: 'yuan_name' }, { name: 'yuan_phone' }, ...]
        const placeholders = allFields.map(f => ({ name: f.key }))
        
        // ========== 步骤3: 调用AI服务提取数据 ==========
        // AI会分析contentText，尝试为每个placeholder找到对应的值
        // 返回格式：{ yuan_name: '张三', yuan_phone: '138****5678', ... }
        const data = await AIService.extractDataForTemplate(
          config,          // AI配置（API Key、模型等）
          contentText,     // 要分析的文本内容
          placeholders     // 需要提取的字段列表
        )
        
        // ========== 步骤4: 将AI提取的数据填充到表单 ==========
        Object.keys(data).forEach(key => {
          // 只填充表单中存在的字段
          if (formData.value.hasOwnProperty(key)) {
            // 如果AI提取到了值就用AI的值，否则保持原值
            formData.value[key] = data[key] || formData.value[key]
          }
        })
        
        showNotification('AI提取完成', 'success')
        closeAIDialog()
      } catch (error) {
        showNotification('AI提取失败: ' + error.message, 'error')
      } finally {
        extracting.value = false
      }
    }

    const handleTemplateUpload = async (event) => {
      const file = event.target.files[0]
      if (!file) return

      try {
        templateFile.value = file
        templateArrayBuffer.value = await file.arrayBuffer()
        showNotification('模板上传成功', 'success')
      } catch (error) {
        showNotification('模板文件读取失败: ' + error.message, 'error')
      }
    }

    const removeTemplate = () => {
      templateFile.value = null
      templateArrayBuffer.value = null
    }

    /**
     * 生成填充后的Word文档
     * 
     * 核心技术：使用 docxtemplater 库
     * - docxtemplater 是一个模板引擎，可以将数据填充到Word模板中
     * - 它通过解析Word文档的XML结构，找到占位符并替换成实际数据
     * 
     * 工作流程：
     * 1. 验证模板文件是否存在
     * 2. 清理表单数据（移除空值和未选中的checkbox）
     * 3. 使用 PizZip 解压Word文档（Word文档本质是一个ZIP压缩包）
     * 4. 使用 Docxtemplater 解析模板并填充数据
     * 5. 重新打包成Word文档
     * 6. 触发浏览器下载
     */
    const downloadFilledDocument = async () => {
      try {
        // ========== 步骤1: 验证模板文件 ==========
        if (!templateArrayBuffer.value) {
          showNotification('模板文件未上传或已丢失', 'error')
          return
        }

        if (!templateFile.value) {
          showNotification('模板文件信息丢失', 'error')
          return
        }

        console.log('开始生成文档...')
        console.log('模板文件:', templateFile.value.name)
        console.log('原始填充数据:', formData.value)

        // ========== 步骤2: 清理数据 ==========
        // 为什么要清理？
        // - 空字符串会让模板显示占位符名称
        // - 未选中的checkbox（□）不应该传递给模板
        // - 我们希望空值显示为空白而不是 "undefined"
        const cleanData = {}
        Object.keys(formData.value).forEach(key => {
          const value = formData.value[key]
          // 只保留非空字符串，并且不是单独的 □
          if (value && value !== '' && value !== '□') {
            cleanData[key] = value
          } else {
            // 空值用空字符串替换，避免显示占位符
            cleanData[key] = ''
          }
        })

        console.log('清理后的填充数据:', cleanData)

        // ========== 步骤3: 解压Word文档 ==========
        // Word文档（.docx）本质上是一个ZIP压缩包，包含：
        // - word/document.xml: 文档主体内容
        // - word/styles.xml: 样式定义
        // - word/_rels/: 关系文件
        // - [Content_Types].xml: 内容类型定义
        // PizZip 用于解压和操作这个ZIP包
        const zip = new PizZip(templateArrayBuffer.value)
        
        // ========== 步骤4: 配置 Docxtemplater ==========
        const doc = new Docxtemplater(zip, {
          // paragraphLoop: 支持循环语法（如 {#items}...{/items}）
          paragraphLoop: true,
          // linebreaks: 支持换行符（\n会被转换为Word的换行）
          linebreaks: true,
          // delimiters: 定义占位符的分隔符
          // 默认是 {{ }}（双花括号），这里改成 { }（单花括号）
          // 这样模板中的 {yuan_name} 就能被识别
          delimiters: {
            start: '{',
            end: '}'
          },
          // nullGetter: 当找不到占位符对应的值时调用
          // 返回空字符串而不是 undefined，避免文档中显示 "undefined"
          nullGetter: function() {
            return ''
          }
        })

        // 渲染文档
        try {
          doc.render(cleanData)
          console.log('文档渲染成功')
        } catch (renderError) {
          console.error('渲染错误:', renderError)
          if (renderError.properties) {
            console.error('错误详情:', renderError.properties)
          }
          throw renderError
        }

        // 生成blob
        const blob = doc.getZip().generate({
          type: 'blob',
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        })

        console.log('Blob生成成功，大小:', blob.size)

        // 下载
        const fileName = templateFile.value.name.replace(/\.docx$/, '_已填充.docx')
        saveAs(blob, fileName)
        
        showNotification('文档下载成功', 'success')
      } catch (error) {
        console.error('生成文档失败:', error)
        console.error('错误详情:', error.properties)
        showNotification('生成文档失败: ' + error.message, 'error')
      }
    }

    const showNotification = (message, type = 'info') => {
      notification.value = { message, type }
      setTimeout(() => {
        notification.value = null
      }, 3000)
    }

    return {
      currentStep,
      categories,
      selectedTemplate,
      formData,
      templateFile,
      aiDialogVisible,
      aiContentFiles,
      showAIConfig,
      extracting,
      notification,
      getTemplatesByCategory,
      selectTemplate,
      clearForm,
      handleGenderChange,
      showAIDialog,
      closeAIDialog,
      handleAIContentUpload,
      removeAIFile,
      handleAIExtract,
      handleTemplateUpload,
      removeTemplate,
      downloadFilledDocument
    }
  }
}
</script>

<style scoped>
.template-filler {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 2rem;
}

.steps {
  display: flex;
  justify-content: space-between;
  margin-bottom: 3rem;
  position: relative;
}

.steps::before {
  content: '';
  position: absolute;
  top: 20px;
  left: 10%;
  right: 10%;
  height: 2px;
  background: #ddd;
  z-index: 0;
}

.step {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 1;
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #ddd;
  color: #999;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-bottom: 0.5rem;
  transition: all 0.3s;
}

.step.active .step-number {
  background: #42b983;
  color: white;
}

.step.completed .step-number {
  background: #4caf50;
  color: white;
}

.step-title {
  font-size: 0.9rem;
  color: #666;
}

.step.active .step-title {
  color: #2c3e50;
  font-weight: 500;
}

.step-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.step-content h2 {
  margin-top: 0;
  color: #2c3e50;
}

.hint {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
}

.upload-area {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 3rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 2rem;
}

.upload-area:hover {
  border-color: #42b983;
  background: #f9f9f9;
}

.upload-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.file-types {
  color: #999;
  font-size: 0.85rem;
}

.file-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.file-icon {
  font-size: 3rem;
  color: #4caf50;
}

.file-name {
  font-weight: 500;
  color: #2c3e50;
}

.btn-remove {
  background: #f44336;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.placeholder-list {
  margin-top: 2rem;
}

.placeholder-list h3 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.placeholder-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  background: #e3f2fd;
  color: #1976d2;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  font-size: 0.9rem;
  font-family: monospace;
}

.content-files {
  margin-top: 2rem;
}

.content-files h3 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.8rem;
  background: #f5f5f5;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.file-item .file-name {
  flex: 1;
}

.file-size {
  color: #999;
  font-size: 0.85rem;
}

.btn-remove-small {
  background: #f44336;
  color: white;
  border: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2rem;
  line-height: 1;
}

.button-group {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

.btn-primary, .btn-secondary {
  padding: 0.8rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s;
}

.btn-primary {
  background: #42b983;
  color: white;
  border: none;
}

.btn-primary:hover {
  background: #359268;
}

.btn-secondary {
  background: white;
  color: #666;
  border: 1px solid #ddd;
}

.btn-secondary:hover {
  background: #f5f5f5;
}

.btn-next, .btn-large {
  display: block;
  margin: 2rem auto 0;
  padding: 1rem 2rem;
}

.loading {
  text-align: center;
  padding: 3rem;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #42b983;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.extractions {
  margin-top: 2rem;
}

.extractions h3 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.extraction-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.extraction-item {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
  background: white;
}

.form-categories {
  margin-bottom: 2rem;
}

.category-section {
  margin-bottom: 2rem;
}

.category-section h3 {
  color: #2c3e50;
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.form-templates {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.template-card {
  background: white;
  border: 2px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.template-card:hover {
  border-color: #42b983;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(66, 185, 131, 0.2);
}

.template-card.selected {
  border-color: #42b983;
  background: #e8f5e9;
}

.template-icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.template-name {
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.template-fields {
  font-size: 0.85rem;
  color: #999;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #eee;
}

.form-header h2 {
  margin: 0;
}

.form-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-ai {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-ai:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.ai-icon {
  font-size: 1.2rem;
}

.btn-clear {
  background: white;
  color: #666;
  border: 1px solid #ddd;
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-clear:hover {
  background: #f5f5f5;
}

.form-group-container {
  margin-bottom: 3rem;
}

.group-title {
  font-size: 1.5rem;
  color: #2c3e50;
  margin: 0 0 1.5rem 0;
  padding-bottom: 0.8rem;
  border-bottom: 3px solid #667eea;
  font-weight: 600;
}

.form-section {
  margin-bottom: 2rem;
}

.section-title {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.8rem 1.2rem;
  margin: 0 0 0 0;
  border-radius: 6px 6px 0 0;
  font-size: 1.1rem;
}

.form-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border-radius: 0 0 6px 6px;
  overflow: hidden;
}

.form-table tbody tr {
  border-bottom: 1px solid #eee;
}

.form-table tbody tr:last-child {
  border-bottom: none;
}

.label-cell {
  width: 200px;
  padding: 1rem 1.2rem;
  background: #f9f9f9;
  color: #555;
  font-weight: 500;
  vertical-align: middle;
  border-right: 1px solid #eee;
}

.label-cell.required {
  font-weight: 600;
}

.required-mark {
  color: #f44336;
  margin-left: 0.25rem;
}

.input-cell {
  padding: 0.8rem 1.2rem;
}

.table-input,
.table-textarea,
.table-select {
  width: 100%;
  padding: 0.6rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.95rem;
  transition: border-color 0.3s;
}

.table-input:focus,
.table-textarea:focus,
.table-select:focus {
  outline: none;
  border-color: #42b983;
}

.table-textarea {
  resize: vertical;
  font-family: inherit;
}

.checkbox-inline {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.checkbox-inline-label {
  font-weight: 500;
  color: #555;
}

.checkbox-option {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
}

.checkbox-option input[type="radio"] {
  cursor: pointer;
}

.checkbox-option span {
  font-size: 1rem;
}

.checkbox-single {
  display: flex;
  align-items: center;
}

.checkbox-single-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.checkbox-single-label input[type="checkbox"] {
  cursor: pointer;
  width: 18px;
  height: 18px;
}

.checkbox-single-label span {
  font-size: 1rem;
  color: #555;
}

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
  max-height: 80vh;
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

.dialog-header h3 {
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

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #eee;
}

.upload-area-small {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 1rem;
}

.upload-area-small:hover {
  border-color: #42b983;
  background: #f9f9f9;
}

.upload-icon-small {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.ai-files {
  margin-top: 1rem;
}

.file-item-small {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem;
  background: #f5f5f5;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.btn-remove-tiny {
  background: #f44336;
  color: white;
  border: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
}

.summary-card {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 2rem;
  margin-bottom: 2rem;
}

.summary-card h3 {
  margin-top: 0;
  color: #2c3e50;
  margin-bottom: 1.5rem;
}

.summary-group {
  margin-bottom: 2rem;
}

.summary-group-title {
  font-size: 1.2rem;
  color: #2c3e50;
  margin: 0 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #667eea;
  font-weight: 600;
}

.summary-section {
  margin-bottom: 1.5rem;
  margin-left: 1rem;
}

.summary-section h4 {
  color: #667eea;
  margin: 0 0 1rem 0;
  font-size: 1rem;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.summary-label {
  font-size: 0.85rem;
  color: #999;
}

.summary-value {
  font-size: 1rem;
  color: #2c3e50;
  font-weight: 500;
}

.download-icon {
  font-size: 1.2rem;
}

.extraction-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.placeholder-name {
  font-family: monospace;
  font-weight: 500;
  color: #1976d2;
  font-size: 0.9rem;
}

.extraction-value {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  margin-top: 0.5rem;
}

.preview-container {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 2rem;
  background: white;
  max-height: 600px;
  overflow-y: auto;
  margin-bottom: 2rem;
}

.document-preview {
  line-height: 1.8;
}

.document-preview :deep(.filled-value) {
  background: #e8f5e9;
  padding: 2px 4px;
  border-radius: 3px;
  font-weight: 500;
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
</style>
