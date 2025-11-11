<template>
  <div class="placeholder-list">
    <div class="list-header">
      <h3>占位符列表</h3>
      <span class="count">{{ placeholders.length }}</span>
    </div>

    <div v-if="placeholders.length === 0" class="empty-list">
      <p>还没有添加占位符</p>
    </div>

    <div v-else class="list-items">
      <div 
        v-for="placeholder in placeholders"
        :key="placeholder.id"
        class="list-item"
        :class="{ active: placeholder.id === activePlaceholderId }"
        @click="$emit('select', placeholder.id)"
      >
        <div class="item-content">
          <h4>{{ placeholder.name }}</h4>
          <p v-if="placeholder.description">{{ placeholder.description }}</p>
          <span class="item-meta">
            {{ formatDate(placeholder.createdAt) }}
          </span>
        </div>

        <div class="item-actions">
          <button 
            @click.stop="$emit('edit', placeholder.id)"
            class="btn-icon"
            title="编辑"
          >
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
          </button>
          <button 
            @click.stop="$emit('delete', placeholder.id)"
            class="btn-icon btn-delete"
            title="删除"
          >
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PlaceholderList',
  props: {
    placeholders: {
      type: Array,
      default: () => []
    },
    activePlaceholderId: {
      type: String,
      default: null
    }
  },
  emits: ['select', 'edit', 'delete'],
  setup() {
    const formatDate = (date) => {
      return new Date(date).toLocaleString('zh-CN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    return {
      formatDate
    }
  }
}
</script>

<style scoped>
.placeholder-list {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: #f5f5f5;
  border-bottom: 1px solid #eee;
}

.list-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.count {
  background: #42b983;
  color: white;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

.empty-list {
  padding: 3rem 1.5rem;
  text-align: center;
  color: #999;
}

.list-items {
  max-height: 500px;
  overflow-y: auto;
}

.list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background 0.2s;
}

.list-item:hover {
  background: #f9f9f9;
}

.list-item.active {
  background: #e8f5e9;
  border-left: 4px solid #42b983;
}

.item-content {
  flex: 1;
}

.item-content h4 {
  margin: 0 0 0.3rem 0;
  color: #2c3e50;
  font-size: 1rem;
}

.item-content p {
  margin: 0 0 0.3rem 0;
  color: #666;
  font-size: 0.9rem;
}

.item-meta {
  font-size: 0.8rem;
  color: #999;
}

.item-actions {
  display: flex;
  gap: 0.5rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.list-item:hover .item-actions {
  opacity: 1;
}

.btn-icon {
  background: white;
  border: 1px solid #ddd;
  padding: 0.4rem;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: #f5f5f5;
  border-color: #42b983;
}

.btn-delete:hover {
  border-color: #ff4444;
  color: #ff4444;
}

.btn-delete:hover svg path {
  fill: #ff4444;
}
</style>
