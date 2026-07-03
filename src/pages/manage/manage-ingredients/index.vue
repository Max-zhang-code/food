<template>
  <view class="container">
    <view class="search-bar">
      <input v-model="search" class="search-input" placeholder="搜索食材..." />
    </view>
    <scroll-view scroll-x class="tab-bar">
      <view
        v-for="cat in categoryTabs" :key="cat"
        class="tab" :class="{ active: activeCat === cat }"
        @click="activeCat = cat"
      >{{ cat }}</view>
    </scroll-view>

    <button class="add-btn" @click="goToNew">+ 新增食材</button>

    <view v-if="loading" class="empty">加载中...</view>
    <view v-else-if="filteredList.length === 0" class="empty">暂无食材</view>

    <view v-else class="ingredient-grid">
      <view v-for="ing in filteredList" :key="ing._id" class="ing-card">
        <image v-if="ing.image" :src="ing.image" class="ing-img" mode="aspectFill" />
        <text v-else-if="ing.icon" class="ing-emoji">{{ ing.icon }}</text>
        <text v-else class="ing-placeholder">{{ ing.name[0] }}</text>
        <text class="ing-name">{{ ing.name }}</text>
        <text class="ing-cat">{{ ing.category }}</text>
        <button size="mini" class="edit-btn" @click="goToEdit(ing._id)">编辑</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const search = ref('')
const activeCat = ref('全部')
const ingredients = ref<any[]>([])
const loading = ref(false)

const categoryTabs = ['全部', '蔬菜', '肉类', '蛋类', '调味', '豆制品', '其他']

const filteredList = computed(() => {
  let list = ingredients.value
  if (activeCat.value !== '全部') {
    list = list.filter(i => i.category === activeCat.value)
  }
  const kw = search.value.trim().toLowerCase()
  if (kw) {
    list = list.filter(i => i.name.toLowerCase().includes(kw))
  }
  return list
})

onMounted(() => fetchAll())

const fetchAll = async () => {
  loading.value = true
  try {
    const res = await wx.cloud.callFunction({ name: 'getAllIngredients', data: {} })
    const data = res.result as any
    if (!data.code) ingredients.value = data.ingredients || []
  } catch (_) {}
  finally { loading.value = false }
}

const goToNew = () => uni.navigateTo({ url: '/pages/submit-ingredient/index' })
const goToEdit = (id: string) => uni.navigateTo({ url: `/pages/submit-ingredient/index?ingredientId=${id}` })
</script>

<style scoped>
.container { padding: 20rpx; }

.search-bar { margin-bottom: 16rpx; }
.search-input { border: 1px solid #e0e0e0; border-radius: 12rpx; padding: 16rpx 24rpx; font-size: 28rpx; background: #fff; }

.tab-bar { white-space: nowrap; margin-bottom: 16rpx; display: flex; gap: 12rpx; }
.tab {
  display: inline-block; padding: 12rpx 24rpx; font-size: 26rpx; color: #666;
  background: #f5f5f5; border-radius: 32rpx; flex-shrink: 0;
}
.tab.active { background: #07C160; color: #fff; }

.add-btn { width: 100%; background: #07C160; color: #fff; border: none; margin-bottom: 16rpx; padding: 18rpx; font-size: 28rpx; }

.ingredient-grid { display: flex; flex-wrap: wrap; gap: 16rpx; }
.ing-card {
  width: calc(50% - 8rpx); background: #fff; border-radius: 16rpx;
  padding: 16rpx; box-sizing: border-box; display: flex;
  flex-direction: column; align-items: center; gap: 8rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06);
}
.ing-img { width: 120rpx; height: 120rpx; border-radius: 8rpx; }
.ing-emoji { font-size: 64rpx; line-height: 120rpx; }
.ing-placeholder {
  width: 120rpx; height: 120rpx; border-radius: 8rpx; background: #f0f0f0;
  display: flex; align-items: center; justify-content: center; font-size: 48rpx; color: #999;
}
.ing-name { font-size: 26rpx; font-weight: bold; }
.ing-cat { font-size: 22rpx; color: #999; }
.edit-btn { background: #f0f0f0; color: #333; border: none; }

.empty { text-align: center; padding: 100rpx 0; color: #999; font-size: 28rpx; }
</style>
