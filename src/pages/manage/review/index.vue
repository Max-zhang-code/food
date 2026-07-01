<template>
  <view class="container">
    <view v-if="loading" class="loading">加载中...</view>

    <view v-else-if="pendingDishes.length === 0" class="empty">
      <text class="empty-icon">🎉</text>
      <text class="empty-text">暂无待审核菜品</text>
    </view>

    <view v-else>
      <view v-for="dish in pendingDishes" :key="dish._id" class="review-card">
        <image v-if="dish.image" :src="dish.image" class="dish-img" mode="aspectFill" />
        <view class="dish-info">
          <view class="dish-name">{{ dish.name }}</view>
          <view class="dish-desc">{{ dish.description }}</view>
          <view class="dish-meta">
            <text>⏱ {{ dish.cooking_time }}分钟</text>
            <text>提交人：{{ dish.submitted_by_name }}</text>
          </view>
          <view class="ingredients">
            <text v-for="id in dish.ingredient_ids" :key="id" class="ing-tag">
              {{ getIngredientName(id) }}
            </text>
          </view>
        </view>
        <view class="actions">
          <button size="mini" class="approve-btn" @click="handleApprove(dish._id)">通过</button>
          <button size="mini" class="reject-btn" @click="handleReject(dish._id)">驳回</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDishManageStore } from '@/stores/dish-manage'
import { useMenuStore } from '@/stores/menu'

const dishStore = useDishManageStore()
const menuStore = useMenuStore()
const pendingDishes = ref<any[]>([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    await menuStore.fetchAllIngredients()
    pendingDishes.value = await dishStore.fetchPendingDishes()
  } catch (_) { }
  finally { loading.value = false }
})

const getIngredientName = (id: string) => {
  const ing = menuStore.ingredients.find((i: any) => i._id === id)
  return ing?.name || id
}

const handleApprove = async (id: string) => {
  try {
    await dishStore.approveDish(id)
    pendingDishes.value = pendingDishes.value.filter((d) => d._id !== id)
    uni.showToast({ title: '已通过', icon: 'success' })
  } catch (e: any) {
    uni.showToast({ title: e.message || '操作失败', icon: 'none' })
  }
}

const handleReject = async (id: string) => {
  try {
    await dishStore.rejectDish(id)
    pendingDishes.value = pendingDishes.value.filter((d) => d._id !== id)
    uni.showToast({ title: '已驳回', icon: 'success' })
  } catch (e: any) {
    uni.showToast({ title: e.message || '操作失败', icon: 'none' })
  }
}
</script>

<style scoped>
.container { padding: 20rpx; }
.review-card {
  background: #fff; border-radius: 16rpx; padding: 24rpx;
  margin-bottom: 20rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06);
}
.dish-img { width: 100%; height: 300rpx; border-radius: 12rpx; }
.dish-info { margin-top: 20rpx; }
.dish-name { font-size: 32rpx; font-weight: bold; }
.dish-desc { font-size: 26rpx; color: #666; margin: 8rpx 0; }
.dish-meta { font-size: 24rpx; color: #999; display: flex; gap: 20rpx; }
.ingredients { display: flex; flex-wrap: wrap; gap: 12rpx; margin-top: 16rpx; }
.ing-tag { font-size: 24rpx; background: #f0faf4; color: #07C160; padding: 6rpx 16rpx; border-radius: 16rpx; }
.actions { display: flex; justify-content: flex-end; gap: 20rpx; margin-top: 24rpx; }
.approve-btn { background: #07C160; color: #fff; border: none; }
.reject-btn { background: #f5f5f5; color: #ff4757; border: none; }
.loading, .empty { text-align: center; padding: 120rpx 0; color: #999; }
.empty-icon { font-size: 80rpx; display: block; margin-bottom: 20rpx; }
</style>
