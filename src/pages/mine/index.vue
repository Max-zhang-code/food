<template>
  <view class="container">
    <!-- 编辑模式 -->
    <view v-if="isEditing" class="setup-card">
      <view class="setup-title">{{ hasProfile ? '修改个人信息' : '完善个人信息' }}</view>

      <button class="avatar-btn" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
        <image v-if="avatarPath" :src="avatarPath" class="avatar-preview" />
        <image v-else-if="hasProfile && userStore.userInfo?.avatarUrl" :src="userStore.userInfo.avatarUrl" class="avatar-preview" />
        <view v-else class="avatar-empty">+</view>
      </button>
      <text class="setup-label">点击上方设置头像</text>

      <input
        class="nickname-input"
        type="nickname"
        v-model="editNickname"
        :placeholder="editNickname || '点击获取微信昵称'"
      />

      <view class="setup-actions">
        <button class="save-btn" :disabled="!canSave" @click="saveProfile">保存</button>
        <text class="cancel-btn" @click="cancelEdit">取消</text>
      </view>
    </view>

    <!-- 展示模式 -->
    <view v-else class="user-card">
      <image v-if="userStore.userInfo?.avatarUrl" :src="userStore.userInfo.avatarUrl" class="avatar" />
      <view v-else class="avatar-placeholder" />
      <text class="nickname">{{ userStore.userInfo?.nickName || '完善个人信息' }}</text>
      <text class="edit-hint" @click.stop="openEdit">✎</text>
      <text v-if="userStore.isApprover" class="badge">审核人</text>
    </view>

    <!-- 功能入口 -->
    <view class="menu-list">
      <view v-if="userStore.isApprover" class="menu-item" @click="goToManageDishes">
        <text>🍽️ 管理菜品</text>
        <text class="badge-inline" v-if="pendingCount > 0">{{ pendingCount }}</text>
        <text class="arrow">›</text>
      </view>
      <view v-if="userStore.isApprover" class="menu-item" @click="goToManageIngredients">
        <text>🥬 管理食材</text>
        <text class="arrow">›</text>
      </view>
      <view class="menu-item" @click="goToApprovers">
        <text>👥 管理审核人</text>
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

    <AppTabBar :current="3" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { useDishManageStore } from '@/stores/dish-manage'
import AppTabBar from '@/components/app-tab-bar/AppTabBar.vue'

const userStore = useUserStore()
const dishStore = useDishManageStore()
const myDishes = ref<any[]>([])
const pendingCount = ref(0)

// 设置/编辑表单
const isEditing = ref(false)
const avatarPath = ref('')       // 新选的头像临时路径
const editNickname = ref('')

const hasProfile = computed(() => {
  return !!(userStore.userInfo?.nickName || userStore.userInfo?.avatarUrl)
})

const canSave = computed(() => {
  return !!(avatarPath.value || editNickname.value.trim())
})

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
const goToSubmitIngredient = () => uni.navigateTo({ url: '/pages/submit-ingredient/index' })
const goToManageDishes = () => uni.navigateTo({ url: '/pages/manage/manage-dishes/index' })
const goToManageIngredients = () => uni.navigateTo({ url: '/pages/manage/manage-ingredients/index' })
const goToApprovers = () => uni.navigateTo({ url: '/pages/manage/approvers/index' })
const editDish = (dish: any) => uni.navigateTo({ url: `/pages/submit/index?dishId=${dish._id}` })

const openEdit = () => {
  editNickname.value = userStore.userInfo?.nickName || ''
  avatarPath.value = ''
  isEditing.value = true
}

const cancelEdit = () => {
  isEditing.value = false
  avatarPath.value = ''
  editNickname.value = ''
}

const onChooseAvatar = (e: any) => {
  avatarPath.value = e.detail.avatarUrl
}

const saveProfile = async () => {
  uni.showLoading({ title: '保存中...' })
  try {
    const data: any = {}

    // 上传头像
    if (avatarPath.value) {
      const cloudPath = `avatars/${userStore.openid}_${Date.now()}.jpg`
      const uploadRes = await wx.cloud.uploadFile({ cloudPath, filePath: avatarPath.value })
      data.avatarUrl = uploadRes.fileID
    }

    // 昵称
    if (editNickname.value.trim()) {
      data.nickName = editNickname.value.trim()
    }

    const result = await wx.cloud.callFunction({
      name: 'updateNickname',
      data,
    })
    const res = result.result as any
    if (res.code) {
      uni.showToast({ title: res.message, icon: 'none' })
      return
    }

    // 更新本地状态
    const info: any = { ...userStore.userInfo }
    if (data.avatarUrl) info.avatarUrl = data.avatarUrl
    if (data.nickName) info.nickName = data.nickName
    userStore.userInfo = info

    isEditing.value = false
    avatarPath.value = ''
    editNickname.value = ''
    uni.showToast({ title: '保存成功', icon: 'success' })
  } catch (e: any) {
    uni.showToast({ title: '保存失败，请重试', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}
</script>

<style scoped>
.container { padding: 20rpx; padding-bottom: calc(120rpx + env(safe-area-inset-bottom)); }

/* 已有资料的用户卡片 */
.user-card {
  display: flex; align-items: center; gap: 16rpx;
  background: #fff; border-radius: 16rpx; padding: 30rpx; margin-bottom: 20rpx;
}
.avatar { width: 80rpx; height: 80rpx; border-radius: 50%; }
.avatar-placeholder { width: 80rpx; height: 80rpx; border-radius: 50%; background: #e0e0e0; }
.nickname { font-size: 32rpx; font-weight: bold; }
.edit-hint { font-size: 26rpx; color: #bbb; padding: 8rpx; }
.badge { background: #07C160; color: #fff; font-size: 22rpx; padding: 4rpx 16rpx; border-radius: 20rpx; }

/* 设置/编辑卡片 */
.setup-card {
  background: #fff; border-radius: 16rpx; padding: 40rpx 30rpx;
  margin-bottom: 20rpx; display: flex; flex-direction: column; align-items: center;
}
.setup-title { font-size: 32rpx; font-weight: bold; margin-bottom: 30rpx; }
.avatar-btn {
  width: 120rpx; height: 120rpx; border-radius: 50%;
  padding: 0; margin: 0; border: none;
  background: #f5f5f5; overflow: hidden;
}
.avatar-preview { width: 120rpx; height: 120rpx; border-radius: 50%; }
.avatar-empty {
  width: 120rpx; height: 120rpx; border-radius: 50%;
  background: #f0f0f0; display: flex; align-items: center;
  justify-content: center; font-size: 48rpx; color: #ccc;
}
.setup-label { font-size: 24rpx; color: #999; margin: 12rpx 0 24rpx; }
.nickname-input {
  width: 100%; height: 88rpx; border: 1px solid #e0e0e0; border-radius: 12rpx;
  padding: 0 24rpx; font-size: 30rpx; text-align: center; margin-bottom: 24rpx;
  box-sizing: border-box; line-height: 88rpx;
}
.setup-actions { width: 80%; display: flex; flex-direction: column; align-items: center; gap: 16rpx; }
.save-btn {
  width: 100%; background: #07C160; color: #fff; border: none;
  padding: 20rpx; font-size: 30rpx;
}
.save-btn[disabled] { background: #c0c0c0; }
.cancel-btn { font-size: 26rpx; color: #999; }

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
