import mammoth from 'mammoth'

export class DocumentService {
  // 解析Word文档为HTML
  static async parseWordDocument(file) {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.convertToHtml({ arrayBuffer })
      return {
        html: result.value,
        messages: result.messages
      }
    } catch (error) {
      console.error('Word文档解析失败:', error)
      throw new Error('无法解析Word文档')
    }
  }

  // 解析Word文档为纯文本
  static async parseWordToText(file) {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.extractRawText({ arrayBuffer })
      return result.value
    } catch (error) {
      console.error('Word文档解析失败:', error)
      throw new Error('无法解析Word文档')
    }
  }

  // 检测是否为Word文档
  static isWordDocument(file) {
    return file.type.includes('word') || 
           file.name.endsWith('.doc') || 
           file.name.endsWith('.docx')
  }

  // 检测是否为PDF
  static isPDF(file) {
    return file.type === 'application/pdf' || file.name.endsWith('.pdf')
  }
}
