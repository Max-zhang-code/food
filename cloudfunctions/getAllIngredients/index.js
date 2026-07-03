const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  try {
    const approversDoc = await db.collection('settings').doc('approvers').get()
    const approvers = approversDoc.data?.approvers || []
    if (!approvers.some(a => a.openid === OPENID)) {
      return { code: 'NOT_APPROVER', message: '仅审核人可查看' }
    }
    const res = await db.collection('ingredients').orderBy('createdAt', 'desc').limit(200).get()
    return { ingredients: res.data || [] }
  } catch (e) {
    return { code: 'GET_FAILED', message: e.message }
  }
}
