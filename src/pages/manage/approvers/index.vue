<template>
  <view class="container">
    <view class="section-title">
      审核人列表
      <text class="count">（{{ approvers.length }} 人）</text>
    </view>

    <view v-if="loading" class="loading">加载中...</view>

    <view v-else-if="approvers.length === 0" class="empty">
      <text class="empty-icon">👤</text>
      <text class="empty-text">暂无审核人</text>
      <text class="empty-hint">请在下方「添加审核人」中添加第一位</text>
    </view>

    <view v-else class="approver-list">
      <view v-for="(item, index) in approvers" :key="item.openid" class="approver-item">
        <image
          v-if="item.avatarUrl"
          :src="item.avatarUrl"
          class="avatar"
        />
        <view v-else class="avatar-placeholder" />
        <text class="nickname">{{ item.nickName || item.openid }}</text>
        <button
          v-if="approvers.length > 1"
          size="mini"
          class="remove-btn"
          @click="handleRemove(item, index)"
        >移除</button>
      </view>
    </view>

    <!-- 添加审核人 -->
    <view class="add-section">
      <view class="section-title">添加审核人</view>
      <view v-if="users.length === 0" class="empty">
        <text class="empty-hint">还没有其他用户登录过小程序</text>
        <text class="empty-hint-sub">请让家人先打开小程序登录一次</text>
      </view>
      <view v-else class="user-list">
        <view
          v-for="user in users"
          :key="user._id"
          class="user-item"
          @click="handleAdd(user)"
        >
          <image v-if="user.avatarUrl" :src="user.avatarUrl" class="avatar small" />
          <view v-else class="avatar-placeholder small" />
          <text class="nickname">{{ user.nickName || user._id }}</text>
          <button
            v-if="isApprover(user._id)"
            size="mini"
            class="added-btn"
            disabled
          >已是审核人</button>
          <button v-else size="mini" class="add-btn">添加</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Approver {
  openid: string
  nickName: string
  avatarUrl: string
}

const approvers = ref<Approver[]>([])
const users = ref<any[]>([])
const loading = ref(false)

onMounted(() => {
  fetchApprovers()
  fetchUsers()
})

const fetchApprovers = async () => {
  try {
    const res = await wx.cloud.callFunction({
      name: 'manageApprovers',
      data: { action: 'list' },
    })
    const data = res.result as any
    if (data.code) {
      uni.showToast({ title: data.message, icon: 'none' })
      return
    }
    approvers.value = data.approvers || []
  } catch (e: any) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

const fetchUsers = async () => {
  loading.value = true
  try {
    const db = wx.cloud.database()
    const res = await db.collection('users').limit(100).get()
    users.value = res.data || []
  } catch (_) {}
  finally { loading.value = false }
}

const isApprover = (openid: string) => {
  return approvers.value.some(a => a.openid === openid)
}

const handleAdd = async (user: any) => {
  try {
    const res = await wx.cloud.callFunction({
      name: 'manageApprovers',
      data: { action: 'add', targetOpenid: user._id },
    })
    const data = res.result as any
    if (data.code) {
      uni.showToast({ title: data.message, icon: 'none' })
      return
    }
    approvers.value = data.approvers || []
    uni.showToast({ title: '已添加', icon: 'success' })
  } catch (e: any) {
    uni.showToast({ title: '添加失败', icon: 'none' })
  }
}

const handleRemove = (item: Approver, index: number) => {
  uni.showModal({
    title: '移除审核人',
    content: `确定移除 ${item.nickName || item.openid} 的审核权限？`,
    confirmColor: '#ff4757',
    success: async (modalRes) => {
      if (!modalRes.confirm) return
      try {
        const res = await wx.cloud.callFunction({
          name: 'manageApprovers',
          data: { action: 'remove', targetOpenid: item.openid },
        })
        const data = res.result as any
        if (data.code) {
          uni.showToast({ title: data.message, icon: 'none' })
          return
        }
        approvers.value = data.approvers || []
        uni.showToast({ title: '已移除', icon: 'success' })
      } catch (e: any) {
        uni.showToast({ title: '移除失败', icon: 'none' })
      }
    },
  })
}
</script>

<style scoped>
.container { padding: 20rpx; }

.section-title {
  font-size: 30rpx; font-weight: bold; margin: 24rpx 0 16rpx;
}
.count { font-size: 24rpx; color: #999; font-weight: normal; }

.approver-list { display: flex; flex-direction: column; gap: 16rpx; }
.approver-item {
  display: flex; align-items: center; gap: 20rpx;
  background: #fff; border-radius: 16rpx; padding: 24rpx;
}
.avatar { width: 72rpx; height: 72rpx; border-radius: 50%; }
.avatar.small { width: 56rpx; height: 56rpx; }
.avatar-placeholder {
  width: 72rpx; height: 72rpx; border-radius: 50%; background: #e0e0e0;
}
.avatar-placeholder.small { width: 56rpx; height: 56rpx; }
.nickname { flex: 1; font-size: 28rpx; }

.remove-btn { background: #fff; color: #ff4757; border: 1px solid #ff4757; }

.add-section { margin-top: 40rpx; }
.user-list { display: flex; flex-direction: column; gap: 12rpx; }
.user-item {
  display: flex; align-items: center; gap: 16rpx;
  background: #fff; border-radius: 12rpx; padding: 20rpx 24rpx;
}
.add-btn { background: #07C160; color: #fff; border: none; }
.added-btn { background: #f5f5f5; color: #999; border: none; }

.loading { text-align: center; padding: 80rpx; color: #999; }
.empty { text-align: center; padding: 60rpx; color: #999; }
.empty-icon { font-size: 72rpx; display: block; margin-bottom: 16rpx; }
.empty-text { font-size: 28rpx; display: block; margin-bottom: 8rpx; }
.empty-hint { font-size: 26rpx; color: #999; display: block; }
.empty-hint-sub { font-size: 24rpx; color: #bbb; display: block; margin-top: 4rpx; }
</style>
