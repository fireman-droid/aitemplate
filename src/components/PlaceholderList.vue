<template>
  <div class="placeholder-list">
    <div class="list-header">
      <h3>填充文档</h3>
      <el-tag type="success" round>{{ placeholders.length }} 个字段</el-tag>
    </div>

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
          size="large"
        />
      </div>

      <el-form :model="formData" label-position="top" class="placeholder-form">
        <!-- 原告信息 -->
        <el-collapse v-model="activeGroups" class="form-collapse">
          <el-collapse-item title="原告信息（自然人）" name="plaintiff">
            <!-- 性别选择（特殊处理） -->
            <el-form-item 
              v-if="hasGenderFields('p_')"
              class="form-item"
            >
              <template #label>
                <span class="label-text">原告性别</span>
              </template>
              <el-radio-group v-model="genderSelections.p" @change="handleGenderChange('p', $event)">
                <el-radio label="male">男</el-radio>
                <el-radio label="female">女</el-radio>
              </el-radio-group>
            </el-form-item>

            <!-- 其他字段 -->
            <el-form-item 
              v-for="placeholder in getGroupPlaceholders('p_', true)"
              :key="placeholder.id"
              class="form-item"
            >
              <template #label>
                <span class="label-text">{{ getPlaceholderLabel(placeholder.name) }}</span>
              </template>
              
              <el-select 
                v-if="isCheckboxField(placeholder.name)"
                v-model="formData[placeholder.name]"
                placeholder="请选择"
                clearable
              >
                <el-option label="☑ 选中" value="☑" />
                <el-option label="□ 未选中" value="□" />
              </el-select>
              
              <el-input
                v-else-if="isTextareaField(placeholder.name)"
                v-model="formData[placeholder.name]"
                type="textarea"
                :rows="3"
                placeholder="请输入内容"
                clearable
              />
              
              <el-input
                v-else
                v-model="formData[placeholder.name]"
                placeholder="请输入内容"
                clearable
              />
            </el-form-item>
          </el-collapse-item>

          <el-collapse-item title="原告信息（法人）" name="plaintiff_company">
            <el-form-item 
              v-for="placeholder in getGroupPlaceholders('pc_')"
              :key="placeholder.id"
              class="form-item"
            >
              <template #label>
                <span class="label-text">{{ getPlaceholderLabel(placeholder.name) }}</span>
              </template>
              
              <el-select 
                v-if="isCheckboxField(placeholder.name)"
                v-model="formData[placeholder.name]"
                placeholder="请选择"
                clearable
              >
                <el-option label="☑ 选中" value="☑" />
                <el-option label="□ 未选中" value="□" />
              </el-select>
              
              <el-input
                v-else
                v-model="formData[placeholder.name]"
                placeholder="请输入内容"
                clearable
              />
            </el-form-item>
          </el-collapse-item>

          <el-collapse-item title="原告代理人" name="plaintiff_agent">
            <el-form-item 
              v-for="placeholder in getGroupPlaceholders('pa_')"
              :key="placeholder.id"
              class="form-item"
            >
              <template #label>
                <span class="label-text">{{ getPlaceholderLabel(placeholder.name) }}</span>
              </template>
              
              <el-select 
                v-if="isCheckboxField(placeholder.name)"
                v-model="formData[placeholder.name]"
                placeholder="请选择"
                clearable
              >
                <el-option label="☑ 选中" value="☑" />
                <el-option label="□ 未选中" value="□" />
              </el-select>
              
              <el-input
                v-else
                v-model="formData[placeholder.name]"
                placeholder="请输入内容"
                clearable
              />
            </el-form-item>
          </el-collapse-item>

          <el-collapse-item title="被告信息（自然人）" name="defendant">
            <!-- 性别选择（特殊处理） -->
            <el-form-item 
              v-if="hasGenderFields('d_')"
              class="form-item"
            >
              <template #label>
                <span class="label-text">被告性别</span>
              </template>
              <el-radio-group v-model="genderSelections.d" @change="handleGenderChange('d', $event)">
                <el-radio label="male">男</el-radio>
                <el-radio label="female">女</el-radio>
              </el-radio-group>
            </el-form-item>

            <!-- 其他字段 -->
            <el-form-item 
              v-for="placeholder in getGroupPlaceholders('d_', true)"
              :key="placeholder.id"
              class="form-item"
            >
              <template #label>
                <span class="label-text">{{ getPlaceholderLabel(placeholder.name) }}</span>
              </template>
              
              <el-select 
                v-if="isCheckboxField(placeholder.name)"
                v-model="formData[placeholder.name]"
                placeholder="请选择"
                clearable
              >
                <el-option label="☑ 选中" value="☑" />
                <el-option label="□ 未选中" value="□" />
              </el-select>
              
              <el-input
                v-else-if="isTextareaField(placeholder.name)"
                v-model="formData[placeholder.name]"
                type="textarea"
                :rows="3"
                placeholder="请输入内容"
                clearable
              />
              
              <el-input
                v-else
                v-model="formData[placeholder.name]"
                placeholder="请输入内容"
                clearable
              />
            </el-form-item>
          </el-collapse-item>

          <el-collapse-item title="被告信息（法人）" name="defendant_company">
            <el-form-item 
              v-for="placeholder in getGroupPlaceholders('dc_')"
              :key="placeholder.id"
              class="form-item"
            >
              <template #label>
                <span class="label-text">{{ getPlaceholderLabel(placeholder.name) }}</span>
              </template>
              
              <el-select 
                v-if="isCheckboxField(placeholder.name)"
                v-model="formData[placeholder.name]"
                placeholder="请选择"
                clearable
              >
                <el-option label="☑ 选中" value="☑" />
                <el-option label="□ 未选中" value="□" />
              </el-select>
              
              <el-input
                v-else
                v-model="formData[placeholder.name]"
                placeholder="请输入内容"
                clearable
              />
            </el-form-item>
          </el-collapse-item>

          <el-collapse-item title="第三人信息" name="third_party">
            <el-form-item 
              v-for="placeholder in getGroupPlaceholders('t_', 'tc_')"
              :key="placeholder.id"
              class="form-item"
            >
              <template #label>
                <span class="label-text">{{ getPlaceholderLabel(placeholder.name) }}</span>
              </template>
              
              <el-select 
                v-if="isCheckboxField(placeholder.name)"
                v-model="formData[placeholder.name]"
                placeholder="请选择"
                clearable
              >
                <el-option label="☑ 选中" value="☑" />
                <el-option label="□ 未选中" value="□" />
              </el-select>
              
              <el-input
                v-else
                v-model="formData[placeholder.name]"
                placeholder="请输入内容"
                clearable
              />
            </el-form-item>
          </el-collapse-item>

          <el-collapse-item title="诉讼请求与事实" name="claims">
            <el-form-item 
              v-for="placeholder in getOtherPlaceholders()"
              :key="placeholder.id"
              class="form-item"
            >
              <template #label>
                <span class="label-text">{{ getPlaceholderLabel(placeholder.name) }}</span>
              </template>
              
              <el-select 
                v-if="isCheckboxField(placeholder.name)"
                v-model="formData[placeholder.name]"
                placeholder="请选择"
                clearable
              >
                <el-option label="☑ 选中" value="☑" />
                <el-option label="□ 未选中" value="□" />
              </el-select>
              
              <el-input
                v-else-if="isTextareaField(placeholder.name)"
                v-model="formData[placeholder.name]"
                type="textarea"
                :rows="5"
                placeholder="请输入内容"
                clearable
              />
              
              <el-input
                v-else
                v-model="formData[placeholder.name]"
                placeholder="请输入内容"
                clearable
              />
            </el-form-item>
          </el-collapse-item>
        </el-collapse>
      </el-form>
    </div>
  </div>
</template>

<script>
import { ref, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import placeholderMapping from '@/data/placeholderMapping.json'
import { 
  getFieldGroups, 
  getFieldsForSubgroup, 
  hasGenderFields as checkGenderFields,
  isCheckboxField as utilIsCheckboxField,
  isTextareaField as utilIsTextareaField,
  detectTemplateType
} from '@/utils/fieldGroupHelper'

// 防抖函数
function debounce(fn, delay) {
  let timer = null
  return function(...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

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
    },
    templateConfig: {
      type: Object,
      default: null
    },
    placeholderMapping: {
      type: Object,
      default: null
    }
  },
  emits: ['fill-placeholders', 'preview-update'],
  setup(props, { emit }) {
    const formData = ref({})
    const searchKeyword = ref('')
    const activeGroups = ref(['plaintiff', 'defendant', 'claims']) // 默认展开的分组
    const genderSelections = ref({
      p: null,  // 原告性别
      d: null,  // 被告性别
      t: null   // 第三人性别
    })

    // 监听占位符变化，初始化表单数据
    watch(() => props.placeholders, (newPlaceholders) => {
      const newFormData = {}
      newPlaceholders.forEach(p => {
        newFormData[p.name] = ''
      })
      formData.value = newFormData
    }, { immediate: true, deep: true })

    // 防抖的预览更新函数
    const debouncedPreviewUpdate = debounce((data) => {
      console.log('触发预览更新')
      emit('preview-update', data)
    }, 500) // 500ms 防抖

    // 监听表单数据变化，实时更新预览
    watch(formData, (newData) => {
      debouncedPreviewUpdate(newData)
    }, { deep: true })

    // 检查是否有性别字段
    const hasGenderFields = (prefix) => {
      return props.placeholders.some(p => 
        p.name === `${prefix}gender_m` || p.name === `${prefix}gender_f`
      )
    }

    // 处理性别选择变化
    const handleGenderChange = (prefix, value) => {
      if (value === 'male') {
        formData.value[`${prefix}_gender_m`] = '☑'
        formData.value[`${prefix}_gender_f`] = '□'
      } else if (value === 'female') {
        formData.value[`${prefix}_gender_m`] = '□'
        formData.value[`${prefix}_gender_f`] = '☑'
      }
    }

    // 获取指定前缀的占位符
    const getGroupPlaceholders = (prefix, excludeGender = false) => {
      return props.placeholders.filter(p => {
        const isMatch = p.name.startsWith(prefix) && !p.name.startsWith('pa_')
        if (excludeGender) {
          // 排除性别字段
          return isMatch && !p.name.includes('gender_m') && !p.name.includes('gender_f')
        }
        return isMatch
      })
    }

    // 获取其他占位符（不属于特定分组的）
    const getOtherPlaceholders = () => {
      const knownPrefixes = ['p_', 'pc_', 'pa_', 'd_', 'dc_', 't_', 'tc_']
      return props.placeholders.filter(p => {
        return !knownPrefixes.some(prefix => p.name.startsWith(prefix))
      })
    }

    // 获取占位符的中文标签
    const getPlaceholderLabel = (name) => {
      // 优先使用传入的 placeholderMapping
      if (props.placeholderMapping && props.placeholderMapping[name]) {
        return props.placeholderMapping[name]
      }
      // 降级使用导入的 placeholderMapping
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
      activeGroups,
      genderSelections,
      hasGenderFields,
      handleGenderChange,
      getGroupPlaceholders,
      getOtherPlaceholders,
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
  padding: 24px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.list-header h3 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.search-bar {
  margin-bottom: 20px;
}

.placeholder-form {
  padding: 0;
}

.form-collapse {
  border: none;
}

.form-collapse :deep(.el-collapse-item__header) {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  background: #f5f7fa;
  padding: 16px 20px;
  border-radius: 4px;
  margin-bottom: 8px;
}

.form-collapse :deep(.el-collapse-item__wrap) {
  border: none;
  background: transparent;
}

.form-collapse :deep(.el-collapse-item__content) {
  padding: 16px 20px 24px;
  background: #fafafa;
  border-radius: 4px;
  margin-bottom: 16px;
}

.form-item {
  margin-bottom: 20px;
}

.label-text {
  font-weight: 500;
  color: #606266;
  font-size: 14px;
}

.form-container {
  display: flex;
  flex-direction: column;
}
</style>
