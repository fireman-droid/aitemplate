<template>
  <div class="dynamic-form">
    <div class="form-header">
      <h3>填充文档</h3>
      <el-tag type="success" round>{{ placeholders.length }} 个字段</el-tag>
    </div>

    <el-empty 
      v-if="placeholders.length === 0" 
      description="请先选择模板或上传文档"
      :image-size="100"
    />

    <div v-else class="form-container">
      <el-form :model="formData" label-position="top" class="placeholder-form">
        <el-collapse v-model="activeGroups" class="form-collapse">
          <!-- 动态生成一级分组 -->
          <el-collapse-item
            v-for="group in groups"
            :key="group.id"
            :title="group.title"
            :name="group.id"
          >
            <!-- 递归渲染子分组 -->
            <template v-for="subgroup in group.subgroups" :key="subgroup.id">
              <div class="subgroup-container">
                <!-- 二级标题 -->
                <div class="subgroup-header">
                  <h4>{{ subgroup.title }}</h4>
                  <p v-if="subgroup.description" class="subgroup-description">
                    {{ subgroup.description }}
                  </p>
                </div>

                <!-- 如果有三级子分组，继续渲染 -->
                <template v-if="subgroup.subgroups && subgroup.subgroups.length > 0">
                  <div
                    v-for="thirdLevel in subgroup.subgroups"
                    :key="thirdLevel.id"
                    class="third-level-container"
                  >
                    <div class="third-level-header">
                      <h5>{{ thirdLevel.title }}</h5>
                      <p v-if="thirdLevel.description" class="third-level-description">
                        {{ thirdLevel.description }}
                      </p>
                    </div>
                    
                    <!-- 渲染字段 -->
                    <div class="fields-container">
                      <el-form-item
                        v-for="placeholder in getFieldsForSubgroup(thirdLevel)"
                        :key="placeholder.id"
                        class="form-item"
                      >
                        <template #label>
                          <span class="label-text">{{ getPlaceholderLabel(placeholder.name) }}</span>
                        </template>
                        
                        <!-- 性别字段：下拉选择框 -->
                        <el-select
                          v-if="shouldRenderGenderGroup(placeholder.name)"
                          :model-value="getGenderValue(getGenderPrefix(placeholder.name))"
                          @update:model-value="handleGenderChange(getGenderPrefix(placeholder.name), $event)"
                          placeholder="请选择性别"
                          clearable
                        >
                          <el-option label="男" value="male" />
                          <el-option label="女" value="female" />
                        </el-select>
                        
                        <!-- 普通复选框 -->
                        <el-checkbox
                          v-else-if="isCheckboxField(placeholder.name)"
                          v-model="formData[placeholder.name]"
                          true-label="☑"
                          false-label="□"
                          size="large"
                        >
                          {{ formData[placeholder.name] === '☑' ? '选中' : '未选中' }}
                        </el-checkbox>
                        
                        <!-- 大文本框 -->
                        <el-input
                          v-else-if="isTextareaField(placeholder.name)"
                          v-model="formData[placeholder.name]"
                          type="textarea"
                          :rows="5"
                          placeholder="请输入内容"
                          clearable
                        />
                        
                        <!-- 普通文本框 -->
                        <el-input
                          v-else-if="!isGenderField(placeholder.name)"
                          v-model="formData[placeholder.name]"
                          placeholder="请输入内容"
                          clearable
                        />
                      </el-form-item>
                    </div>
                  </div>
                </template>

                <!-- 如果没有三级子分组，直接渲染字段 -->
                <template v-else>
                  <div class="fields-container">
                    <el-form-item
                      v-for="placeholder in getFieldsForSubgroup(subgroup)"
                      :key="placeholder.id"
                      class="form-item"
                    >
                      <template #label>
                        <span class="label-text">{{ getPlaceholderLabel(placeholder.name) }}</span>
                      </template>
                      
                      <!-- 性别字段：下拉选择框 -->
                      <el-select
                        v-if="shouldRenderGenderGroup(placeholder.name)"
                        :model-value="getGenderValue(getGenderPrefix(placeholder.name))"
                        @update:model-value="handleGenderChange(getGenderPrefix(placeholder.name), $event)"
                        placeholder="请选择性别"
                        clearable
                      >
                        <el-option label="男" value="male" />
                        <el-option label="女" value="female" />
                      </el-select>
                      
                      <!-- 普通复选框 -->
                      <el-checkbox
                        v-else-if="isCheckboxField(placeholder.name)"
                        v-model="formData[placeholder.name]"
                        true-label="☑"
                        false-label="□"
                        size="large"
                      >
                        {{ formData[placeholder.name] === '☑' ? '选中' : '未选中' }}
                      </el-checkbox>
                      
                      <!-- 大文本框 -->
                      <el-input
                        v-else-if="isTextareaField(placeholder.name)"
                        v-model="formData[placeholder.name]"
                        type="textarea"
                        :rows="5"
                        placeholder="请输入内容"
                        clearable
                      />
                      
                      <!-- 普通文本框 -->
                      <el-input
                        v-else-if="!isGenderField(placeholder.name)"
                        v-model="formData[placeholder.name]"
                        placeholder="请输入内容"
                        clearable
                      />
                    </el-form-item>
                  </div>
                </template>
              </div>
            </template>
          </el-collapse-item>
        </el-collapse>
      </el-form>
    </div>
  </div>
</template>

<script>
import { ref, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'

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
  name: 'DynamicPlaceholderForm',
  props: {
    placeholders: {
      type: Array,
      default: () => []
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
  emits: ['preview-update'],
  setup(props, { emit }) {
    const formData = ref({})
    const activeGroups = ref([])

    // 获取分组配置
    const groups = computed(() => {
      if (!props.templateConfig || !props.templateConfig.lawsuit_template) {
        console.log('DynamicForm: 没有模板配置')
        return []
      }
      const groups = props.templateConfig.lawsuit_template.groups || []
      console.log('DynamicForm: 加载了', groups.length, '个分组')
      return groups
    })

    // 初始化默认展开的分组
    watch(groups, (newGroups) => {
      if (newGroups.length > 0) {
        activeGroups.value = newGroups
          .filter(g => g.defaultExpanded !== false)
          .map(g => g.id)
      }
    }, { immediate: true })

    // 监听占位符变化，初始化表单数据
    watch(() => props.placeholders, (newPlaceholders) => {
      const newFormData = {}
      newPlaceholders.forEach(p => {
        // 如果是复选框字段，默认值为 □（未选中）
        if (isCheckboxField(p.name)) {
          newFormData[p.name] = '□'
        } else {
          newFormData[p.name] = ''
        }
      })
      formData.value = newFormData
    }, { immediate: true, deep: true })

    // 防抖的预览更新函数
    const debouncedPreviewUpdate = debounce((data) => {
      emit('preview-update', data)
    }, 500)

    // 监听表单数据变化，实时更新预览
    watch(formData, (newData) => {
      debouncedPreviewUpdate(newData)
    }, { deep: true })

    // 根据子分组配置获取字段
    const getFieldsForSubgroup = (subgroup) => {
      let fields = []
      
      // 如果明确指定了 fields，直接使用
      if (subgroup.fields && subgroup.fields.length > 0) {
        fields = props.placeholders.filter(p => subgroup.fields.includes(p.name))
      }
      // 使用 prefix 匹配
      else if (subgroup.prefix) {
        fields = props.placeholders.filter(p => {
          const matchesPrefix = p.name.startsWith(subgroup.prefix)
          
          // 排除特定前缀
          if (subgroup.excludePrefixes) {
            const isExcluded = subgroup.excludePrefixes.some(exclude => 
              p.name.startsWith(exclude)
            )
            return matchesPrefix && !isExcluded
          }
          
          return matchesPrefix
        })
      }
      // 使用正则模式匹配
      else if (subgroup.prefixPattern) {
        const pattern = new RegExp(`^(${subgroup.prefixPattern})`)
        fields = props.placeholders.filter(p => pattern.test(p.name))
      }

      // 过滤掉成对字段的反向字段
      return fields.filter(p => !shouldFilterField(p.name))
    }

    // 获取占位符的中文标签
    const getPlaceholderLabel = (name) => {
      // 如果是性别字段，返回不带"-男/-女"的标签
      if (isGenderField(name)) {
        const prefix = getGenderPrefix(name)
        if (prefix && props.placeholderMapping) {
          const mField = `${prefix}_gender_m`
          const label = props.placeholderMapping[mField]
          if (label) {
            // 移除"-男"或"-女"后缀
            return label.replace(/-男$/, '').replace(/-女$/, '')
          }
        }
      }
      
      if (props.placeholderMapping && props.placeholderMapping[name]) {
        return props.placeholderMapping[name]
      }
      return name
    }

    // 判断是否为性别字段（单选按钮组）
    const isGenderField = (name) => {
      return name.includes('gender_m') || name.includes('gender_f')
    }
    
    // 判断是否为选择框字段（单个复选框）
    const isCheckboxField = (name) => {
      // 排除性别字段
      if (isGenderField(name)) {
        return false
      }
      
      // 排除成对出现的字段（如 _yes/_no, _understand/_not_understand）
      // 这些应该合并为一个复选框
      const isPairedField = (
        (name.includes('_yes') || name.includes('_no')) ||
        (name.includes('_understand') && name.includes('_not_')) ||
        (name.includes('_has') || name.includes('_none'))
      )
      
      if (isPairedField) {
        // 只保留正向字段（_yes, _understand, _has）
        return name.includes('_yes') || 
               (name.includes('_understand') && !name.includes('_not_')) ||
               name.includes('_has')
      }
      
      // 其他单独的选择框字段
      return name.includes('_type_') ||
             name.includes('_own_') ||
             name.includes('_auth_') ||
             name.includes('_issue') ||
             name.includes('_claim_') ||
             name.includes('_registered') ||
             name.includes('_signed') ||
             name.includes('_sale') ||
             name.includes('_presale') ||
             name.includes('_actual') ||
             name.includes('_diff') ||
             name.includes('_parking') ||
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
    
    // 判断字段是否应该被过滤掉（成对字段的反向字段）
    const shouldFilterField = (name) => {
      // 性别字段的 _f 字段需要被过滤掉（只保留 _m 用于渲染下拉框）
      if (name.includes('gender_f')) {
        return true
      }
      
      return name.includes('_no') ||
             (name.includes('_not_understand')) ||
             name.includes('_none')
    }
    
    // 获取性别字段的前缀（如 p_gender_m -> p）
    const getGenderPrefix = (name) => {
      const match = name.match(/^(.+?)_gender_/)
      return match ? match[1] : null
    }
    
    // 检查是否已经渲染过该性别字段组
    const renderedGenderGroups = ref(new Set())
    
    // 判断是否应该渲染性别字段组（只渲染 _m 字段，_f 字段跳过）
    const shouldRenderGenderGroup = (name) => {
      if (!isGenderField(name)) return false
      if (!name.includes('gender_m')) return false // 只在 _m 字段时渲染
      
      return true
    }
    
    // 处理性别选择变化
    const handleGenderChange = (prefix, value) => {
      const mField = `${prefix}_gender_m`
      const fField = `${prefix}_gender_f`
      
      if (value === 'male') {
        formData.value[mField] = '☑'
        formData.value[fField] = '□'
      } else if (value === 'female') {
        formData.value[mField] = '□'
        formData.value[fField] = '☑'
      }
    }
    
    // 获取当前性别选择
    const getGenderValue = (prefix) => {
      const mField = `${prefix}_gender_m`
      const fField = `${prefix}_gender_f`
      
      if (formData.value[mField] === '☑') return 'male'
      if (formData.value[fField] === '☑') return 'female'
      return null
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

    return {
      formData,
      activeGroups,
      groups,
      getFieldsForSubgroup,
      getPlaceholderLabel,
      isCheckboxField,
      isGenderField,
      isTextareaField,
      shouldRenderGenderGroup,
      getGenderPrefix,
      getGenderValue,
      handleGenderChange
    }
  }
}
</script>

<style scoped>
.dynamic-form {
  padding: 24px;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.form-header h3 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.form-container {
  display: flex;
  flex-direction: column;
}

.placeholder-form {
  padding: 0;
}

.form-collapse {
  border: none;
}

.form-collapse :deep(.el-collapse-item__header) {
  font-size: 18px;
  font-weight: 700;
  color: #303133;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 16px 20px;
  border-radius: 8px;
  margin-bottom: 12px;
}

.form-collapse :deep(.el-collapse-item__wrap) {
  border: none;
  background: transparent;
}

.form-collapse :deep(.el-collapse-item__content) {
  padding: 0;
  background: #fafafa;
  border-radius: 8px;
  margin-bottom: 16px;
}

.subgroup-container {
  padding: 20px;
  background: white;
  border-radius: 8px;
  margin-bottom: 16px;
}

.subgroup-header {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e4e7ed;
}

.subgroup-header h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #409eff;
}

.subgroup-description {
  margin: 0;
  font-size: 13px;
  color: #909399;
  line-height: 1.6;
}

.third-level-container {
  margin-left: 20px;
  margin-bottom: 20px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 6px;
  border-left: 3px solid #409eff;
}

.third-level-header h5 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #606266;
}

.third-level-description {
  margin: 0 0 12px 0;
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}

.fields-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.form-item {
  margin-bottom: 0;
}

.label-text {
  font-weight: 500;
  color: #606266;
  font-size: 14px;
}

@media (max-width: 768px) {
  .fields-container {
    grid-template-columns: 1fr;
  }
  
  .third-level-container {
    margin-left: 0;
  }
}
</style>
