<template>
  <view class="container">
    <!-- 食材选择区 -->
    <view class="ingredient-section">
      <view class="section-title">选择食材</view>
      <view class="ingredient-tags">
        <view
          v-for="ing in menuStore.ingredients"
          :key="ing._id"
          class="tag"
          :class="{ active: menuStore.isSelected(ing._id) }"
          @click="menuStore.toggleIngredient(ing._id)"
        >
          {{ ing.icon }} {{ ing.name }}
        </view>
      </view>
    </view>

    <!-- 菜品列表 -->
    <view class="dish-section">
      <view class="section-title">
        可做的菜
        <text class="count">（{{ menuStore.dishes.length }} 道）</text>
      </view>

      <view v-if="menuStore.loading" class="loading">加载中...</view>

      <view v-else-if="menuStore.dishes.length === 0" class="empty">
        {{ menuStore.selectedIngredientIds.size === 0 ? '请选择食材筛选菜品' : '暂无可做的菜' }}
      </view>

      <view v-else class="dish-list">
        <view v-for="dish in menuStore.dishes" :key="dish._id" class="dish-card">
          <image v-if="dish.image" :src="dish.image" class="dish-img" mode="aspectFill" />
          <view class="dish-info">
            <view class="dish-name">{{ dish.name }}</view>
            <view class="dish-desc">{{ dish.description }}</view>
            <view class="dish-meta">
              <text class="cooking-time">约 {{ dish.cooking_time }} 分钟</text>
              <text class="match-info">
                匹配 {{ dish.matched_count }}/{{ dish.total_count }} 食材
              </text>
            </view>
          </view>
          <button class="add-btn" size="mini" @click="cartStore.addDish(dish)">
            + 加入
          </button>
        </view>
      </view>
    </view>

    <!-- 购物车入口 -->
    <view v-if="cartStore.totalCount > 0" class="cart-bar" @click="goToCart">
      <text class="cart-count">{{ cartStore.totalCount }}</text>
      <text class="cart-text">已选菜品，查看购物车</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useMenuStore } from '@/stores/menu'
import { useCartStore } from '@/stores/cart'

const menuStore = useMenuStore()
const cartStore = useCartStore()

onMounted(() => {
  menuStore.fetchAllIngredients()
  menuStore.fetchMatchedDishes()
})

const goToCart = () => {
  uni.navigateTo({ url: '/pages/cart/index' })
}
</script>

<style scoped>
.container { padding: 20rpx; padding-bottom: 140rpx; }

.section-title { font-size: 32rpx; font-weight: bold; margin: 20rpx 0; }
.section-title .count { font-size: 26rpx; color: #999; font-weight: normal; }

.ingredient-tags { display: flex; flex-wrap: wrap; gap: 16rpx; }
.tag {
  padding: 12rpx 24rpx; background: #f0f0f0; border-radius: 32rpx;
  font-size: 26rpx; transition: all 0.2s;
}
.tag.active { background: #07C160; color: #fff; }

.dish-list { display: flex; flex-direction: column; gap: 20rpx; }
.dish-card {
  display: flex; align-items: center; background: #fff;
  border-radius: 16rpx; padding: 20rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06);
}
.dish-img { width: 120rpx; height: 120rpx; border-radius: 12rpx; flex-shrink: 0; }
.dish-info { flex: 1; margin-left: 20rpx; }
.dish-name { font-size: 30rpx; font-weight: bold; }
.dish-desc { font-size: 24rpx; color: #666; margin: 8rpx 0; }
.dish-meta { font-size: 22rpx; color: #999; display: flex; gap: 20rpx; }
.add-btn { flex-shrink: 0; margin-left: 16rpx; background: #07C160; color: #fff; border: none; }

.cart-bar {
  position: fixed; bottom: 0; left: 0; right: 0;
  background: #07C160; color: #fff; padding: 24rpx 40rpx;
  display: flex; align-items: center; gap: 20rpx; z-index: 100;
}
.cart-count {
  background: #fff; color: #07C160; width: 44rpx; height: 44rpx;
  border-radius: 50%; text-align: center; line-height: 44rpx; font-weight: bold; font-size: 24rpx;
}

.loading, .empty { text-align: center; padding: 80rpx; color: #999; font-size: 28rpx; }
</style>
