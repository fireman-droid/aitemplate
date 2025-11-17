# Requirements Document

## Introduction

本功能将"AI生成占位符"改造为"AI填充内容"功能。用户上传包含实际数据的资料文件（Word文档），AI从中提取信息并自动填充到模板中已存在的占位符表单中。系统需要智能识别不同类型的字段（文本、选择框等），并正确填充对应的值。

## Glossary

- **System**: AI内容填充系统
- **User**: 使用模板填充功能的用户
- **Resource_File**: 用户上传的包含实际数据的Word文档
- **Template**: 包含占位符的Word模板文档
- **Placeholder**: 模板中需要填充的字段标记，格式为 {field_name}
- **Placeholder_Mapping**: 占位符名称到中文描述的映射表（JSON格式）
- **Checkbox_Field**: 需要用户选择是/否的字段，填充后显示为 ☑ 或 □
- **Text_Field**: 需要填充文本内容的字段
- **AI_Service**: 调用大语言模型进行内容提取和填充的服务
- **Form_Data**: 从占位符生成的表单数据结构

## Requirements

### Requirement 1

**User Story:** 作为用户，我希望上传资料文件后AI能自动提取信息填充表单，这样我就不需要手动逐个填写字段

#### Acceptance Criteria

1. WHEN User上传Resource_File，THE System SHALL解析文件内容并提取纯文本
2. WHEN User点击"开始填充"按钮，THE System SHALL将Resource_File内容、Placeholder_Mapping和Placeholder列表发送给AI_Service
3. WHEN AI_Service返回填充结果，THE System SHALL将结果应用到Form_Data中
4. WHERE Placeholder为Checkbox_Field，THE System SHALL确保AI返回的值为"☑"或"□"
5. WHERE Placeholder为Text_Field，THE System SHALL将AI提取的文本内容填充到对应字段

### Requirement 2

**User Story:** 作为用户，我希望AI能准确识别选择框字段并返回正确的符号，这样选择框能正确显示勾选状态

#### Acceptance Criteria

1. WHEN System准备AI请求数据，THE System SHALL标识哪些Placeholder为Checkbox_Field
2. THE System SHALL在Placeholder_Mapping中包含字段类型信息
3. WHEN AI_Service处理Checkbox_Field，THE System SHALL要求AI返回"☑"表示选中或"□"表示未选中
4. IF AI返回的Checkbox_Field值不是"☑"或"□"，THEN THE System SHALL将其转换为正确格式
5. THE System SHALL在AI提示词中明确说明Checkbox_Field的填充规则

### Requirement 3

**User Story:** 作为用户，我希望系统能智能决定传递给AI的数据格式，这样AI能获得足够的上下文进行准确填充

#### Acceptance Criteria

1. THE System SHALL将Placeholder_Mapping（JSON格式）包含在AI请求中
2. THE System SHALL将Resource_File的纯文本内容包含在AI请求中
3. THE System SHALL将所有Placeholder的名称和描述列表包含在AI请求中
4. WHERE 文档类型已指定，THE System SHALL将文档类型信息包含在AI请求中
5. THE System SHALL构造结构化的提示词，明确要求AI返回JSON格式的填充结果

### Requirement 4

**User Story:** 作为用户，我希望看到资料文件的预览内容，这样我能确认上传的文件是否正确

#### Acceptance Criteria

1. WHEN User选择Resource_File，THE System SHALL解析Word文档内容
2. THE System SHALL在对话框中显示Resource_File的HTML预览
3. THE System SHALL提取Resource_File的纯文本用于AI分析
4. IF 文件解析失败，THEN THE System SHALL显示错误消息并清空预览区域
5. THE System SHALL在预览区域限制显示行数，避免界面过长

### Requirement 5

**User Story:** 作为用户，我希望AI填充完成后能看到哪些字段被填充了，这样我能快速检查和修改

#### Acceptance Criteria

1. WHEN AI填充完成，THE System SHALL显示成功消息，包含填充字段数量
2. THE System SHALL关闭AI对话框并返回到表单视图
3. THE System SHALL在表单中高亮显示或标记AI填充的字段
4. THE System SHALL允许User手动修改AI填充的内容
5. IF AI未能填充某些字段，THEN THE System SHALL保持这些字段为空，允许User手动填写

### Requirement 6

**User Story:** 作为开发者，我希望AI服务能返回结构化的数据，这样系统能可靠地解析和应用填充结果

#### Acceptance Criteria

1. THE AI_Service SHALL返回JSON格式的填充结果
2. THE JSON结果 SHALL包含占位符名称到填充值的映射
3. WHERE 字段无法从Resource_File中提取，THE AI_Service SHALL返回空字符串或null
4. THE AI_Service SHALL在响应中包含置信度信息（可选）
5. IF AI_Service调用失败，THEN THE System SHALL显示友好的错误消息并允许User重试
