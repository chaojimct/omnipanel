import { getLocale } from './i18n/index.js'
import { createI18nMixin } from './i18n/index.js'

const i18nMixin = createI18nMixin()

export default {
  data() {
    const app = getApp()
    return {
      resolvedTheme: app?.globalData?.resolvedTheme || 'dark',
      themeMode: app?.globalData?.themeMode || 'system',
      locale: app?.globalData?.locale || getLocale(),
    }
  },
  mixins: [i18nMixin],
  onShow() {
    this.syncPageState()
    this.updateTabBar?.()
  },
  onLoad() {
    this._onThemeChange = ({ resolved, mode }) => {
      this.resolvedTheme = resolved
      this.themeMode = mode
    }
    this._onLocaleChange = (next) => {
      this.locale = next
      this.updateTabBar?.()
    }
    uni.$on('theme-change', this._onThemeChange)
    uni.$on('locale-change', this._onLocaleChange)
  },
  onUnload() {
    if (this._onThemeChange) uni.$off('theme-change', this._onThemeChange)
    if (this._onLocaleChange) uni.$off('locale-change', this._onLocaleChange)
  },
  methods: {
    syncPageState() {
      const app = getApp()
      if (app?.globalData) {
        this.resolvedTheme = app.globalData.resolvedTheme
        this.themeMode = app.globalData.themeMode
        this.locale = app.globalData.locale
      }
      uni.setNavigationBarColor({
        frontColor: this.resolvedTheme === 'light' ? '#000000' : '#ffffff',
        backgroundColor: this.resolvedTheme === 'light' ? '#f5f5f7' : '#201d1d',
      })
    },
    updateTabBar() {
      // #ifdef MP-WEIXIN
      const pages = getCurrentPages()
      const page = pages[pages.length - 1]
      if (page && typeof page.getTabBar === 'function') {
        const tabBar = page.getTabBar()
        if (tabBar && typeof tabBar.refresh === 'function') {
          tabBar.refresh()
        }
      }
      // #endif
    },
    setTabSelected(index) {
      // #ifdef MP-WEIXIN
      const pages = getCurrentPages()
      const page = pages[pages.length - 1]
      if (page && typeof page.getTabBar === 'function') {
        const tabBar = page.getTabBar()
        if (tabBar) {
          if (typeof tabBar.refresh === 'function') {
            tabBar.refresh()
          }
          tabBar.setData({ selected: index })
        }
      }
      // #endif
      // #ifndef MP-WEIXIN
      this.tabIndex = index
      // #endif
    },
  },
  computed: {
    themeClass() {
      return `theme-${this.resolvedTheme}`
    },
  },
}
