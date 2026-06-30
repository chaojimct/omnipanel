const LABELS = {
  'zh-CN': {
    dashboard: '仪表盘',
    ai: 'AI 助手',
    profile: '我的',
  },
  'en-US': {
    dashboard: 'Dashboard',
    ai: 'AI Assistant',
    profile: 'Profile',
  },
}

function buildList(locale) {
  const labels = LABELS[locale] || LABELS['zh-CN']
  return [
    { pagePath: '/pages/tabBar/dashboard', icon: '⌂', text: labels.dashboard },
    { pagePath: '/pages/tabBar/ai-assistant', icon: '✦', text: labels.ai },
    { pagePath: '/pages/tabBar/profile', icon: '☺', text: labels.profile },
  ]
}

Component({
  data: {
    selected: 0,
    resolvedTheme: 'dark',
    list: buildList('zh-CN'),
  },
  lifetimes: {
    attached() {
      this.refresh()
    },
  },
  methods: {
    refresh() {
      const app = getApp()
      const locale =
        (app && app.globalData && app.globalData.locale) ||
        wx.getStorageSync('omnipanel_locale') ||
        'zh-CN'
      const resolvedTheme =
        (app && app.globalData && app.globalData.resolvedTheme) || 'dark'
      this.setData({
        resolvedTheme,
        list: buildList(locale),
      })
    },
    switchTab(e) {
      const { path, index } = e.currentTarget.dataset
      if (!path) return
      wx.switchTab({ url: path })
      this.setData({ selected: index })
    },
  },
})
