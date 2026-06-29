<template>
  <view class="ym-attachments">
    <!-- File list -->
    <view class="ym-attachments__file-list">
      <view 
        class="ym-attachments__scroll-container"
        :class="scrollDirection === 'horizontal' ? 'ym-attachments__scroll-container--horizontal' : 'ym-attachments__scroll-container--vertical'"
      >
        <!-- File cards -->
        <FileCard 
          v-for="(file, index) in items" 
          :key="file.id || index"
          :file="file"
          :show-remove="showRemove"
          :selectable="selectionMode !== 'none'"
          :selected="file.selected || false"
          @remove="removeFile(index)"
          @select="toggleFileSelection(index)"
        />
        
        <!-- Add file button when not at max count -->
        <view 
          v-if="items.length < count" 
          class="ym-attachments__add-btn" 
          @click="chooseFiles"
        >
          <view class="ym-attachments__add-icon">
            <text class="ym-icon i-tianjia1"></text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import FileCard from './FileCard.vue'

// 声明 uni 全局对象
declare const uni: any;

// 文件类型定义
interface AttachmentFile {
  id?: string
  name: string
  size?: number
  type?: string
  url?: string
  status?: string
  progress?: number
  selected?: boolean
}

// Props定义
interface Props {
  items?: AttachmentFile[]
  count?: number
  scrollDirection?: 'horizontal' | 'vertical'
  showRemove?: boolean
  selectionMode?: 'none' | 'single' | 'multiple'
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  count: 9,
  scrollDirection: 'horizontal',
  showRemove: true,
  selectionMode: 'none'
})

const emit = defineEmits<{
  'update:items': [files: AttachmentFile[]]
  'file-add': [files: AttachmentFile[]]
  'file-remove': [file: AttachmentFile]
  'file-select': [file: AttachmentFile, selected: boolean]
}>()

const items = ref<AttachmentFile[]>([...props.items])

watch(() => props.items, (newVal:any) => {
  console.log('newVal', newVal)
  items.value = newVal ? [...newVal] : []
}, { deep: true })

// 选择文件
const chooseFiles = () => {
  if (items.value.length >= props.count) {
    uni.showToast({
      title: `最多只能选择${props.count}个文件`,
      icon: 'none'
    })
    return
  }

  uni.chooseMessageFile({
    count: props.count - items.value.length,
    type: 'all',
    success: (res: any) => {
      const newFiles: AttachmentFile[] = res.tempFiles.map((file: any) => {
        // 根据文件扩展名判断类型
        const fileName = file.name || file.path
        let fileType = 'file'
        if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName)) {
          fileType = 'image'
        } else if (/\.(mp4|avi|mov|wmv|flv|webm)$/i.test(fileName)) {
          fileType = 'video'
        } else if (/\.(mp3|wav|flac|aac|ogg)$/i.test(fileName)) {
          fileType = 'audio'
        }
        
        return {
          id: Date.now() + Math.random() + '',
          name: file.name || `file_${Date.now()}`,
          size: file.size,
          type: fileType,
          url: file.path,
          status: 'pending'
        }
      })
      
      items.value.push(...newFiles)
      emit('update:items', items.value)
      emit('file-add', newFiles)
    },
    fail: (err: any) => {
      console.log('选择文件失败:', err)
    }
  })
}

// 移除文件
const removeFile = (index: number) => {
  const removedFile = items.value.splice(index, 1)[0]
  emit('update:items', items.value)
  emit('file-remove', removedFile)
}

// 切换文件选中状态
const toggleFileSelection = (index: number) => {
  if (props.selectionMode === 'none') return
  
  const file = items.value[index]
  const newSelected = !file.selected
  
  // 如果是单选模式，先取消其他文件的选中状态
  if (props.selectionMode === 'single' && newSelected) {
    items.value.forEach((item, i) => {
      if (i !== index) {
        item.selected = false
      }
    })
  }
  
  file.selected = newSelected
  
  emit('update:items', items.value)
  emit('file-select', file, newSelected)
}

// 暴露方法给父组件
defineExpose({
  chooseFiles
})
</script>

<style lang="less">
.ym-attachments {
  padding-bottom: var(--ym-attachments-padding-bottom);
  border-bottom: var(--ym-attachments-border-bottom);

  &__scroll-container {
    display: flex;
    align-items: center;
    gap: var(--ym-attachments-scroll-gap);

    &--horizontal {
      overflow-x: auto;
      overflow-y: hidden;
    }

    &--vertical {
      overflow-x: hidden;
      overflow-y: auto;
      max-height: var(--ym-attachments-max-height);
      flex-direction: column;
      align-items: stretch;
    }

    /* 隐藏滚动条 */
    &::-webkit-scrollbar { display: none; }
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  &__add-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--ym-attachments-add-btn-size);
    height: var(--ym-attachments-add-btn-size);
    background: var(--ym-attachments-add-btn-bg);
    border: var(--ym-attachments-add-btn-border);
    border-radius: var(--ym-attachments-add-btn-radius);
    transition: var(--ym-transition-base);
    cursor: pointer;
    flex-shrink: 0;

    &:hover {
      background: var(--ym-primary-color);
      border-color: var(--ym-primary-color);
    }
  }

  &__add-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    .ym-icon {
      font-size: var(--ym-attachments-add-icon-size);
    }
  }
}
</style>