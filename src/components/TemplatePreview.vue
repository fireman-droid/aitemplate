<template>
  <el-card class="template-preview" shadow="hover">
    <template #header>
      <div class="preview-toolbar">
        <span>文档预览</span>
        <div class="zoom-controls">
          <el-button-group>
            <el-button :icon="ZoomOut" @click="zoomOut" :disabled="scale <= 0.5" size="small" />
            <el-button size="small" disabled>{{ Math.round(scale * 100) }}%</el-button>
            <el-button :icon="ZoomIn" @click="zoomIn" :disabled="scale >= 2" size="small" />
          </el-button-group>
        </div>
      </div>
    </template>

    <div class="preview-container" :style="{ transform: `scale(${scale})` }">
      <!-- 暂无内容 -->
      <el-empty v-if="!content" description="暂无内容" />
      
      <!-- 文本预览 -->
      <div 
        v-else-if="contentType === 'text'" 
        class="text-preview"
      >
        <div v-html="highlightedContent"></div>
      </div>

      <!-- Word文档预览 -->
      <div 
        v-else-if="contentType === 'document'" 
        class="document-preview"
      >
        <div v-html="highlightedContent"></div>
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

    </div>
  </el-card>
</template>

<script>
import { ref, computed } from 'vue'
import { ZoomIn, ZoomOut } from '@element-plus/icons-vue'

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
  emits: [],
  setup(props) {
    const scale = ref(1)

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
      console.log('=== TemplatePreview 渲染 ===')
      console.log('content 长度:', props.content?.length)
      console.log('contentType:', props.contentType)
      
      if (!props.content || (props.contentType !== 'text' && props.contentType !== 'document')) {
        console.log('没有内容或类型不匹配')
        return ''
      }
      
      // 检查内容中是否还有占位符（{xxx} 格式）
      const hasPlaceholders = /\{[^}]+\}/.test(props.content)
      console.log('是否包含占位符:', hasPlaceholders)
      
      // 如果没有占位符了，说明已经填充完成，直接返回内容
      if (!hasPlaceholders) {
        console.log('✓ 内容已填充，直接显示')
        console.log('内容预览:', props.content.substring(0, 200))
        return props.content
      }
      
      console.log('内容中还有占位符，使用高亮模式')
      
      // 如果没有占位符定义，直接返回原内容
      if (props.placeholders.length === 0) {
        return props.content
      }

      // 过滤掉 position 为 0 的占位符（这些是自动提取的，不需要高亮）
      const validPlaceholders = props.placeholders.filter(p => 
        p.position.startOffset !== 0 || p.position.endOffset !== 0
      )

      // 如果没有有效的占位符位置，直接返回原内容
      if (validPlaceholders.length === 0) {
        return props.content
      }

      console.log('=== 渲染占位符 ===')
      console.log('有效占位符数量:', validPlaceholders.length)
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
      const sortedPlaceholders = [...validPlaceholders].sort(
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
      getPlaceholderStyle,
      ZoomIn,
      ZoomOut
    }
  }
}
</script>

<style scoped>
.template-preview {
  height: 100%;
}

.preview-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  font-size: 16px;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 8px;
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
