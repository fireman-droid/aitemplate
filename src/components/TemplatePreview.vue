<template>
  <div class="template-preview">
    <div class="preview-toolbar">
      <button @click="zoomOut" :disabled="scale <= 0.5">-</button>
      <span>{{ Math.round(scale * 100) }}%</span>
      <button @click="zoomIn" :disabled="scale >= 2">+</button>
    </div>

    <div class="preview-container" :style="{ transform: `scale(${scale})` }">
      <!-- 文本预览 -->
      <div 
        v-if="contentType === 'text'" 
        class="text-preview"
        @mouseup="handleTextSelection"
      >
        <div v-html="highlightedContent"></div>
      </div>

      <!-- Word文档预览 -->
      <div 
        v-else-if="contentType === 'document'" 
        class="document-preview"
        @mouseup="handleTextSelection"
      >
        <div v-html="highlightedContent"></div>
      </div>

      <!-- 浮动添加按钮 -->
      <div 
        v-if="showAddButton" 
        class="floating-add-button"
        :style="{ top: buttonPosition.y + 'px', left: buttonPosition.x + 'px' }"
        @click="handleAddPlaceholder"
      >
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
        添加占位符
      </div>

      <!-- 图片预览 -->
      <div v-else-if="contentType === 'image'" class="image-preview">
        <img :src="content" alt="Template" />
        <div 
          v-for="placeholder in placeholders"
          :key="placeholder.id"
          class="placeholder-marker"
          :class="{ active: placeholder.id === activePlaceholderId }"
          :style="getPlaceholderStyle(placeholder)"
          @click="$emit('placeholder-click', placeholder.id)"
        >
          {{ placeholder.name }}
        </div>
      </div>

      <!-- PDF预览 -->
      <div v-else-if="contentType === 'pdf'" class="pdf-preview">
        <embed :src="content" type="application/pdf" width="100%" height="800px" />
      </div>

      <div v-else class="empty-preview">
        <p>暂无内容</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'TemplatePreview',
  props: {
    content: {
      type: String,
      default: ''
    },
    contentType: {
      type: String,
      default: 'text'
    },
    placeholders: {
      type: Array,
      default: () => []
    },
    activePlaceholderId: {
      type: String,
      default: null
    }
  },
  emits: ['text-select', 'placeholder-click', 'add-placeholder'],
  setup(props, { emit }) {
    const scale = ref(1)
    const showAddButton = ref(false)
    const buttonPosition = ref({ x: 0, y: 0 })
    const currentSelection = ref(null)

    const zoomIn = () => {
      if (scale.value < 2) {
        scale.value += 0.1
      }
    }

    const zoomOut = () => {
      if (scale.value > 0.5) {
        scale.value -= 0.1
      }
    }

    const highlightedContent = computed(() => {
      if (!props.content || (props.contentType !== 'text' && props.contentType !== 'document')) return ''
      
      if (props.placeholders.length === 0) {
        return props.content
      }

      console.log('=== 渲染占位符 ===')
      console.log('占位符数量:', props.placeholders.length)
      console.log('文档类型:', props.contentType)

      // 对于HTML内容，需要在纯文本层面计算位置
      let workingContent = props.content
      let plainText = props.content
      
      if (props.contentType === 'document') {
        // 提取纯文本用于位置计算
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = props.content
        plainText = tempDiv.textContent || tempDiv.innerText || ''
        console.log('纯文本长度:', plainText.length)
      }
      
      // 按位置倒序排列，从后往前插入，避免位置偏移
      const sortedPlaceholders = [...props.placeholders].sort(
        (a, b) => b.position.startOffset - a.position.startOffset
      )

      // 对于纯文本，直接替换
      if (props.contentType === 'text') {
        for (const placeholder of sortedPlaceholders) {
          console.log(`处理占位符: ${placeholder.name}, 位置: ${placeholder.position.startOffset}-${placeholder.position.endOffset}`)
          
          const before = workingContent.substring(0, placeholder.position.startOffset)
          const after = workingContent.substring(placeholder.position.endOffset)
          
          const isActive = placeholder.id === props.activePlaceholderId
          const className = isActive ? 'placeholder-highlight active' : 'placeholder-highlight'
          
          // 显示为 {name} 格式
          workingContent = `${before}<span class="${className}" data-id="${placeholder.id}">{${placeholder.name}}</span>${after}`
        }
      } else {
        // 对于HTML内容，需要在保持HTML结构的同时插入标记
        // 这里简化处理：在纯文本位置插入标记
        for (const placeholder of sortedPlaceholders) {
          const targetText = plainText.substring(
            placeholder.position.startOffset,
            placeholder.position.endOffset
          )
          
          console.log(`处理占位符: ${placeholder.name}`)
          console.log(`  位置: ${placeholder.position.startOffset}-${placeholder.position.endOffset}`)
          console.log(`  目标文本: "${targetText}"`)
          
          const isActive = placeholder.id === props.activePlaceholderId
          const className = isActive ? 'placeholder-highlight active' : 'placeholder-highlight'
          
          // 在HTML中查找并替换第一个匹配的文本
          const escapedText = targetText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          const regex = new RegExp(`(>[^<]*)(${escapedText})([^<]*<)`, 'i')
          
          const matched = workingContent.match(regex)
          console.log(`  是否匹配: ${matched ? '是' : '否'}`)
          
          // 显示为 {name} 格式
          workingContent = workingContent.replace(regex, (match, before, text, after) => {
            console.log(`  替换成功: {${placeholder.name}}`)
            return `${before}<span class="${className}" data-id="${placeholder.id}">{${placeholder.name}}</span>${after}`
          })
        }
      }
      
      console.log('==================')

      return workingContent
    })

    const handleTextSelection = (event) => {
      const selection = window.getSelection()
      const selectedText = selection.toString().trim()
      
      if (selectedText && selectedText.length > 0) {
        const range = selection.getRangeAt(0)
        
        // 获取预览容器的DOM元素
        const previewElement = event.currentTarget
        
        // 计算选中文本在整个内容中的准确位置
        let startOffset = 0
        let endOffset = 0
        
        if (props.contentType === 'text') {
          // 纯文本模式：直接使用内容
          startOffset = props.content.indexOf(selectedText)
          endOffset = startOffset + selectedText.length
        } else if (props.contentType === 'document') {
          // HTML文档模式：需要基于原始内容计算位置
          // 提取原始内容的纯文本
          const tempDiv = document.createElement('div')
          tempDiv.innerHTML = props.content
          const originalPlainText = tempDiv.textContent || tempDiv.innerText || ''
          
          // 获取当前显示位置（包含已有占位符）
          const preRange = document.createRange()
          preRange.selectNodeContents(previewElement)
          preRange.setEnd(range.startContainer, range.startOffset)
          const displayTextBefore = preRange.toString()
          
          // 计算已有占位符造成的偏移
          let offset = 0
          const sortedPlaceholders = [...props.placeholders].sort((a, b) => a.position.startOffset - b.position.startOffset)
          
          for (const ph of sortedPlaceholders) {
            if (ph.position.startOffset < displayTextBefore.length - offset) {
              // 这个占位符在选中位置之前
              const originalLength = ph.position.endOffset - ph.position.startOffset
              const displayLength = `{${ph.name}}`.length
              offset += (displayLength - originalLength)
            }
          }
          
          // 在原始文本中的实际位置
          startOffset = displayTextBefore.length - offset
          endOffset = startOffset + selectedText.length
          
          // 验证位置是否正确
          const actualText = originalPlainText.substring(startOffset, endOffset)
          if (actualText !== selectedText) {
            console.warn('位置计算可能不准确，尝试直接查找')
            // 降级方案：直接在原始文本中查找
            const foundIndex = originalPlainText.indexOf(selectedText, Math.max(0, startOffset - 50))
            if (foundIndex !== -1) {
              startOffset = foundIndex
              endOffset = startOffset + selectedText.length
            }
          }
        }
        
        if (startOffset !== -1) {
          currentSelection.value = {
            text: selectedText,
            startOffset: startOffset,
            endOffset: endOffset
          }
          
          // 调试信息
          console.log('=== 文本选择信息 ===')
          console.log('选中的文本:', selectedText)
          console.log('开始位置:', startOffset)
          console.log('结束位置:', endOffset)
          console.log('文档类型:', props.contentType)
          console.log('文档内容长度:', props.content.length)
          console.log('==================')
          
          // 获取选中区域的位置，显示浮动按钮
          const rect = range.getBoundingClientRect()
          const containerRect = event.currentTarget.getBoundingClientRect()
          
          buttonPosition.value = {
            x: rect.left - containerRect.left + rect.width / 2 - 60,
            y: rect.bottom - containerRect.top + 10
          }
          
          showAddButton.value = true
          
          emit('text-select', currentSelection.value)
        }
      } else {
        // 没有选中文本，隐藏按钮
        showAddButton.value = false
        currentSelection.value = null
      }
    }

    const handleAddPlaceholder = () => {
      if (currentSelection.value) {
        emit('add-placeholder', currentSelection.value)
        showAddButton.value = false
        // 清除选中状态
        window.getSelection().removeAllRanges()
      }
    }

    const getPlaceholderStyle = (placeholder) => {
      const pos = placeholder.position
      return {
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        width: pos.width ? `${pos.width}px` : 'auto',
        height: pos.height ? `${pos.height}px` : 'auto'
      }
    }

    return {
      scale,
      zoomIn,
      zoomOut,
      highlightedContent,
      handleTextSelection,
      getPlaceholderStyle,
      showAddButton,
      buttonPosition,
      handleAddPlaceholder
    }
  }
}
</script>

<style scoped>
.template-preview {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.preview-toolbar {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 0.5rem;
  background: #f5f5f5;
  border-radius: 4px;
}

.preview-toolbar button {
  background: white;
  border: 1px solid #ddd;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.preview-toolbar button:hover:not(:disabled) {
  background: #e0e0e0;
}

.preview-toolbar button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.preview-container {
  transform-origin: top left;
  transition: transform 0.2s;
  min-height: 400px;
  position: relative;
}

.text-preview {
  padding: 2rem;
  background: #fafafa;
  border-radius: 4px;
  line-height: 1.8;
  white-space: pre-wrap;
  word-wrap: break-word;
  user-select: text;
}

.document-preview {
  padding: 2rem;
  background: white;
  border-radius: 4px;
  line-height: 1.6;
  user-select: text;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
}

.document-preview :deep(p) {
  margin-bottom: 1em;
}

.document-preview :deep(h1),
.document-preview :deep(h2),
.document-preview :deep(h3) {
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  color: #2c3e50;
}

.document-preview :deep(ul),
.document-preview :deep(ol) {
  margin-left: 2em;
  margin-bottom: 1em;
}

.pdf-preview {
  background: #525659;
  border-radius: 4px;
  padding: 1rem;
}

.image-preview {
  position: relative;
  display: inline-block;
}

.image-preview img {
  max-width: 100%;
  height: auto;
  display: block;
}

.placeholder-marker {
  position: absolute;
  background: rgba(66, 185, 131, 0.3);
  border: 2px solid #42b983;
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.placeholder-marker:hover,
.placeholder-marker.active {
  background: rgba(66, 185, 131, 0.5);
  transform: scale(1.05);
}

.empty-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: #999;
  font-size: 1.1rem;
}

:deep(.placeholder-highlight) {
  background: rgba(66, 185, 131, 0.2);
  border-bottom: 2px solid #42b983;
  cursor: pointer;
  transition: background 0.2s;
}

:deep(.placeholder-highlight:hover),
:deep(.placeholder-highlight.active) {
  background: rgba(66, 185, 131, 0.4);
}

.floating-add-button {
  position: absolute;
  background: #42b983;
  color: white;
  border: none;
  padding: 0.6rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  box-shadow: 0 4px 12px rgba(66, 185, 131, 0.4);
  z-index: 100;
  animation: fadeIn 0.2s ease;
  white-space: nowrap;
  transition: all 0.2s;
}

.floating-add-button:hover {
  background: #359268;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(66, 185, 131, 0.5);
}

.floating-add-button svg {
  flex-shrink: 0;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
