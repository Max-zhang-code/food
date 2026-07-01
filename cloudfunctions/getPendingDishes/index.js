const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()

  try {
    // 校验审核人身份
    const approversDoc = await db.collection('settings').doc('approvers').get()
    const approvers = approversDoc.data?.approvers || []
    const isApprover = approvers.some(a => a.openid === OPENID)

    if (!isApprover) {
      return { code: 'NOT_APPROVER', message: '只有审核人可以查看待审核菜品' }
    }

    const res = await db.collection('dishes')
      .where({ status: 'pending' })
      .orderBy('submitted_at', 'desc')
      .get()

    return { dishes: res.data || [] }
  } catch (e) {
    console.error('getPendingDishes error:', e)
    return { code: 'QUERY_FAILED', message: e.message }
  }
}
