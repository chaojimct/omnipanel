<template>
  <view class="message-row" :class="message.user">
    <view v-if="message.user === 'assistant'" class="avatar assistant">
      <text class="avatar-text">AI</text>
    </view>

    <view class="bubble-wrap">
      <view v-if="message.loading" class="bubble assistant-bubble loading-bubble">
        <LoadingDots />
        <text class="thinking-text">{{ thinkingText }}</text>
      </view>
      <view
        v-else
        class="bubble"
        :class="message.user === 'customer' ? 'user-bubble' : 'assistant-bubble'"
        @longpress="copyContent"
      >
        <text class="bubble-text" selectable>{{ message.content }}</text>
      </view>
    </view>

    <view v-if="message.user === 'customer'" class="avatar user">
      <text class="avatar-text">Me</text>
    </view>
  </view>
</template>

<script>
import LoadingDots from './LoadingDots.vue'

export default {
  name: 'MessageItem',
  components: { LoadingDots },
  props: {
    message: {
      type: Object,
      required: true,
    },
    thinkingText: {
      type: String,
      default: '',
    },
  },
  methods: {
    copyContent() {
      if (this.message.loading || !this.message.content) return
      uni.setClipboardData({ data: this.message.content })
    },
  },
}
</script>

<style scoped>
.message-row {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 16rpx 24rpx;
  gap: 16rpx;
}

.message-row.customer {
  flex-direction: row-reverse;
}

.avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar.assistant {
  background: var(--accent);
}

.avatar.user {
  background: var(--surface-active);
}

.avatar-text {
  font-size: 20rpx;
  font-weight: 700;
  color: #fff;
}

.avatar.user .avatar-text {
  color: var(--fg-2);
}

.bubble-wrap {
  max-width: calc(100% - 160rpx);
}

.bubble {
  padding: 20rpx 24rpx;
  border-radius: 16rpx;
  word-break: break-word;
}

.user-bubble {
  background: var(--bubble-user);
  border: 1px solid var(--accent-soft);
}

.assistant-bubble {
  background: var(--bubble-ai);
  border: 1px solid var(--border-soft);
}

.loading-bubble {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.bubble-text {
  font-size: 28rpx;
  line-height: 1.6;
  color: var(--fg);
  white-space: pre-wrap;
}

.thinking-text {
  font-size: 24rpx;
  color: var(--muted);
}
</style>
