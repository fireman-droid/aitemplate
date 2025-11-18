# 模板目录说明

本目录存放所有法律文书模板文件。每个模板包含3个必需文件。

## 目录结构

```
templates/
├── index.json                    # 模板索引文件
├── house-sale-dispute/          # 房屋买卖合同纠纷模板
│   ├── template.docx            # Word模板文件
│   ├── config.json              # 模板配置文件
│   └── placeholders.json        # 占位符映射文件
├── divorce-dispute/             # 离婚纠纷模板（待添加）
└── sale-contract-dispute/       # 买卖合同纠纷模板（待添加）
```

## 添加新模板

### 1. 创建模板目录

在 `templates/` 下创建新文件夹，使用 kebab-case 命名：

```bash
mkdir src/templates/your-template-name
```

### 2. 准备Word模板文件

创建 `template.docx` 文件，在需要填充的位置使用 `{placeholder_name}` 格式的占位符。

**占位符命名规则：**
- 使用小写字母和下划线
- 使用有意义的前缀（如 `p_` 表示原告，`d_` 表示被告）
- 选择框字段使用 `_yes`/`_no`、`_m`/`_f` 等后缀

**示例：**
```
原告姓名：{p_name}
原告性别：{p_gender_m} 男  {p_gender_f} 女
被告姓名：{d_name}
```

### 3. 创建配置文件 (config.json)

定义模板的元数据和字段分组结构：

```json
{
  "lawsuit_template": {
    "name": "模板名称",
    "groups": [
      {
        "id": "group_id",
        "title": "分组标题",
        "icon": "User",
        "defaultExpanded": true,
        "subgroups": [
          {
            "id": "subgroup_id",
            "title": "子分组标题",
            "prefix": "p_",
            "excludePrefixes": ["pc_", "pa_"],
            "fields": ["p_name", "p_phone"]
          }
        ]
      }
    ]
  }
}
```

**配置说明：**
- `groups`: 顶层分组数组
- `subgroups`: 子分组数组
- `prefix`: 字段前缀，用于自动过滤字段
- `excludePrefixes`: 排除的前缀
- `fields`: 明确指定的字段列表（可选）

### 4. 创建占位符映射文件 (placeholders.json)

定义占位符名称与中文描述的对应关系：

```json
{
  "p_name": "原告姓名",
  "p_gender_m": "原告性别-男",
  "p_gender_f": "原告性别-女",
  "p_phone": "原告联系电话",
  "d_name": "被告姓名"
}
```

### 5. 更新模板索引

在 `templates/index.json` 中添加新模板的信息：

```json
{
  "templates": [
    {
      "id": "your-template-name",
      "name": "模板显示名称",
      "description": "模板描述",
      "icon": "Document",
      "category": "分类名称",
      "path": "/src/templates/your-template-name",
      "enabled": true
    }
  ]
}
```

### 6. 更新 TemplateService

在 `src/services/templateService.js` 的 `getAvailableTemplates()` 方法中添加新模板：

```javascript
{
  id: 'your-template-name',
  name: '模板显示名称',
  description: '模板描述',
  icon: 'Document',
  path: '/src/templates/your-template-name',
  category: '分类名称'
}
```

## 字段类型识别

系统会根据字段名称自动识别字段类型：

### 选择框字段
包含以下关键词的字段会显示为选择框（☑/□）：
- `_yes` / `_no`
- `_m` / `_f` (性别)
- `_has` / `_none`
- `_understand`
- `_type_`
- `_registered`
- `_signed`
- 等等

### 大文本字段
包含以下关键词的字段会显示为多行文本框：
- `_detail`
- `_content`
- `_reason`
- `_addr` / `_address`
- `_list`
- `facts_and_reasons`
- `claim_content`
- 等等

### 普通文本字段
其他字段默认显示为单行文本框。

## 测试模板

1. 启动开发服务器
2. 在模板选择界面应该能看到新模板
3. 选择模板后检查：
   - Word文件是否正确加载
   - 占位符是否正确提取
   - 表单分组是否正确显示
   - 字段标签是否正确显示
   - 填充功能是否正常工作

## 注意事项

1. **文件编码**: 所有JSON文件使用UTF-8编码
2. **占位符格式**: Word文档中的占位符必须使用 `{name}` 格式
3. **命名一致性**: config.json、placeholders.json和Word文档中的占位符名称必须完全一致
4. **文件大小**: Word模板文件建议不超过5MB
5. **浏览器兼容**: 确保在Chrome、Firefox、Edge等主流浏览器中测试
