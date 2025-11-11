<template>
  <div class="home">
    <div class="hero">
      <h1>欢迎使用模板占位符编辑器</h1>
      <p>上传模板，添加占位符，为AI填充做准备</p>
      <div class="button-group">
        <button @click="goToEditor" class="btn-primary">创建模板</button>
        <button @click="goToFiller" class="btn-secondary">智能填充</button>
      </div>
    </div>

    <div class="projects-section" v-if="projects.length > 0">
      <h2>最近的项目</h2>
      <div class="projects-grid">
        <div 
          v-for="project in projects" 
          :key="project.id" 
          class="project-card"
          @click="openProject(project.id)"
        >
          <h3>{{ project.name }}</h3>
          <p class="project-meta">
            {{ formatDate(project.updatedAt) }}
          </p>
          <p class="project-info">
            {{ project.placeholders?.length || 0 }} 个占位符
          </p>
          <button 
            @click.stop="deleteProject(project.id)" 
            class="btn-delete"
          >
            删除
          </button>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <p>还没有项目，开始创建第一个吧！</p>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { StorageService } from '@/services/storageService'

export default {
  name: 'Home',
  setup() {
    const router = useRouter()
    const projects = ref([])

    const loadProjects = () => {
      projects.value = StorageService.getAllProjects()
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    }

    const goToEditor = () => {
      router.push('/editor')
    }

    const goToFiller = () => {
      router.push('/filler')
    }

    const openProject = (projectId) => {
      router.push(`/editor/${projectId}`)
    }

    const deleteProject = (projectId) => {
      if (confirm('确定要删除这个项目吗？')) {
        StorageService.deleteProject(projectId)
        loadProjects()
      }
    }

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }

    onMounted(() => {
      loadProjects()
    })

    return {
      projects,
      goToEditor,
      goToFiller,
      openProject,
      deleteProject,
      formatDate
    }
  }
}
</script>

<style scoped>
.home {
  max-width: 1000px;
  margin: 0 auto;
}

.hero {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 8px;
  margin-bottom: 3rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.hero h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: #2c3e50;
}

.hero p {
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 2rem;
}

.button-group {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.btn-primary, .btn-secondary {
  padding: 1rem 2rem;
  font-size: 1.1rem;
  border-radius: 6px;
  transition: all 0.3s;
  cursor: pointer;
}

.btn-primary {
  background: #42b983;
  color: white;
  border: none;
}

.btn-primary:hover {
  background: #359268;
}

.btn-secondary {
  background: white;
  color: #42b983;
  border: 2px solid #42b983;
}

.btn-secondary:hover {
  background: #42b983;
  color: white;
}

.projects-section h2 {
  margin-bottom: 1.5rem;
  color: #2c3e50;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.project-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;
}

.project-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.project-card h3 {
  margin-bottom: 0.5rem;
  color: #2c3e50;
}

.project-meta {
  color: #999;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.project-info {
  color: #666;
  font-size: 0.95rem;
}

.btn-delete {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: #ff4444;
  color: white;
  border: none;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  font-size: 0.85rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.project-card:hover .btn-delete {
  opacity: 1;
}

.btn-delete:hover {
  background: #cc0000;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #999;
  font-size: 1.1rem;
}
</style>
