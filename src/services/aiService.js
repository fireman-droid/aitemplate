/**
 * AI 服务类 - 提供智能占位符生成和数据提取功能
 * 
 * 核心功能：
 * 1. generatePlaceholders - 分析文档，自动识别需要替换的字段
 * 2. extractDataForTemplate - 从内容文件中提取数据填充模板
 * 3. 支持多种 AI 提供商（OpenAI、Kimi、OpenRouter、Azure）
 * 4. 提供模拟模式用于测试和演示
 */
export class AIService {
  /**
   * AI 自动生成占位符 - 核心方法
   * 
   * 工作原理：
   * 1. 构建专业的系统提示词，定义识别规则和命名规范
   * 2. 将文档内容发送给 AI 模型进行分析
   * 3. AI 返回 JSON 格式的占位符建议列表
   * 4. 解析并验证返回结果
   * 
   * @param {Object} config - AI 配置对象
   * @param {string} config.mode - 运行模式：'mock'（模拟）或 'api'（真实调用）
   * @param {string} config.provider - AI 提供商：'openai'、'kimi'、'openrouter'、'azure'
   * @param {string} config.apiKey - API 密钥
   * @param {string} config.apiUrl - API 端点 URL
   * @param {string} config.model - 使用的模型名称
   * @param {string} documentContent - 文档纯文本内容
   * @param {string} documentType - 文档类型（如：合同、简历），用于优化识别
   * @returns {Promise<Array>} 占位符建议列表，每项包含 {name, text, reason}
   */
  static async generatePlaceholders(config, documentContent, documentType = '') {
    const { mode, provider, apiKey, apiUrl, model } = config

    // ===== 模拟模式：用于测试，无需 API Key =====
    // 使用正则表达式进行基础的模式匹配
    if (mode === 'mock') {
      return this.mockGeneratePlaceholders(documentContent, documentType)
    }

    // ===== 步骤1: 构建系统提示词 =====
    // 这是 AI 智能识别的核心，定义了详细的识别规则和命名规范
    // 提示词工程（Prompt Engineering）是影响 AI 输出质量的关键因素
    const systemPrompt = `你是一个专业的文档模板分析助手。你的任务是智能分析文档内容，识别出所有需要替换为占位符的可变信息。

核心识别规则：
1. 包含"XX"、"XXX"、"XXXX"等占位标记的内容 → 100%是占位符，必须识别
2. 选择框符号（□、☑、○、●）→ 100%是占位符，必须识别
3. 冒号后面的具体值 → 分析是否为可变信息
   - "姓名：张三" → "张三"是占位符
   - "民族：汉族" → "汉族"是占位符
   - "性别：男□ 女☑" → "□"和"☑"是占位符
   - "日期：2024年1月1日" → "2024年1月1日"是占位符
4. 明显的个人信息、日期、金额、地址等 → 是占位符

智能识别策略：
- 分析文档结构，识别"标签：值"的模式
- 只提取"值"部分作为占位符，不包含"标签："
- 对于选择框，每个符号都是独立的占位符
- 对于重复出现的相似内容（如多个地址、多个姓名），分别识别

占位符命名规范：
- 使用小写英文，多个单词用下划线连接
- 根据上下文智能命名：
  * 如果能识别角色（原告/被告/律师等），加上前缀：plaintiff_name, defendant_name
  * 如果是通用字段，使用描述性名称：name, address, phone, date
  * 选择框使用：checkbox_1, checkbox_2 或 gender_male, gender_female
- 常用词汇参考：
  * 人物：name, plaintiff, defendant, lawyer, witness, child
  * 时间：date, birth_date, marriage_date, filing_date
  * 地点：address, residence, registered_address, property_address
  * 联系：phone, mobile, email
  * 金额：amount, price, fee, compensation, alimony
  * 证件：id_number, license, certificate
  * 其他：company, job_title, ethnicity, gender

特别注意：
- text字段只包含需要替换的值，不包含标签
- 选择框符号（□、☑）必须单独识别为占位符
- 不要识别固定的标签文字（如"姓名："、"日期："等）
- 每个可变信息都要单独识别，不要遗漏

返回JSON格式：
{
  "placeholders": [
    {"name": "name", "text": "张三", "reason": "姓名"},
    {"name": "ethnicity", "text": "汉族", "reason": "民族"},
    {"name": "gender_male", "text": "□", "reason": "性别选择-男"},
    {"name": "gender_female", "text": "☑", "reason": "性别选择-女"},
    {"name": "birth_date", "text": "1990年1月1日", "reason": "出生日期"}
  ]
}

只返回JSON，不要其他解释。`

    // ===== 步骤2: 构建用户提示词 =====
    // 根据文档类型定制提示，提高识别准确度
    let userPrompt = ''
    if (documentType) {
      // 如果用户指定了文档类型，AI 可以利用该类型的领域知识
      userPrompt = `这是一份${documentType}文档。请仔细分析并识别所有需要替换的可变信息。\n\n文档内容：\n${documentContent}`
    } else {
      // 通用提示，适用于任何类型的文档
      userPrompt = `请仔细分析以下文档，识别所有包含"XX"标记或明显可变的信息（如姓名、日期、金额、地址等）。\n\n文档内容：\n${documentContent}`
    }

    try {
      // ===== 步骤3: 配置 API 请求参数 =====
      let url = apiUrl
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`  // 标准的 Bearer Token 认证
      }

      // ===== 步骤3.1: 根据不同提供商设置 API 端点 =====
      if (provider === 'kimi') {
        // Kimi (月之暗面) - 国产 AI，支持长文本
        url = 'https://api.moonshot.cn/v1/chat/completions'
      } else if (provider === 'openrouter') {
        // OpenRouter - AI 模型聚合平台，提供多种免费和付费模型
        url = 'https://openrouter.ai/api/v1/chat/completions'
        // OpenRouter 需要额外的 headers 用于统计和限流
        headers['HTTP-Referer'] = window.location.origin
        headers['X-Title'] = 'Template Placeholder Editor'
      } else if (provider === 'openai') {
        // OpenAI - GPT 系列模型
        url = 'https://api.openai.com/v1/chat/completions'
      } else if (provider === 'azure') {
        // Azure OpenAI - 企业级部署，URL 格式特殊
        url = apiUrl  // 使用用户提供的完整 URL
      }

      // ===== 步骤3.2: 确定使用的模型 =====
      // 如果用户未指定模型，使用各提供商的默认推荐模型
      let selectedModel = model
      if (!selectedModel || selectedModel.trim() === '') {
        if (provider === 'kimi') {
          selectedModel = 'moonshot-v1-8k'  // Kimi 8K 上下文模型
        } else if (provider === 'openrouter') {
          selectedModel = 'deepseek/deepseek-r1:free'  // DeepSeek 免费模型
        } else {
          selectedModel = 'gpt-4o-mini'  // OpenAI 性价比模型
        }
      }

      // ===== 步骤3.3: 构建请求体 =====
      const requestBody = {
        model: selectedModel,
        messages: [
          { role: 'system', content: systemPrompt },  // 系统角色：定义 AI 的行为
          { role: 'user', content: userPrompt }       // 用户角色：具体的任务请求
        ],
        temperature: 0.3,  // 低温度值 = 更确定性的输出，适合结构化任务
        max_tokens: 4000   // 最大输出长度，确保长文档也能完整返回所有占位符
      }

      // ===== 步骤3.4: 启用 JSON 模式（如果支持）=====
      // OpenAI 和 Kimi 支持强制 JSON 输出格式，提高解析成功率
      if (provider === 'openai' || provider === 'kimi') {
        requestBody.response_format = { type: 'json_object' }
      }

      // ===== 步骤4: 发送 API 请求 =====
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody)
      })

      // ===== 步骤5: 处理 API 响应 =====
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || '调用AI接口失败')
      }

      const data = await response.json()
      let content = data.choices[0].message.content

      // ===== 步骤6: 处理响应截断问题 =====
      // 当文档很长时，AI 的输出可能被 max_tokens 限制截断
      // finish_reason === 'length' 表示输出被截断
      if (data.choices[0].finish_reason === 'length') {
        console.warn('AI响应被截断，尝试修复JSON...')
        
        // 智能修复策略：
        // 1. 移除最后一个不完整的对象（可能只有部分字段）
        content = content.replace(/,\s*\{\s*"name"[^}]*$/, '')
        
        // 2. 确保 JSON 结构完整（闭合数组和对象）
        if (!content.trim().endsWith(']')) {
          content = content.trim()
          if (content.endsWith(',')) {
            content = content.slice(0, -1)  // 移除末尾的逗号
          }
          content += '\n  ]\n}'  // 添加缺失的闭合符号
        }
      }

      // ===== 步骤7: 解析 JSON 响应 =====
      let placeholders
      try {
        // 尝试直接解析 JSON
        const parsed = JSON.parse(content)
        
        // 兼容多种返回格式：
        // - { "placeholders": [...] }  标准格式
        // - { "占位符": [...] }        中文键名
        // - [...]                      直接返回数组
        placeholders = parsed.placeholders || parsed['占位符'] || parsed
        
      } catch (e) {
        console.error('JSON解析失败，原始内容:', content)
        
        // ===== 步骤7.1: 容错处理 - 提取 JSON 片段 =====
        // 有些 AI 可能在 JSON 前后添加说明文字，尝试提取纯 JSON 部分
        const jsonMatch = content.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0])
            placeholders = parsed.placeholders || parsed['占位符'] || parsed
          } catch (e2) {
            throw new Error('AI返回的格式不正确，请尝试减少文档长度或使用模拟模式')
          }
        } else {
          throw new Error('AI返回的格式不正确')
        }
      }

      // ===== 步骤8: 验证返回数据格式 =====
      if (!Array.isArray(placeholders)) {
        throw new Error('AI返回的数据格式不正确，期望数组')
      }

      console.log(`成功解析 ${placeholders.length} 个占位符`)
      return placeholders
    } catch (error) {
      console.error('AI生成占位符失败:', error)
      throw error
    }
  }

  // AI填充占位符（预留接口）
  static async fillPlaceholder(request) {
    // 这是预留的AI接口，未来可以接入真实的AI服务
    throw new Error('AI服务尚未实现')
  }

  // 批量填充占位符
  static async fillMultiplePlaceholders(requests) {
    const results = []
    for (const request of requests) {
      try {
        const result = await this.fillPlaceholder(request)
        results.push(result)
      } catch (error) {
        results.push({
          placeholderId: request.placeholderId,
          error: error.message
        })
      }
    }
    return results
  }

  /**
   * 模拟生成占位符（无需 API Key）
   * 
   * 用途：
   * 1. 演示功能 - 让用户无需配置 API 即可体验
   * 2. 开发测试 - 避免频繁调用 API 产生费用
   * 3. 离线使用 - 在无网络环境下工作
   * 
   * 实现原理：
   * 使用正则表达式匹配常见的数据模式
   * 虽然不如 AI 智能，但能覆盖大部分常见场景
   * 
   * @param {string} documentContent - 文档纯文本内容
   * @param {string} documentType - 文档类型（当前未使用）
   * @returns {Promise<Array>} 占位符建议列表
   */
  static async mockGeneratePlaceholders(documentContent, documentType = '') {
    return new Promise((resolve) => {
      // 模拟网络延迟，让用户体验更真实
      setTimeout(() => {
        const placeholders = []

        // ===== 模式1: 识别中文姓名 =====
        // 匹配规则：常见姓氏 + 1-2个汉字名字
        // 例如：张三、李四、王小明
        const namePattern = /([王李张刘陈杨黄赵吴周徐孙马朱胡郭何高林罗郑梁谢宋唐许韩冯邓曹彭曾肖田董袁潘于蒋蔡余杜叶程苏魏吕丁任沈姚卢姜崔钟谭陆汪范金石廖贾夏韦付方白邹孟熊秦邱江尹薛闫段雷侯龙史陶黎贺顾毛郝龚邵万钱严覃武戴莫孔向汤])([XX一-龥]{1,2})/g
        let match
        while ((match = namePattern.exec(documentContent)) !== null) {
          const text = match[0]
          // 过滤条件：包含 XX 占位符 或 长度为2-3个字符
          if (text.includes('XX') || text.length === 2 || text.length === 3) {
            placeholders.push({
              name: '姓名',
              text: text,
              reason: '识别为人名'
            })
          }
        }

        // ===== 模式2: 识别日期 =====
        // 匹配格式：YYYY年MM月DD日
        // 例如：2024年1月1日、2023年12月31日
        const datePattern = /(\d{4}年\d{1,2}月\d{1,2}日)/g
        while ((match = datePattern.exec(documentContent)) !== null) {
          placeholders.push({
            name: '日期',
            text: match[0],
            reason: '日期信息'
          })
        }

        // ===== 模式3: 识别金额 =====
        // 匹配格式：数字 + 元
        // 例如：1000元、50000元
        const moneyPattern = /(\d+元)/g
        while ((match = moneyPattern.exec(documentContent)) !== null) {
          placeholders.push({
            name: '金额',
            text: match[0],
            reason: '金额信息'
          })
        }

        // ===== 模式4: 识别电话号码 =====
        // 匹配规则：
        // - 手机号：1开头 + 3-9 + 9位数字
        // - 占位符：3-4位数字 + XXXX
        const phonePattern = /(1[3-9]\d{9}|\d{3,4}XXXX)/g
        while ((match = phonePattern.exec(documentContent)) !== null) {
          placeholders.push({
            name: '联系电话',
            text: match[0],
            reason: '电话号码'
          })
        }

        // ===== 模式5: 识别身份证号 =====
        // 匹配规则：
        // - 18位身份证：地区码(6位) + 出生日期(8位) + 顺序码(3位) + 校验码(1位)
        // - 占位符形式：数字 + XXXXXXXXX
        const idPattern = /([1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]|[1-9]XXXXXXXXX)/g
        while ((match = idPattern.exec(documentContent)) !== null) {
          placeholders.push({
            name: '身份证号',
            text: match[0],
            reason: '身份证号码'
          })
        }

        // ===== 模式6: 识别地址 =====
        // 匹配规则：省份/直辖市 + 2-30个字符 + 地址关键词（区、街道、路、号等）
        // 例如：北京市朝阳区XX街道XX号
        const addressPattern = /((?:北京|上海|天津|重庆|河北|山西|辽宁|吉林|黑龙江|江苏|浙江|安徽|福建|江西|山东|河南|湖北|湖南|广东|海南|四川|贵州|云南|陕西|甘肃|青海|台湾|内蒙古|广西|西藏|宁夏|新疆|香港|澳门)(?:省|市|自治区|特别行政区)?[^，。；！？\n]{2,30}(?:区|县|市|街道|路|号|室|栋|楼|单元|小区))/g
        while ((match = addressPattern.exec(documentContent)) !== null) {
          placeholders.push({
            name: '地址',
            text: match[0],
            reason: '地址信息'
          })
        }

        // ===== 模式7: 识别车牌号 =====
        // 匹配规则：
        // - 标准车牌：省份简称 + 字母 + 5位字母或数字
        // - 占位符形式：包含 XXXX 的车牌号
        const carPattern = /(京|津|冀|晋|蒙|辽|吉|黑|沪|苏|浙|皖|闽|赣|鲁|豫|鄂|湘|粤|桂|琼|渝|川|贵|云|藏|陕|甘|青|宁|新)[A-Z][A-Z0-9]{5}|[A-Z]{2}牌[^，。\n]{0,20}号码[：:]\s*([京津冀晋蒙辽吉黑沪苏浙皖闽赣鲁豫鄂湘粤桂琼渝川贵云藏陕甘青宁新][A-Z][A-Z0-9XXXX]{5})/g
        while ((match = carPattern.exec(documentContent)) !== null) {
          placeholders.push({
            name: '车牌号',
            text: match[0],
            reason: '车牌号码'
          })
        }

        // ===== 模式8: 识别公司/机构名称 =====
        // 匹配规则：2-20个字符 + 组织关键词（公司、事务所、集团等）
        // 只识别包含 XX 占位符的名称
        const companyPattern = /([一-龥A-Za-z0-9]{2,20}(?:公司|律师事务所|事务所|集团|企业|中心|机构))/g
        while ((match = companyPattern.exec(documentContent)) !== null) {
          if (match[0].includes('XX')) {
            placeholders.push({
              name: '单位名称',
              text: match[0],
              reason: '公司或机构名称'
            })
          }
        }

        // ===== 去重处理 =====
        // 使用 Set 数据结构去除重复的占位符
        // 例如：文档中多次出现"张三"，只保留一个
        const uniquePlaceholders = []
        const seen = new Set()
        for (const p of placeholders) {
          const key = `${p.text}`  // 使用文本内容作为唯一标识
          if (!seen.has(key)) {
            seen.add(key)
            uniquePlaceholders.push(p)
          }
        }

        resolve(uniquePlaceholders)
      }, 1500) // 模拟网络延迟 1.5 秒
    })
  }

  // 模拟AI填充（用于测试）
  static async mockFill(request) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          placeholderId: request.placeholderId,
          generatedContent: `模拟生成的内容：${request.prompt}`,
          confidence: 0.85
        })
      }, 1000)
    })
  }

  // AI提取数据填充模板
  static async extractDataForTemplate(config, contentText, placeholders) {
    const { mode, provider, apiKey, apiUrl, model } = config

    // 模拟模式
    if (mode === 'mock') {
      return this.mockExtractData(contentText, placeholders)
    }

    // 构建占位符列表
    const placeholderList = placeholders.map(p => p.name).join('、')

    const systemPrompt = `你是一个专业的文档信息提取助手。从内容文件中提取信息，填充模板占位符。

提取规则：
1. 仔细阅读内容，提取每个占位符对应的准确信息
2. 如果找不到信息，该字段设为空字符串""
3. 对于checkbox类占位符，如果选中返回"☑"，未选中返回"□"
4. 保持原文格式和完整性

返回格式：直接返回JSON对象，键是占位符名称，值是提取的内容
例如：
{
  "name": "张三",
  "phone": "13800138000",
  "address": "北京市朝阳区XX街道XX号",
  "checkbox_male": "☑",
  "checkbox_female": "□"
}

只返回JSON对象，不要其他内容。`

    const userPrompt = `请从以下内容中提取信息，填充这些占位符：${placeholderList}

内容：
${contentText}`

    try {
      let url = apiUrl
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }

      if (provider === 'kimi') {
        url = 'https://api.moonshot.cn/v1/chat/completions'
      } else if (provider === 'openrouter') {
        url = 'https://openrouter.ai/api/v1/chat/completions'
        headers['HTTP-Referer'] = window.location.origin
        headers['X-Title'] = 'Template Placeholder Editor'
      } else if (provider === 'openai') {
        url = 'https://api.openai.com/v1/chat/completions'
      } else if (provider === 'azure') {
        url = apiUrl
      }

      let selectedModel = model
      if (!selectedModel || selectedModel.trim() === '') {
        if (provider === 'kimi') {
          selectedModel = 'moonshot-v1-8k'
        } else if (provider === 'openrouter') {
          selectedModel = 'deepseek/deepseek-r1:free'
        } else {
          selectedModel = 'gpt-4o-mini'
        }
      }

      const requestBody = {
        model: selectedModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 2000
      }

      if (provider === 'openai' || provider === 'kimi') {
        requestBody.response_format = { type: 'json_object' }
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || '调用AI接口失败')
      }

      const data = await response.json()
      const content = data.choices[0].message.content

      const extractedData = JSON.parse(content)
      return extractedData
    } catch (error) {
      console.error('AI提取数据失败:', error)
      throw error
    }
  }

  // 模拟数据提取
  static async mockExtractData(contentText, placeholders) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const result = {}
        
        placeholders.forEach(p => {
          const name = p.name.toLowerCase()
          
          if (name.includes('name') || name.includes('姓名')) {
            const nameMatch = contentText.match(/([王李张刘陈杨黄赵吴周徐孙马朱胡郭何高林][一-龥]{1,2})/)
            result[p.name] = nameMatch ? nameMatch[0] : ''
          } else if (name.includes('phone') || name.includes('电话')) {
            const phoneMatch = contentText.match(/1[3-9]\d{9}/)
            result[p.name] = phoneMatch ? phoneMatch[0] : ''
          } else if (name.includes('address') || name.includes('地址')) {
            const addressMatch = contentText.match(/((?:北京|上海|天津|重庆|河北|山西|辽宁|吉林|黑龙江|江苏|浙江|安徽|福建|江西|山东|河南|湖北|湖南|广东|海南|四川|贵州|云南|陕西|甘肃|青海|台湾|内蒙古|广西|西藏|宁夏|新疆|香港|澳门)(?:省|市|自治区|特别行政区)?[^，。；！？\n]{2,30}(?:区|县|市|街道|路|号))/)
            result[p.name] = addressMatch ? addressMatch[0] : ''
          } else if (name.includes('date') || name.includes('日期')) {
            const dateMatch = contentText.match(/\d{4}年\d{1,2}月\d{1,2}日/)
            result[p.name] = dateMatch ? dateMatch[0] : ''
          } else if (name.includes('checkbox')) {
            result[p.name] = '□'
          } else {
            result[p.name] = ''
          }
        })

        resolve(result)
      }, 2000)
    })
  }
}
