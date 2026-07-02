<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'

onLaunch(async () => {
  // 初始化微信云开发（CLI 项目必须手动 init）
  wx.cloud.init({ env: 'cloudbase-d4gszdfotaac057f6' })

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
