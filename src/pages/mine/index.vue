<template>
  <view class="container">
    <!-- 用户信息 -->
    <view class="user-card">
      <image v-if="userStore.userInfo?.avatarUrl" :src="userStore.userInfo.avatarUrl" class="avatar" />
      <text class="nickname">{{ userStore.userInfo?.nickName || '家人' }}</text>
      <text v-if="userStore.isApprover" class="badge">审核人</text>
    </view>

    <!-- 功能入口 -->
    <view class="menu-list">
      <view class="menu-item" @click="goToSubmit">
        <text>➕ 提交新菜品</text>
        <text class="arrow">›</text>
      </view>
      <view v-if="userStore.isApprover" class="menu-item" @click="goToReview">
        <text>✅ 审核菜品</text>
        <text class="badge-inline" v-if="pendingCount > 0">{{ pendingCount }}</text>
        <text class="arrow">›</text>
      </view>
    </view>

    <!-- 我的提交 -->
    <view class="section">
      <view class="section-title">我的提交</view>
      <view v-if="myDishes.length === 0" class="empty">暂无提交</view>
      <view v-for="dish in myDishes" :key="dish._id" class="dish-item">
        <view class="dish-info">
          <text class="dish-name">{{ dish.name }}</text>
          <text class="dish-status" :class="'status-' + dish.status">
            {{ statusText(dish.status) }}
          </text>
        </view>
        <button
          v-if="dish.status === 'rejected'"
          size="mini"
          class="edit-btn"
          @click="editDish(dish)"
        >编辑</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { useDishManageStore } from '@/stores/dish-manage'

const userStore = useUserStore()
const dishStore = useDishManageStore()
const myDishes = ref<any[]>([])
const pendingCount = ref(0)

onMounted(async () => {
  try {
    myDishes.value = await dishStore.fetchMySubmissions()
  } catch (_) {}
  if (userStore.isApprover) {
    try {
      const pending = await dishStore.fetchPendingDishes()
      pendingCount.value = pending.length
    } catch (_) {}
  }
})

const statusText = (s: string) => {
  const map: Record<string, string> = { pending: '待审核', approved: '已上架', rejected: '已驳回' }
  return map[s] || s
}

const goToSubmit = () => uni.navigateTo({ url: '/pages/submit/index' })
const goToReview = () => uni.navigateTo({ url: '/pages/manage/review/index' })
const editDish = (dish: any) => uni.navigateTo({ url: `/pages/submit/index?dishId=${dish._id}` })
</script>

<style scoped>
.container { padding: 20rpx; }
.user-card {
  display: flex; align-items: center; gap: 16rpx;
  background: #fff; border-radius: 16rpx; padding: 30rpx; margin-bottom: 20rpx;
}
.avatar { width: 80rpx; height: 80rpx; border-radius: 50%; }
.nickname { font-size: 32rpx; font-weight: bold; }
.badge { background: #07C160; color: #fff; font-size: 22rpx; padding: 4rpx 16rpx; border-radius: 20rpx; }

.menu-list { background: #fff; border-radius: 16rpx; margin-bottom: 20rpx; overflow: hidden; }
.menu-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 28rpx 30rpx; border-bottom: 1px solid #f5f5f5; font-size: 28rpx;
}
.arrow { font-size: 36rpx; color: #ccc; }
.badge-inline {
  background: #ff4757; color: #fff; font-size: 22rpx;
  padding: 4rpx 12rpx; border-radius: 20rpx; margin-left: auto; margin-right: 12rpx;
}

.section { background: #fff; border-radius: 16rpx; padding: 20rpx; }
.section-title { font-size: 30rpx; font-weight: bold; margin-bottom: 16rpx; }
.dish-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 20rpx 0; border-bottom: 1px solid #f5f5f5;
}
.dish-name { font-size: 28rpx; }
.dish-status { font-size: 24rpx; margin-left: 16rpx; }
.status-pending { color: #f0a040; }
.status-approved { color: #07C160; }
.status-rejected { color: #ff4757; }
.edit-btn { background: #f0f0f0; color: #333; border: none; }

.empty { text-align: center; padding: 60rpx; color: #999; font-size: 26rpx; }
</style>
