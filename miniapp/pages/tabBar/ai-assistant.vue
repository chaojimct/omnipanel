<template>
  <view class="page" :class="themeClass">
    <view class="chat-header">
      <text class="chat-title">{{ t('ai.title') }}</text>
      <view class="header-action" @tap="clearChat">
        <text class="header-action-text">{{ t('ai.clear') }}</text>
      </view>
    </view>

    <view class="chat-body" :style="{ height: contentHeight + 'px' }">
      <scroll-view
        scroll-y
        class="message-scroll"
        :scroll-top="scrollTop"
        :scroll-with-animation="scrollAnimation"
        scroll-into-view="chat-bottom"
      >
        <MessageItem
          v-for="(message, index) in messages"
          :key="index"
          :message="message"
          :thinking-text="t('ai.thinking')"
        />
        <view id="chat-bottom" class="scroll-anchor" />
      </scroll-view>
    </view>

    <ChatInput
      ref="chatInput"
      :placeholder="t('ai.placeholder')"
      @send-message="onSendMessage"
    />
    <!-- #ifndef MP-WEIXIN -->
    <AppTabBar :selected="tabIndex" />
    <!-- #endif -->
  </view>
</template>

<script>
import pageMixin from '@/common/pageMixin.js'
import AppTabBar from '@/components/AppTabBar.vue'
import ChatInput from '@/components/chat/ChatInput.vue'
import MessageItem from '@/components/chat/MessageItem.vue'

const STORAGE_KEY = 'omnipanel_chat_messages'

export default {
  components: { AppTabBar, ChatInput, MessageItem },
  mixins: [pageMixin],
  data() {
    return {
      tabIndex: 1,
      messages: [],
      scrollTop: 0,
      scrollAnimation: true,
      contentHeight: 500,
      isLoading: false,
      streamTimer: null,
    }
  },
  onShow() {
    this.syncPageState()
    this.setTabSelected(1)
    this.calcLayout()
  },
  onLoad() {
    uni.setNavigationBarTitle({ title: this.t('tabBar.ai') })
    this.loadMessages()
    this.calcLayout()
  },
  onUnload() {
    this.stopStream()
  },
  watch: {
    locale() {
      uni.setNavigationBarTitle({ title: this.t('tabBar.ai') })
    },
  },
  methods: {
    calcLayout() {
      const info = uni.getSystemInfoSync()
      const inputHeight = 120
      const headerHeight = 44
      const tabBarHeight = 40
      const safeBottom = info.safeAreaInsets?.bottom || 0
      this.contentHeight =
        info.windowHeight - headerHeight - inputHeight - tabBarHeight - safeBottom
    },
    loadMessages() {
      const cached = uni.getStorageSync(STORAGE_KEY)
      if (cached && Array.isArray(cached) && cached.length > 0) {
        this.messages = cached
      } else {
        this.messages = [
          {
            user: 'assistant',
            content: this.t('ai.welcome'),
            loading: false,
          },
        ]
      }
      this.$nextTick(() => this.scrollToBottom(false))
    },
    saveMessages() {
      const data = this.messages.filter((m) => !m.loading).slice(-30)
      uni.setStorageSync(STORAGE_KEY, data)
    },
    onSendMessage(payload) {
      if (this.isLoading) {
        uni.showToast({ title: this.t('ai.busy'), icon: 'none' })
        return
      }
      this.addMessage('customer', payload.content)
      this.addMessage('assistant', '', false, true)
      this.scrollToBottom()
      this.mockStreamReply()
    },
    addMessage(user, content, persist = false, loading = false) {
      if (loading) {
        this.messages.push({ user, content: '', loading: true })
        return
      }
      const last = this.messages[this.messages.length - 1]
      if (last?.loading && user === 'assistant') {
        this.messages.pop()
      }
      this.messages.push({ user, content, loading: false })
      if (persist) this.saveMessages()
    },
    mockStreamReply() {
      this.isLoading = true
      const fullText = this.t('ai.mockReply')
      let index = 0
      let current = ''

      this.stopStream()
      this.streamTimer = setInterval(() => {
        if (index >= fullText.length) {
          this.stopStream()
          this.isLoading = false
          this.saveMessages()
          this.scrollToBottom()
          return
        }
        current += fullText.charAt(index)
        index += 1
        const last = this.messages[this.messages.length - 1]
        if (last?.loading) {
          this.messages.pop()
        }
        this.messages.push({ user: 'assistant', content: current, loading: false })
        this.scrollToBottom(false)
      }, 40)
    },
    stopStream() {
      if (this.streamTimer) {
        clearInterval(this.streamTimer)
        this.streamTimer = null
      }
    },
    scrollToBottom(animated = true) {
      this.scrollAnimation = animated
      this.$nextTick(() => {
        this.scrollTop = this.scrollTop === 99999 ? 100000 : 99999
      })
    },
    clearChat() {
      uni.showModal({
        title: this.t('ai.clear'),
        content: this.t('ai.clearConfirm'),
        success: (res) => {
          if (!res.confirm) return
          this.stopStream()
          this.isLoading = false
          this.messages = [
            { user: 'assistant', content: this.t('ai.welcome'), loading: false },
          ]
          uni.removeStorageSync(STORAGE_KEY)
          this.scrollToBottom()
        },
      })
    },
  },
}
</script>

<style scoped>
@import '@/common/omnipanel.css';

.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg);
  padding-bottom: calc(60rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.chat-header {
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24rpx;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
}

.chat-title {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--fg);
}

.header-action {
  padding: 8rpx 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-action-text {
  font-size: 24rpx;
  color: var(--muted);
}

.chat-body {
  flex: 1;
  overflow: hidden;
}

.message-scroll {
  height: 100%;
}

.scroll-anchor {
  height: 24rpx;
}
</style>
