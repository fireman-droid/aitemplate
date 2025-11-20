# 需求文档

## 简介

本文档定义了表单布局改进功能的需求。该功能旨在改进当前动态表单的显示方式，使其更加清晰、结构化，提升用户填写体验。当前表单存在字段排列混乱、分组不清晰、视觉层次不明显等问题，需要重新设计表单布局和渲染逻辑。

## 术语表

- **System**: 指动态表单渲染系统（DynamicPlaceholderForm 组件）
- **biaodan.json**: 表单配置文件，定义表单的结构、分组和字段
- **Section**: 一级分组，如"一、当事人信息"、"二、诉讼请求"
- **Group**: 二级分组，如"1. 原告信息"、"2. 委托诉讼代理人"
- **Field**: 表单字段，对应文档中的占位符
- **UI Mode**: 字段的渲染模式，如 simple_fields、radio_group_boolean、checkbox_activation 等
- **Trigger Field**: 触发字段，用于控制其他字段的显示/隐藏
- **Detail Fields**: 详细字段，在触发条件满足时显示的字段组

## 需求

### 需求 1：改进表单整体布局

**用户故事：** 作为用户，我希望表单具有清晰的视觉层次和结构，以便我能快速理解表单的组织方式并高效填写。

#### 验收标准

1. WHEN 用户打开表单 THEN the System SHALL 按照 Section → Group → Field 的三级层次结构渲染表单内容
2. WHEN 渲染 Section 标题 THEN the System SHALL 使用蓝色标题栏样式，并在右侧显示该 Section 的描述信息
3. WHEN 渲染 Group 标题 THEN the System SHALL 使用灰色背景和左侧边框，使其与 Section 区分开
4. WHEN 渲染 Field THEN the System SHALL 根据字段类型选择合适的输入控件（文本框、日期选择器、单选按钮等）
5. WHEN 表单内容超过一屏 THEN the System SHALL 提供平滑的滚动体验，并保持标题栏固定

### 需求 2：优化字段分组显示

**用户故事：** 作为用户，我希望相关字段能够合理分组显示，以便我能按照逻辑顺序填写表单。

#### 验收标准

1. WHEN Group 的 ui_mode 为 simple_fields THEN the System SHALL 将所有字段按照配置顺序垂直排列
2. WHEN Group 的 ui_mode 为 radio_group_boolean THEN the System SHALL 将字段渲染为单选按钮组，并支持互斥选择
3. WHEN Group 的 ui_mode 为 checkbox_activation THEN the System SHALL 先显示触发字段（有/无选项），然后显示详细字段列表
4. WHEN Group 包含 sub_groups THEN the System SHALL 在主字段下方渲染子分组，并使用缩进或边框区分
5. WHEN Group 的 ui_mode 为 dynamic_list THEN the System SHALL 支持添加/删除多个实例，每个实例包含完整的字段集

### 需求 3：改进字段渲染逻辑

**用户故事：** 作为用户，我希望每个字段都能以最合适的方式显示，以便我能准确理解字段含义并正确填写。

#### 验收标准

1. WHEN 字段为性别字段（gender_m/gender_f）THEN the System SHALL 渲染为单个性别选择器，包含"男"和"女"两个选项
2. WHEN 字段为出生日期字段（birth_y/birth_m/birth_d）THEN the System SHALL 渲染为单个日期选择器，并自动拆分为年月日
3. WHEN 字段为是/否字段（_yes/_no）THEN the System SHALL 渲染为单个单选按钮组，包含"是"和"否"两个选项
4. WHEN 字段为日期字段（_date/_time）THEN the System SHALL 渲染为日期选择器
5. WHEN 字段为多行文本字段（_detail/_content/_reason 等）THEN the System SHALL 渲染为多行文本框
6. WHEN 字段为普通文本字段 THEN the System SHALL 渲染为单行文本框

### 需求 4：实现字段关联和互斥逻辑

**用户故事：** 作为用户，我希望相关字段能够自动关联，互斥字段能够自动排斥，以便我不需要手动维护字段之间的一致性。

#### 验收标准

1. WHEN 用户选择性别为"男" THEN the System SHALL 自动将 gender_m 设置为 ☑，gender_f 设置为 □
2. WHEN 用户选择性别为"女" THEN the System SHALL 自动将 gender_f 设置为 ☑，gender_m 设置为 □
3. WHEN 用户选择是/否字段为"是" THEN the System SHALL 自动将 _yes 字段设置为 ☑，_no 字段设置为 □
4. WHEN 用户选择是/否字段为"否" THEN the System SHALL 自动将 _no 字段设置为 ☑，_yes 字段设置为 □
5. WHEN 用户选择触发字段为"有" THEN the System SHALL 自动将 trigger_field_true 设置为 ☑，trigger_field_false 设置为 □

### 需求 5：支持多选下拉框

**用户故事：** 作为用户，我希望对于多个互斥选项（如单位类型、所有制性质），能够使用下拉框选择，以便节省页面空间并提升选择效率。

#### 验收标准

1. WHEN sub_group 的 ui_mode 为 radio_group_boolean THEN the System SHALL 渲染为多选下拉框
2. WHEN 用户在下拉框中选择选项 THEN the System SHALL 自动将选中的字段设置为 ☑，未选中的字段设置为 □
3. WHEN 用户取消选择选项 THEN the System SHALL 自动将该字段设置为 □
4. WHEN 下拉框显示选项 THEN the System SHALL 使用 placeholderMapping 中的中文标签作为选项文本
5. WHEN 下拉框为空 THEN the System SHALL 显示"请选择"占位符文本

### 需求 6：优化表单数据绑定

**用户故事：** 作为开发者，我希望表单数据能够实时同步到 formData 对象，以便父组件能够获取最新的表单数据用于文档生成。

#### 验收标准

1. WHEN 用户修改任何字段 THEN the System SHALL 立即更新 formData 对象中对应字段的值
2. WHEN formData 更新 THEN the System SHALL 在 500ms 后触发 preview-update 事件，避免频繁更新
3. WHEN 父组件访问 formData THEN the System SHALL 返回包含所有字段当前值的对象
4. WHEN 字段值为复选框类型 THEN the System SHALL 使用 ☑ 表示选中，□ 表示未选中
5. WHEN 字段值为空 THEN the System SHALL 使用空字符串表示

### 需求 7：改进表单样式和交互

**用户故事：** 作为用户，我希望表单具有现代化的视觉设计和流畅的交互体验，以便我能愉快地完成表单填写。

#### 验收标准

1. WHEN 用户悬停在输入控件上 THEN the System SHALL 显示边框高亮效果
2. WHEN 用户聚焦输入控件 THEN the System SHALL 显示蓝色边框和阴影效果
3. WHEN 用户展开/折叠 Section THEN the System SHALL 使用平滑的动画过渡
4. WHEN 表单加载完成 THEN the System SHALL 默认展开所有 Section
5. WHEN 字段标签过长 THEN the System SHALL 自动换行显示，避免文本截断
