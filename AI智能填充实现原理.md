# AI 智能填充实现原理学习文档

## 📚 概述

智能填充功能通过 AI 技术自动分析文档内容，识别需要替换为占位符的可变信息（如姓名、日期、金额等），大大提高了模板制作效率。

---

## 🔄 完整工作流程

```
用户点击"AI生成" 
    ↓
显示配置对话框（选择文档类型、AI提供商等）
    ↓
提取文档纯文本内容
    ↓
调用 AI 服务分析文档
    ↓
AI 返回占位符建议列表
    ↓
在文档中定位每个建议的位置
    ↓
批量添加占位符到系统
    ↓
显示成功消息
```

---

## 🎯 核心实现文件

### 1. **Editor.vue** - 用户交互层

#### 关键方法：`showAIDialog()`
- **职责**：显示 AI 配置对话框
- **实现要点**：
  ```javascript
  // 提取文档纯文本（去除 HTML 标签）
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = templateStore.currentTemplate.content
  documentContent.value = tempDiv.textContent || tempDiv.innerText || ''
  ```

#### 关键方法：`handleAIGenerate(config)`
- **职责**：处理 AI 生成结果，转换为占位符
- **核心步骤**：
  1. 提取文档纯文本
  2. 调用 `AIService.generatePlaceholders()`
  3. 遍历 AI 返回的建议
  4. 使用 `indexOf()` 定位文本在文档中的位置
  5. 调用 `placeholderStore.addPlaceholder()` 添加占位符

- **位置定位算法**：
  ```javascript
  const startOffset = documentContent.indexOf(suggestion.text)
  const endOffset = startOffset + suggestion.text.length
  ```

---

### 2. **aiService.js** - AI 服务层

#### 核心方法：`generatePlaceholders(config, documentContent, documentType)`

这是整个智能填充的核心，实现了与 AI 模型的交互。

##### **步骤1：构建系统提示词（Prompt Engineering）**

系统提示词定义了 AI 的行为规则：

```javascript
const systemPrompt = `你是一个专业的文档模板分析助手...

核心识别规则：
1. 包含"XX"、"XXX"等占位标记 → 100%是占位符
2. 选择框符号（□、☑） → 100%是占位符
3. 冒号后面的具体值 → 分析是否为可变信息
4. 明显的个人信息、日期、金额、地址等 → 是占位符

占位符命名规范：
- 使用小写英文，下划线连接
- 根据上下文智能命名：plaintiff_name, defendant_name
- 常用词汇：name, date, address, phone, amount...

返回JSON格式：
{
  "placeholders": [
    {"name": "name", "text": "张三", "reason": "姓名"},
    {"name": "birth_date", "text": "1990年1月1日", "reason": "出生日期"}
  ]
}
`
```

**为什么提示词如此重要？**
- 提示词是 AI 的"工作说明书"
- 详细的规则能提高识别准确度
- 明确的输出格式便于程序解析

##### **步骤2：配置 API 请求**

支持多种 AI 提供商：

| 提供商 | API 端点 | 特点 |
|--------|---------|------|
| OpenAI | `https://api.openai.com/v1/chat/completions` | GPT 系列，质量高 |
| Kimi | `https://api.moonshot.cn/v1/chat/completions` | 国产，支持长文本 |
| OpenRouter | `https://openrouter.ai/api/v1/chat/completions` | 聚合平台，有免费模型 |
| Azure | 用户自定义 URL | 企业级部署 |

**请求参数说明**：
```javascript
{
  model: 'gpt-4o-mini',           // 使用的模型
  messages: [
    { role: 'system', content: systemPrompt },  // 系统角色
    { role: 'user', content: userPrompt }       // 用户请求
  ],
  temperature: 0.3,               // 低温度 = 更确定的输出
  max_tokens: 4000,               // 最大输出长度
  response_format: { type: 'json_object' }  // 强制 JSON 格式
}
```

##### **步骤3：处理 AI 响应**

**响应截断处理**：
```javascript
if (data.choices[0].finish_reason === 'length') {
  // AI 输出被 max_tokens 限制截断
  // 智能修复：移除不完整的对象，闭合 JSON 结构
  content = content.replace(/,\s*\{\s*"name"[^}]*$/, '')
  content += '\n  ]\n}'
}
```

**容错解析**：
```javascript
try {
  // 尝试直接解析
  const parsed = JSON.parse(content)
  placeholders = parsed.placeholders || parsed['占位符'] || parsed
} catch (e) {
  // 提取 JSON 片段（处理 AI 添加的说明文字）
  const jsonMatch = content.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
  placeholders = JSON.parse(jsonMatch[0])
}
```

---

### 3. **模拟模式** - 无需 API 的实现

#### 方法：`mockGeneratePlaceholders(documentContent)`

**用途**：
- 演示功能（无需 API Key）
- 开发测试（避免 API 费用）
- 离线使用

**实现原理**：使用正则表达式匹配常见模式

**示例模式**：

```javascript
// 1. 中文姓名：常见姓氏 + 1-2个汉字
const namePattern = /([王李张刘陈...])([XX一-龥]{1,2})/g

// 2. 日期：YYYY年MM月DD日
const datePattern = /(\d{4}年\d{1,2}月\d{1,2}日)/g

// 3. 手机号：1开头 + 3-9 + 9位数字
const phonePattern = /(1[3-9]\d{9})/g

// 4. 地址：省份 + 2-30字符 + 地址关键词
const addressPattern = /((?:北京|上海|...)(?:省|市)?[^，。]{2,30}(?:区|街道|路|号))/g
```

**去重处理**：
```javascript
const seen = new Set()
for (const p of placeholders) {
  const key = `${p.text}`
  if (!seen.has(key)) {
    seen.add(key)
    uniquePlaceholders.push(p)
  }
}
```

---

## 🔑 关键技术点

### 1. **文本定位算法**

**问题**：如何在文档中准确定位 AI 建议的文本？

**解决方案**：
```javascript
const startOffset = documentContent.indexOf(suggestion.text)
const endOffset = startOffset + suggestion.text.length
```

**局限性**：
- 只能找到第一次出现的位置
- 如果文档中有重复文本，可能定位不准

**改进方向**：
- 使用上下文信息辅助定位
- 实现更精确的文本匹配算法

### 2. **提示词工程（Prompt Engineering）**

**核心原则**：
1. **明确角色**：告诉 AI 它是什么（文档分析助手）
2. **详细规则**：列出所有识别规则和边界情况
3. **示例输出**：提供期望的输出格式
4. **约束条件**：明确不要做什么

**优化技巧**：
- 使用编号列表，结构清晰
- 提供具体示例，而非抽象描述
- 强调关键点（如"100%是占位符"）
- 要求特定格式（"只返回JSON，不要其他解释"）

### 3. **错误处理与容错**

**多层容错机制**：

```javascript
// 第1层：检查 HTTP 状态
if (!response.ok) throw new Error(...)

// 第2层：处理响应截断
if (finish_reason === 'length') { /* 修复 JSON */ }

// 第3层：JSON 解析容错
try {
  JSON.parse(content)
} catch {
  // 提取 JSON 片段
  const jsonMatch = content.match(/\{[\s\S]*\}/)
}

// 第4层：数据格式验证
if (!Array.isArray(placeholders)) throw new Error(...)
```

---

## 📊 数据流图

```
┌─────────────┐
│  用户操作   │
│ 点击AI生成  │
└──────┬──────┘
       │
       ↓
┌─────────────────────┐
│   Editor.vue        │
│ showAIDialog()      │
│ - 提取文档内容      │
│ - 显示配置对话框    │
└──────┬──────────────┘
       │
       ↓
┌─────────────────────┐
│   Editor.vue        │
│ handleAIGenerate()  │
│ - 调用 AI 服务      │
└──────┬──────────────┘
       │
       ↓
┌─────────────────────────────┐
│   aiService.js              │
│ generatePlaceholders()      │
│ 1. 构建提示词               │
│ 2. 配置 API 请求            │
│ 3. 发送请求到 AI 模型       │
│ 4. 解析 JSON 响应           │
│ 5. 返回占位符列表           │
└──────┬──────────────────────┘
       │
       ↓
┌─────────────────────┐
│   Editor.vue        │
│ handleAIGenerate()  │
│ - 定位文本位置      │
│ - 添加占位符        │
└──────┬──────────────┘
       │
       ↓
┌─────────────────────┐
│  placeholderStore   │
│ addPlaceholder()    │
│ - 保存到状态管理    │
└─────────────────────┘
```

---

## 💡 学习要点总结

1. **AI 集成的本质**：构建好的提示词 + 调用 API + 解析结果
2. **提示词是关键**：决定了 AI 输出的质量和格式
3. **容错很重要**：AI 输出不总是完美，需要多层容错
4. **模拟模式的价值**：正则表达式虽简单，但能覆盖常见场景
5. **文本定位算法**：简单的 indexOf 有局限，可以优化

---

## 🚀 扩展思考

### 如何提高识别准确度？

1. **优化提示词**：
   - 添加更多示例
   - 针对特定文档类型定制规则

2. **使用更强大的模型**：
   - GPT-4 比 GPT-3.5 更准确
   - 增加 max_tokens 避免截断

3. **后处理优化**：
   - 合并相似的占位符
   - 根据上下文调整命名

### 如何处理复杂文档？

1. **分段处理**：
   - 将长文档分成多个部分
   - 分别调用 AI 分析

2. **增量识别**：
   - 先识别明显的占位符
   - 再让用户确认模糊的部分

3. **人机协作**：
   - AI 提供建议
   - 用户最终确认

---

## 📝 代码位置索引

- **用户交互**：`src/views/Editor.vue` 
  - `showAIDialog()` - 第 234 行
  - `handleAIGenerate()` - 第 246 行

- **AI 服务**：`src/services/aiService.js`
  - `generatePlaceholders()` - 第 1 行
  - `mockGeneratePlaceholders()` - 第 280 行

- **配置对话框**：`src/components/AIPlaceholderDialog.vue`

---

希望这份文档能帮助你深入理解智能填充的实现原理！🎉
