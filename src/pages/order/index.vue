<template>
  <view class="container">
    <!-- 内部 tab 切换 -->
    <view class="tabs">
      <view
        class="tab"
        :class="{ active: currentTab === 'active' }"
        @click="switchTab('active')"
      >进行中</view>
      <view
        class="tab"
        :class="{ active: currentTab === 'history' }"
        @click="switchTab('history')"
      >历史</view>
    </view>

    <view v-if="loading" class="loading">加载中...</view>

    <!-- 进行中订单 -->
    <view v-else-if="currentTab === 'active'">
      <view v-if="activeOrders.length === 0" class="empty">暂无进行中订单</view>
      <view v-for="order in activeOrders" :key="order._id" class="order-card">
        <view class="order-header">
          <image v-if="order.user_avatar" :src="order.user_avatar" class="order-avatar" />
          <view v-else class="order-avatar-placeholder" />
          <text class="order-user">{{ order.user_name }}</text>
          <text class="order-time">{{ formatTime(order.created_at) }}</text>
        </view>
        <view v-for="item in order.items" :key="item.dish_id" class="order-item">
          <text>{{ item.dish_name }} × {{ item.quantity }}</text>
        </view>
        <view class="order-footer">
          <button size="mini" class="complete-btn" @click="handleComplete(order._id)">
            完成
          </button>
        </view>
      </view>
    </view>

    <!-- 历史订单 -->
    <view v-else>
      <view v-if="historyOrders.length === 0" class="empty">暂无历史订单</view>
      <view v-for="order in historyOrders" :key="order._id" class="order-card done">
        <view class="order-header">
          <image v-if="order.user_avatar" :src="order.user_avatar" class="order-avatar" />
          <view v-else class="order-avatar-placeholder" />
          <text class="order-user">{{ order.user_name }}</text>
          <text class="order-time">{{ formatTime(order.completed_at || order.created_at) }}</text>
        </view>
        <view v-for="item in order.items" :key="item.dish_id" class="order-item">
          <text>{{ item.dish_name }} × {{ item.quantity }}</text>
        </view>
      </view>
      <view v-if="hasMore" class="load-more" @click="loadMore">加载更多</view>
    </view>

    <AppTabBar :current="2" />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useOrderStore } from '@/stores/order'
import AppTabBar from '@/components/app-tab-bar/AppTabBar.vue'

const orderStore = useOrderStore()
const currentTab = ref<'active' | 'history'>('active')
const loading = ref(false)
const activeOrders = ref<any[]>([])
const historyOrders = ref<any[]>([])
const page = ref(1)
const hasMore = ref(false)

const switchTab = (tab: 'active' | 'history') => {
  currentTab.value = tab
  if (tab === 'active') fetchActive()
  else if (historyOrders.value.length === 0) fetchHistory()
}

const fetchActive = async () => {
  loading.value = true
  try { activeOrders.value = await orderStore.fetchActiveOrders() }
  finally { loading.value = false }
}

const fetchHistory = async (reset = true) => {
  loading.value = true
  try {
    if (reset) { page.value = 1; historyOrders.value = [] }
    const result = await orderStore.fetchHistoryOrders(page.value)
    historyOrders.value.push(...result.orders)
    hasMore.value = result.hasMore
    page.value++
  } finally { loading.value = false }
}

const loadMore = () => fetchHistory(false)

const handleComplete = async (orderId: string) => {
  try {
    await orderStore.completeOrder(orderId)
    uni.showToast({ title: '已完成', icon: 'success' })
    fetchActive()
  } catch (e: any) {
    uni.showToast({ title: e.message || '操作失败', icon: 'none' })
  }
}

const formatTime = (d: Date | string) => {
  const date = new Date(d)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}

onShow(() => fetchActive())
</script>

<style scoped>
.container { padding-bottom: calc(120rpx + env(safe-area-inset-bottom)); }
.tabs { display: flex; border-bottom: 1px solid #eee; background: #fff; }
.tab {
  flex: 1; text-align: center; padding: 24rpx; font-size: 28rpx; color: #666;
  border-bottom: 4rpx solid transparent; transition: all 0.2s;
}
.tab.active { color: #07C160; border-bottom-color: #07C160; font-weight: bold; }

.order-card {
  background: #fff; border-radius: 12rpx; padding: 24rpx;
  margin: 16rpx 20rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06);
}
.order-card.done { opacity: 0.7; }
.order-header { display: flex; align-items: center; gap: 12rpx; margin-bottom: 16rpx; }
.order-avatar { width: 48rpx; height: 48rpx; border-radius: 50%; flex-shrink: 0; }
.order-avatar-placeholder { width: 48rpx; height: 48rpx; border-radius: 50%; background: #e0e0e0; flex-shrink: 0; }
.order-user { font-weight: bold; font-size: 28rpx; }
.order-time { font-size: 24rpx; color: #999; margin-left: auto; flex-shrink: 0; }
.order-item { font-size: 26rpx; color: #333; padding: 8rpx 0; }
.order-footer { text-align: right; margin-top: 16rpx; }
.complete-btn { background: #07C160; color: #fff; border: none; }

.load-more { text-align: center; padding: 20rpx; color: #07C160; font-size: 26rpx; }
.loading, .empty { text-align: center; padding: 80rpx; color: #999; font-size: 28rpx; }
</style>
