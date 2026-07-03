const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { action, targetOpenid } = event

  try {
    // 获取当前审核人列表
    let approvers = []
    try {
      const approversDoc = await db.collection('settings').doc('approvers').get()
      approvers = approversDoc.data?.approvers || []
    } catch (_) {
      // 文档不存在时创建
      await db.collection('settings').add({ data: { _id: 'approvers', approvers: [] } })
    }
    const isApprover = approvers.some(a => a.openid === OPENID)

    // 空列表时允许 bootstrap：任何人可查看和添加第一个审核人
    const isEmpty = approvers.length === 0

    if (!isEmpty && !isApprover) {
      return { code: 'NOT_APPROVER', message: '仅审核人可管理审核人' }
    }

    switch (action) {
      case 'list': {
        // 始终从 users 集合获取最新昵称和头像
        const updated = await Promise.all(
          approvers.map(async (a) => {
            try {
              const userDoc = await db.collection('users').doc(a.openid).get()
              if (userDoc.data) {
                return {
                  ...a,
                  nickName: userDoc.data.nickName || a.nickName,
                  avatarUrl: userDoc.data.avatarUrl || a.avatarUrl,
                }
              }
            } catch (_) {}
            return a
          })
        )
        return { approvers: updated }
      }

      case 'add': {
        if (!targetOpenid) {
          return { code: 'MISSING_TARGET', message: '请指定要添加的用户' }
        }
        if (approvers.some(a => a.openid === targetOpenid)) {
          return { code: 'ALREADY_APPROVER', message: '该用户已是审核人' }
        }
        // 从 users 集合获取用户信息
        const userDoc = await db.collection('users').doc(targetOpenid).get()
        if (!userDoc.data) {
          return { code: 'USER_NOT_FOUND', message: '用户不存在，请先登录' }
        }
        const newApprover = {
          openid: targetOpenid,
          nickName: userDoc.data.nickName || '',
          avatarUrl: userDoc.data.avatarUrl || '',
        }
        approvers.push(newApprover)
        await db.collection('settings').doc('approvers').update({
          data: { approvers },
        })
        return { success: true, approvers }
      }

      case 'remove': {
        if (!targetOpenid) {
          return { code: 'MISSING_TARGET', message: '请指定要移除的用户' }
        }
        if (approvers.length <= 1) {
          return { code: 'LAST_APPROVER', message: '不能移除最后一位审核人' }
        }
        const idx = approvers.findIndex(a => a.openid === targetOpenid)
        if (idx < 0) {
          return { code: 'NOT_APPROVER', message: '该用户不是审核人' }
        }
        approvers.splice(idx, 1)
        await db.collection('settings').doc('approvers').update({
          data: { approvers },
        })
        return { success: true, approvers }
      }

      default:
        return { code: 'INVALID_ACTION', message: `未知操作: ${action}` }
    }
  } catch (e) {
    console.error('manageApprovers error:', e)
    return { code: 'MANAGE_FAILED', message: e.message }
  }
}
