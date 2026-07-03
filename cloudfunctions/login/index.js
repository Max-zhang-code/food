const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()

  try {
    // 查已有用户记录，存在则保留已有昵称头像
    let existingUser = null
    try {
      const userDoc = await db.collection('users').doc(OPENID).get()
      existingUser = userDoc.data
    } catch (_) {}

    const userInfo = {
      nickName: event.nickName || existingUser?.nickName || '',
      avatarUrl: event.avatarUrl || existingUser?.avatarUrl || '',
    }

    if (existingUser) {
      // 老用户：只更新登录时间，保留已有资料
      await db.collection('users').doc(OPENID).update({
        data: { lastLoginAt: new Date() },
      })
    } else {
      // 新用户：创建记录
      await db.collection('users').doc(OPENID).set({
        data: {
          openid: OPENID,
          nickName: userInfo.nickName,
          avatarUrl: userInfo.avatarUrl,
          lastLoginAt: new Date(),
        },
      })
    }

    // 检查是否为审核人（approvers 文档可能不存在）
    let approvers = []
    let isApprover = false
    try {
      const approversDoc = await db.collection('settings').doc('approvers').get()
      approvers = approversDoc.data?.approvers || []
      isApprover = approvers.some(a => a.openid === OPENID)
    } catch (_) {
      // 文档不存在，没有人是审核人
    }

    // 如果是审核人且本次登录有新资料，同步更新
    if (isApprover && (event.nickName || event.avatarUrl)) {
      const updatedApprovers = approvers.map(a => {
        if (a.openid === OPENID) {
          return {
            ...a,
            ...(event.nickName ? { nickName: event.nickName } : {}),
            ...(event.avatarUrl ? { avatarUrl: event.avatarUrl } : {}),
          }
        }
        return a
      })
      await db.collection('settings').doc('approvers').update({
        data: { approvers: updatedApprovers },
      })
    }

    return {
      openid: OPENID,
      userInfo,
      isApprover,
    }
  } catch (e) {
    console.error('login error:', e)
    return { code: 'LOGIN_FAILED', message: e.message }
  }
}
