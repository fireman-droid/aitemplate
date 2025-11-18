/**
 * 模板管理服务
 * 负责加载和管理多个法律文书模板
 */

export class TemplateService {
  /**
   * 获取所有可用模板列表
   * @returns {Promise<Array>} 模板列表
   */
  static async getAvailableTemplates() {
    // 目前只有一个模板，后续可以扩展
    return [
      {
        id: 'house-sale-dispute',
        name: '房屋买卖合同纠纷',
        description: '适用于房屋买卖合同相关的民事纠纷案件',
        icon: 'House',
        path: '/src/templates/house-sale-dispute',
        category: '合同纠纷'
      }
      // 后续添加更多模板
      // {
      //   id: 'divorce-dispute',
      //   name: '离婚纠纷',
      //   description: '适用于离婚相关的民事纠纷案件',
      //   icon: 'User',
      //   path: '/src/templates/divorce-dispute',
      //   category: '婚姻家庭'
      // }
    ]
  }

  /**
   * 加载指定模板的配置文件
   * @param {string} templateId - 模板ID
   * @returns {Promise<Object>} 模板配置对象
   */
  static async loadTemplateConfig(templateId) {
    try {
      const response = await fetch(`/src/templates/${templateId}/config.json`)
      if (!response.ok) {
        throw new Error(`加载模板配置失败: ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      console.error('加载模板配置失败:', error)
      throw error
    }
  }

  /**
   * 加载指定模板的占位符映射文件
   * @param {string} templateId - 模板ID
   * @returns {Promise<Object>} 占位符映射对象
   */
  static async loadPlaceholderMapping(templateId) {
    try {
      const response = await fetch(`/src/templates/${templateId}/placeholders.json`)
      if (!response.ok) {
        throw new Error(`加载占位符映射失败: ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      console.error('加载占位符映射失败:', error)
      throw error
    }
  }

  /**
   * 加载指定模板的Word文件
   * @param {string} templateId - 模板ID
   * @returns {Promise<File>} Word文件对象
   */
  static async loadTemplateFile(templateId) {
    try {
      const response = await fetch(`/src/templates/${templateId}/template.docx`)
      if (!response.ok) {
        throw new Error(`加载模板文件失败: ${response.statusText}`)
      }
      
      const blob = await response.blob()
      // 将Blob转换为File对象
      const file = new File([blob], `${templateId}.docx`, {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      })
      
      return file
    } catch (error) {
      console.error('加载模板文件失败:', error)
      throw error
    }
  }

  /**
   * 解析Word文件中的占位符
   * @param {string} content - Word文档的HTML内容
   * @returns {Array} 占位符列表
   */
  static extractPlaceholders(content) {
    if (!content) return []

    // 匹配 {xxx} 格式的占位符
    const regex = /\{([^}]+)\}/g
    const matches = content.matchAll(regex)
    const placeholderNames = new Set()

    for (const match of matches) {
      placeholderNames.add(match[1])
    }

    return Array.from(placeholderNames).map((name, index) => ({
      id: `placeholder_${Date.now()}_${index}`,
      name: name,
      description: `占位符: ${name}`,
      position: {
        startOffset: 0,
        endOffset: 0
      },
      createdAt: new Date()
    }))
  }

  /**
   * 加载完整的模板（配置+映射+文件）
   * @param {string} templateId - 模板ID
   * @returns {Promise<Object>} 包含所有模板数据的对象
   */
  static async loadCompleteTemplate(templateId) {
    try {
      const [config, placeholderMapping, file] = await Promise.all([
        this.loadTemplateConfig(templateId),
        this.loadPlaceholderMapping(templateId),
        this.loadTemplateFile(templateId)
      ])

      return {
        id: templateId,
        config,
        placeholderMapping,
        file
      }
    } catch (error) {
      console.error('加载完整模板失败:', error)
      throw error
    }
  }
}
