<template>
  <div class="placeholder-toolbar">
    <button 
      @click="$emit('ai-generate')"
      class="btn-ai"
    >
      <svg viewBox="0 0 24 24" width="20" height="20">
        <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
      </svg>
      AI 生成
    </button>

    <button 
      @click="$emit('add-placeholder')"
      :disabled="!canAddPlaceholder"
      class="btn-add"
    >
      <svg viewBox="0 0 24 24" width="20" height="20">
        <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
      </svg>
      手动添加
    </button>

    <div class="toolbar-divider"></div>

    <button 
      @click="$emit('undo')"
      :disabled="!canUndo"
      class="btn-icon"
      title="撤销"
    >
      <svg viewBox="0 0 24 24" width="20" height="20">
        <path fill="currentColor" d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/>
      </svg>
    </button>

    <button 
      @click="$emit('redo')"
      :disabled="!canRedo"
      class="btn-icon"
      title="重做"
    >
      <svg viewBox="0 0 24 24" width="20" height="20">
        <path fill="currentColor" d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z"/>
      </svg>
    </button>

    <div class="toolbar-divider"></div>

    <button 
      @click="$emit('download')"
      class="btn-save"
    >
      <svg viewBox="0 0 24 24" width="18" height="18" style="margin-right: 0.3rem;">
        <path fill="currentColor" d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z"/>
      </svg>
      下载文件
    </button>
  </div>
</template>

<script>
export default {
  name: 'PlaceholderToolbar',
  props: {
    canAddPlaceholder: {
      type: Boolean,
      default: false
    },
    canUndo: {
      type: Boolean,
      default: false
    },
    canRedo: {
      type: Boolean,
      default: false
    }
  },
  emits: ['ai-generate', 'add-placeholder', 'undo', 'redo', 'download']
}
</script>

<style scoped>
.placeholder-toolbar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 1rem;
}

.btn-ai {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
  font-size: 0.95rem;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.btn-ai:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-add {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #42b983;
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
  font-size: 0.95rem;
  transition: background 0.3s;
}

.btn-add:hover:not(:disabled) {
  background: #359268;
}

.btn-add:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-icon {
  background: white;
  border: 1px solid #ddd;
  padding: 0.6rem;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-icon:hover:not(:disabled) {
  background: #f5f5f5;
  border-color: #42b983;
}

.btn-icon:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-save {
  background: #2c3e50;
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
  transition: background 0.3s;
  margin-left: auto;
  display: flex;
  align-items: center;
}

.btn-save:hover {
  background: #1a252f;
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: #ddd;
  margin: 0 0.5rem;
}
</style>
