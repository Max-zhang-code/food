<template>
  <view class="tab-bar">
    <view
      v-for="(item, index) in TAB_BAR_ITEMS"
      :key="item.pagePath"
      class="tab-bar-item"
      @tap="switchTab(index)"
    >
      <view class="tab-icon" :class="{ active: current === index }">
        <template v-if="item.icon === 'menu'">
          <view class="menu-line" />
          <view class="menu-bowl" />
        </template>
        <template v-else-if="item.icon === 'order'">
          <view class="order-body">
            <view class="order-line" />
            <view class="order-line" />
            <view class="order-line short" />
          </view>
        </template>
        <template v-else>
          <view class="mine-head" />
          <view class="mine-body" />
        </template>
      </view>
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
  gap: 6rpx;
}

.tab-icon {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
}

.tab-icon.active {
  color: #07c160;
}

.tab-text {
  font-size: 22rpx;
  color: #999;
  line-height: 1;
}

.tab-text.active {
  color: #07c160;
}

.menu-line {
  width: 36rpx;
  height: 4rpx;
  border-radius: 2rpx;
  background: currentColor;
  margin-bottom: 4rpx;
}

.menu-bowl {
  width: 32rpx;
  height: 22rpx;
  border: 4rpx solid currentColor;
  border-top: none;
  border-radius: 0 0 16rpx 16rpx;
}

.order-body {
  width: 30rpx;
  height: 38rpx;
  border: 4rpx solid currentColor;
  border-radius: 6rpx;
  padding: 8rpx 6rpx;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.order-line {
  height: 4rpx;
  border-radius: 2rpx;
  background: currentColor;
}

.order-line.short {
  width: 60%;
}

.mine-head {
  width: 16rpx;
  height: 16rpx;
  border: 4rpx solid currentColor;
  border-radius: 50%;
  margin-bottom: 2rpx;
}

.mine-body {
  width: 30rpx;
  height: 14rpx;
  border: 4rpx solid currentColor;
  border-bottom: none;
  border-radius: 16rpx 16rpx 0 0;
}
</style>
