# Script Setup 转换指南

## 概述

本文档说明如何将 Vue 3 组件从 Options API 转换为 `<script setup>` 语法糖。

## 转换步骤

### 1. 基本结构转换

**转换前（Options API）：**
```vue
<script>
import { ref } from 'vue'

export default {
  name: 'MyComponent',
  props: {
    title: String
  },
  emits: ['update'],
  setup(props, { emit }) {
    const count = ref(0)
    
    const increment = () => {
      count.value++
      emit('update', count.value)
    }
    
    return {
      count,
      increment
    }
  }
}
</script>
```

**转换后（Script Setup）：**
```vue
<script setup>
/**
 * 组件名称和说明
 */
import { ref } from 'vue'

// ==================== Props & Emits ====================
/**
 * Props 定义
 */
const props = defineProps({
  title: String
})

/**
 * 事件定义
 */
const emit = defineEmits(['update'])

// ==================== 响应式数据 ====================
/**
 * 计数器
 * @type {Ref<number>}
 */
const count = ref(0)

// ==================== 方法 ====================
/**
 * 增加计数
 */
const increment = () => {
  count.value++
  emit('update', count.value)
}
</script>
```

### 2. 关键变化

1. **移除 `export default`** - 不再需要导出
2. **移除 `setup()` 函数** - 整个 script 就是 setup
3. **移除 `return`** - 所有顶层变量自动暴露给模板
4. **使用 `defineProps()`** - 定义 props
5. **使用 `defineEmits()`** - 定义 emits
6. **添加注释** - 为每个部分添加清晰的注释

### 3. 注释规范

#### 文件顶部注释
```javascript
/**
 * 组件名称
 * 组件功能描述
 * 
 * @author 作者名（可选）
 * @date 创建日期（可选）
 */
```

#### 分区注释
```javascript
// ==================== Props & Emits ====================
// ==================== 响应式数据 ====================
// ==================== 计算属性 ====================
// ==================== 方法 ====================
// ==================== 生命周期 ====================
// ==================== Watchers ====================
```

#### 变量注释
```javascript
/**
 * 变量说明
 * @type {Ref<类型>}
 */
const variable = ref(initialValue)
```

#### 函数注释
```javascript
/**
 * 函数说明
 * @param {类型} 参数名 - 参数说明
 * @returns {类型} 返回值说明
 */
const functionName = (param) => {
  // 实现
}
```

## 示例：完整组件转换

### DynamicPlaceholderForm.vue 转换示例

```vue
<script setup>
/**
 * 动态占位符表单组件
 * 根据模板配置动态生成多层级表单，支持不同类型的字段输入
 */

import { ref, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'

// ==================== 工具函数 ====================
/**
 * 防抖函数
 * @param {Function} fn - 需要防抖的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
function debounce(fn, delay) {
  let timer = null
  return function(...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

// ==================== Props & Emits ====================
/**
 * 组件 Props
 */
const props = defineProps({
  /** 占位符列表 */
  placeholders: {
    type: Array,
    default: () => []
  },
  /** 模板配置对象 */
  templateConfig: {
    type: Object,
    default: null
  },
  /** 占位符映射对象 */
  placeholderMapping: {
    type: Object,
    default: null
  }
})

/**
 * 组件事件
 * @event preview-update - 表单数据更新时触发，用于实时预览
 */
const emit = defineEmits(['preview-update'])

// ==================== 响应式数据 ====================
/**
 * 表单数据对象
 * @type {Ref<Object>}
 */
const formData = ref({})

/**
 * 当前展开的分组ID列表
 * @type {Ref<Array<string>>}
 */
const activeGroups = ref([])

// ==================== 计算属性 ====================
/**
 * 获取分组配置
 * 从模板配置中提取分组信息
 * @returns {Array} 分组配置数组
 */
const groups = computed(() => {
  if (!props.templateConfig || !props.templateConfig.lawsuit_template) {
    return []
  }
  return props.templateConfig.lawsuit_template.groups || []
})

// ==================== Watchers ====================
/**
 * 监听分组变化，初始化默认展开的分组
 */
watch(groups, (newGroups) => {
  if (newGroups.length > 0) {
    activeGroups.value = newGroups
      .filter(g => g.defaultExpanded !== false)
      .map(g => g.id)
  }
}, { immediate: true })

/**
 * 监听占位符变化，初始化表单数据
 */
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

/**
 * 监听表单数据变化，实时更新预览（带防抖）
 */
const debouncedPreviewUpdate = debounce((data) => {
  emit('preview-update', data)
}, 500)

watch(formData, (newData) => {
  debouncedPreviewUpdate(newData)
}, { deep: true })

// ==================== 方法 ====================
/**
 * 判断是否为性别字段
 * @param {string} name - 字段名称
 * @returns {boolean}
 */
const isGenderField = (name) => {
  return name.includes('gender_m') || name.includes('gender_f')
}

/**
 * 判断是否为复选框字段
 * @param {string} name - 字段名称
 * @returns {boolean}
 */
const isCheckboxField = (name) => {
  // 实现逻辑...
}

// ... 其他方法
</script>
```

## 已转换的组件

- ✅ TemplateSelector.vue

## 待转换的组件

- [ ] DynamicPlaceholderForm.vue
- [ ] AIPlaceholderDialog.vue
- [ ] PlaceholderList.vue
- [ ] FileUploader.vue
- [ ] TemplatePreview.vue

## 注意事项

1. **不要过度注释** - 只为复杂逻辑添加注释
2. **保持一致性** - 使用统一的注释风格
3. **中文注释** - 所有注释使用中文
4. **类型标注** - 为响应式数据添加类型注释
5. **分区清晰** - 使用分隔线区分不同部分

## 参考资源

- [Vue 3 Script Setup 文档](https://cn.vuejs.org/api/sfc-script-setup.html)
- [JSDoc 注释规范](https://jsdoc.app/)
