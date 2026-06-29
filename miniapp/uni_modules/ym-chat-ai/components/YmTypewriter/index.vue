<template>
  <view class="typewriter">
    {{ displayedText }}
    <text v-if="showCursor" class="cursor">{{ cursorSuffix }}</text>
  </view>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted, computed } from 'vue'

interface Props {
  text?: string
  speed?: number
  mode?: 'normal' | 'cursor'
  cursorSuffix?: string
  pauseOnComplete?: boolean
  onComplete?: () => void
}

const props = withDefaults(defineProps<Props>(), {
  text: '',
  speed: 50,
  mode: 'normal',
  cursorSuffix: '|',
  pauseOnComplete: false
})

const emit = defineEmits<{
  complete: []
  start: []
}>()

const displayedText = ref('')
const showCursor = ref(false)
const isTyping = ref(false)
const isPaused = ref(false)

// 使用更准确的类型声明
let typeTimer: ReturnType<typeof setInterval> | null = null
let cursorTimer: ReturnType<typeof setInterval> | null = null

// 计算属性：检查文本是否已完全显示
const isComplete = computed(() => displayedText.value === props.text)

// 清理所有定时器
const cleanup = () => {
  if (typeTimer) {
    clearInterval(typeTimer)
    typeTimer = null
  }
  if (cursorTimer) {
    clearInterval(cursorTimer)
    cursorTimer = null
  }
  isTyping.value = false
}

// 开始光标闪烁
const startCursorBlink = () => {
  if (props.mode === 'cursor') {
    showCursor.value = true
    cursorTimer = setInterval(() => {
      showCursor.value = !showCursor.value
    }, 500)
  }
}

// 停止光标闪烁
const stopCursorBlink = () => {
  if (cursorTimer) {
    clearInterval(cursorTimer)
    cursorTimer = null
  }
  showCursor.value = false
}

// 打字效果核心逻辑
const typeText = () => {
  // 如果文本为空，直接返回
  if (!props.text) {
    displayedText.value = ''
    cleanup()
    return
  }

  // 如果正在打字且文本相同，不重新开始
  if (isTyping.value && displayedText.value === props.text) {
    return
  }

  // 清理之前的定时器
  cleanup()
  
  // 重置状态
  displayedText.value = ''
  isPaused.value = false
  isTyping.value = true
  
  emit('start')
  
  let index = 0
  const textLength = props.text.length
  
  // 开始光标闪烁
  startCursorBlink()
  
  // 打字定时器
  typeTimer = setInterval(() => {
    if (index < textLength && !isPaused.value) {
      displayedText.value += props.text.charAt(index)
      index++
    } else if (index >= textLength) {
      // 完成打字
      cleanup()
      stopCursorBlink()
      
      // 根据模式决定是否显示光标
      if (props.mode === 'cursor' && props.pauseOnComplete) {
        showCursor.value = true
      }
      
      emit('complete')
      props.onComplete?.()
    }
  }, props.speed)
}

// 暂停打字
const pause = () => {
  isPaused.value = true
}

// 恢复打字
const resume = () => {
  isPaused.value = false
}

// 重置打字效果
const reset = () => {
  cleanup()
  stopCursorBlink()
  displayedText.value = ''
  isPaused.value = false
}

// 暴露方法给父组件
defineExpose({
  pause,
  resume,
  reset,
  isTyping: computed(() => isTyping.value),
  isComplete
})

// 监听文本变化，重新开始打字效果
watch(() => props.text, (newText, oldText) => {
  // 只有当文本真正改变时才重新开始
  if (newText !== oldText) {
    typeText()
  }
}, { immediate: true })

// 监听模式变化
watch(() => props.mode, () => {
  if (isComplete.value) {
    // 如果已完成，根据新模式调整光标显示
    if (props.mode === 'cursor' && props.pauseOnComplete) {
      showCursor.value = true
    } else {
      showCursor.value = false
    }
  }
})

// 组件卸载时清理定时器
onUnmounted(() => {
  cleanup()
  stopCursorBlink()
})
</script>

<style scoped>
.typewriter {
  font-family: monospace;
  display: inline-block;
  white-space: pre-wrap; /* 保持换行和空格 */
}

.cursor {
  display: inline-block;
  animation: blink 1s infinite;
  color: currentColor;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* 可选：添加打字机声音效果（需要音频文件） */
.typewriter.typing {
  /* 可以在这里添加打字机声音的CSS动画 */
}
</style>
