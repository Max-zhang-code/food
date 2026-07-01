<template>
  <view class="container">
    <view v-if="cartStore.items.length === 0" class="empty">
      <text class="empty-icon">🛒</text>
      <text class="empty-text">购物车是空的，去首页选菜吧</text>
    </view>

    <view v-else>
      <view v-for="item in cartStore.items" :key="item.dish_id" class="cart-item">
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
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useCartStore } from '@/stores/cart'
import { useOrderStore } from '@/stores/order'

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
.container { padding: 20rpx; }
.empty { display: flex; flex-direction: column; align-items: center; padding: 200rpx 0; }
.empty-icon { font-size: 80rpx; }
.empty-text { font-size: 28rpx; color: #999; margin-top: 20rpx; }

.cart-item {
  display: flex; justify-content: space-between; align-items: center;
  background: #fff; border-radius: 12rpx; padding: 24rpx; margin-bottom: 16rpx;
}
.item-name { font-size: 30rpx; font-weight: bold; }
.item-qty { display: flex; align-items: center; gap: 16rpx; }
.qty { font-size: 32rpx; font-weight: bold; min-width: 40rpx; text-align: center; }

.footer {
  position: fixed; bottom: 0; left: 0; right: 0; background: #fff;
  padding: 24rpx 40rpx; display: flex; justify-content: space-between; align-items: center;
  box-shadow: 0 -2rpx 8rpx rgba(0,0,0,0.06);
}
.total { font-size: 30rpx; }
.submit-btn { background: #07C160; color: #fff; border: none; padding: 12rpx 40rpx; }
</style>
