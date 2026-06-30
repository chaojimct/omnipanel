<template>
  <view class="page" :class="themeClass">
    <scroll-view scroll-y class="scroll-body" :show-scrollbar="false">
      <view class="hero op-card">
        <view class="hero-logo">OP</view>
        <view class="hero-text">
          <text class="hero-title">{{ t('dashboard.title') }}</text>
          <text class="hero-subtitle">{{ t('dashboard.subtitle') }}</text>
        </view>
      </view>

      <view class="section">
        <text class="op-section-title">{{ t('dashboard.quickConnect') }}</text>
        <view class="module-grid">
          <view
            v-for="item in modules"
            :key="item.id"
            class="module-item op-card"
            @tap="onModuleTap(item)"
          >
            <view class="module-icon" :style="{ background: item.bg }">
              <text class="module-icon-text">{{ item.short }}</text>
            </view>
            <text class="module-label">{{ t(item.labelKey) }}</text>
          </view>
        </view>
      </view>

      <view class="section">
        <text class="op-section-title">{{ t('dashboard.resources') }}</text>
        <view class="op-card resource-card">
          <view v-for="bar in resourceBars" :key="bar.id" class="resource-row">
            <view class="resource-head">
              <text class="resource-label">{{ t(bar.labelKey) }}</text>
              <text class="resource-value">{{ bar.value }}</text>
            </view>
            <view class="op-progress-track">
              <view
                class="op-progress-fill"
                :style="{ width: bar.width, background: bar.color }"
              />
            </view>
          </view>
        </view>
      </view>

      <view class="section">
        <text class="op-section-title">{{ t('dashboard.recentTasks') }}</text>
        <view class="op-card task-list">
          <view v-for="task in tasks" :key="task.id" class="task-row">
            <view class="op-status-dot" :class="task.dotClass" />
            <view class="task-main">
              <text class="task-name">{{ t(task.labelKey) }}</text>
              <text class="task-info op-muted">{{ task.info }}</text>
            </view>
            <text class="task-badge" :class="task.badgeClass">{{ t(task.statusKey) }}</text>
          </view>
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

export default {
  components: { AppTabBar },
  mixins: [pageMixin],
  data() {
    return {
      tabIndex: 0,
      modules: [
        { id: 'terminal', short: 'T', labelKey: 'dashboard.modules.terminal', bg: 'rgba(0,122,255,0.15)' },
        { id: 'ssh', short: 'S', labelKey: 'dashboard.modules.ssh', bg: 'rgba(48,209,88,0.15)' },
        { id: 'database', short: 'DB', labelKey: 'dashboard.modules.database', bg: 'rgba(255,159,10,0.15)' },
        { id: 'docker', short: 'D', labelKey: 'dashboard.modules.docker', bg: 'rgba(0,122,255,0.15)' },
        { id: 'files', short: 'F', labelKey: 'dashboard.modules.files', bg: 'rgba(255,59,48,0.12)' },
      ],
      resourceBars: [
        { id: 'cpu', labelKey: 'dashboard.cpu', value: '42%', width: '42%', color: 'var(--success)' },
        { id: 'memory', labelKey: 'dashboard.memory', value: '68%', width: '68%', color: 'var(--warn)' },
        { id: 'disk', labelKey: 'dashboard.disk', value: '51%', width: '51%', color: 'var(--success)' },
      ],
      tasks: [
        {
          id: '1',
          labelKey: 'dashboard.tasks.dbSync',
          info: 'MySQL → PostgreSQL',
          dotClass: 'success',
          badgeClass: 'running',
          statusKey: 'dashboard.statusRunning',
        },
        {
          id: '2',
          labelKey: 'dashboard.tasks.vectorize',
          info: '128 / 256 docs',
          dotClass: 'warn',
          badgeClass: 'running',
          statusKey: 'dashboard.statusRunning',
        },
        {
          id: '3',
          labelKey: 'dashboard.tasks.deploy',
          info: 'nginx:latest',
          dotClass: 'muted',
          badgeClass: 'idle',
          statusKey: 'dashboard.statusIdle',
        },
      ],
    }
  },
  onShow() {
    this.syncPageState()
    this.setTabSelected(0)
  },
  onLoad() {
    uni.setNavigationBarTitle({ title: this.t('tabBar.dashboard') })
  },
  watch: {
    locale() {
      uni.setNavigationBarTitle({ title: this.t('tabBar.dashboard') })
    },
  },
  methods: {
    onModuleTap(item) {
      if (item.id === 'terminal' || item.id === 'ssh') {
        uni.showToast({ title: this.t('dashboard.modules.' + item.id), icon: 'none' })
        return
      }
      uni.switchTab({ url: '/pages/tabBar/ai-assistant' })
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

.hero {
  display: flex;
  align-items: center;
  gap: 24rpx;
  margin-bottom: 32rpx;
}

.hero-logo {
  width: 88rpx;
  height: 88rpx;
  border-radius: 12rpx;
  background: var(--accent);
  color: #fff;
  font-size: 28rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-text {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.hero-title {
  font-size: 36rpx;
  font-weight: 700;
  color: var(--fg);
}

.hero-subtitle {
  font-size: 24rpx;
  color: var(--muted);
}

.section {
  margin-bottom: 32rpx;
}

.module-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
}

.module-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  padding: 24rpx 12rpx;
}

.module-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.module-icon-text {
  font-size: 22rpx;
  font-weight: 700;
  color: var(--accent);
}

.module-label {
  font-size: 24rpx;
  color: var(--fg-2);
  text-align: center;
}

.resource-card {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.resource-head {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8rpx;
}

.resource-label {
  font-size: 26rpx;
  color: var(--fg);
}

.resource-value {
  font-size: 24rpx;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}

.task-list {
  display: flex;
  flex-direction: column;
}

.task-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 20rpx 0;
  border-bottom: 1px solid var(--border-soft);
}

.task-row:last-child {
  border-bottom: none;
}

.task-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.task-name {
  font-size: 28rpx;
  color: var(--fg);
}

.task-badge {
  font-size: 22rpx;
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
}

.task-badge.running {
  background: var(--success-soft);
  color: var(--success);
}

.task-badge.idle {
  background: var(--accent-soft);
  color: var(--accent);
}

.bottom-spacer {
  height: calc(80rpx + env(safe-area-inset-bottom));
}
</style>
