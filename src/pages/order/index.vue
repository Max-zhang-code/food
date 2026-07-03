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

    <!-- 筛选栏 -->
    <view v-if="orderUsers.length > 0" class="filter-bar">
      <scroll-view scroll-x class="filter-scroll">
        <view class="filter-list">
          <view
            class="filter-chip"
            :class="{ active: filterOpenid === undefined }"
            @click="setFilter(undefined)"
          >全部</view>
          <view
            v-if="myOpenid"
            class="filter-chip"
            :class="{ active: filterOpenid === myOpenid }"
            @click="setFilter(myOpenid)"
          >我的</view>
          <view
            v-for="u in otherUsers"
            :key="u.openid"
            class="filter-chip"
            :class="{ active: filterOpenid === u.openid }"
            @click="setFilter(u.openid)"
          >
            <image v-if="u.user_avatar" :src="u.user_avatar" class="filter-avatar" />
            <text>{{ u.user_name }}</text>
          </view>
        </view>
      </scroll-view>
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
          <view class="footer-actions">
            <button
              v-if="isOwnOrder(order)"
              size="mini"
              class="revoke-btn"
              @click="handleRevoke(order._id)"
            >撤销</button>
            <button size="mini" class="complete-btn" @click="handleComplete(order._id)">
              完成
            </button>
          </view>
        </view>
      </view>
    </view>

    <!-- 历史订单 -->
    <view v-else>
      <view v-if="historyOrders.length === 0" class="empty">暂无历史订单</view>
      <view
        v-for="order in historyOrders"
        :key="order._id"
        class="order-card"
        :class="{ revoked: order.status === 'revoked' }"
      >
        <view class="order-header">
          <image v-if="order.user_avatar" :src="order.user_avatar" class="order-avatar" />
          <view v-else class="order-avatar-placeholder" />
          <text class="order-user">{{ order.user_name }}</text>
          <text class="order-time">{{ formatTime(order.completed_at || order.revoked_at || order.created_at) }}</text>
        </view>
        <view v-for="item in order.items" :key="item.dish_id" class="order-item">
          <text>{{ item.dish_name }} × {{ item.quantity }}</text>
        </view>
        <view class="order-footer">
          <text v-if="order.status === 'revoked'" class="revoked-tag">已撤销</text>
          <view class="footer-actions">
            <button
              v-if="order.status === 'revoked' && isOwnOrder(order)"
              size="mini"
              class="delete-btn"
              @click="handleDelete(order._id)"
            >删除</button>
            <button
              v-if="isOwnOrder(order) && order.status !== 'revoked'"
              size="mini"
              class="revoke-btn"
              @click="handleRevoke(order._id)"
            >撤销</button>
          </view>
        </view>
      </view>
      <view v-if="hasMore" class="load-more" @click="loadMore">加载更多</view>
    </view>

    <AppTabBar :current="2" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useOrderStore } from '@/stores/order'
import { useUserStore } from '@/stores/user'
import AppTabBar from '@/components/app-tab-bar/AppTabBar.vue'

const orderStore = useOrderStore()
const userStore = useUserStore()

const currentTab = ref<'active' | 'history'>('active')
const loading = ref(false)
const activeOrders = ref<any[]>([])
const historyOrders = ref<any[]>([])
const page = ref(1)
const hasMore = ref(false)

// 筛选相关
const orderUsers = ref<{ openid: string; user_name: string; user_avatar: string }[]>([])
const filterOpenid = ref<string | undefined>(undefined)

const myOpenid = userStore.openid || ''

const otherUsers = computed(() =>
  orderUsers.value.filter(u => u.openid !== myOpenid)
)

const isOwnOrder = (order: any) => order.user_openid === myOpenid

let lastFetchTime = 0
const CACHE_TTL = 30000 // 30 秒内不重复拉取

const fetchActiveIfStale = () => {
  const now = Date.now()
  if (now - lastFetchTime > CACHE_TTL) {
    lastFetchTime = now
    fetchActive()
  }
}

const forceRefresh = () => {
  lastFetchTime = 0
  if (currentTab.value === 'active') fetchActive()
  else { page.value = 1; historyOrders.value = []; fetchHistory() }
}

const switchTab = (tab: 'active' | 'history') => {
  currentTab.value = tab
  if (tab === 'active') fetchActive()
  else fetchHistory()
}

const setFilter = (openid: string | undefined) => {
  filterOpenid.value = openid
  if (currentTab.value === 'active') fetchActive()
  else { page.value = 1; historyOrders.value = []; fetchHistory() }
}

const fetchActive = async () => {
  loading.value = true
  try {
    activeOrders.value = await orderStore.fetchActiveOrders(filterOpenid.value)
  } finally { loading.value = false }
}

const fetchHistory = async (reset = true) => {
  loading.value = true
  try {
    if (reset) { page.value = 1; historyOrders.value = [] }
    const result = await orderStore.fetchHistoryOrders(page.value, filterOpenid.value)
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
    forceRefresh()
  } catch (e: any) {
    uni.showToast({ title: e.message || '操作失败', icon: 'none' })
  }
}

const handleRevoke = (orderId: string) => {
  uni.showModal({
    title: '撤销订单',
    content: '确定要撤销这个订单吗？',
    success: async (res) => {
      if (!res.confirm) return
      try {
        await orderStore.revokeOrder(orderId)
        uni.showToast({ title: '已撤销', icon: 'success' })
        forceRefresh()
      } catch (e: any) {
        uni.showToast({ title: e.message || '撤销失败', icon: 'none' })
      }
    },
  })
}

const handleDelete = (orderId: string) => {
  uni.showModal({
    title: '删除订单',
    content: '确定要删除这个订单吗？删除后不可恢复。',
    success: async (res) => {
      if (!res.confirm) return
      try {
        await orderStore.deleteOrder(orderId)
        uni.showToast({ title: '已删除', icon: 'success' })
        forceRefresh()
      } catch (e: any) {
        uni.showToast({ title: e.message || '删除失败', icon: 'none' })
      }
    },
  })
}

const fetchUsers = async () => {
  // 先读缓存立即渲染筛选栏
  const cached = wx.getStorageSync('orderUsers')
  if (cached && cached.length > 0) {
    orderUsers.value = cached
  }
  try {
    const users = await orderStore.fetchOrderUsers()
    orderUsers.value = users
    wx.setStorageSync('orderUsers', users)
  } catch (e) {
    console.warn('[order] fetchUsers failed:', e)
  }
}

const formatTime = (d: Date | string) => {
  const date = new Date(d)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}

onShow(() => {
  // 购物车下单后强制刷新
  if (wx.getStorageSync('forceOrderRefresh')) {
    wx.removeStorageSync('forceOrderRefresh')
    forceRefresh()
  } else {
    fetchActiveIfStale()
  }
  fetchUsers()
})
</script>

<style scoped>
.container { padding-bottom: calc(120rpx + env(safe-area-inset-bottom)); }
.tabs { display: flex; border-bottom: 1px solid #eee; background: #fff; }
.tab {
  flex: 1; text-align: center; padding: 24rpx; font-size: 28rpx; color: #666;
  border-bottom: 4rpx solid transparent; transition: all 0.2s;
}
.tab.active { color: #FF6B4A; border-bottom-color: #FF6B4A; font-weight: bold; }

/* 筛选栏 */
.filter-bar { background: #fff; padding: 16rpx 0; border-bottom: 1px solid #f0f0f0; }
.filter-scroll { white-space: nowrap; }
.filter-list { display: inline-flex; padding: 0 20rpx; gap: 12rpx; }
.filter-chip {
  display: inline-flex; align-items: center; gap: 8rpx;
  padding: 10rpx 24rpx; border-radius: 32rpx; font-size: 26rpx; color: #666;
  background: #f5f5f5; white-space: nowrap; flex-shrink: 0;
}
.filter-chip.active { background: #FF6B4A; color: #fff; }
.filter-avatar { width: 36rpx; height: 36rpx; border-radius: 50%; }

.order-card {
  background: #fff; border-radius: 20rpx; padding: 24rpx;
  margin: 16rpx 20rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06);
}
.order-card.revoked { opacity: 0.5; }
.order-header { display: flex; align-items: center; gap: 12rpx; margin-bottom: 16rpx; }
.order-avatar { width: 48rpx; height: 48rpx; border-radius: 50%; flex-shrink: 0; }
.order-avatar-placeholder { width: 48rpx; height: 48rpx; border-radius: 50%; background: #e0e0e0; flex-shrink: 0; }
.order-user { font-weight: bold; font-size: 28rpx; }
.order-time { font-size: 24rpx; color: #999; margin-left: auto; flex-shrink: 0; }
.order-item { font-size: 26rpx; color: #333; padding: 8rpx 0; }
.order-footer { display: flex; align-items: center; gap: 16rpx; margin-top: 16rpx; }
.footer-actions { margin-left: auto; display: flex; align-items: center; gap: 16rpx; }
.complete-btn { background: #FF6B4A; color: #fff; border: none; }
.revoke-btn { background: #fff; color: #fa5151; border: 1px solid #fa5151; }
.revoked-tag { font-size: 24rpx; color: #999; }
.delete-btn { background: #fa5151; color: #fff; border: none; }

.load-more { text-align: center; padding: 20rpx; color: #FF6B4A; font-size: 26rpx; }
.loading, .empty { text-align: center; padding: 80rpx; color: #999; font-size: 28rpx; }
</style>
