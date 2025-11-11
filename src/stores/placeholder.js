import { defineStore } from 'pinia'

export const usePlaceholderStore = defineStore('placeholder', {
  state: () => ({
    placeholders: [],
    activePlaceholderId: null,
    history: [],
    historyIndex: -1
  }),

  getters: {
    activePlaceholder: (state) => {
      return state.placeholders.find(p => p.id === state.activePlaceholderId)
    },
    
    canUndo: (state) => {
      return state.historyIndex > 0
    },
    
    canRedo: (state) => {
      return state.historyIndex < state.history.length - 1
    }
  },

  actions: {
    addPlaceholder(placeholderData) {
      const placeholder = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: placeholderData.name,
        description: placeholderData.description || '',
        position: placeholderData.position,
        aiPrompt: placeholderData.aiPrompt || '',
        aiContext: placeholderData.aiContext || '',
        value: '',
        createdAt: new Date()
      }
      
      this.placeholders.push(placeholder)
      this.saveToHistory()
      return placeholder
    },

    updatePlaceholder(id, updates) {
      const index = this.placeholders.findIndex(p => p.id === id)
      if (index !== -1) {
        this.placeholders[index] = {
          ...this.placeholders[index],
          ...updates
        }
        this.saveToHistory()
      }
    },

    deletePlaceholder(id) {
      const index = this.placeholders.findIndex(p => p.id === id)
      if (index !== -1) {
        this.placeholders.splice(index, 1)
        if (this.activePlaceholderId === id) {
          this.activePlaceholderId = null
        }
        this.saveToHistory()
      }
    },

    setActivePlaceholder(id) {
      this.activePlaceholderId = id
    },

    saveToHistory() {
      // 删除当前位置之后的历史记录
      this.history = this.history.slice(0, this.historyIndex + 1)
      
      // 添加新的历史记录
      this.history.push(JSON.parse(JSON.stringify(this.placeholders)))
      this.historyIndex++
      
      // 限制历史记录数量
      if (this.history.length > 50) {
        this.history.shift()
        this.historyIndex--
      }
    },

    undo() {
      if (this.canUndo) {
        this.historyIndex--
        this.placeholders = JSON.parse(JSON.stringify(this.history[this.historyIndex]))
      }
    },

    redo() {
      if (this.canRedo) {
        this.historyIndex++
        this.placeholders = JSON.parse(JSON.stringify(this.history[this.historyIndex]))
      }
    },

    clearPlaceholders() {
      this.placeholders = []
      this.activePlaceholderId = null
      this.history = []
      this.historyIndex = -1
    }
  }
})
