import App from './App'

// #ifndef VUE3
import Vue from 'vue'
import './uni.promisify.adaptor'
Vue.config.productionTip = false
App.mpType = 'app'
const app = new Vue({
  ...App
})
app.$mount()
// #endif

// #ifdef VUE3
import { createSSRApp } from 'vue'

// 简易事件总线，供主题/语言切换通知各页面
const bus = {
  events: {},
  $on(name, fn) {
    if (!this.events[name]) this.events[name] = []
    this.events[name].push(fn)
  },
  $off(name, fn) {
    if (!this.events[name]) return
    if (!fn) {
      delete this.events[name]
      return
    }
    this.events[name] = this.events[name].filter((item) => item !== fn)
  },
  $emit(name, payload) {
    ;(this.events[name] || []).forEach((fn) => fn(payload))
  },
}

if (!uni.$on) {
  uni.$on = bus.$on.bind(bus)
  uni.$off = bus.$off.bind(bus)
  uni.$emit = bus.$emit.bind(bus)
}

export function createApp() {
  const app = createSSRApp(App)
  return {
    app
  }
}
// #endif
