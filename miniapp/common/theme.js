const STORAGE_KEY = 'omnipanel_theme'

export const THEME_MODES = ['system', 'light', 'dark']

export function getStoredTheme() {
  const stored = uni.getStorageSync(STORAGE_KEY)
  return THEME_MODES.includes(stored) ? stored : 'system'
}

export function setStoredTheme(mode) {
  uni.setStorageSync(STORAGE_KEY, mode)
}

export function getSystemTheme() {
  try {
    const info = uni.getSystemInfoSync()
    if (info.theme === 'dark' || info.theme === 'light') {
      return info.theme
    }
  } catch (e) {
    // ignore
  }
  return 'dark'
}

export function resolveTheme(mode) {
  if (mode === 'system') {
    return getSystemTheme()
  }
  return mode === 'light' ? 'light' : 'dark'
}

export function applyTheme(mode) {
  const resolved = resolveTheme(mode)
  const app = getApp()
  if (app && app.globalData) {
    app.globalData.themeMode = mode
    app.globalData.resolvedTheme = resolved
  }
  uni.$emit('theme-change', { mode, resolved })
  return resolved
}

export function initTheme() {
  const mode = getStoredTheme()
  return applyTheme(mode)
}

export function watchSystemTheme() {
  if (typeof uni.onThemeChange !== 'function') return
  uni.onThemeChange(({ theme }) => {
    const app = getApp()
    if (!app?.globalData || app.globalData.themeMode !== 'system') return
    app.globalData.resolvedTheme = theme === 'light' ? 'light' : 'dark'
    uni.$emit('theme-change', { mode: 'system', resolved: app.globalData.resolvedTheme })
  })
}
