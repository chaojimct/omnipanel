<template>
  <view 
    class="file-card" 
    :class="{ 'file-card--selectable': selectable, 'file-card--selected': selected }"
    @click="handleCardClick"
  >

    <!-- File icon -->
    <view class="file-card__icon">
      <!-- 图片文件直接显示图片 -->
      <image 
        v-if="isImageFile(file.type || file.name)" 
        :src="file.url" 
        class="file-card__image"
        mode="aspectFill"
      />
      <!-- 其他文件显示图标 -->
      <text 
        v-else 
        :class="getFileIconClass(file.name)"
      ></text>
    </view>

    <!-- File info -->
    <view class="file-card__info">
      <text class="file-card__name">{{ file.name }}</text>
      <text class="file-card__size">{{ formatFileSize(file.size || 0) }}</text>
    </view>

    <!-- 进度条覆盖层 -->
    <view v-if="file.progress !== undefined && file.progress > 0" class="file-card__progress-overlay">
      <view class="file-card__progress-bg">
        <view 
          class="file-card__progress-bar" 
          :style="{ width: file.progress + '%' }"
        ></view>
      </view>
    </view>

    <!-- File actions -->
    <view v-if="showRemove" class="file-card__actions">
      <view class="file-card__action-btn" @click.stop="$emit('remove')">
        <text class="ym-icon i-delete"></text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
// 文件类型定义
interface AttachmentFile {
  id?: string
  name: string
  size?: number
  type?: string
  url?: string
  status?: string
  progress?: number
}

interface Props {
  file: AttachmentFile
  showRemove?: boolean
  selectable?: boolean
  selected?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showRemove: true,
  selectable: false,
  selected: false
})

// 判断是否为图片文件
const isImageFile = (typeOrName: string): boolean => {
  const name = typeOrName.toLowerCase()
  return name.includes('image') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(name)
}

const getFileIconClass = (typeOrName: string): string => {
  const name = typeOrName.toLowerCase()
  
  if (name.includes('audio') || /\.(mp3|wav|flac|aac|ogg)$/i.test(name)) return 'ym-icon i-yinpinwenjiantubiao'
  if (name.includes('video') || /\.(mp4|avi|mov|wmv|flv|webm)$/i.test(name)) return 'ym-icon i-lianjiewenjian'
  if (/\.(pdf)$/i.test(name)) return 'ym-icon i-danjufujian-wenjiantubiao-geshi3'
  if (/\.(doc|docx)$/i.test(name)) return 'ym-icon i-danjufujian-wenjiantubiao-geshi5'
  if (/\.(xls|xlsx)$/i.test(name)) return 'ym-icon i-danjufujian-wenjiantubiao-geshi1'
  if (/\.(ppt|pptx)$/i.test(name)) return 'ym-icon i-pptwenjian'
  if (/\.(txt)$/i.test(name)) return 'ym-icon i-duanlian-txtwenjian'
  if (/\.(md)$/i.test(name)) return 'ym-icon i-file-markdown-fill'
  if (/\.(js|ts|vue|html|css|less|scss|json|xml|php|java|py)$/i.test(name)) return 'ym-icon i-daimawenjian'
  if (/\.(zip|rar|7z|tar|gz)$/i.test(name)) return 'ym-icon i-yasuowenjian'
  
  return 'ym-icon i-weizhiwenjian'
}

const formatFileSize = (bytes: number): string => {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes, unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

// 定义 emit
const emit = defineEmits<{
  'remove': []
  'select': []
}>()

// 处理卡片点击
const handleCardClick = () => {
  if (props.selectable) {
    emit('select')
  }
}
</script>

<style lang="less">
.file-card {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  width: var(--ym-file-card-width);
  height: var(--ym-file-card-height);
  background: var(--ym-file-card-bg);
  border-radius: var(--ym-file-card-radius);
  transition: var(--ym-transition-base);
  flex-shrink: 0;
  position: relative;
  padding: var(--ym-file-card-padding);
  margin: var(--ym-file-card-margin);
  border: var(--ym-file-card-border);

  &__icon {
    width: var(--ym-file-card-icon-size);
    height: var(--ym-file-card-icon-size);
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: var(--ym-file-card-icon-margin);

    .ym-icon {
      font-size: var(--ym-file-card-icon-font-size);
    }

    .i-yinpinwenjiantubiao { color: var(--ym-file-audio-color); }
    .i-lianjiewenjian { color: var(--ym-file-video-color); }
    .i-danjufujian-wenjiantubiao-geshi3 { color: var(--ym-file-pdf-color); }
    .i-danjufujian-wenjiantubiao-geshi5 { color: var(--ym-file-word-color); }
    .i-danjufujian-wenjiantubiao-geshi1 { color: var(--ym-file-excel-color); }
    .i-pptwenjian { color: var(--ym-file-powerpoint-color); }
    .i-duanlian-txtwenjian { color: var(--ym-file-text-color); }
    .i-file-markdown-fill { color: var(--ym-file-markdown-color); }
    .i-daimawenjian { color: var(--ym-file-code-color); }
    .i-yasuowenjian { color: var(--ym-file-archive-color); }
    .i-weizhiwenjian { color: var(--ym-file-default-color); }
  }

  &__image {
    width: 100%;
    height: 100%;
    border-radius: 8rpx;
  }

  &__info {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-width: 0;
  }

  &__name {
    font-size: var(--ym-file-card-name-font-size);
    font-weight: bold;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.2;
    color: var(--ym-file-card-name-color);
    margin-bottom: var(--ym-file-card-name-margin-bottom);
  }

  &__size {
    font-size: var(--ym-file-card-size-font-size);
    color: var(--ym-file-card-size-color);
    font-weight: 400;
    line-height: 1.2;
  }

  &__progress-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 5;
    display: flex;
    align-items: flex-end;
  }

  &__progress-bg {
    width: 100%;
    height: var(--ym-file-card-progress-height);
    background: var(--ym-file-card-progress-bg);
    border-radius: var(--ym-file-card-progress-radius);
    overflow: hidden;
    backdrop-filter: blur(2rpx);
  }

  &__progress-bar {
    height: 100%;
    background: var(--ym-primary-color);
    border-radius: var(--ym-file-card-progress-radius);
    transition: var(--ym-transition-base);
  }

  &__actions {
    position: absolute;
    top: var(--ym-file-card-actions-top);
    right: var(--ym-file-card-actions-right);
    z-index: 10;
  }

  // 选中状态样式
  &--selectable {
    cursor: pointer;
    user-select: none;
    
    &:hover {
      background: var(--ym-file-card-hover-bg);
      transform: var(--ym-file-card-hover-transform);
      box-shadow: var(--ym-shadow-hover);
    }
  }

  &--selected {
    background: var(--ym-file-card-selected-bg);
    border: var(--ym-file-card-selected-border);
    box-shadow: var(--ym-shadow-selected);
  }

  &__action-btn {
    width: var(--ym-file-card-action-btn-size);
    height: var(--ym-file-card-action-btn-size);
    border-radius: 50%;
    background: var(--ym-file-card-action-btn-bg);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: var(--ym-transition-base);
    cursor: pointer;
    box-shadow: var(--ym-shadow-sm);

    &:hover {
      background: var(--ym-error-color);
      transform: scale(1.1);
    }

    .ym-icon {
      font-size: var(--ym-file-card-action-btn-font-size);
      color: var(--ym-text-light);
    }
  }
}
</style>
