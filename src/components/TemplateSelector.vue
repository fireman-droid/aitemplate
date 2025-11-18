<template>
  <div class="template-selector">
    <div class="selector-header">
      <h2>选择法律文书模板</h2>
      <p class="subtitle">请选择适合您案件类型的模板开始填写</p>
    </div>

    <div v-if="loading" class="loading-container">
      <el-icon class="is-loading" :size="40"><Loading /></el-icon>
      <p>加载模板列表中...</p>
    </div>

    <div v-else-if="error" class="error-container">
      <el-icon :size="40" color="#f56c6c"><CircleClose /></el-icon>
      <p>{{ error }}</p>
      <el-button @click="loadTemplates">重试</el-button>
    </div>

    <div v-else class="template-grid">
      <div
        v-for="template in templates"
        :key="template.id"
        class="template-card"
        @click="selectTemplate(template)"
      >
        <div class="card-icon">
          <el-icon :size="48"><House /></el-icon>
        </div>
        <div class="card-content">
          <h3>{{ template.name }}</h3>
          <p class="description">{{ template.description }}</p>
          <el-tag size="small" type="info">{{ template.category }}</el-tag>
        </div>
        <div class="card-footer">
          <el-button type="primary" size="small">
            选择此模板
            <el-icon class="el-icon--right"><ArrowRight /></el-icon>
          </el-button>
        </div>
      </div>
    </div>

    <!-- 或者上传自定义模板 -->
    <div class="upload-option">
      <el-divider>或</el-divider>
      <el-button @click="$emit('upload-custom')" plain>
        <el-icon><Upload /></el-icon>
        上传自定义模板
      </el-button>
    </div>
  </div>
</template>

<script setup>
/**
 * 模板选择器组件
 * 用于展示所有可用的法律文书模板，用户可以选择预置模板或上传自定义模板
 */

import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { House, ArrowRight, Upload, Loading, CircleClose } from '@element-plus/icons-vue'
import { TemplateService } from '@/services/templateService'

// ==================== Props & Emits ====================
/**
 * 组件事件定义
 * @event template-selected - 当用户选择模板时触发，传递完整的模板数据
 * @event upload-custom - 当用户点击上传自定义模板时触发
 */
const emit = defineEmits(['template-selected', 'upload-custom'])

// ==================== 响应式数据 ====================
/**
 * 模板列表
 * @type {Ref<Array>}
 */
const templates = ref([])

/**
 * 加载状态
 * @type {Ref<boolean>}
 */
const loading = ref(false)

/**
 * 错误信息
 * @type {Ref<string|null>}
 */
const error = ref(null)

// ==================== 方法 ====================
/**
 * 加载可用模板列表
 * 从 TemplateService 获取所有可用的模板
 */
const loadTemplates = async () => {
  loading.value = true
  error.value = null
  
  try {
    templates.value = await TemplateService.getAvailableTemplates()
  } catch (err) {
    console.error('加载模板列表失败:', err)
    error.value = '加载模板列表失败，请重试'
  } finally {
    loading.value = false
  }
}

/**
 * 选择模板
 * 加载完整的模板数据（包括配置、映射和Word文件）
 * @param {Object} template - 模板基本信息
 */
const selectTemplate = async (template) => {
  // 显示加载提示
  const loadingMessage = ElMessage({
    message: '正在加载模板...',
    type: 'info',
    duration: 0
  })

  try {
    // 加载完整模板数据
    const completeTemplate = await TemplateService.loadCompleteTemplate(template.id)
    loadingMessage.close()
    
    // 触发事件，传递完整模板数据给父组件
    emit('template-selected', completeTemplate)
  } catch (err) {
    loadingMessage.close()
    console.error('加载模板失败:', err)
    ElMessage.error('加载模板失败: ' + err.message)
  }
}

// ==================== 生命周期 ====================
/**
 * 组件挂载时加载模板列表
 */
onMounted(() => {
  loadTemplates()
})
</script>

<style scoped>
.template-selector {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 24px;
}

.selector-header {
  text-align: center;
  margin-bottom: 48px;
}

.selector-header h2 {
  font-size: 32px;
  color: #303133;
  margin-bottom: 12px;
}

.subtitle {
  font-size: 16px;
  color: #909399;
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;
}

.loading-container p,
.error-container p {
  color: #909399;
  font-size: 14px;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
  margin-bottom: 48px;
}

.template-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.template-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
}

.card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  color: white;
  margin: 0 auto;
}

.card-content {
  flex: 1;
  text-align: center;
}

.card-content h3 {
  font-size: 20px;
  color: #303133;
  margin-bottom: 8px;
}

.description {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  margin-bottom: 12px;
}

.card-footer {
  display: flex;
  justify-content: center;
}

.card-footer .el-button {
  width: 100%;
}

.upload-option {
  text-align: center;
  margin-top: 48px;
}

.upload-option .el-divider {
  margin: 24px 0;
}

@media (max-width: 768px) {
  .template-grid {
    grid-template-columns: 1fr;
  }
  
  .selector-header h2 {
    font-size: 24px;
  }
}
</style>
