<template>
  <view class="ym-bubble" :class="bubbleClasses" @click="onBubbleClick">
    <view class="ym-bubble-wrapper">
      <view class="ym-bubble-content">
        <!-- 头部插槽 -->
        <slot name="header"></slot>
        <slot name="content">
          <!-- 文本消息 -->
          <view v-if="isTextMessage" class="ym-bubble__text">
            <view v-if="files && files.length > 0" class="ym-bubble__files">
              <FileCard 
                v-for="(file, index) in files" 
                :key="file.id || index"
                :file="file"
                :show-remove="false"
              />
            </view>
            <YmTypewriter v-if="typing" :text="message" :speed="typingSpeed" mode="cursor" :cursor-char="cursorChar" />
            <mark-down v-else-if="isMarkdown" :content="message" :resources="resources"></mark-down>
            <view v-else :class="{ 'ym-bubble__error': isError }">{{ message }}</view>
          </view>
          <!-- 加载状态 -->
          <view v-else-if="isLoadingMessage" class="ym-bubble__loading">
            <view class="ym-bubble__loading-dot" v-for="i in 3" :key="i"></view>
          </view>
        </slot>
      </view>
      
      <!-- 底部插槽 -->
      <slot name="footer" v-if="!isLoadingMessage"></slot>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import MarkDown from './components/MarkDown.vue'
import YmTypewriter from '../YmTypewriter/index.vue'
import FileCard from '../YmAttachments/FileCard.vue'

const props = defineProps({
  message: { type: String, default: '' },
  position: { type: String, default: 'left' },
  messageId: { type: String, default: '' },
  typing: { type: [Boolean, String], default: false },
  typingSpeed: { type: Number, default: 50 },
  cursorChar: { type: String, default: '|' },
  isMarkdown: { type: Boolean, default: false },
  resources: { type: Array, default: [] },
  files: { type: Array, default: [] },
  isError: { type: Boolean, default: false }
})

const emit = defineEmits(['bubble-click'])

// 消息类型判断
const isLoadingMessage = computed(() => props.message === 'loading' || props.message === '')

const isTextMessage = computed(() =>
  !isLoadingMessage.value
)

// 气泡样式类
const bubbleClasses = computed(() => {
  const classes = ['ym-bubble', `ym-bubble--${props.position}`]
  if (isLoadingMessage.value) classes.push('ym-bubble--loading')
  return classes
})

// 事件处理
const onBubbleClick = () => props.messageId && emit('bubble-click', props.messageId)
</script>

<style lang="less">

.ym-bubble {
  display: flex;
  margin: var(--ym-bubble-margin);
  animation: ym-bubble-enter var(--ym-bubble-animation-duration) cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  overflow: hidden;
  margin-bottom: var(--ym-bubble-margin-bottom);
  box-sizing: border-box;
  transition: all var(--ym-bubble-animation-duration) cubic-bezier(0.4, 0, 0.2, 1);
  width: 100%;

  .ym-bubble-content {
    padding: var(--ym-bubble-padding);
    box-sizing: border-box;
    width: 100%;
  }



  // 位置样式
  &--right {
    justify-content: flex-end;

    .ym-bubble-content {
      color: #fff;
      background-color: var(--ym-bubble-user-color);
      border-radius: var(--ym-bubble-radius) var(--ym-bubble-radius) 0 var(--ym-bubble-radius);
    }
  }

  &--left {
    justify-content: flex-start;

    .ym-bubble-content {
      color: var(--ym-bubble-text-color);
      background-color: var(--ym-bubble-bot-color);
      border-radius: var(--ym-bubble-radius) var(--ym-bubble-radius) var(--ym-bubble-radius) 0;
    }
  }

  // 文本样式
  &__text {
    font-size: var(--ym-bubble-font-size);
    line-height: var(--ym-bubble-line-height);
    margin: 0;
    max-width: 100%;
    width: 100%;
    display: block;
    box-sizing: border-box;
    word-break: break-all;
    overflow-wrap: break-word;
  }

  // 错误消息样式
  &__error {
    color: var(--ym-bubble-error-color) !important;
    font-weight: 500;
  }

  // 加载动画
  &__loading {
    display: flex;
    align-items: center;
    gap: var(--ym-bubble-loading-gap);
    padding: var(--ym-space-md) var(--ym-space-3xl);

    &-dot {
      width: var(--ym-bubble-dot-size);
      height: var(--ym-bubble-dot-size);
      background: var(--ym-primary-color);
      border-radius: 50%;
      animation: ym-bubble-loading var(--ym-bubble-loading-duration) infinite both;

      &:nth-child(1) {
        animation-delay: -0.32s;
      }

      &:nth-child(2) {
        animation-delay: -0.16s;
      }

      &:nth-child(3) {
        animation-delay: 0s;
      }
    }
  }

  // 文件附件样式
  &__files {
    display: flex;
    flex-wrap: wrap;
    gap: var(--ym-space-sm);
  }
}


// 动画定义
@keyframes ym-bubble-enter {
  from {
    opacity: 0;
    transform: translateY(10rpx);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes ym-bubble-loading {

  0%,
  80%,
  100% {
    transform: scale(0.8);
    opacity: 0.5;
  }

  40% {
    transform: scale(1.2);
    opacity: 1;
  }
}
</style>