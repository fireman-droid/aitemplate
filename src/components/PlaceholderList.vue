<template>
  <el-card class="placeholder-list" shadow="hover">
    <template #header>
      <div class="list-header">
        <span>占位符列表</span>
        <el-tag type="success" round>{{ placeholders.length }}</el-tag>
      </div>
    </template>

    <el-empty 
      v-if="placeholders.length === 0" 
      description="还没有添加占位符"
      :image-size="100"
    />

    <el-scrollbar v-else max-height="500px">
      <div class="list-items">
        <el-card 
          v-for="placeholder in placeholders"
          :key="placeholder.id"
          class="list-item"
          :class="{ active: placeholder.id === activePlaceholderId }"
          @click="$emit('select', placeholder.id)"
          shadow="hover"
        >
          <div class="item-content">
            <div class="item-title">
              <el-icon color="#409eff"><PriceTag /></el-icon>
              <h4>{{ placeholder.name }}</h4>
            </div>
            <p v-if="placeholder.description" class="item-desc">
              {{ placeholder.description }}
            </p>
            <div class="item-meta">
              <el-icon><Clock /></el-icon>
              <span>{{ formatDate(placeholder.createdAt) }}</span>
            </div>
          </div>

          <div class="item-actions">
            <el-button 
              @click.stop="$emit('edit', placeholder.id)"
              :icon="Edit"
              circle
              size="small"
            />
            <el-button 
              @click.stop="$emit('delete', placeholder.id)"
              :icon="Delete"
              type="danger"
              circle
              size="small"
            />
          </div>
        </el-card>
      </div>
    </el-scrollbar>
  </el-card>
</template>

<script>
import { Edit, Delete } from '@element-plus/icons-vue'

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
      formatDate,
      Edit,
      Delete
    }
  }
}
</script>

<style scoped>
.placeholder-list {
  height: 100%;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 16px;
}

.list-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.list-item {
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.list-item:hover {
  transform: translateX(4px);
}

.list-item.active {
  border-left: 4px solid #67c23a;
  background: #f0f9ff;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.item-title h4 {
  margin: 0;
  color: #303133;
  font-size: 15px;
  font-weight: 600;
}

.item-desc {
  margin: 0 0 8px 0;
  color: #606266;
  font-size: 13px;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
}

.item-actions {
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.3s;
}

.list-item:hover .item-actions {
  opacity: 1;
}
</style>
