import zhCN from './zh-CN'
import enUS from './en-US'

const STORAGE_KEY = 'omnipanel_locale'
const messages = {
  'zh-CN': zhCN,
  'en-US': enUS,
}

let locale = 'zh-CN'

export const LOCALES = ['zh-CN', 'en-US']

export function getLocale() {
  return locale
}

export function getStoredLocale() {
  const stored = uni.getStorageSync(STORAGE_KEY)
  return LOCALES.includes(stored) ? stored : 'zh-CN'
}

export function setLocale(next) {
  if (!LOCALES.includes(next)) return locale
  locale = next
  uni.setStorageSync(STORAGE_KEY, next)
  const app = getApp()
  if (app?.globalData) {
    app.globalData.locale = next
  }
  uni.$emit('locale-change', next)
  return locale
}

export function initLocale() {
  locale = getStoredLocale()
  const app = getApp()
  if (app?.globalData) {
    app.globalData.locale = locale
  }
  return locale
}

export function t(key, params) {
  const parts = key.split('.')
  let value = messages[locale]
  for (const part of parts) {
    value = value?.[part]
  }
  if (typeof value !== 'string') return key
  if (!params) return value
  return Object.keys(params).reduce(
    (text, name) => text.replace(new RegExp(`\\{${name}\\}`, 'g'), String(params[name])),
    value,
  )
}

export function createI18nMixin() {
  return {
    methods: {
      t(key, params) {
        return t(key, params)
      },
      syncLocale() {
        this.locale = getLocale()
      },
    },
    computed: {
      localeLabel() {
        return this.locale === 'zh-CN' ? '简体中文' : 'English'
      },
    },
  }
}
