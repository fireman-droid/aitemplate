<template>
  <el-card class="placeholder-list" shadow="hover">
    <template #header>
      <div class="list-header">
        <span>占位符填充表单</span>
        <el-tag type="success" round>{{ placeholders.length }}</el-tag>
      </div>
    </template>

    <el-empty 
      v-if="placeholders.length === 0" 
      description="请先上传包含占位符的文档"
      :image-size="100"
    />

    <div v-else class="form-container">
      <div class="search-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索占位符..."
          clearable
          :prefix-icon="Search"
        />
      </div>

      <el-scrollbar max-height="550px">
      <el-form :model="formData" label-position="top" class="placeholder-form">
        <el-form-item 
          v-for="placeholder in filteredPlaceholders"
          :key="placeholder.id"
          class="form-item"
        >
          <template #label>
            <div class="form-label">
              <span class="label-text">{{ getPlaceholderLabel(placeholder.name) }}</span>
              <el-tag size="small" type="info">{{ placeholder.name }}</el-tag>
            </div>
          </template>
          
          <!-- 选择框类型（性别、是否等） -->
          <el-select 
            v-if="isCheckboxField(placeholder.name)"
            v-model="formData[placeholder.name]"
            placeholder="请选择"
            style="width: 100%"
            clearable
          >
            <el-option label="☑ 选中" value="☑" />
            <el-option label="□ 未选中" value="□" />
          </el-select>
          
          <!-- 大文本类型 -->
          <el-input
            v-else-if="isTextareaField(placeholder.name)"
            v-model="formData[placeholder.name]"
            type="textarea"
            :rows="3"
            placeholder="请输入内容"
            clearable
          />
          
          <!-- 普通文本类型 -->
          <el-input
            v-else
            v-model="formData[placeholder.name]"
            placeholder="请输入内容"
            clearable
          />
        </el-form-item>
      </el-form>
    </el-scrollbar>
    
    <div v-if="searchKeyword && filteredPlaceholders.length === 0" class="no-results">
      <el-empty description="没有找到匹配的占位符" :image-size="80" />
    </div>
  </div>

    <template #footer v-if="placeholders.length > 0">
      <div class="form-actions">
        <el-button @click="handleClear">清空</el-button>
        <el-button type="primary" @click="handleFill">填充到文档</el-button>
      </div>
    </template>
  </el-card>
</template>

<script>
import { ref, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import placeholderMappingData from '../../PLACEHOLDER_MAPPING.json'

const placeholderMapping = placeholderMappingData

export default {
  name: 'PlaceholderList',
  props: {
    placeholders: {
      type: Array,
      default: () => []
    },
    activePlaceholderId: {
      type: String,
      default: null
    }
  },
  emits: ['fill-placeholders'],
  setup(props, { emit }) {
    const formData = ref({})
    const searchKeyword = ref('')

    // 监听占位符变化，初始化表单数据
    watch(() => props.placeholders, (newPlaceholders) => {
      const newFormData = {}
      newPlaceholders.forEach(p => {
        newFormData[p.name] = ''
      })
      formData.value = newFormData
    }, { immediate: true, deep: true })

    // 过滤占位符
    const filteredPlaceholders = computed(() => {
      if (!searchKeyword.value) {
        return props.placeholders
      }
      const keyword = searchKeyword.value.toLowerCase()
      return props.placeholders.filter(p => {
        const label = getPlaceholderLabel(p.name).toLowerCase()
        const name = p.name.toLowerCase()
        return label.includes(keyword) || name.includes(keyword)
      })
    })

    // 获取占位符的中文标签
    const getPlaceholderLabel = (name) => {
      return placeholderMapping[name] || name
    }

    // 判断是否为选择框字段（包含 gender、yes、no 等关键词）
    const isCheckboxField = (name) => {
      return name.includes('gender_') || 
             name.includes('_yes') || 
             name.includes('_no') ||
             name.includes('_has') ||
             name.includes('_none') ||
             name.includes('_understand') ||
             name.includes('_type_') ||
             name.includes('_own_') ||
             name.includes('_auth_') ||
             name.includes('_issue') ||
             name.includes('_claim_') ||
             name.includes('_return') ||
             name.includes('_pay_') ||
             name.includes('_penalty') ||
             name.includes('_interest') ||
             name.includes('_compensation') ||
             name.includes('_assist') ||
             name.includes('_bear') ||
             name.includes('_repair') ||
             name.includes('_cost') ||
             name.includes('_request') ||
             name.includes('_formal') ||
             name.includes('_preliminary') ||
             name.includes('_registered') ||
             name.includes('_signed') ||
             name.includes('_sale') ||
             name.includes('_presale') ||
             name.includes('_diff') ||
             name.includes('_parking') ||
             name.includes('_actual') ||
             name.includes('_registration') ||
             name.includes('_transfer') ||
             name.includes('_warranty') ||
             name.includes('_action') ||
             name.includes('_notice') ||
             name.includes('_contract') ||
             name.includes('_fact') ||
             name.includes('_method_') ||
             name.includes('_paid') ||
             name.includes('_decoration') ||
             name.includes('_serious') ||
             name.includes('_repairable') ||
             name.includes('_mediation') ||
             name.includes('_benefit') ||
             name.includes('_consider')
    }

    // 判断是否为大文本字段
    const isTextareaField = (name) => {
      return name.includes('_detail') ||
             name.includes('_content') ||
             name.includes('_reason') ||
             name.includes('_reasons') ||
             name.includes('_requirement') ||
             name.includes('_agreement') ||
             name.includes('_list') ||
             name.includes('_addr') ||
             name.includes('_address') ||
             name.includes('_location') ||
             name === 'facts_and_reasons' ||
             name === 'claim_content' ||
             name === 'other_request' ||
             name === 'evidence_list'
    }

    // 清空表单
    const handleClear = () => {
      const newFormData = {}
      props.placeholders.forEach(p => {
        newFormData[p.name] = ''
      })
      formData.value = newFormData
      ElMessage.success('已清空所有内容')
    }

    // 填充到文档
    const handleFill = () => {
      // 检查是否有填充内容
      const hasContent = Object.values(formData.value).some(v => v && v.trim())
      if (!hasContent) {
        ElMessage.warning('请至少填写一个字段')
        return
      }

      emit('fill-placeholders', formData.value)
      ElMessage.success('已填充到文档')
    }

    return {
      formData,
      searchKeyword,
      filteredPlaceholders,
      getPlaceholderLabel,
      isCheckboxField,
      isTextareaField,
      handleClear,
      handleFill,
      Search
    }
  }
}
</script>

<style scoped>
.placeholder-list {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 16px;
}

.placeholder-form {
  padding: 16px;
}

.form-item {
  margin-bottom: 20px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.label-text {
  font-weight: 500;
  color: #303133;
  font-size: 14px;
}

.form-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.search-bar {
  padding: 16px;
  border-bottom: 1px solid #ebeef5;
  background: #fafafa;
}

.no-results {
  padding: 40px 16px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px;
  border-top: 1px solid #ebeef5;
  background: #fafafa;
}
</style>
