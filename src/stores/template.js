import { defineStore } from 'pinia'
import { DocumentService } from '@/services/documentService'

export const useTemplateStore = defineStore('template', {
  state: () => ({
    currentTemplate: null,
    isLoading: false,
    error: null
  }),

  actions: {
    async uploadTemplate(file) {
      console.log('[Store] 开始上传模板')
      this.isLoading = true
      this.error = null
      
      try {
        const contentType = this.detectContentType(file)
        console.log('[Store] 检测到内容类型:', contentType)
        
        const content = await this.readFile(file, contentType)
        console.log('[Store] 文件读取完成，内容长度:', content?.length || 0)
        
        // 保存原始文件的ArrayBuffer用于后续处理
        const arrayBuffer = await file.arrayBuffer()
        console.log('[Store] ArrayBuffer 大小:', arrayBuffer.byteLength)
        
        this.currentTemplate = {
          id: Date.now().toString(),
          name: file.name,
          file: file,
          originalArrayBuffer: arrayBuffer, // 保存原始文件数据
          content: content,
          contentType: contentType,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        
        console.log('[Store] 模板设置完成:', this.currentTemplate.name)
      } catch (error) {
        console.error('[Store] 上传失败:', error)
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async readFile(file, contentType) {
      // 处理Word文档
      if (contentType === 'document') {
        const result = await DocumentService.parseWordDocument(file)
        return result.html
      }

      // 处理PDF（暂时作为图片处理）
      if (contentType === 'pdf') {
        return new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = (e) => resolve(e.target.result)
          reader.onerror = () => reject(new Error('PDF读取失败'))
          reader.readAsDataURL(file)
        })
      }

      // 处理其他文件
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        
        reader.onload = (e) => {
          resolve(e.target.result)
        }
        
        reader.onerror = () => {
          reject(new Error('文件读取失败'))
        }
        
        if (contentType === 'text') {
          reader.readAsText(file)
        } else {
          reader.readAsDataURL(file)
        }
      })
    },

    detectContentType(file) {
      if (file.type.startsWith('image/')) {
        return 'image'
      }
      if (DocumentService.isWordDocument(file)) {
        return 'document'
      }
      if (DocumentService.isPDF(file)) {
        return 'pdf'
      }
      return 'text'
    },

    clearTemplate() {
      this.currentTemplate = null
      this.error = null
    },

    updateTemplate(updates) {
      if (this.currentTemplate) {
        this.currentTemplate = {
          ...this.currentTemplate,
          ...updates,
          updatedAt: new Date()
        }
      }
    }
  }
})
