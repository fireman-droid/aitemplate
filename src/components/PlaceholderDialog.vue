<template>
  <el-dialog
    v-model="dialogVisible"
    :title="mode === 'create' ? '添加占位符' : '编辑占位符'"
    width="500px"
    @close="handleClose"
  >
    <el-form :model="formData" label-width="100px" @submit.prevent="handleConfirm">
      <el-form-item label="名称" required>
        <el-input
          v-model="formData.name"
          placeholder="例如：客户姓名"
          @keyup.enter="handleConfirm"
        />
      </el-form-item>

      <el-form-item label="描述">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="3"
          placeholder="描述这个占位符的用途"
        />
      </el-form-item>

      <el-form-item label="AI提示词">
        <el-input
          v-model="formData.aiPrompt"
          type="textarea"
          :rows="2"
          placeholder="为AI填充提供提示，例如：生成一个正式的称呼"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleConfirm">
        {{ mode === 'create' ? '添加' : '保存' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  placeholder: {
    type: Object,
    default: null
  },
  mode: {
    type: String,
    default: 'create'
  }
})

const emit = defineEmits(['confirm', 'cancel'])

const formData = ref({
  name: '',
  description: '',
  aiPrompt: ''
})

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => {
    if (!val) {
      emit('cancel')
    }
  }
})

watch(() => props.visible, (newVal) => {
  if (newVal) {
    if (props.mode === 'edit' && props.placeholder) {
      formData.value = {
        name: props.placeholder.name || '',
        description: props.placeholder.description || '',
        aiPrompt: props.placeholder.aiPrompt || ''
      }
    } else {
      formData.value = {
        name: '',
        description: '',
        aiPrompt: ''
      }
    }
  }
})

watch(() => props.placeholder, (newVal) => {
  if (newVal && props.mode === 'edit') {
    formData.value = {
      name: newVal.name || '',
      description: newVal.description || '',
      aiPrompt: newVal.aiPrompt || ''
    }
  }
})

const handleConfirm = () => {
  if (!formData.value.name.trim()) {
    ElMessage.warning('请输入占位符名称')
    return
  }
  emit('confirm', { ...formData.value })
}

const handleClose = () => {
  emit('cancel')
}
</script>

