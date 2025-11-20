<template>
  <div class="dynamic-form">
    <!-- 表单头部：显示标题和字段数量 -->
    <div class="form-header">
      <h3>{{ templateConfig?.template_config?.template_name || '填充文档' }}</h3>
      <div class="header-actions">
        <el-button size="small" @click="showImportDialog = true">导入JSON</el-button>
        <el-tag type="success" round>{{ placeholders.length }} 个字段</el-tag>
      </div>
    </div>

    <!-- 导入JSON对话框 -->
    <el-dialog
      v-model="showImportDialog"
      title="导入JSON数据"
      width="600px"
    >
      <el-input
        v-model="jsonInput"
        type="textarea"
        :rows="15"
        placeholder="请粘贴JSON数据..."
      />
      <template #footer>
        <el-button @click="showImportDialog = false">取消</el-button>
        <el-button type="primary" @click="handleImportJSON">导入</el-button>
      </template>
    </el-dialog>

    <!-- 空状态提示 -->
    <el-empty
      v-if="placeholders.length === 0"
      description="请先选择模板或上传文档"
      :image-size="100"
    />

    <!-- 表单主体内容 -->
    <div v-else class="form-container">
      <el-form :model="formData" label-position="top" class="placeholder-form">
        <!-- 折叠面板：遍历一级分组 (root_sections) -->
        <el-collapse v-model="activeGroups" class="form-collapse">
          <!-- 
            一级分组：如 "一、当事人信息"、"二、诉讼请求" 等
            每个 section 对应 biaodan.json 中的 root_sections 数组项
          -->
          <el-collapse-item
            v-for="section in sections"
            :key="section.id"
            :title="section.title"
            :name="section.id"
          >
            <!-- 分组描述（如果有） -->
            <div v-if="section.description" class="section-description">
              {{ section.description }}
            </div>

            <!-- 
              二级分组：遍历每个 section 下的 groups
              如 "1. 原告信息"、"2. 委托诉讼代理人" 等
            -->
            <div
              v-for="group in section.groups"
              :key="group.id"
              class="group-container"
            >
              <div class="group-header">
                <h4>{{ group.title }}</h4>
              </div>

              <!-- 
                渲染模式 1: fields_mapping 类型
                用于需要类型选择的分组，如原告信息（自然人/法人）
                结构：fields_mapping.type_selector.options[]
              -->
              <template v-if="group.fields_mapping">
                <!-- 遍历类型选项，如 "自然人"、"法人/非法人组织" -->
                <div
                  v-for="(option, idx) in group.fields_mapping.type_selector
                    .options"
                  :key="idx"
                  class="option-section"
                >
                  <h5 class="option-title">{{ option.label }}</h5>

                  <!-- 渲染该选项下的字段 -->
                  <div class="fields-container">
                    <template v-for="fieldName in option.fields" :key="fieldName">
                      <el-form-item
                        v-if="shouldRenderField(fieldName)"
                        class="form-item"
                      >
                      <template #label>
                        <span class="label-text">{{
                          getPlaceholderLabel(fieldName)
                        }}</span>
                      </template>
                      <el-radio-group
                        v-if="shouldRenderGenderGroup(fieldName)"
                        :model-value="
                          getGenderValue(getGenderPrefix(fieldName))
                        "
                        @update:model-value="
                          handleGenderChange(getGenderPrefix(fieldName), $event)
                        "
                        class="radio-group-inline"
                      >
                        <el-radio label="male" border>男</el-radio>
                        <el-radio label="female" border>女</el-radio>
                      </el-radio-group>
                      <el-date-picker
                        v-else-if="shouldRenderBirthDatePicker(fieldName)"
                        :model-value="getBirthDateValue(getBirthDatePrefix(fieldName))"
                        @update:model-value="handleBirthDateChange(getBirthDatePrefix(fieldName), $event)"
                        type="date"
                        placeholder="选择日期"
                        format="YYYY年MM月DD日"
                        value-format="YYYY-MM-DD"
                        clearable
                      />
                      <el-radio-group
                        v-else-if="isYesNoField(fieldName)"
                        v-model="formData[fieldName]"
                        class="yes-no-radio-group"
                      >
                        <el-radio label="☑">是</el-radio>
                        <el-radio label="□">否</el-radio>
                      </el-radio-group>
                      <el-date-picker
                        v-else-if="isDateField(fieldName)"
                        v-model="formData[fieldName]"
                        type="date"
                        placeholder="选择日期"
                        format="YYYY年MM月DD日"
                        value-format="YYYY-MM-DD"
                        clearable
                      />
                      <el-input
                        v-else-if="isTextareaField(fieldName)"
                        v-model="formData[fieldName]"
                        type="textarea"
                        :rows="5"
                        placeholder="请输入内容"
                        clearable
                      />
                      <el-input
                        v-else
                        v-model="formData[fieldName]"
                        placeholder="请输入内容"
                        clearable
                      />
                    </el-form-item>
                    </template>
                  </div>

                  <!-- 三级子分组：如 "单位类型"、"所有制性质" -->
                  <div v-if="option.sub_groups" class="sub-groups-container">
                    <div
                      v-for="(subGroup, subIdx) in option.sub_groups"
                      :key="subIdx"
                      class="sub-group-container"
                    >
                      <h6 class="sub-group-title">{{ subGroup.label }}</h6>
                      
                      <!-- 如果是单选组布尔类型，渲染为多选下拉框 -->
                      <el-form-item v-if="subGroup.ui_mode === 'radio_group_boolean'" class="form-item">
                        <el-select
                          :model-value="getMultiSelectValue(subGroup.fields)"
                          @update:model-value="handleMultiSelectChange(subGroup.fields, $event)"
                          placeholder="请选择"
                          multiple
                          clearable
                        >
                          <el-option
                            v-for="fieldName in subGroup.fields"
                            :key="fieldName"
                            :label="getPlaceholderLabel(fieldName)"
                            :value="fieldName"
                          />
                        </el-select>
                      </el-form-item>
                      
                      <!-- 否则按原来的方式渲染 -->
                      <div v-else class="fields-container">
                        <template v-for="fieldName in subGroup.fields" :key="fieldName">
                          <el-form-item
                            v-if="shouldRenderField(fieldName)"
                            class="form-item"
                          >
                          <template #label>
                            <span class="label-text">{{
                              getPlaceholderLabel(fieldName)
                            }}</span>
                          </template>
                          <el-radio-group
                            v-if="isYesNoField(fieldName)"
                            v-model="formData[fieldName]"
                            class="yes-no-radio-group"
                          >
                            <el-radio label="☑">是</el-radio>
                            <el-radio label="□">否</el-radio>
                          </el-radio-group>
                          <el-input
                            v-else
                            v-model="formData[fieldName]"
                            placeholder="请输入内容"
                            clearable
                          />
                        </el-form-item>
                        </template>
                      </div>
                    </div>
                  </div>
                </div>
              </template>

              <!-- 
                渲染模式 1.5: structured_form 类型
                用于结构化表单，每个 section 包含标签和字段
              -->
              <template v-else-if="group.ui_mode === 'structured_form' && group.sections">
                <div class="structured-form-container">
                  <div
                    v-for="(section, sectionIdx) in group.sections"
                    :key="sectionIdx"
                    class="structured-section"
                  >
                    <div class="structured-section-label">{{ section.label }}</div>
                    <div class="structured-section-fields" :class="{ 'fields-horizontal': hasMultipleYesNoFields(section.fields) }">
                      <!-- 单选模式：多个选项只能选一个 -->
                      <template v-if="section.ui_mode === 'single_choice'">
                        <el-radio-group
                          :model-value="getSingleChoiceValue(section.fields)"
                          @update:model-value="handleSingleChoiceChange(section.fields, $event)"
                          class="single-choice-group"
                        >
                          <el-radio
                            v-for="fieldName in section.fields"
                            :key="fieldName"
                            :label="fieldName"
                          >
                            {{ getPlaceholderLabel(fieldName) }}
                          </el-radio>
                        </el-radio-group>
                      </template>
                      
                      <!-- 是/否带详情模式：是 ○ 否 ○ 具体情况[文本框] -->
                      <template v-else-if="section.ui_mode === 'yes_no_with_detail'">
                        <div class="yes-no-detail-container">
                          <el-radio-group
                            :model-value="getYesNoDetailValue(section.fields)"
                            @update:model-value="handleYesNoDetailChange(section.fields, $event)"
                            class="yes-no-detail-group"
                          >
                            <template v-for="fieldName in section.fields" :key="fieldName">
                              <el-radio
                                v-if="fieldName.endsWith('_yes') || fieldName.endsWith('_no')"
                                :label="fieldName"
                              >
                                {{ getPlaceholderLabel(fieldName) }}
                              </el-radio>
                            </template>
                          </el-radio-group>
                          <template v-for="fieldName in section.fields" :key="'detail_' + fieldName">
                            <div v-if="!fieldName.endsWith('_yes') && !fieldName.endsWith('_no')" class="detail-input-wrapper">
                              <span class="detail-label">{{ getPlaceholderLabel(fieldName) }}：</span>
                              <el-input
                                v-if="isTextareaField(fieldName)"
                                v-model="formData[fieldName]"
                                type="textarea"
                                :rows="3"
                                placeholder="请输入内容"
                                clearable
                              />
                              <el-input
                                v-else
                                v-model="formData[fieldName]"
                                placeholder="请输入内容"
                                clearable
                              />
                            </div>
                          </template>
                        </div>
                      </template>
                      
                      <!-- 普通模式 -->
                      <template v-else>
                        <template v-for="fieldName in section.fields" :key="fieldName">
                          <el-form-item
                            v-if="shouldRenderField(fieldName)"
                            class="form-item structured-field-item"
                          >
                            <template #label v-if="hasMultipleYesNoFields(section.fields) && isYesNoField(fieldName)">
                              <span class="inline-field-label">{{ getPlaceholderLabel(fieldName) }}</span>
                            </template>
                            <el-radio-group
                              v-if="shouldRenderGenderGroup(fieldName)"
                              :model-value="getGenderValue(getGenderPrefix(fieldName))"
                              @update:model-value="handleGenderChange(getGenderPrefix(fieldName), $event)"
                              class="radio-group-inline"
                            >
                              <el-radio label="male" border>男</el-radio>
                              <el-radio label="female" border>女</el-radio>
                            </el-radio-group>
                            <el-date-picker
                              v-else-if="shouldRenderBirthDatePicker(fieldName)"
                              :model-value="getBirthDateValue(getBirthDatePrefix(fieldName))"
                              @update:model-value="handleBirthDateChange(getBirthDatePrefix(fieldName), $event)"
                              type="date"
                              placeholder="选择日期"
                              format="YYYY年MM月DD日"
                              value-format="YYYY-MM-DD"
                              clearable
                            />
                            <el-radio-group
                              v-else-if="isYesNoField(fieldName)"
                              v-model="formData[fieldName]"
                              class="yes-no-radio-group"
                            >
                              <el-radio label="☑">是</el-radio>
                              <el-radio label="□">否</el-radio>
                            </el-radio-group>
                            <el-date-picker
                              v-else-if="isDateField(fieldName)"
                              v-model="formData[fieldName]"
                              type="date"
                              placeholder="选择日期"
                              format="YYYY年MM月DD日"
                              value-format="YYYY-MM-DD"
                              clearable
                            />
                            <el-input
                              v-else-if="isTextareaField(fieldName)"
                              v-model="formData[fieldName]"
                              type="textarea"
                              :rows="5"
                              placeholder="请输入内容"
                              clearable
                            />
                            <el-input
                              v-else
                              v-model="formData[fieldName]"
                              placeholder="请输入内容"
                              clearable
                            />
                          </el-form-item>
                        </template>
                      </template>
                    </div>
                  </div>
                </div>
              </template>

              <!-- 
                渲染模式 2: 直接 fields 类型
                用于简单的字段列表，如 "事实与理由概述"
              -->
              <template v-else-if="group.fields">
                <!-- 如果是 radio_group_boolean 且有 detail_fields，特殊处理 -->
                <template v-if="group.ui_mode === 'radio_group_boolean' && group.detail_fields">
                  <!-- 渲染触发字段（有/无选项） -->
                  <el-form-item v-if="group.fields && group.fields.length >= 2" class="form-item trigger-field">
                    <el-radio-group
                      :model-value="getTriggerValue(group.fields[0], group.fields[1])"
                      @update:model-value="handleTriggerChange(group.fields[0], group.fields[1], $event)"
                      class="trigger-radio-group"
                    >
                      <el-radio label="true">有</el-radio>
                      <el-radio label="false">无</el-radio>
                    </el-radio-group>
                  </el-form-item>
                  
                  <!-- 渲染详细字段 -->
                  <div class="fields-container">
                    <template v-for="fieldName in group.detail_fields" :key="fieldName">
                      <el-form-item
                        v-if="shouldRenderField(fieldName)"
                        class="form-item"
                      >
                      <template #label>
                        <span class="label-text">{{
                          getPlaceholderLabel(fieldName)
                        }}</span>
                      </template>
                      <el-checkbox
                        v-if="isYesNoField(fieldName)"
                        v-model="formData[fieldName]"
                        true-label="☑"
                        false-label="□"
                        class="yes-no-checkbox"
                      >
                        {{ formData[fieldName] === '☑' ? '是' : '否' }}
                      </el-checkbox>
                      <el-date-picker
                        v-else-if="isDateField(fieldName)"
                        v-model="formData[fieldName]"
                        type="date"
                        placeholder="选择日期"
                        format="YYYY年MM月DD日"
                        value-format="YYYY-MM-DD"
                        clearable
                      />
                      <el-input
                        v-else-if="isTextareaField(fieldName)"
                        v-model="formData[fieldName]"
                        type="textarea"
                        :rows="5"
                        placeholder="请输入内容"
                        clearable
                      />
                      <el-input
                        v-else
                        v-model="formData[fieldName]"
                        placeholder="请输入内容"
                        clearable
                      />
                    </el-form-item>
                    </template>
                  </div>
                </template>
                
                <!-- 否则按原来的方式渲染 -->
                <div v-else class="fields-container">
                  <template v-for="fieldName in group.fields" :key="fieldName">
                    <el-form-item
                      v-if="shouldRenderField(fieldName)"
                      class="form-item"
                    >
                    <template #label>
                      <span class="label-text">{{
                        getPlaceholderLabel(fieldName)
                      }}</span>
                    </template>
                    <el-checkbox
                      v-if="isYesNoField(fieldName)"
                      v-model="formData[fieldName]"
                      true-label="☑"
                      false-label="□"
                      class="yes-no-checkbox"
                    >
                      {{ formData[fieldName] === '☑' ? '是' : '否' }}
                    </el-checkbox>
                    <el-date-picker
                      v-else-if="isDateField(fieldName)"
                      v-model="formData[fieldName]"
                      type="date"
                      placeholder="选择日期"
                      format="YYYY年MM月DD日"
                      value-format="YYYY-MM-DD"
                      clearable
                    />
                    <el-input
                      v-else-if="isTextareaField(fieldName)"
                      v-model="formData[fieldName]"
                      type="textarea"
                      :rows="5"
                      placeholder="请输入内容"
                      clearable
                    />
                    <el-input
                      v-else
                      v-model="formData[fieldName]"
                      placeholder="请输入内容"
                      clearable
                    />
                  </el-form-item>
                  </template>
                </div>

                <!-- 该组的子分组，如 "房屋性质"、"销售属性" 等 -->
                <div v-if="group.sub_groups" class="sub-groups-container">
                  <div
                    v-for="(subGroup, subIdx) in group.sub_groups"
                    :key="subIdx"
                    class="sub-group-container"
                  >
                    <h6 class="sub-group-title">{{ subGroup.label }}</h6>
                    
                    <!-- 如果是单选组布尔类型，渲染为多选下拉框 -->
                    <el-form-item v-if="subGroup.ui_mode === 'radio_group_boolean'" class="form-item">
                      <el-select
                        :model-value="getMultiSelectValue(subGroup.fields)"
                        @update:model-value="handleMultiSelectChange(subGroup.fields, $event)"
                        placeholder="请选择"
                        multiple
                        clearable
                      >
                        <el-option
                          v-for="fieldName in subGroup.fields"
                          :key="fieldName"
                          :label="getPlaceholderLabel(fieldName)"
                          :value="fieldName"
                        />
                      </el-select>
                    </el-form-item>
                    
                    <!-- 否则按原来的方式渲染 -->
                    <div v-else class="fields-container">
                      <template v-for="fieldName in subGroup.fields" :key="fieldName">
                        <el-form-item
                          v-if="shouldRenderField(fieldName)"
                          class="form-item"
                        >
                        <template #label>
                          <span class="label-text">{{
                            getPlaceholderLabel(fieldName)
                          }}</span>
                        </template>
                        <el-radio-group
                          v-if="isYesNoField(fieldName)"
                          v-model="formData[fieldName]"
                          class="yes-no-radio-group"
                        >
                          <el-radio label="☑">是</el-radio>
                          <el-radio label="□">否</el-radio>
                        </el-radio-group>
                        <el-input
                          v-else
                          v-model="formData[fieldName]"
                          placeholder="请输入内容"
                          clearable
                        />
                      </el-form-item>
                      </template>
                    </div>
                  </div>
                </div>
              </template>

              <!-- 
                渲染模式 3: detail_fields 类型
                用于条件激活的详细字段，如 "房屋买卖合同关系" 的具体主张
              -->
              <template v-else-if="group.detail_fields">
                <!-- 如果有触发字段，先显示触发选项 -->
                <el-form-item v-if="group.trigger_field_true && group.trigger_field_false" class="form-item trigger-field">
                  <el-radio-group
                    :model-value="getTriggerValue(group.trigger_field_true, group.trigger_field_false)"
                    @update:model-value="handleTriggerChange(group.trigger_field_true, group.trigger_field_false, $event)"
                    class="trigger-radio-group"
                  >
                    <el-radio label="true">有此问题</el-radio>
                    <el-radio label="false">无此问题</el-radio>
                  </el-radio-group>
                </el-form-item>
                
                <!-- 详细字段始终显示，不受触发字段影响 -->
                <div class="fields-container">
                  <template v-for="fieldName in group.detail_fields" :key="fieldName">
                    <el-form-item
                      v-if="shouldRenderField(fieldName)"
                      class="form-item"
                    >
                    <template #label>
                      <span class="label-text">{{
                        getPlaceholderLabel(fieldName)
                      }}</span>
                    </template>
                    <el-checkbox
                      v-if="isYesNoField(fieldName)"
                      v-model="formData[fieldName]"
                      true-label="☑"
                      false-label="□"
                      class="yes-no-checkbox"
                    >
                      {{ formData[fieldName] === '☑' ? '是' : '否' }}
                    </el-checkbox>
                    <el-date-picker
                      v-else-if="isDateField(fieldName)"
                      v-model="formData[fieldName]"
                      type="date"
                      placeholder="选择日期"
                      format="YYYY年MM月DD日"
                      value-format="YYYY-MM-DD"
                      clearable
                    />
                    <el-input
                      v-else-if="isTextareaField(fieldName)"
                      v-model="formData[fieldName]"
                      type="textarea"
                      :rows="5"
                      placeholder="请输入内容"
                      clearable
                    />
                    <el-input
                      v-else
                      v-model="formData[fieldName]"
                      placeholder="请输入内容"
                      clearable
                    />
                  </el-form-item>
                  </template>
                </div>
              </template>
            </div>
          </el-collapse-item>
        </el-collapse>
      </el-form>
    </div>
  </div>
</template>

<script setup>
/**
 * 动态占位符表单组件
 *
 * 功能：根据 biaodan.json 配置文件动态渲染表单
 * 支持多种渲染模式：
 * 1. fields_mapping: 带类型选择的字段组（如自然人/法人）
 * 2. fields: 直接字段列表
 * 3. detail_fields: 条件激活的详细字段
 * 4. sub_groups: 嵌套子分组
 */

import { ref, watch, computed } from "vue";
import { ElMessage } from 'element-plus';

/**
 * 防抖函数
 * 用于延迟执行频繁触发的函数，避免性能问题
 * @param {Function} fn - 要防抖的函数
 * @param {number} delay - 延迟时间（毫秒）
 */
function debounce(fn, delay) {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// ==================== Props 定义 ====================
const props = defineProps({
  // 占位符列表（从文档中提取的所有占位符）
  placeholders: { type: Array, default: () => [] },
  // 模板配置（biaodan.json 的内容）
  templateConfig: { type: Object, default: null },
  // 占位符映射（placeholders.json 的内容，字段名 -> 中文标签）
  placeholderMapping: { type: Object, default: null },
});

// ==================== Emits 定义 ====================
const emit = defineEmits(["preview-update"]);

// ==================== 响应式数据 ====================
// 表单数据对象，key 为字段名，value 为用户输入的值
const formData = ref({});
// 当前展开的折叠面板组
const activeGroups = ref([]);
// 导入JSON对话框
const showImportDialog = ref(false);
const jsonInput = ref('');

// ==================== 计算属性 ====================
/**
 * 从模板配置中提取一级分组（root_sections）
 * 如：一、当事人信息；二、诉讼请求；三、约定管辖和诉前保全 等
 */
const sections = computed(() => {
  if (!props.templateConfig?.template_config) return [];
  return props.templateConfig.template_config.root_sections || [];
});

// ==================== 监听器 ====================
/**
 * 监听 sections 变化，自动展开所有分组
 */
watch(
  sections,
  (newSections) => {
    if (newSections.length > 0) {
      activeGroups.value = newSections.map((s) => s.id);
    }
  },
  { immediate: true }
);

/**
 * 监听占位符变化，初始化表单数据
 * 复选框字段默认为 □（未选中），其他字段默认为空字符串
 */
watch(
  () => props.placeholders,
  (newPlaceholders) => {
    const newFormData = {};
    newPlaceholders.forEach((p) => {
      newFormData[p.name] = isCheckboxField(p.name) ? "□" : "";
    });
    formData.value = newFormData;
  },
  { immediate: true, deep: true }
);

/**
 * 防抖的预览更新
 * 当表单数据变化时，延迟 500ms 后触发预览更新，避免频繁更新
 */
const debouncedPreviewUpdate = debounce(
  (data) => emit("preview-update", data),
  500
);
watch(formData, (newData) => {
  // 调试：打印 formData 的内容
  console.log('📋 FormData 更新:', JSON.stringify(newData, null, 2));
  // console.log('📊 字段总数:', Object.keys(newData).length);
  // console.log('✅ 已填写字段:', Object.entries(newData).filter(([k, v]) => v && v !== '□').length);
  debouncedPreviewUpdate(newData);
}, { deep: true });

// ==================== 字段类型判断函数 ====================

/**
 * 获取占位符的显示标签
 * @param {string} name - 字段名称
 * @returns {string} 中文标签或原字段名
 *
 * 特殊处理：
 * - 性别字段（gender_m）统一显示为"性别"
 * - 出生日期字段（birth_y）统一显示为"出生日期"
 * - 其他字段从 placeholderMapping 中查找对应的中文标签
 */
const getPlaceholderLabel = (name) => {
  if (isGenderField(name) && name.includes("gender_m")) return "性别";
  if (isBirthDateField(name) && name.includes("birth_y")) return "出生日期";
  return props.placeholderMapping?.[name] || name;
};

/**
 * 判断是否为性别字段
 * @param {string} name - 字段名称
 * @returns {boolean} 是否为性别字段
 *
 * 性别字段命名规则：包含 gender_m（男）或 gender_f（女）
 */
const isGenderField = (name) =>
  name.includes("gender_m") || name.includes("gender_f");

/**
 * 判断是否为复选框字段
 * @param {string} name - 字段名称
 * @returns {boolean} 是否应该渲染为复选框
 *
 * 复选框字段识别规则：
 * 1. 性别字段不是复选框（单独处理）
 * 2. 成对字段（_yes/_no, _understand/_not_, _has/_none）中只有肯定项是复选框
 * 3. 包含特定关键词的字段（_type_, _own_, _auth_ 等）
 */
const isCheckboxField = (name) => {
  // 性别字段不是复选框
  if (isGenderField(name)) return false;

  // 文本字段不是复选框（包含 _detail, _content, _reason 等）
  if (name.includes("_detail") || name.includes("_content") || name.includes("_reason") || 
      name.includes("_reasons") || name.includes("_requirement") || name.includes("_agreement") ||
      name.includes("_list") || name.includes("_addr") || name.includes("_address") || 
      name.includes("_location")) {
    return false;
  }

  // 成对字段判断：只有肯定项（_yes, _understand, _has）才是复选框
  const paired =
    name.includes("_yes") ||
    name.includes("_no") ||
    (name.includes("_understand") && name.includes("_not_")) ||
    name.includes("_has") ||
    name.includes("_none");
  if (paired)
    return (
      name.includes("_yes") ||
      (name.includes("_understand") && !name.includes("_not_")) ||
      name.includes("_has")
    );

  // 其他复选框字段：根据命名关键词判断
  return (
    name.includes("_type_") ||
    name.includes("_own_") ||
    name.includes("_auth_") ||
    name.includes("_issue") ||
    name.includes("_claim_") ||
    name.includes("_registered") ||
    name.includes("_signed") ||
    name.includes("_sale") ||
    name.includes("_presale") ||
    name.includes("_actual") ||
    name.includes("_diff") ||
    name.includes("_parking") ||
    name.includes("_warranty") ||
    name.includes("_action") ||
    name.includes("_notice") ||
    name.includes("_contract") ||
    name.includes("_fact") ||
    name.includes("_method_") ||
    name.includes("_paid") ||
    name.includes("_decoration") ||
    name.includes("_serious") ||
    name.includes("_repairable") ||
    name.includes("_mediation") ||
    name.includes("_benefit") ||
    name.includes("_consider")
  );
};

/**
 * 从性别字段名中提取前缀
 * @param {string} name - 字段名称，如 "plaintiff_gender_m"
 * @returns {string|null} 前缀部分，如 "plaintiff"，如果不是性别字段则返回 null
 *
 * 用于关联同一实体的男女性别字段
 */
const getGenderPrefix = (name) => {
  const match = name.match(/^(.+?)_gender_/);
  return match ? match[1] : null;
};

/**
 * 判断是否应该渲染性别选择组件
 * @param {string} name - 字段名称
 * @returns {boolean} 是否渲染
 *
 * 只在遇到 gender_m 字段时渲染一次，避免重复渲染
 */
const shouldRenderGenderGroup = (name) =>
  isGenderField(name) && name.includes("gender_m");

/**
 * 处理性别选择变化
 * @param {string} prefix - 字段前缀，如 "plaintiff"
 * @param {string} value - 选择的值："male" 或 "female"
 *
 * 互斥逻辑：选中男性时，女性自动取消；反之亦然
 * ☑ 表示选中，□ 表示未选中
 */
const handleGenderChange = (prefix, value) => {
  const mField = `${prefix}_gender_m`;
  const fField = `${prefix}_gender_f`;
  if (value === "male") {
    formData.value[mField] = "☑";
    formData.value[fField] = "□";
  } else if (value === "female") {
    formData.value[mField] = "□";
    formData.value[fField] = "☑";
  }
};

/**
 * 获取当前性别选择值
 * @param {string} prefix - 字段前缀
 * @returns {string|null} "male"、"female" 或 null（未选择）
 *
 * 用于回显性别选择器的当前值
 */
const getGenderValue = (prefix) => {
  const mField = `${prefix}_gender_m`;
  const fField = `${prefix}_gender_f`;
  if (formData.value[mField] === "☑") return "male";
  if (formData.value[fField] === "☑") return "female";
  return null;
};

/**
 * 判断字段是否应该被渲染
 * @param {string} name - 字段名称
 * @returns {boolean} 是否应该渲染
 *
 * 跳过规则：
 * - gender_f（女）字段：因为已经在 gender_m 时一起渲染
 * - birth_m 和 birth_d 字段：因为已经在 birth_y 时一起渲染为日期选择器
 * - _no 字段：因为已经在对应的 _yes 字段时一起渲染
 * - _preliminary 字段：因为已经在 _formal 字段时一起渲染
 */
const shouldRenderField = (name) => {
  // 跳过 gender_f，因为性别在 gender_m 时一起渲染
  if (name.includes("gender_f")) return false;
  // 跳过 birth_m 和 birth_d，因为出生日期在 birth_y 时一起渲染
  if (name.includes("birth_m") || name.includes("birth_d")) return false;
  // 跳过 _no 字段，因为在 _yes 字段时一起渲染
  if (name.endsWith("_no")) return false;
  // 跳过 _preliminary 字段，因为在 _formal 字段时一起渲染
  if (name.endsWith("_preliminary")) return false;
  return true;
};

/**
 * 判断是否为成对的是/否字段
 * @param {string} name - 字段名称
 * @returns {boolean} 是否为成对字段
 */
const isPairedYesNoField = (name) => {
  return name.endsWith("_yes") || name.endsWith("_formal");
};

/**
 * 获取成对字段的配对字段名
 * @param {string} name - 字段名称
 * @returns {string} 配对字段名
 */
const getPairedFieldName = (name) => {
  if (name.endsWith("_yes")) {
    return name.replace("_yes", "_no");
  }
  if (name.endsWith("_formal")) {
    return name.replace("_formal", "_preliminary");
  }
  return null;
};

/**
 * 获取成对字段的当前值
 * @param {string} yesField - "是"字段名
 * @param {string} noField - "否"字段名
 * @returns {string} "yes" 或 "no"
 */
const getPairedFieldValue = (yesField, noField) => {
  if (formData.value[yesField] === '☑') return 'yes';
  if (formData.value[noField] === '☑') return 'no';
  return 'no'; // 默认为"否"
};

/**
 * 处理成对字段变化
 * @param {string} yesField - "是"字段名
 * @param {string} noField - "否"字段名
 * @param {string} value - "yes" 或 "no"
 */
const handlePairedFieldChange = (yesField, noField, value) => {
  if (value === 'yes') {
    formData.value[yesField] = '☑';
    formData.value[noField] = '□';
  } else {
    formData.value[yesField] = '□';
    formData.value[noField] = '☑';
  }
};

/**
 * 获取成对字段的标签（去掉后缀）
 * @param {string} name - 字段名称
 * @returns {string} 清理后的标签
 */
const getPairedFieldLabel = (name) => {
  const label = props.placeholderMapping?.[name] || name;
  // 去掉标签末尾的"是"、"否"、"本约"、"预约"等
  return label.replace(/[是否本约预]$/, '');
};

/**
 * 获取多选组的当前选中值
 * @param {Array} fields - 字段名称数组
 * @returns {Array} 当前选中的字段名数组
 *
 * 遍历所有字段，找到值为 ☑ 的字段
 */
const getMultiSelectValue = (fields) => {
  return fields.filter(field => formData.value[field] === '☑');
};

/**
 * 处理多选组选择变化
 * @param {Array} fields - 字段名称数组
 * @param {Array} selectedFields - 选中的字段名数组
 *
 * 将选中的字段设置为 ☑，未选中的字段设置为 □
 */
const handleMultiSelectChange = (fields, selectedFields) => {
  fields.forEach(field => {
    formData.value[field] = selectedFields.includes(field) ? '☑' : '□';
  });
};

/**
 * 获取触发字段的当前值
 * @param {string} trueField - "有此问题"对应的字段
 * @param {string} falseField - "无此问题"对应的字段
 * @returns {string} "true" 或 "false"
 */
const getTriggerValue = (trueField, falseField) => {
  if (formData.value[trueField] === '☑') return 'true';
  if (formData.value[falseField] === '☑') return 'false';
  return 'false'; // 默认为"无此问题"
};

/**
 * 处理触发字段变化
 * @param {string} trueField - "有此问题"对应的字段
 * @param {string} falseField - "无此问题"对应的字段
 * @param {string} value - "true" 或 "false"
 *
 * 互斥逻辑：选择"有此问题"或"无此问题"
 */
const handleTriggerChange = (trueField, falseField, value) => {
  if (value === 'true') {
    formData.value[trueField] = '☑';
    formData.value[falseField] = '□';
  } else {
    formData.value[trueField] = '□';
    formData.value[falseField] = '☑';
  }
};

/**
 * 判断是否为出生日期字段
 * @param {string} name - 字段名称
 * @returns {boolean} 是否为出生日期字段
 *
 * 出生日期字段命名规则：包含 birth_y（年）、birth_m（月）或 birth_d（日）
 */
const isBirthDateField = (name) =>
  name.includes("birth_y") || name.includes("birth_m") || name.includes("birth_d");

/**
 * 判断是否为日期字段（单个日期选择器）
 * @param {string} name - 字段名称
 * @returns {boolean} 是否为日期字段
 *
 * 日期字段命名规则：包含 _time 或 _date（但不是出生日期）
 */
const isDateField = (name) => {
  if (isBirthDateField(name)) return false;
  return name.includes("_time") || name.includes("_date");
};

/**
 * 从出生日期字段名中提取前缀
 * @param {string} name - 字段名称，如 "p_birth_y"
 * @returns {string|null} 前缀部分，如 "p"，如果不是出生日期字段则返回 null
 *
 * 用于关联同一实体的年月日字段
 */
const getBirthDatePrefix = (name) => {
  const match = name.match(/^(.+?)_birth_/);
  return match ? match[1] : null;
};

/**
 * 判断是否应该渲染出生日期选择器
 * @param {string} name - 字段名称
 * @returns {boolean} 是否渲染
 *
 * 只在遇到 birth_y 字段时渲染一次，避免重复渲染
 */
const shouldRenderBirthDatePicker = (name) =>
  isBirthDateField(name) && name.includes("birth_y");

/**
 * 处理出生日期选择变化
 * @param {string} prefix - 字段前缀，如 "p"
 * @param {string} value - 选择的日期值，格式："YYYY-MM-DD"
 *
 * 将日期拆分为年月日，分别填充到对应字段
 */
const handleBirthDateChange = (prefix, value) => {
  const yField = `${prefix}_birth_y`;
  const mField = `${prefix}_birth_m`;
  const dField = `${prefix}_birth_d`;
  
  if (value) {
    const [year, month, day] = value.split('-');
    formData.value[yField] = year;
    formData.value[mField] = month;
    formData.value[dField] = day;
  } else {
    formData.value[yField] = '';
    formData.value[mField] = '';
    formData.value[dField] = '';
  }
};

/**
 * 获取当前出生日期值
 * @param {string} prefix - 字段前缀
 * @returns {string|null} 日期字符串 "YYYY-MM-DD" 或 null（未填写）
 *
 * 用于回显日期选择器的当前值
 */
const getBirthDateValue = (prefix) => {
  const yField = `${prefix}_birth_y`;
  const mField = `${prefix}_birth_m`;
  const dField = `${prefix}_birth_d`;
  
  const year = formData.value[yField];
  const month = formData.value[mField];
  const day = formData.value[dField];
  
  if (year && month && day) {
    // 确保月份和日期是两位数
    const paddedMonth = month.toString().padStart(2, '0');
    const paddedDay = day.toString().padStart(2, '0');
    return `${year}-${paddedMonth}-${paddedDay}`;
  }
  return null;
};

/**
 * 判断是否为是/否单选字段
 * @param {string} name - 字段名称
 * @returns {boolean} 是否应该渲染为是/否单选按钮
 *
 * 是/否字段识别规则：与 isCheckboxField 相同的规则
 */
const isYesNoField = (name) => {
  return isCheckboxField(name);
};

/**
 * 判断是否为多行文本字段
 * @param {string} name - 字段名称
 * @returns {boolean} 是否应该渲染为 textarea
 *
 * 多行文本字段识别规则：
 * - 包含特定关键词（_detail, _content, _reason 等）
 * - 或者是特定的完整字段名（facts_and_reasons, claim_content 等）
 */
const isTextareaField = (name) => {
  return (
    name.includes("_detail") ||
    name.includes("_content") ||
    name.includes("_reason") ||
    name.includes("_reasons") ||
    name.includes("_requirement") ||
    name.includes("_agreement") ||
    name.includes("_list") ||
    name.includes("_addr") ||
    name.includes("_address") ||
    name.includes("_location") ||
    name === "facts_and_reasons" ||
    name === "claim_content" ||
    name === "other_request" ||
    name === "evidence_list"
  );
};

/**
 * 判断字段数组中是否有多个是/否字段
 * @param {Array} fields - 字段名称数组
 * @returns {boolean} 是否有多个是/否字段
 */
const hasMultipleYesNoFields = (fields) => {
  if (!fields || fields.length === 0) return false;
  const yesNoFields = fields.filter(f => isYesNoField(f) && shouldRenderField(f));
  return yesNoFields.length > 1;
};

/**
 * 判断是否为带详情的是/否字段组合
 * @param {Array} fields - 字段名称数组
 * @returns {boolean} 是否为带详情的是/否组合
 */
const hasYesNoWithDetail = (fields) => {
  if (!fields || fields.length !== 2) return false;
  const yesNoCount = fields.filter(f => isYesNoField(f)).length;
  const otherCount = fields.filter(f => !isYesNoField(f)).length;
  return yesNoCount === 1 && otherCount === 1;
};

/**
 * 获取单选组的当前选中值
 * @param {Array} fields - 字段名称数组
 * @returns {string|null} 当前选中的字段名
 */
const getSingleChoiceValue = (fields) => {
  if (!fields || fields.length === 0) return null;
  // 找到值为 ☑ 的字段
  const selected = fields.find(field => formData.value[field] === '☑');
  return selected || null;
};

/**
 * 处理单选组选择变化
 * @param {Array} fields - 字段名称数组
 * @param {string} selectedField - 选中的字段名
 */
const handleSingleChoiceChange = (fields, selectedField) => {
  if (!fields || fields.length === 0) return;
  // 将所有字段设置为 □，只有选中的设置为 ☑
  fields.forEach(field => {
    formData.value[field] = field === selectedField ? '☑' : '□';
  });
};

/**
 * 获取是/否带详情组的当前选中值
 * @param {Array} fields - 字段名称数组
 * @returns {string|null} 当前选中的字段名
 */
const getYesNoDetailValue = (fields) => {
  if (!fields || fields.length === 0) return null;
  const yesNoFields = fields.filter(f => f.endsWith('_yes') || f.endsWith('_no'));
  const selected = yesNoFields.find(field => formData.value[field] === '☑');
  return selected || null;
};

/**
 * 处理是/否带详情组选择变化
 * @param {Array} fields - 字段名称数组
 * @param {string} selectedField - 选中的字段名
 */
const handleYesNoDetailChange = (fields, selectedField) => {
  if (!fields || fields.length === 0) return;
  const yesNoFields = fields.filter(f => f.endsWith('_yes') || f.endsWith('_no'));
  // 将所有是/否字段设置为 □，只有选中的设置为 ☑
  yesNoFields.forEach(field => {
    formData.value[field] = field === selectedField ? '☑' : '□';
  });
};

// ==================== 组件暴露 ====================
/**
 * 处理导入JSON
 */
const handleImportJSON = () => {
  try {
    const data = JSON.parse(jsonInput.value);
    
    // 将JSON数据合并到formData中
    Object.entries(data).forEach(([key, value]) => {
      if (formData.value.hasOwnProperty(key)) {
        formData.value[key] = value;
      }
    });
    
    ElMessage.success('JSON数据导入成功');
    showImportDialog.value = false;
    jsonInput.value = '';
  } catch (error) {
    ElMessage.error('JSON格式错误：' + error.message);
  }
};

/**
 * 向父组件暴露 formData
 * 父组件可以通过 ref 访问表单数据，用于生成文档
 */
defineExpose({ formData });
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
.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.form-collapse {
  border: none;
}
.form-collapse :deep(.el-collapse-item__header) {
  font-size: 18px;
  font-weight: 700;
  color: white;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
.section-description {
  padding: 16px 20px;
  background: #e6f7ff;
  border-left: 4px solid #1890ff;
  margin-bottom: 20px;
  font-size: 14px;
  color: #606266;
}
.group-container {
  padding: 20px;
  background: white;
  border-radius: 8px;
  margin-bottom: 16px;
}
.group-header h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #409eff;
}
.option-section {
  margin-bottom: 24px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
}
.option-title {
  margin: 0 0 12px 0;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  padding-bottom: 8px;
  border-bottom: 2px solid #e4e7ed;
}
.sub-groups-container {
  margin-top: 16px;
}
.sub-group-container {
  margin-bottom: 16px;
}
.sub-group-title {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 500;
  color: #606266;
}
.fields-container {
  display: flex;
  flex-direction: column;
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

/* 性别单选按钮组样式 - 带边框 */
.radio-group-inline {
  display: flex;
  gap: 12px;
}

.radio-group-inline :deep(.el-radio) {
  margin-right: 0;
}

.radio-group-inline :deep(.el-radio.is-bordered) {
  padding: 8px 20px;
  border-radius: 4px;
  transition: all 0.3s;
}

.radio-group-inline :deep(.el-radio.is-bordered.is-checked) {
  border-color: #409eff;
  background-color: #ecf5ff;
}

/* 是/否单选按钮组样式 - 无边框，左右布局 */
.yes-no-radio-group {
  display: flex;
  gap: 24px;
  align-items: center;
}

.yes-no-radio-group :deep(.el-radio) {
  margin-right: 0;
}

.yes-no-radio-group :deep(.el-radio__label) {
  padding-left: 8px;
  font-size: 14px;
  color: #606266;
}

/* 是/否字段使用左右布局 */
.form-item:has(.yes-no-radio-group) :deep(.el-form-item__label) {
  display: inline-block;
  width: auto;
  margin-right: 16px;
  line-height: 32px;
}

.form-item:has(.yes-no-radio-group) :deep(.el-form-item__content) {
  display: inline-block;
  margin-left: 0 !important;
}

/* 触发字段单选按钮组样式 - 垂直排列 */
.trigger-radio-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.trigger-radio-group :deep(.el-radio) {
  margin-right: 0;
}

/* 结构化表单样式 */
.structured-form-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.structured-section {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.structured-section:last-child {
  border-bottom: none;
}

.structured-section-label {
  flex-shrink: 0;
  width: 200px;
  font-size: 14px;
  font-weight: 500;
  color: #606266;
  line-height: 32px;
  text-align: left;
  padding-right: 12px;
}

.structured-section-fields {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 当有多个是/否字段时，横向排列 */
.structured-section-fields.fields-horizontal {
  flex-direction: row;
  flex-wrap: wrap;
  gap: 24px;
  align-items: center;
}

.structured-field-item {
  margin-bottom: 0 !important;
}

.structured-field-item :deep(.el-form-item__label) {
  display: none;
}

.structured-field-item :deep(.el-form-item__content) {
  margin-left: 0 !important;
}

/* 横向排列时显示内联标签 */
.fields-horizontal .structured-field-item :deep(.el-form-item__label) {
  display: inline-block;
  margin-right: 8px;
  font-size: 14px;
  color: #606266;
}

.inline-field-label {
  font-weight: normal;
}

/* 单选组样式 */
.single-choice-group {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.single-choice-group :deep(.el-radio) {
  margin-right: 0;
}

.single-choice-group :deep(.el-radio__label) {
  padding-left: 8px;
  font-size: 14px;
  color: #606266;
}

/* 是/否带详情组样式 */
.yes-no-detail-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.yes-no-detail-group {
  display: flex;
  gap: 24px;
}

.yes-no-detail-group :deep(.el-radio) {
  margin-right: 0;
}

.yes-no-detail-group :deep(.el-radio__label) {
  padding-left: 8px;
  font-size: 14px;
  color: #606266;
}

.detail-input-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
}

.detail-label {
  flex-shrink: 0;
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
  line-height: 32px;
}

.detail-input-wrapper .el-input {
  flex: 1;
}

.detail-input-wrapper .el-textarea {
  flex: 1;
}

</style>
