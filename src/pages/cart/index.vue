<template>
  <view class="container">
    <view v-if="cartStore.items.length === 0" class="empty">
      <text class="empty-icon">🛒</text>
      <text class="empty-text">购物车是空的，去首页选菜吧</text>
    </view>

    <view v-else>
      <view v-for="item in cartStore.items" :key="item.dish_id" class="cart-item">
        <image v-if="item.dish_image" :src="item.dish_image" class="dish-img" mode="aspectFill" />
        <view v-else class="dish-placeholder" />
        <view class="item-info">
          <view class="item-name">{{ item.dish_name }}</view>
        </view>
        <view class="item-qty">
          <button size="mini" @click="cartStore.updateQuantity(item.dish_id, item.quantity - 1)">-</button>
          <text class="qty">{{ item.quantity }}</text>
          <button size="mini" @click="cartStore.updateQuantity(item.dish_id, item.quantity + 1)">+</button>
        </view>
      </view>

      <view class="footer">
        <text class="total">共 {{ cartStore.totalCount }} 道菜</text>
        <button class="submit-btn" :disabled="submitting" @click="handleSubmit">
          {{ submitting ? '提交中...' : '确认下单' }}
        </button>
      </view>
    </view>

    <AppTabBar :current="1" />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useCartStore } from '@/stores/cart'
import { useOrderStore } from '@/stores/order'
import AppTabBar from '@/components/app-tab-bar/AppTabBar.vue'

const cartStore = useCartStore()
const orderStore = useOrderStore()
const submitting = ref(false)

const handleSubmit = async () => {
  if (cartStore.items.length === 0) {
    uni.showToast({ title: '请先选择菜品', icon: 'none' })
    return
  }
  submitting.value = true
  try {
    await orderStore.submitOrder(cartStore.items)
    cartStore.clear()
    wx.setStorageSync('forceOrderRefresh', true)
    uni.showToast({ title: '下单成功！', icon: 'success' })
    setTimeout(() => uni.switchTab({ url: '/pages/order/index' }), 1000)
  } catch (e: any) {
    uni.showToast({ title: e.message || '下单失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.container { padding: 20rpx; padding-bottom: calc(140rpx + env(safe-area-inset-bottom)); }
.empty { display: flex; flex-direction: column; align-items: center; padding: 200rpx 0; }
.empty-icon { font-size: 80rpx; }
.empty-text { font-size: 28rpx; color: #999; margin-top: 20rpx; }

.cart-item {
  display: flex; align-items: center; gap: 16rpx;
  background: #fff; border-radius: 20rpx; padding: 20rpx; margin-bottom: 16rpx;
}
.dish-img { width: 80rpx; height: 80rpx; border-radius: 16rpx; flex-shrink: 0; }
.dish-placeholder { width: 80rpx; height: 80rpx; border-radius: 16rpx; background: #f0f0f0; flex-shrink: 0; }
.item-info { flex: 1; min-width: 0; }
.item-name { font-size: 28rpx; font-weight: bold; }
.item-qty { display: flex; align-items: center; gap: 12rpx; flex-shrink: 0; }
.qty { font-size: 28rpx; font-weight: bold; min-width: 36rpx; text-align: center; }

.footer {
  position: fixed; bottom: calc(100rpx + env(safe-area-inset-bottom)); left: 0; right: 0;
  background: #fff; padding: 24rpx 40rpx; display: flex; justify-content: space-between; align-items: center;
  box-shadow: 0 -2rpx 8rpx rgba(0,0,0,0.06);
}
.total { font-size: 30rpx; }
.submit-btn { background: #FF6B4A; color: #fff; border: none; padding: 12rpx 40rpx; }
</style>
