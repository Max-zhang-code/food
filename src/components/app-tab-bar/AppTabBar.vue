<template>
  <view class="tab-bar">
    <view
      v-for="(item, index) in TAB_BAR_ITEMS"
      :key="item.pagePath"
      class="tab-bar-item"
      @tap="switchTab(index)"
    >
      <text class="tab-emoji">{{ item.emoji }}</text>
      <text class="tab-text" :class="{ active: current === index }">{{ item.text }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { TAB_BAR_ITEMS } from '@/constants/tab-bar'

const props = defineProps<{
  current: number
}>()

const switchTab = (index: number) => {
  if (index === props.current) return
  uni.switchTab({ url: `/${TAB_BAR_ITEMS[index].pagePath}` })
}
</script>

<style scoped>
.tab-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  height: calc(100rpx + env(safe-area-inset-bottom));
  padding-bottom: env(safe-area-inset-bottom);
  background: #fff;
  border-top: 1rpx solid #eee;
  z-index: 9999;
}

.tab-bar-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
}

.tab-emoji {
  font-size: 40rpx;
  line-height: 1;
}

.tab-text {
  font-size: 22rpx;
  color: #999;
}

.tab-text.active {
  color: #FF6B4A;
}
</style>
