# 当前实现状态

## 已完成功能

### 1. 多模板系统 ✅
- 模板选择界面
- 支持预置模板和自定义上传
- 房屋买卖合同纠纷模板已配置

### 2. 动态表单生成 ✅
- 根据 config.json 动态生成多层级表单
- 支持三级分组结构
- 字段自动分类和过滤

### 3. 字段类型优化 ✅
- **性别字段**: 下拉选择框（男/女）
- **是/否字段**: 单个复选框（☑选中/□未选中）
- **了解/不了解字段**: 单个复选框
- **普通文本**: 单行输入框
- **大文本**: 多行文本框

## 当前问题

### 预览更新问题
**现象**: 填写表单后，数据没有实时渲染到Word文档预览中

**原因**: `DynamicPlaceholderForm` 组件发出 `preview-update` 事件，但可能没有正确处理

**数据格式**: 
```json
{
  "p_name": "张三",
  "p_gender_m": "☑",
  "p_gender_f": "□",
  "p_birth_y": "1990",
  ...
}
```

## 解决方案

### 方案1: 检查 handlePreviewUpdate 函数

在 `src/views/Editor.vue` 中，`handlePreviewUpdate` 函数应该：

1. 接收表单数据
2. 遍历所有占位符
3. 替换模板内容中的 `{placeholder_name}` 为实际值
4. 更新 `templateStore.currentTemplate.content`

### 方案2: 确保实时预览工作

`DynamicPlaceholderForm` 组件已经实现了防抖的实时更新（500ms延迟）：

```javascript
watch(formData, (newData) => {
  debouncedPreviewUpdate(newData)
}, { deep: true })
```

每次表单数据变化时，都会触发 `preview-update` 事件。

### 方案3: 生成文档时的数据处理

在点击"生成文档"按钮时，`downloadFile` 函数会：

1. 从 `placeholderListRef.value.formData` 获取表单数据
2. 使用 docxtemplater 填充Word模板
3. 生成并下载文件

**重要**: 确保性别字段的值正确映射：
- 如果 `p_gender_m === '☑'`，则在Word中显示为 `☑`
- 如果 `p_gender_f === '☑'`，则在Word中显示为 `☑`

## 使用指南

### 1. 启动应用
```bash
npm run dev
```

### 2. 选择模板
- 打开应用后，选择"房屋买卖合同纠纷"模板
- 或点击"上传自定义模板"上传自己的Word文件

### 3. 填写表单
- 表单按照分组展开/折叠
- 性别字段：下拉选择"男"或"女"
- 是/否字段：点击复选框切换选中/未选中
- 文本字段：直接输入内容

### 4. 生成文档
- 点击"生成文档"按钮
- 系统自动下载填充后的Word文档

## 字段命名规则

### 性别字段
- `p_gender_m` - 原告性别-男
- `p_gender_f` - 原告性别-女
- `d_gender_m` - 被告性别-男
- `d_gender_f` - 被告性别-女
- `t_gender_m` - 第三人性别-男
- `t_gender_f` - 第三人性别-女

**显示**: 合并为一个"性别"下拉框，选项为"男"/"女"

### 是/否字段
- `xxx_yes` - 是
- `xxx_no` - 否

**显示**: 合并为一个复选框，☑表示"是"，□表示"否"

### 了解/不了解字段
- `xxx_understand` - 了解
- `xxx_not_understand` - 不了解

**显示**: 合并为一个复选框，☑表示"了解"，□表示"不了解"

## 配置文件结构

### config.json
定义表单的分组结构和字段映射规则

### placeholders.json
定义占位符名称与中文标签的对应关系

### template.docx
Word模板文件，包含 `{placeholder_name}` 格式的占位符

## 下一步工作

1. **修复预览更新** - 确保表单数据实时更新到预览中
2. **测试生成文档** - 验证所有字段都能正确填充到Word文档
3. **添加更多模板** - 离婚纠纷、买卖合同纠纷等
4. **优化用户体验** - 添加字段验证、必填提示等

## 技术栈

- Vue 3 + Vite
- Element Plus
- Pinia (状态管理)
- docxtemplater (Word文档处理)
- pizzip (ZIP文件处理)

## 相关文档

- [实现总结](IMPLEMENTATION_SUMMARY.md)
- [快速启动指南](QUICK_START.md)
- [动态表单结构说明](DYNAMIC_FORM_STRUCTURE.md)
- [模板添加指南](src/templates/README.md)
