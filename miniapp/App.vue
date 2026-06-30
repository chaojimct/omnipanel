<script>
import { initTheme, watchSystemTheme } from './common/theme.js'
import { initLocale } from './common/i18n/index.js'
import './common/omnipanel.css'

export default {
  globalData: {
    themeMode: 'system',
    resolvedTheme: 'dark',
    locale: 'zh-CN',
  },
  onLaunch() {
    initLocale()
    initTheme()
    watchSystemTheme()
  },
}
</script>

<style>
@import './common/omnipanel.css';
</style>
