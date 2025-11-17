<template>
  <div class="placeholder-toolbar">
    <el-button 
      type="primary"
      @click="$emit('ai-generate')"
      class="btn-ai"
    >
      <el-icon><MagicStick /></el-icon>
      <span>AI 生成</span>
    </el-button>



    <el-button 
      type="info"
      @click="$emit('download')"
      class="btn-download"
    >
      <el-icon><Download /></el-icon>
      <span>下载文件</span>
    </el-button>
  </div>
</template>

<script>
export default {
  name: 'PlaceholderToolbar',
  emits: ['ai-generate', 'download']
}
</script>

<style scoped>
.placeholder-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  margin-bottom: 16px;
}

.btn-ai {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.btn-ai:hover {
  background: linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%);
}

.btn-download {
  margin-left: auto;
}
</style>
