<template>
  <view class="chat-input">
    <view class="input-wrap">
      <textarea
        class="input-field"
        :style="{ height: textAreaHeight }"
        :placeholder="placeholder"
        :value="inputValue"
        maxlength="500"
        auto-height
        confirm-type="send"
        adjust-position
        cursor-spacing="30"
        @input="onInput"
        @linechange="onLineChange"
        @confirm="sendMessage"
      />
      <view class="send-btn" @tap="sendMessage">
        <text class="send-icon">➤</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'ChatInput',
  props: {
    placeholder: {
      type: String,
      default: '',
    },
  },
  emits: ['send-message'],
  data() {
    return {
      inputValue: '',
      textAreaHeight: '72rpx',
    }
  },
  methods: {
    onInput(e) {
      this.inputValue = e.detail.value
    },
    onLineChange(e) {
      const height = Math.min(Math.max(e.detail.height, 36), 120)
      this.textAreaHeight = `${height}px`
    },
    setInputValue(value) {
      this.inputValue = value
    },
    sendMessage() {
      const content = this.inputValue.trim()
      if (!content) {
        this.inputValue = ''
        return
      }
      this.$emit('send-message', { type: 'text', content })
      this.inputValue = ''
      this.textAreaHeight = '72rpx'
    },
  },
}
</script>

<style scoped>
.chat-input {
  padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
  background: var(--surface);
  border-top: 1px solid var(--border);
}

.input-wrap {
  position: relative;
  display: flex;
  align-items: flex-end;
}

.input-field {
  flex: 1;
  min-height: 72rpx;
  max-height: 240rpx;
  padding: 16rpx 88rpx 16rpx 24rpx;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 36rpx;
  font-size: 28rpx;
  color: var(--fg);
  box-sizing: border-box;
}

.send-btn {
  position: absolute;
  right: 12rpx;
  bottom: 12rpx;
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.send-icon {
  font-size: 36rpx;
  color: var(--accent);
  line-height: 1;
}
</style>
