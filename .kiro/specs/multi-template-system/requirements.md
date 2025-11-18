# 需求文档 - 多模板系统

## 简介

本功能旨在重构现有的单一模板系统，使其支持多个不同的法律文书模板。每个模板可以有自己独立的占位符映射配置、字段分组结构和数据模型，从而提高系统的可扩展性和复用性。

## 术语表

- **System**: 指多模板管理系统
- **Template**: 法律文书模板，如民事起诉状、房屋买卖合同等
- **Template File**: Word格式的模板文件（.docx），包含占位符的原始文档
- **Placeholder Mapping**: 占位符映射配置文件，定义占位符名称与中文描述的对应关系
- **Field Group**: 字段分组，如原告信息、被告信息、第三人信息等
- **Template Configuration**: 模板配置文件，包含模板元数据、字段分组结构等信息
- **User**: 使用系统的法律工作者

## 需求

### 需求 1: 模板管理

**用户故事:** 作为法律工作者，我希望系统能够支持多个不同的法律文书模板，以便我可以根据不同的案件类型选择合适的模板进行填充。

#### 验收标准

1. THE System SHALL 在前端项目中存储所有Word模板文件（.docx格式）
2. THE System SHALL 支持至少3种不同的法律文书模板类型
3. THE System SHALL 提供模板选择界面，显示所有可用的模板
4. THE System SHALL 为每个模板维护独立的配置文件和Word文件
5. WHEN User选择模板后，THE System SHALL 加载对应的Word模板文件并解析占位符
6. THE System SHALL 允许User在同一会话中切换不同的模板

### 需求 2: 占位符映射配置

**用户故事:** 作为系统管理员，我希望每个模板都有自己独立的占位符映射配置文件，以便不同模板可以使用不同的占位符命名规则和中文描述。

#### 验收标准

1. THE System SHALL 为每个模板在其目录下存储独立的`placeholders.json`文件
2. WHEN 加载模板时，THE System SHALL 自动加载对应目录下的占位符映射配置
3. THE System SHALL 支持占位符映射配置的热更新，无需重启应用
4. THE System SHALL 在占位符映射文件缺失时提供默认的占位符显示方式
5. THE System SHALL 验证占位符映射配置的格式正确性
6. THE System SHALL 支持不同模板使用完全不同的占位符命名规则

### 需求 3: 字段分组结构

**用户故事:** 作为法律工作者，我希望表单字段能够按照更细粒度的逻辑分组（如原告人、第三人、诉讼请求等），以便我可以更快速地找到和填写相关字段。

#### 验收标准

1. THE System SHALL 支持多层级的字段分组结构（最多3层）
2. WHEN 显示表单时，THE System SHALL 根据模板配置动态生成字段分组
3. THE System SHALL 为每个字段分组提供展开/折叠功能
4. THE System SHALL 在字段分组标题中显示该组包含的字段数量
5. THE System SHALL 支持字段分组的自定义排序

### 需求 4: 模板配置文件

**用户故事:** 作为系统管理员，我希望每个模板都有一个配置文件来定义其元数据和结构信息，以便系统能够正确地处理和显示该模板。

#### 验收标准

1. THE System SHALL 为每个模板维护一个JSON格式的配置文件
2. THE System SHALL 在配置文件中存储模板名称、描述、版本号等元数据
3. THE System SHALL 在配置文件中定义字段分组结构和字段类型
4. THE System SHALL 在配置文件中指定Word模板文件和占位符映射文件的路径
5. THE System SHALL 验证模板配置文件的完整性和正确性

### 需求 5: 模板选择界面

**用户故事:** 作为法律工作者，我希望能够看到清晰的模板选择界面，以便我可以选择合适的模板进行填充。

#### 验收标准

1. WHEN User打开应用时，THE System SHALL 显示所有可用的模板列表
2. THE System SHALL 为每个模板显示名称、描述、适用场景和缩略图
3. WHEN User选择模板后，THE System SHALL 加载对应的Word文件、配置和映射文件
4. THE System SHALL 解析Word模板文件中的所有占位符
5. THE System SHALL 根据模板配置动态生成表单界面
6. THE System SHALL 在模板切换时提示User是否保存当前数据

### 需求 6: 数据持久化

**用户故事:** 作为法律工作者，我希望系统能够记住我最近使用的模板和填写的数据，以便下次使用时可以快速恢复。

#### 验收标准

1. THE System SHALL 在浏览器本地存储中保存User最近使用的模板类型
2. THE System SHALL 在浏览器本地存储中保存User填写的表单数据
3. WHEN User重新打开应用时，THE System SHALL 自动恢复上次使用的模板和数据
4. THE System SHALL 提供清除本地存储数据的功能
5. THE System SHALL 在存储数据前进行数据大小检查，避免超出浏览器限制

### 需求 7: 模板扩展性

**用户故事:** 作为系统管理员，我希望添加新模板的过程尽可能简单，只需要添加Word文件、配置文件和映射文件即可，无需修改核心代码。

#### 验收标准

1. THE System SHALL 通过扫描模板目录自动发现新添加的模板
2. THE System SHALL 在添加新模板时无需修改核心业务逻辑代码
3. THE System SHALL 提供模板配置文件的JSON Schema定义
4. THE System SHALL 在启动时验证所有模板配置的有效性
5. THE System SHALL 在模板配置无效时提供详细的错误信息
6. THE System SHALL 支持通过添加以下文件来创建新模板：Word模板文件、配置JSON、占位符映射JSON

### 需求 8: Word模板文件管理

**用户故事:** 作为系统管理员，我希望Word模板文件能够直接存储在前端项目中，以便用户无需上传文档即可开始填充。

#### 验收标准

1. THE System SHALL 在`src/templates/`目录下为每个模板创建独立的子目录
2. THE System SHALL 按照以下结构组织模板文件：
   - `src/templates/house-sale-dispute/` - 房屋买卖合同纠纷
   - `src/templates/divorce-dispute/` - 离婚纠纷
   - `src/templates/sale-contract-dispute/` - 买卖合同纠纷
3. THE System SHALL 在每个模板目录中包含以下文件：
   - `template.docx` - Word模板文件
   - `config.json` - 模板配置文件
   - `placeholders.json` - 占位符映射文件
4. THE System SHALL 支持通过HTTP请求加载Word模板文件
5. WHEN User选择模板时，THE System SHALL 从对应目录加载所有相关文件
6. THE System SHALL 解析Word文件中的所有占位符并提取到列表中
7. THE System SHALL 支持Word模板文件的版本管理
8. THE System SHALL 在文件加载失败时提供友好的错误提示

### 需求 9: AI填充适配

**用户故事:** 作为法律工作者，我希望AI填充功能能够根据不同的模板类型使用不同的提示词和提取策略，以便提高填充的准确性。

#### 验收标准

1. THE System SHALL 为每个模板配置独立的AI提示词模板
2. WHEN 调用AI填充时，THE System SHALL 使用当前模板的提示词配置
3. THE System SHALL 支持在模板配置中定义字段的提取优先级
4. THE System SHALL 支持在模板配置中定义字段之间的依赖关系
5. THE System SHALL 在AI填充完成后根据模板规则验证数据的合理性
