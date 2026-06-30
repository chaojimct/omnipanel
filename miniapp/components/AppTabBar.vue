<template>
  <view class="tab-bar" :class="'theme-' + resolvedTheme">
    <view
      v-for="(item, index) in tabs"
      :key="item.pagePath"
      class="tab-item"
      @tap="switchTab(index)"
    >
      <text class="tab-icon" :class="{ active: selected === index }">{{ item.icon }}</text>
      <text class="tab-text" :class="{ active: selected === index }">{{ item.text }}</text>
    </view>
  </view>
</template>

<script>
import { t, getLocale } from '@/common/i18n/index.js'

export default {
  name: 'AppTabBar',
  props: {
    selected: {
      type: Number,
      default: 0,
    },
  },
  data() {
    return {
      resolvedTheme: 'dark',
      locale: getLocale(),
    }
  },
  computed: {
    tabs() {
      return [
        {
          pagePath: '/pages/tabBar/dashboard',
          icon: '⌂',
          text: t('tabBar.dashboard'),
        },
        {
          pagePath: '/pages/tabBar/ai-assistant',
          icon: '✦',
          text: t('tabBar.ai'),
        },
        {
          pagePath: '/pages/tabBar/profile',
          icon: '☺',
          text: t('tabBar.profile'),
        },
      ]
    },
  },
  mounted() {
    this.refresh()
    this._onThemeChange = ({ resolved }) => {
      this.resolvedTheme = resolved
    }
    this._onLocaleChange = (next) => {
      this.locale = next
    }
    uni.$on('theme-change', this._onThemeChange)
    uni.$on('locale-change', this._onLocaleChange)
  },
  unmounted() {
    if (this._onThemeChange) uni.$off('theme-change', this._onThemeChange)
    if (this._onLocaleChange) uni.$off('locale-change', this._onLocaleChange)
  },
  methods: {
    refresh() {
      const app = getApp()
      if (app?.globalData) {
        this.resolvedTheme = app.globalData.resolvedTheme || 'dark'
        this.locale = app.globalData.locale || getLocale()
      }
    },
    switchTab(index) {
      const item = this.tabs[index]
      if (!item) return
      uni.switchTab({ url: item.pagePath })
    },
  },
}
</script>

<style scoped>
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: calc(72rpx + env(safe-area-inset-bottom));
  padding-bottom: env(safe-area-inset-bottom);
  display: flex;
  z-index: 9999;
  border-top: 1px solid var(--tabbar-border, #464343);
  background: var(--tabbar-bg, #1a1717);
}

.tab-bar.theme-light {
  --tabbar-bg: #ffffff;
  --tabbar-border: #d2d2d7;
  --muted: #86868b;
  --accent: #007aff;
}

.tab-bar.theme-dark {
  --tabbar-bg: #1a1717;
  --tabbar-border: #464343;
  --muted: #9a9898;
  --accent: #007aff;
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2rpx;
  padding-top: 6rpx;
}

.tab-icon {
  font-size: 30rpx;
  line-height: 1;
  color: var(--muted);
}

.tab-icon.active {
  color: var(--accent);
}

.tab-text {
  font-size: 18rpx;
  color: var(--muted);
}

.tab-text.active {
  color: var(--accent);
  font-weight: 600;
}
</style>
