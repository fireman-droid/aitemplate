/**
 * AI 服务类 - AI 智能填充模板
 * 
 * 核心功能：
 * 从资料文件中提取信息，自动填充到模板的占位符中
 * 支持多种 AI 提供商（OpenAI、Kimi、OpenRouter、Azure）
 */
export class AIService {
  /**
   * AI 智能填充模板 - 从资料文件中提取数据填充占位符
   * 
   * @param {Object} config - AI 配置对象
   * @param {string} config.provider - AI 提供商：'openai'、'kimi'、'openrouter'、'azure'
   * @param {string} config.apiKey - API 密钥
   * @param {string} config.apiUrl - API 端点 URL
   * @param {string} config.model - 使用的模型名称
   * @param {string} contentText - 资料文件的纯文本内容
   * @param {Array} placeholders - 占位符列表
   * @returns {Promise<Object>} 填充结果，键是占位符名称，值是提取的内容
   */
  static async extractDataForTemplate(config, contentText, placeholders) {
    const { provider, apiKey, apiUrl, model } = config

    // 限制资料内容长度，避免超过 token 限制
    // 大约 1 个中文字符 = 2-3 tokens，保守估计留 6000 tokens 给内容
    const maxContentLength = 3000 // 约 6000-9000 tokens
    if (contentText.length > maxContentLength) {
      console.warn(`资料内容过长（${contentText.length}字符），已截断到${maxContentLength}字符`)
      contentText = contentText.substring(0, maxContentLength) + '\n...(内容过长，已截断)'
    }

    // 加载占位符映射表
    let placeholderMapping = {}
    try {
      const response = await fetch('/src/data/placeholderMapping.json')
      placeholderMapping = await response.json()
    } catch (error) {
      console.warn('无法加载占位符映射表，将使用占位符名称')
    }

    // 构建占位符详细信息列表
    const placeholderDetails = placeholders.map(p => {
      const description = placeholderMapping[p.name] || p.name
      const isCheckbox = description.includes('-是') || description.includes('-否') || 
                        description.includes('-男') || description.includes('-女') ||
                        description.includes('-有') || description.includes('-无') ||
                        p.name.includes('_yes') || p.name.includes('_no') ||
                        p.name.includes('_m') || p.name.includes('_f') ||
                        p.name.includes('_has') || p.name.includes('_none')
      
      return {
        name: p.name,
        description: description,
        type: isCheckbox ? 'checkbox' : 'text'
      }
    })

    // 分类占位符
    const checkboxFields = placeholderDetails.filter(p => p.type === 'checkbox')
    const textFields = placeholderDetails.filter(p => p.type === 'text')

    const systemPrompt = `你是信息提取助手，从资料中提取准确信息填充占位符。
**重要规则**：
1. 只返回纯数据，不要任何描述性文字
2. 文本字段：提取准确信息，没有则返回""
3. 选择框字段[☑/□]：适用返回"☑"，不适用返回"□"
4. 智能推理：如"张三，男"则gender_m="☑"，gender_f="□"
**错误示例**（不要这样）：
{"p_phone":"假设林悦的电话号码为13800138000"}
**正确示例**（要这样）：
{"p_phone":"13800138000"}
只返回JSON对象，不要任何解释：
{"p_name":"张三","p_gender_m":"☑","p_gender_f":"□","p_phone":"13800138000"}`

    // 构建简化的占位符列表（避免超过 token 限制）
    const simplifiedFields = placeholderDetails.map(p => {
      if (p.type === 'checkbox') {
        return `${p.name}(${p.description})[☑/□]`
      } else {
        return `${p.name}(${p.description})`
      }
    }).join(', ')

    let userPrompt = `从资料中提取信息填充占位符。

**重要**：只返回纯数据值，不要任何描述、假设或说明文字！

占位符：${simplifiedFields}

资料：
${contentText}

只返回JSON，例如：{"p_name":"张三","p_phone":"13800138000"}`

    try {
      let url = apiUrl
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }

      if (provider === 'deepseek') {
        url = 'https://api.deepseek.com/v1/chat/completions'
      } else if (provider === 'kimi') {
        url = 'https://api.moonshot.cn/v1/chat/completions'
      } else if (provider === 'gemini') {
        const geminiModel = selectedModel || model || 'gemini-pro'
        url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`
        delete headers['Authorization'] // Gemini使用URL参数传递API Key
      } else if (provider === 'openrouter') {
        url = 'https://openrouter.ai/api/v1/chat/completions'
        headers['HTTP-Referer'] = window.location.origin
        headers['X-Title'] = 'AI Template Filler'
      } else if (provider === 'openai') {
        url = 'https://api.openai.com/v1/chat/completions'
      } else if (provider === 'azure') {
        url = apiUrl
      }

      let selectedModel = model
      if (!selectedModel || selectedModel.trim() === '') {
        if (provider === 'deepseek') {
          selectedModel = 'deepseek-chat'
        } else if (provider === 'kimi') {
          selectedModel = 'moonshot-v1-8k'
        } else if (provider === 'gemini') {
          selectedModel = 'gemini-pro'
        } else if (provider === 'openrouter') {
          selectedModel = 'deepseek/deepseek-r1:free'
        } else {
          selectedModel = 'gpt-4o-mini'
        }
      }

      let requestBody
      let content

      if (provider === 'gemini') {
        // Gemini API格式
        requestBody = {
          contents: [{
            parts: [{
              text: `${systemPrompt}\n\n${userPrompt}`
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2000
          }
        }

        const response = await fetch(url, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(requestBody)
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error?.message || '调用Gemini接口失败')
        }

        const data = await response.json()
        content = data.candidates[0].content.parts[0].text
      } else {
        // OpenAI兼容格式 (Kimi, OpenAI, OpenRouter等)
        requestBody = {
          model: selectedModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.3,
          max_tokens: 2000
        }

        if (provider === 'openai' || provider === 'kimi' || provider === 'deepseek') {
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
        content = data.choices[0].message.content
      }

      // 解析 JSON 响应
      let extractedData
      try {
        extractedData = JSON.parse(content)
        console.log('JSON 解析成功')
      } catch (e) {
        console.error('JSON解析失败')
        console.error('错误信息:', e.message)
        
        // 容错处理 - 修复常见的 JSON 问题
        let fixedContent = content
        
        // 1. 移除空键名（如 "": ""）
        fixedContent = fixedContent.replace(/""\s*:\s*"[^"]*"\s*,?\s*/g, '')
        
        // 2. 修复末尾多余的逗号
        fixedContent = fixedContent.replace(/,\s*}/g, '}')
        fixedContent = fixedContent.replace(/,\s*]/g, ']')
        
        // 3. 如果 JSON 被截断，尝试修复
        if (!fixedContent.trim().endsWith('}')) {
          console.log('检测到 JSON 被截断，尝试修复')
          // 找到最后一个完整的键值对
          const lastCommaIndex = fixedContent.lastIndexOf(',')
          if (lastCommaIndex > 0) {
            fixedContent = fixedContent.substring(0, lastCommaIndex) + '}'
          } else {
            // 如果没有逗号，尝试找到最后一个引号
            const lastQuoteIndex = fixedContent.lastIndexOf('"')
            if (lastQuoteIndex > 0) {
              fixedContent = fixedContent.substring(0, lastQuoteIndex + 1) + '}'
            }
          }
        }
        
        console.log('修复后的内容长度:', fixedContent.length)
        console.log('修复后的内容开头:', fixedContent.substring(0, 200))
        console.log('修复后的内容结尾:', fixedContent.substring(fixedContent.length - 200))
        
        try {
          extractedData = JSON.parse(fixedContent)
          console.log('✓ 修复后解析成功，提取到', Object.keys(extractedData).length, '个字段')
        } catch (e2) {
          console.error('修复后仍然解析失败:', e2.message)
          
          // 最后尝试：提取 JSON 片段
          const jsonMatch = fixedContent.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            try {
              extractedData = JSON.parse(jsonMatch[0])
              console.log('✓ 通过正则提取解析成功')
            } catch (e3) {
              console.error('所有尝试都失败了')
              throw new Error('AI返回的格式不正确，请重试')
            }
          } else {
            throw new Error('AI返回的格式不正确')
          }
        }
      }
      
      // 过滤掉空键名的数据
      if (extractedData && typeof extractedData === 'object') {
        const cleanedData = {}
        Object.keys(extractedData).forEach(key => {
          if (key && key.trim() !== '') {
            cleanedData[key] = extractedData[key]
          }
        })
        extractedData = cleanedData
        console.log('清理后的数据包含', Object.keys(extractedData).length, '个字段')
      }

      // 验证和修正选择框字段的值
      placeholders.forEach(p => {
        const value = extractedData[p.name]
        if (value !== undefined && value !== null && value !== '') {
          // 检查是否为选择框字段
          const isCheckbox = p.name.includes('_yes') || p.name.includes('_no') ||
                            p.name.includes('_m') || p.name.includes('_f') ||
                            p.name.includes('_has') || p.name.includes('_none') ||
                            p.name.includes('_male') || p.name.includes('_female')
          
          if (isCheckbox) {
            // 确保选择框字段只返回 ☑ 或 □
            if (value === '☑' || value === '□') {
              // 已经是正确格式
            } else if (value === true || value === 'true' || value === '是' || value === '选中' || value === 'checked') {
              extractedData[p.name] = '☑'
            } else if (value === false || value === 'false' || value === '否' || value === '未选中' || value === 'unchecked') {
              extractedData[p.name] = '□'
            } else {
              // 默认未选中
              extractedData[p.name] = '□'
            }
          }
        }
      })

      return extractedData
    } catch (error) {
      console.error('AI提取数据失败:', error)
      
      // 提供更友好的错误信息
      if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_CLOSED')) {
        if (provider === 'gemini') {
          throw new Error('无法连接到Gemini API，可能是网络问题或需要代理。请检查网络连接或尝试使用Kimi。')
        }
        throw new Error('网络连接失败，请检查网络连接后重试')
      }
      
      throw error
    }
  }
}
