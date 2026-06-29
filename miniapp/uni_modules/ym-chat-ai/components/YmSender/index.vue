<template>
  <view class="ym-sender" :style="senderStyle">
    <!-- Attachments Preview -->
    <view v-if="showAttachments" class="ym-sender__attachments" :class="{ 'ym-sender__attachments--visible': showAttachments }">
      <slot name="header"></slot>
    </view>

    <!-- Main Input Container -->
    <view class="ym-sender__container">
      <!-- Input Area -->
      <view v-if="props.showInput" class="ym-sender__input-container">
        <textarea v-model="message" class="ym-sender__input" :placeholder="props.placeholder" :maxlength="maxLength"
          :auto-height="true" :adjust-position="false" :disabled="props.disabled" aria-label="消息输入框"
          :aria-describedby="`max-length-${maxLength}`" @input="onInput" @focus="onFocus" @blur="onBlur"
          @keyboardheightchange="handleKeyboardHeightChange" />
      </view>

      <!-- Bottom Controls -->
      <view class="ym-sender__controls">
        <!-- Left Side Actions -->
        <view class="ym-sender__left-actions">
          <!-- Attachment Button -->
          <button v-if="props.showUpload" class="ym-sender__control-btn" :disabled="props.disabled"
            aria-label="添加附件" @click="toggleAttachments">
            <text class="ym-icon i-chaolianjie"></text>
          </button>
          <!-- Online Button -->
          <button v-if="props.showOnline" class="ym-sender__control-btn ym-sender__online-btn"
            :class="{ 'ym-sender__online-btn--active': isOpenOnline }" :disabled="props.disabled"
            :aria-pressed="isOpenOnline" aria-label="联网搜索" @click="toggleOnline">
            <text class="ym-icon i-wangzhan"></text>
            <text>联网搜索</text>
          </button>
        </view>
        <!-- Right Side Actions -->
        <view class="ym-sender__right-actions">
          <!-- Send Button -->
          <button class="ym-sender__send-btn" :class="{
            'ym-sender__send-btn--disabled': isSendDisabled,
            'ym-sender__send-btn--loading': props.loading
          }" :disabled="isSendDisabled" :aria-label="props.loading ? '取消发送' : '发送消息'" @click="handleSendOrCancel">
            <view v-if="props.loading" class="ym-sender__loading-container">
              <view class="ym-sender__loading-spinner"></view>
            </view>
            <text v-else class="ym-icon i-fasong3"></text>
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { SendEvent } from '../../types'
import { ref, computed, watch } from 'vue'
import { PlatformUtils, StringUtils } from '../../utils/utils'


// Props定义
interface Props {
  showInput?: boolean
  showHeader?: boolean
  showUpload?: boolean
  showOnline?: boolean
  requireMessage?: boolean
  requireAttachment?: boolean
  placeholder?: string
  maxLength?: number
  disabled?: boolean
  loading?: boolean
  isOnline?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showInput: true,
  showHeader: false,
  showUpload: true,
  showOnline: false,
  requireMessage: true,
  requireAttachment: false,
  placeholder: '请输入内容',
  maxLength: 1000,
  disabled: false,
  loading: false,
  isOnline: false
})
// 事件定义
const emit = defineEmits<{
  (e: 'input', message: string): void
  (e: 'focus'): void
  (e: 'blur'): void
  (e: 'send', event: SendEvent): void
  (e: 'cancel'): void
  (e: 'toggle-attachments', show: boolean): void
  (e: 'toggle-online', isOnline: boolean): void
}>()

// 响应式数据
const message = ref('')
const showAttachments = ref(false)
const isOpenOnline = ref(false)

// 监听 showHeader 变化
watch(() => props.showHeader, (newVal) => {
  if (newVal) {
    // 如果 showHeader 为 true，自动显示附件区域
    showAttachments.value = true
  } else {
    // 如果 showHeader 为 false，不自动隐藏，让用户手动控制
    // showAttachments.value 保持当前状态
  }
}, { immediate: true })

// const 
const keyboardHeight = ref(0)

// 计算属性
const isSendDisabled = computed(() => {
  if (props.loading) return false
  if (props.disabled) return true
  
  const hasText = StringUtils.isNotEmpty(message.value.trim())
  const hasAttachment = showAttachments.value
  
  if (props.requireMessage && !hasText) return true
  if (props.requireAttachment && !hasAttachment) return true
  
  return false
})

// 事件处理函数
const onInput = (e: { detail: { value: string } }): void => {
  const value = e.detail.value
  message.value = value
  emit('input', value)
}

const onFocus = (): void => {
  emit('focus')
}

const onBlur = (): void => {
  emit('blur')
}

// 发送或取消消息处理
const handleSendOrCancel = (): void => {
  if (props.loading) {
    cancelMessage()
  } else {
    sendMessage()
  }
}

// 发送容器样式计算
const senderStyle = computed(() => {
  return {
    marginBottom: keyboardHeight.value > 0 ? `${keyboardHeight.value}px` : '0px'
  }
})

// 发送消息
const sendMessage = async (): Promise<void> => {
  if (props.loading || props.disabled) return

  const trimmedMessage = message.value.trim()

  // 验证消息内容
  if (props.requireMessage && !trimmedMessage) {
    PlatformUtils.showToast('请输入消息内容')
    return
  }

  // 验证附件
  if (props.requireAttachment && !showAttachments.value) {
    PlatformUtils.showToast('请上传附件')
    return
  }

  if (trimmedMessage && trimmedMessage.length > props.maxLength) {
    PlatformUtils.showToast(`消息长度不能超过${props.maxLength}个字符`)
    return
  }

  try {
    const sendEvent: SendEvent = {
      message: trimmedMessage,
      timestamp: Date.now(),
      isOnline: isOpenOnline.value
    }

    emit('send', sendEvent)

    // 清空输入框
    message.value = ''
  } catch (error) {
    PlatformUtils.showToast('发送失败，请重试')
    console.error('发送消息失败:', error)
  }
}

// 取消消息
const cancelMessage = (): void => {
  emit('cancel')
}

// 附件管理
const toggleAttachments = (): void => {
  if (props.disabled) return
  showAttachments.value = !showAttachments.value
  emit('toggle-attachments', showAttachments.value)
}

// 联网功能切换
const toggleOnline = (): void => {
  if (props.disabled) return
  isOpenOnline.value = !isOpenOnline.value
  emit('toggle-online', isOpenOnline.value)
}

// 键盘高度变化处理
const handleKeyboardHeightChange = (res: any): void => {
  const { height } = res.detail;
  keyboardHeight.value = Math.max(0, height)
}

</script>

<style lang="less">
// 使用统一CSS变量，移除本地定义

.ym-sender {
  overflow: hidden;
  border-radius: var(--ym-sender-border-radius);
  background: var(--ym-sender-background);
  border: var(--ym-sender-border-width) solid var(--ym-sender-border-color);
  transition: var(--ym-sender-transition);

  /* 聚焦时的边框颜色 - 使用:focus-within伪类 */
  &:focus-within {
    box-shadow: var(--ym-sender-shadow-focus);
    border-color: var(--ym-sender-border-color-focus);
  }

  /* 附件预览区域 */
  &__attachments {
    max-height: 0;
    opacity: 0;
    transition: var(--ym-sender-attachments-transition);

    &--visible {
      opacity: 1;
      max-height: var(--ym-sender-attachments-max-height);
    }
  }

  /* 主容器 */
  &__container {
    overflow: hidden;
    position: relative;
  }

  /* 输入区域 */
  &__input {
    &-container {
      padding: var(--ym-sender-input-container-padding);
    }

    width: 100%;
    height: var(--ym-sender-input-height);
    border: none;
    background: transparent;
    font-size: var(--ym-sender-input-font-size);
    color: var(--ym-sender-text-color);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    resize: none;
    outline: none;
    padding: 0;
    max-height: var(--ym-sender-input-max-height);

    &::placeholder {
      color: var(--ym-sender-placeholder-color);
      font-size: var(--ym-sender-input-font-size);
    }
  }

  /* 控制栏 */
  &__controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--ym-sender-controls-padding);
  }

  &__left-actions,
  &__right-actions {
    display: flex;
    align-items: center;
    gap: var(--ym-sender-controls-gap);
  }

  /* 控制按钮 */
  &__control-btn {
    width: var(--ym-sender-control-btn-size);
    height: var(--ym-sender-control-btn-size);
    border-radius: var(--ym-sender-control-btn-radius);
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%);
    border: 2rpx solid rgba(226, 232, 240, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: var(--ym-sender-transition);
    backdrop-filter: blur(10rpx);
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
    -webkit-tap-highlight-color: transparent;
  }

  /* 联网按钮 */
  &__online-btn {
    width: auto;
    font-size: 24rpx;
    box-shadow: none;
    padding: 0 10rpx;

    &--active {
      border: 2rpx solid rgba(36, 118, 227, 0.8);
      color: rgba(36, 118, 227);
      background-color: rgba(36, 118, 227, 0.5);

      .ym-icon {
        color: rgba(36, 118, 227);
      }
    }
  }

  /* 发送按钮 */
  &__send-btn {
    width: var(--ym-sender-send-btn-size);
    height: var(--ym-sender-send-btn-size);
    border-radius: 50%;
    background-color: var(--ym-sender-primary-color) !important;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: var(--ym-sender-transition);
    -webkit-tap-highlight-color: transparent;
    user-select: none;
    padding: 0;

    &:active {
      transform: scale(0.95);
    }

    &--disabled {
      background-color: var(--ym-sender-disabled-color) !important;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    &--loading {
      background-color: transparent !important;
    }

    .ym-icon {
      color: #ffffff;
      font-size: 32rpx;
    }
  }

  &__loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    width: 100%;
  }

  &__loading-spinner {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    position: relative;
    background-color: #FFFFFF;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
      bottom: 0;
      border-radius: 50%;
      box-sizing: border-box;
      border: 10rpx solid rgba(202, 218, 252);
      border-top: 10rpx solid var(--ym-primary-color);
      animation: spin 1s linear infinite;
    }

    &::after {
      content: '';
      position: absolute;
      width: 20rpx;
      height: 20rpx;
      top: 50%;
      left: 50%;
      border-radius: 2rpx;
      transform: translate(-50%, -50%);
      background-color: var(--ym-primary-color);
    }
  }
}

/* 动画 */
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>