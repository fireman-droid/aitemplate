export class StorageService {
  static STORAGE_KEY = 'template_projects'

  static saveProject(project) {
    try {
      const projects = this.getAllProjects()
      const existingIndex = projects.findIndex(p => p.id === project.id)
      
      if (existingIndex !== -1) {
        projects[existingIndex] = project
      } else {
        projects.push(project)
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(projects))
      return true
    } catch (error) {
      console.error('保存项目失败:', error)
      return false
    }
  }

  static loadProject(projectId) {
    try {
      const projects = this.getAllProjects()
      return projects.find(p => p.id === projectId) || null
    } catch (error) {
      console.error('加载项目失败:', error)
      return null
    }
  }

  static getAllProjects() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('获取项目列表失败:', error)
      return []
    }
  }

  static deleteProject(projectId) {
    try {
      const projects = this.getAllProjects()
      const filtered = projects.filter(p => p.id !== projectId)
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered))
      return true
    } catch (error) {
      console.error('删除项目失败:', error)
      return false
    }
  }

  static exportProject(projectId) {
    const project = this.loadProject(projectId)
    if (!project) return null
    
    return JSON.stringify(project, null, 2)
  }

  static importProject(jsonData) {
    try {
      const project = JSON.parse(jsonData)
      project.id = Date.now().toString()
      project.updatedAt = new Date()
      
      this.saveProject(project)
      return project
    } catch (error) {
      console.error('导入项目失败:', error)
      return null
    }
  }
}
