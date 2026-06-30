<template>
  <view class="loading-dots">
    <view
      v-for="(dot, index) in dots"
      :key="index"
      :class="['dot', `dot-${index + 1}`]"
    ></view>
  </view>
</template>

<script>
export default {
  name: 'LoadingDots',
  data() {
    return {
      dots: [1, 2, 3, 4],
    }
  },
}
</script>

<style scoped>
.loading-dots {
  display: flex;
  justify-content: space-between;
  width: 80rpx;
  height: 20rpx;
}

.dot {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background-color: var(--muted);
  animation: loading 1.5s infinite;
}

.dot-2 { animation-delay: 0.375s; }
.dot-3 { animation-delay: 0.75s; }
.dot-4 { animation-delay: 1.125s; }

@keyframes loading {
  0%, 50%, 100% { opacity: 0.2; }
  25% { opacity: 1; }
}
</style>
