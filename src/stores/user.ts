import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface UserInfo {
  nickName: string
  avatarUrl: string
}

export const useUserStore = defineStore('user', () => {
  const openid = ref<string | null>(null)
  const userInfo = ref<UserInfo | null>(null)
  const isApprover = ref(false)

  const isLoggedIn = computed(() => !!openid.value)

  const login = async () => {
    try {
      // 调用微信登录 + 云函数 login
      const { code } = await uni.login()
      const res = await wx.cloud.callFunction({
        name: 'login',
        data: { code }
      })
      const data = (res.result as any) || {}
      openid.value = data.openid
      userInfo.value = data.userInfo || null
      isApprover.value = data.isApprover || false
    } catch (e: any) {
      console.error('登录失败:', e.message)
      throw e
    }
  }

  return { openid, userInfo, isApprover, isLoggedIn, login }
})
