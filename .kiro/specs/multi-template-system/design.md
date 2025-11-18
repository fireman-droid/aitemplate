# 设计文档 - 多模板系统

## 概述

本设计实现一个多模板管理系统，支持用户选择不同的法律文书模板，并根据模板配置动态生成表单界面。系统采用模块化设计，每个模板包含独立的Word文件、配置文件和占位符映射文件。

## 架构

### 目录结构

```
src/
├── templates/                    # 模板文件目录
│   ├── house-sale-dispute/      # 房屋买卖合同纠纷
│   │   ├── template.docx        # Word模板文件
│   │   ├── config.json          # 模板配置
│   │   └── placeholders.json    # 占位符映射
│   ├── divorce-dispute/         # 离婚纠纷（待添加）
│   └── sale-contract-dispute/   # 买卖合同纠纷（待添加）
├── services/
│   ├── templateService.js       # 模板管理服务
│   └── aiService.js             # AI服务（已存在）
├── components/
│   ├── TemplateSelector.vue     # 模板选择组件（新增）
│   └── PlaceholderList.vue      # 表单填充组件（改造）
└── views/
    └── Home.vue                 # 主页面（改造）
```

### 核心组件

1. **TemplateSelector.vue** - 模板选择界面
2. **TemplateService** - 模板加载和管理服务
3. **PlaceholderList.vue** - 动态表单生成组件（基于模板配置）

## 组件和接口

### 1. TemplateService（模板服务）

负责加载和管理模板文件。

```javascript
class TemplateService {
  // 获取所有可用模板列表
  static async getAvailableTemplates()
  
  // 加载指定模板的配置
  static async loadTemplateConfig(templateId)
  
  // 加载指定模板的占位符映射
  static async loadPlaceholderMapping(templateId)
  
  // 加载指定模板的Word文件
  static async loadTemplateFile(templateId)
  
  // 解析Word文件中的占位符
  static async extractPlaceholders(docxFile)
}
```

### 2. TemplateSelector.vue（模板选择组件）

用户界面，展示所有可用模板供用户选择。

**Props:**
- 无

**Emits:**
- `template-selected(templateId)` - 用户选择模板时触发

**UI设计:**
- 卡片式布局展示所有模板
- 每个卡片显示：模板名称、描述、图标
- 点击卡片选择模板

### 3. PlaceholderList.vue（改造）

根据模板配置动态生成表单。

**新增Props:**
- `templateConfig` - 模板配置对象
- `placeholderMapping` - 占位符映射对象

**改造点:**
- 从硬编码的分组改为根据`templateConfig.groups`动态生成
- 支持多层级分组（groups -> subgroups）
- 根据配置的prefix自动过滤和分组字段

## 数据模型

### 模板配置文件格式（config.json）

```json
{
  "id": "house-sale-dispute",
  "name": "房屋买卖合同纠纷",
  "description": "适用于房屋买卖合同相关的民事纠纷案件",
  "version": "1.0.0",
  "templateFile": "template.docx",
  "placeholderFile": "placeholders.json",
  "groups": [
    {
      "id": "party_info",
      "title": "当事人信息",
      "icon": "User",
      "defaultExpanded": true,
      "subgroups": [
        {
          "id": "plaintiff_person",
          "title": "原告（自然人）",
          "prefix": "p_",
          "excludePrefixes": ["pc_", "pa_"],
          "fields": ["p_name", "p_gender_m", ...]
        }
      ]
    }
  ]
}
```

### 模板列表配置（templates/index.json）

```json
{
  "templates": [
    {
      "id": "house-sale-dispute",
      "name": "房屋买卖合同纠纷",
      "description": "适用于房屋买卖合同相关的民事纠纷案件",
      "icon": "House",
      "path": "/templates/house-sale-dispute"
    }
  ]
}
```

## 工作流程

### 用户流程

1. 用户打开应用 → 显示模板选择界面
2. 用户选择模板 → 加载模板配置和Word文件
3. 系统解析Word文件 → 提取占位符列表
4. 系统根据配置生成表单 → 用户填写表单
5. 用户填充到文档 → 生成最终文档

### 技术流程

```
TemplateSelector
    ↓ (用户选择)
TemplateService.loadTemplateConfig()
    ↓
TemplateService.loadPlaceholderMapping()
    ↓
TemplateService.loadTemplateFile()
    ↓
TemplateService.extractPlaceholders()
    ↓
PlaceholderList (动态生成表单)
    ↓
用户填写 → 填充到Word → 下载
```

## 错误处理

1. **模板文件缺失**: 显示友好提示，引导用户选择其他模板
2. **配置文件格式错误**: 在控制台输出详细错误，使用默认配置降级
3. **Word文件解析失败**: 提示用户文件可能损坏，提供重新加载选项
4. **网络请求失败**: 提供重试按钮，支持离线缓存

## 测试策略

### 单元测试
- TemplateService的各个方法
- 占位符解析逻辑
- 配置文件验证逻辑

### 集成测试
- 模板选择 → 表单生成流程
- 表单填写 → 文档生成流程
- 模板切换时的数据处理

### 用户测试
- 模板选择界面的易用性
- 表单填写的流畅度
- 错误提示的清晰度

## 性能优化

1. **懒加载**: 只在用户选择模板时才加载对应的文件
2. **缓存**: 已加载的模板配置缓存在内存中
3. **预加载**: 在空闲时预加载常用模板
4. **压缩**: Word文件和JSON文件进行gzip压缩

## 扩展性考虑

1. **新增模板**: 只需在`templates/`目录下添加新文件夹和3个文件
2. **自定义字段类型**: 在配置中支持定义字段的输入类型（text、select、date等）
3. **字段验证**: 在配置中支持定义字段的验证规则
4. **条件显示**: 支持根据其他字段的值动态显示/隐藏字段
