export class FileService {
  static validateFile(file, options = {}) {
    const {
      maxSize = 10, // MB
      acceptedTypes = [
        'text/plain', 
        'text/html', 
        'image/png', 
        'image/jpeg', 
        'image/jpg',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/pdf'
      ]
    } = options

    // 检查文件大小
    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > maxSize) {
      return {
        valid: false,
        error: `文件大小超过限制（最大 ${maxSize}MB）`
      }
    }

    // 检查文件类型
    const isTypeAccepted = acceptedTypes.some(type => {
      // 处理通配符类型 (如 image/*)
      if (type.endsWith('/*')) {
        const prefix = type.split('/')[0]
        return file.type.startsWith(prefix + '/')
      }
      // 处理文件扩展名 (如 .doc, .docx)
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type.toLowerCase())
      }
      // 处理 MIME 类型
      return file.type === type
    })

    if (!isTypeAccepted) {
      console.log('[FileService] 文件类型不匹配')
      console.log('文件类型:', file.type)
      console.log('文件名:', file.name)
      console.log('允许的类型:', acceptedTypes)
      return {
        valid: false,
        error: '不支持的文件类型'
      }
    }

    return { valid: true }
  }

  static async readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => resolve(e.target.result)
      reader.onerror = () => reject(new Error('文件读取失败'))
      
      if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file)
      } else {
        reader.readAsText(file)
      }
    })
  }

  static detectContentType(file) {
    if (file.type.startsWith('image/')) {
      return 'image'
    }
    if (file.type.includes('word') || file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
      return 'document'
    }
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      return 'pdf'
    }
    return 'text'
  }
}
