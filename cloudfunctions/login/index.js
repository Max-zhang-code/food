const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()

  try {
    // 获取微信用户信息
    const userInfo = {
      nickName: event.nickName || '家人',
      avatarUrl: event.avatarUrl || '',
    }

    // upsert 用户信息到 users 集合
    await db.collection('users').doc(OPENID).set({
      data: {
        openid: OPENID,
        nickName: userInfo.nickName,
        avatarUrl: userInfo.avatarUrl,
        lastLoginAt: new Date(),
      },
    })

    // 检查是否为审核人
    const approversDoc = await db.collection('settings').doc('approvers').get()
    const approvers = approversDoc.data?.approvers || []
    const isApprover = approvers.some(a => a.openid === OPENID)

    // 如果是审核人，同步更新头像昵称
    if (isApprover) {
      const updatedApprovers = approvers.map(a => {
        if (a.openid === OPENID) {
          return { ...a, nickName: userInfo.nickName, avatarUrl: userInfo.avatarUrl }
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
