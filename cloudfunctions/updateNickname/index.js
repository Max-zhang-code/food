const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { nickName, avatarUrl } = event

  if (!nickName && !avatarUrl) {
    return { code: 'EMPTY_FIELDS', message: '昵称或头像至少填一项' }
  }

  try {
    // 构建更新数据
    const updateData = { lastLoginAt: new Date() }
    if (nickName !== undefined) updateData.nickName = nickName.trim()
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl

    // 更新 users 集合
    await db.collection('users').doc(OPENID).update({ data: updateData })

    // 同步更新 settings.approvers 中的信息
    try {
      const approversDoc = await db.collection('settings').doc('approvers').get()
      const approvers = approversDoc.data?.approvers || []
      const updated = approvers.map(a => {
        if (a.openid === OPENID) {
          return {
            ...a,
            ...(nickName !== undefined ? { nickName: nickName.trim() } : {}),
            ...(avatarUrl !== undefined ? { avatarUrl } : {}),
          }
        }
        return a
      })
      await db.collection('settings').doc('approvers').update({
        data: { approvers: updated },
      })
    } catch (_) {
      // approvers 文档可能不存在，忽略
    }

    return {
      success: true,
      nickName: nickName?.trim() || '',
      avatarUrl: avatarUrl || '',
    }
  } catch (e) {
    console.error('updateNickname error:', e)
    return { code: 'UPDATE_FAILED', message: e.message }
  }
}
