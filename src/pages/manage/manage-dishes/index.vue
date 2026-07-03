<template>
  <view class="container">
    <!-- 搜索 + 筛选 -->
    <view class="search-bar">
      <input v-model="search" class="search-input" placeholder="搜索菜品..." />
    </view>
    <scroll-view scroll-x class="tab-bar">
      <view
        v-for="tab in statusTabs" :key="tab.key"
        class="tab" :class="{ active: activeStatus === tab.key }"
        @click="activeStatus = tab.key"
      >{{ tab.label }}<text v-if="tab.count !== null">（{{ tab.count }}）</text></view>
    </scroll-view>

    <button class="add-btn" @click="goToNew">+ 新增菜品</button>

    <view v-if="loading" class="empty">加载中...</view>
    <view v-else-if="filteredDishes.length === 0" class="empty">暂无菜品</view>

    <view v-else class="dish-list">
      <view v-for="dish in filteredDishes" :key="dish._id" class="dish-card">
        <image v-if="dish.image" :src="dish.image" class="dish-img" mode="aspectFill" />
        <view class="dish-info">
          <view class="dish-name">{{ dish.name }}</view>
          <view class="dish-meta">
            <text class="status-tag" :class="'st-' + dish.status">{{ statusMap[dish.status] }}</text>
            <text v-if="dish.submitted_by_name">提交人：{{ dish.submitted_by_name }}</text>
          </view>
        </view>
        <view class="dish-actions">
          <template v-if="dish.status === 'pending'">
            <button size="mini" class="approve-btn" @click="handleReview(dish._id, 'approve')">通过</button>
            <button size="mini" class="reject-btn" @click="handleReview(dish._id, 'reject')">驳回</button>
          </template>
          <button v-else size="mini" class="edit-btn" @click="goToEdit(dish._id)">编辑</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const search = ref('')
const activeStatus = ref('all')
const dishes = ref<any[]>([])
const loading = ref(false)

const statusTabs = [
  { key: 'all', label: '全部', count: null },
  { key: 'pending', label: '待审核', count: null },
  { key: 'approved', label: '已上架', count: null },
  { key: 'rejected', label: '已驳回', count: null },
]
const statusMap: Record<string, string> = { pending: '待审核', approved: '已上架', rejected: '已驳回' }

const filteredDishes = computed(() => {
  let list = dishes.value
  if (activeStatus.value !== 'all') {
    list = list.filter(d => d.status === activeStatus.value)
  }
  const kw = search.value.trim().toLowerCase()
  if (kw) {
    list = list.filter(d => d.name.toLowerCase().includes(kw))
  }
  return list
})

onMounted(() => fetchAll())

const fetchAll = async () => {
  loading.value = true
  try {
    const res = await wx.cloud.callFunction({ name: 'getAllDishes', data: {} })
    const data = res.result as any
    if (!data.code) {
      dishes.value = data.dishes || []
    }
  } catch (_) {}
  finally { loading.value = false }
}

const goToNew = () => uni.navigateTo({ url: '/pages/submit/index' })
const goToEdit = (id: string) => uni.navigateTo({ url: `/pages/submit/index?dishId=${id}` })

const handleReview = (dishId: string, action: 'approve' | 'reject') => {
  const label = action === 'approve' ? '通过' : '驳回'
  uni.showModal({
    title: `确认${label}`,
    content: `确定${label}该菜品？`,
    confirmColor: action === 'reject' ? '#ff4757' : '#FF6B4A',
    success: async (res) => {
      if (!res.confirm) return
      try {
        const cfName = action === 'approve' ? 'approveDish' : 'rejectDish'
        const cfRes = await wx.cloud.callFunction({ name: cfName, data: { dish_id: dishId } })
        const cfData = cfRes.result as any
        if (cfData.code) {
          uni.showToast({ title: cfData.message, icon: 'none' })
          return
        }
        uni.showToast({ title: `已${label}`, icon: 'success' })
        fetchAll()
      } catch (e: any) {
        uni.showToast({ title: '操作失败', icon: 'none' })
      }
    },
  })
}
</script>

<style scoped>
.container { padding: 20rpx; }

.search-bar { margin-bottom: 16rpx; }
.search-input { border: 1px solid #e0e0e0; border-radius: 20rpx; padding: 16rpx 24rpx; font-size: 28rpx; background: #fff; }

.tab-bar { white-space: nowrap; margin-bottom: 16rpx; display: flex; gap: 12rpx; }
.tab {
  display: inline-block; padding: 12rpx 24rpx; font-size: 26rpx; color: #666;
  background: #f5f5f5; border-radius: 32rpx; flex-shrink: 0;
}
.tab.active { background: #FF6B4A; color: #fff; }

.add-btn { width: 100%; background: #FF6B4A; color: #fff; border: none; margin-bottom: 16rpx; padding: 18rpx; font-size: 28rpx; }

.dish-list { display: flex; flex-direction: column; gap: 16rpx; }
.dish-card {
  display: flex; align-items: center; gap: 16rpx;
  background: #fff; border-radius: 16rpx; padding: 20rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06);
}
.dish-img { width: 100rpx; height: 100rpx; border-radius: 20rpx; flex-shrink: 0; }
.dish-info { flex: 1; min-width: 0; }
.dish-name { font-size: 28rpx; font-weight: bold; }
.dish-meta { font-size: 22rpx; color: #999; display: flex; flex-direction: column; gap: 4rpx; margin-top: 6rpx; }
.status-tag { font-size: 22rpx; padding: 2rpx 12rpx; border-radius: 16rpx; display: inline-block; width: fit-content; }
.st-pending { background: #fff3e0; color: #f0a040; }
.st-approved { background: #fff0ed; color: #FF6B4A; }
.st-rejected { background: #ffebee; color: #ff4757; }

.dish-actions { display: flex; flex-direction: column; gap: 10rpx; flex-shrink: 0; }
.approve-btn { background: #FF6B4A; color: #fff; border: none; }
.reject-btn { background: #f5f5f5; color: #ff4757; border: none; }
.edit-btn { background: #f0f0f0; color: #333; border: none; }

.empty { text-align: center; padding: 100rpx 0; color: #999; font-size: 28rpx; }
</style>
