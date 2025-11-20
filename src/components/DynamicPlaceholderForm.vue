<template>
  <div class="dynamic-form">
    <!-- 表单头部：显示标题和字段数量 -->
    <div class="form-header">
      <h3>填充文档</h3>
      <el-tag type="success" round>{{ placeholders.length }} 个字段</el-tag>
    </div>

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
                      <div class="fields-container">
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
                渲染模式 2: 直接 fields 类型
                用于简单的字段列表，如 "事实与理由概述"
              -->
              <template v-else-if="group.fields">
                <div class="fields-container">
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
                    <el-radio-group
                      v-if="isYesNoField(fieldName)"
                      v-model="formData[fieldName]"
                      class="yes-no-radio-group"
                    >
                      <el-radio label="☑">是</el-radio>
                      <el-radio label="□">否</el-radio>
                    </el-radio-group>
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
                    <div class="fields-container">
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
                    <el-radio-group
                      v-if="isYesNoField(fieldName)"
                      v-model="formData[fieldName]"
                      class="yes-no-radio-group"
                    >
                      <el-radio label="☑">是</el-radio>
                      <el-radio label="□">否</el-radio>
                    </el-radio-group>
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
 */
const shouldRenderField = (name) => {
  // 跳过 gender_f，因为性别在 gender_m 时一起渲染
  if (name.includes("gender_f")) return false;
  // 跳过 birth_m 和 birth_d，因为出生日期在 birth_y 时一起渲染
  if (name.includes("birth_m") || name.includes("birth_d")) return false;
  return true;
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

// ==================== 组件暴露 ====================
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
  padding: 12px;
  background: #fff;
  border-radius: 6px;
  border-left: 3px solid #67c23a;
}
.sub-group-title {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #606266;
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

@media (max-width: 768px) {
  .fields-container {
    grid-template-columns: 1fr;
  }
}
</style>
