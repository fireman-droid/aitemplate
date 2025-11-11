<template>
  <div class="settings">
    <h1>设置</h1>
    
    <div class="settings-section">
      <h2>应用设置</h2>
      <div class="setting-item">
        <label>最大文件大小 (MB)</label>
        <input 
          v-model.number="settings.maxFileSize" 
          type="number" 
          min="1" 
          max="100"
        />
      </div>
      
      <div class="setting-item">
        <label>自动保存</label>
        <input 
          v-model="settings.autoSave" 
          type="checkbox"
        />
      </div>
    </div>

    <div class="settings-section">
      <h2>数据管理</h2>
      <button @click="exportAllProjects" class="btn-secondary">
        导出所有项目
      </button>
      <button @click="clearAllData" class="btn-danger">
        清除所有数据
      </button>
    </div>

    <div class="settings-section">
      <h2>关于</h2>
      <p>模板占位符编辑器 v0.0.1</p>
      <p>一个用于管理模板占位符的工具</p>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { StorageService } from '@/services/storageService'

export default {
  name: 'Settings',
  setup() {
    const settings = ref({
      maxFileSize: 10,
      autoSave: true
    })

    const loadSettings = () => {
      const saved = localStorage.getItem('app_settings')
      if (saved) {
        settings.value = JSON.parse(saved)
      }
    }

    const saveSettings = () => {
      localStorage.setItem('app_settings', JSON.stringify(settings.value))
    }

    const exportAllProjects = () => {
      const projects = StorageService.getAllProjects()
      const dataStr = JSON.stringify(projects, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `projects_${Date.now()}.json`
      link.click()
      URL.revokeObjectURL(url)
    }

    const clearAllData = () => {
      if (confirm('确定要清除所有数据吗？此操作不可恢复！')) {
        localStorage.clear()
        alert('所有数据已清除')
        location.reload()
      }
    }

    onMounted(() => {
      loadSettings()
    })

    // 监听设置变化并保存
    const unwatchSettings = () => {
      return () => saveSettings()
    }

    return {
      settings,
      exportAllProjects,
      clearAllData
    }
  }
}
</script>

<style scoped>
.settings {
  max-width: 800px;
  margin: 0 auto;
}

.settings h1 {
  margin-bottom: 2rem;
  color: #2c3e50;
}

.settings-section {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.settings-section h2 {
  margin-bottom: 1.5rem;
  color: #2c3e50;
  font-size: 1.3rem;
}

.setting-item {
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.setting-item label {
  font-weight: 500;
  color: #555;
}

.setting-item input[type="number"] {
  width: 100px;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.setting-item input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.btn-secondary {
  background: #42b983;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 6px;
  margin-right: 1rem;
  transition: background 0.3s;
}

.btn-secondary:hover {
  background: #359268;
}

.btn-danger {
  background: #ff4444;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 6px;
  transition: background 0.3s;
}

.btn-danger:hover {
  background: #cc0000;
}

.settings-section p {
  color: #666;
  line-height: 1.6;
}
</style>
