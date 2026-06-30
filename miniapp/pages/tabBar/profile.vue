<template>
  <view class="page" :class="themeClass">
    <scroll-view scroll-y class="scroll-body">
      <view class="profile-header">
        <view class="avatar">
          <text class="avatar-text">OP</text>
        </view>
        <view class="profile-info">
          <text class="profile-name">{{ t('profile.guest') }}</text>
          <text class="profile-hint op-muted">{{ t('profile.hint') }}</text>
        </view>
      </view>

      <view class="section">
        <text class="op-section-title">{{ t('profile.settings') }}</text>
        <view class="op-card setting-list">
          <view class="setting-row">
            <text class="setting-label">{{ t('profile.language') }}</text>
            <view class="segmented">
              <view
                v-for="item in localeOptions"
                :key="item.value"
                class="segment-item"
                :class="{ active: locale === item.value }"
                @tap="changeLocale(item.value)"
              >
                {{ item.label }}
              </view>
            </view>
          </view>

          <view class="setting-divider" />

          <view class="setting-row column">
            <text class="setting-label">{{ t('profile.theme') }}</text>
            <view class="theme-options">
              <view
                v-for="item in themeOptions"
                :key="item.value"
                class="theme-chip"
                :class="{ active: themeMode === item.value }"
                @tap="changeTheme(item.value)"
              >
                <view class="theme-preview" :class="item.preview" />
                <text class="theme-label">{{ t(item.labelKey) }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view class="section">
        <text class="op-section-title">{{ t('profile.about') }}</text>
        <view class="op-card about-card">
          <view class="about-row">
            <text class="about-label">{{ t('profile.title') }}</text>
            <text class="about-value">OmniPanel</text>
          </view>
          <view class="about-row">
            <text class="about-label">{{ t('profile.version') }}</text>
            <text class="about-value">1.0.0</text>
          </view>
          <text class="about-desc op-muted">{{ t('dashboard.subtitle') }}</text>
        </view>
      </view>

      <view class="bottom-spacer" />
    </scroll-view>
    <!-- #ifndef MP-WEIXIN -->
    <AppTabBar :selected="tabIndex" />
    <!-- #endif -->
  </view>
</template>

<script>
import pageMixin from '@/common/pageMixin.js'
import AppTabBar from '@/components/AppTabBar.vue'
import { setLocale, LOCALES } from '@/common/i18n/index.js'
import { setStoredTheme, applyTheme, THEME_MODES } from '@/common/theme.js'

export default {
  components: { AppTabBar },
  mixins: [pageMixin],
  data() {
    return {
      tabIndex: 2,
      localeOptions: [
        { value: 'zh-CN', label: '中文' },
        { value: 'en-US', label: 'EN' },
      ],
      themeOptions: [
        { value: 'system', labelKey: 'profile.themeSystem', preview: 'preview-system' },
        { value: 'light', labelKey: 'profile.themeLight', preview: 'preview-light' },
        { value: 'dark', labelKey: 'profile.themeDark', preview: 'preview-dark' },
      ],
    }
  },
  onShow() {
    this.syncPageState()
    this.setTabSelected(2)
  },
  onLoad() {
    uni.setNavigationBarTitle({ title: this.t('tabBar.profile') })
  },
  watch: {
    locale() {
      uni.setNavigationBarTitle({ title: this.t('tabBar.profile') })
    },
  },
  methods: {
    changeLocale(next) {
      if (!LOCALES.includes(next) || next === this.locale) return
      setLocale(next)
      this.locale = next
      this.updateTabBar()
    },
    changeTheme(mode) {
      if (!THEME_MODES.includes(mode) || mode === this.themeMode) return
      setStoredTheme(mode)
      const resolved = applyTheme(mode)
      this.themeMode = mode
      this.resolvedTheme = resolved
      this.syncPageState()
      this.updateTabBar()
    },
  },
}
</script>

<style scoped>
@import '@/common/omnipanel.css';

.page {
  min-height: 100vh;
  background: var(--bg);
}

.scroll-body {
  height: 100vh;
  padding: 24rpx;
  padding-bottom: calc(80rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 32rpx 8rpx 40rpx;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 24rpx;
  background: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-text {
  font-size: 36rpx;
  font-weight: 700;
  color: #fff;
}

.profile-info {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.profile-name {
  font-size: 36rpx;
  font-weight: 600;
  color: var(--fg);
}

.profile-hint {
  font-size: 24rpx;
}

.section {
  margin-bottom: 32rpx;
}

.setting-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.setting-row.column {
  flex-direction: column;
  align-items: stretch;
}

.setting-label {
  font-size: 28rpx;
  color: var(--fg);
  font-weight: 500;
}

.setting-divider {
  height: 1px;
  background: var(--border-soft);
}

.segmented {
  display: flex;
  background: var(--bg-deeper);
  border-radius: 10rpx;
  padding: 4rpx;
}

.segment-item {
  padding: 12rpx 24rpx;
  font-size: 24rpx;
  color: var(--muted);
  border-radius: 8rpx;
}

.segment-item.active {
  background: var(--surface);
  color: var(--accent);
  font-weight: 600;
}

.theme-options {
  display: flex;
  gap: 16rpx;
  margin-top: 16rpx;
}

.theme-chip {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  padding: 20rpx 12rpx;
  border: 2px solid var(--border-soft);
  border-radius: 12rpx;
}

.theme-chip.active {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.theme-preview {
  width: 64rpx;
  height: 64rpx;
  border-radius: 12rpx;
  border: 1px solid var(--border);
}

.preview-light { background: linear-gradient(135deg, #f5f5f7 50%, #ffffff 50%); }
.preview-dark { background: linear-gradient(135deg, #201d1d 50%, #302c2c 50%); }
.preview-system { background: linear-gradient(135deg, #f5f5f7 50%, #201d1d 50%); }

.theme-label {
  font-size: 22rpx;
  color: var(--fg-2);
}

.about-card {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.about-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.about-label {
  font-size: 26rpx;
  color: var(--muted);
}

.about-value {
  font-size: 26rpx;
  color: var(--fg);
  font-weight: 500;
}

.about-desc {
  font-size: 24rpx;
  line-height: 1.6;
  margin-top: 8rpx;
}

.bottom-spacer {
  height: calc(80rpx + env(safe-area-inset-bottom));
}
</style>
