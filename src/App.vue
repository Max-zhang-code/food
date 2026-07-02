<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'

onLaunch(async () => {
  uni.hideTabBar({ animation: false })

  const userStore = useUserStore()
  try {
    await userStore.login()
  } catch (e) {
    console.error('登录失败', e)
  }
})
</script>
<style>
/* 全局样式 */
page { background: #F5F5F5; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
</style>
