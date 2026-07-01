const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()

  try {
    if (!OPENID) {
      return { code: 'NOT_LOGGED_IN', message: '请先登录' }
    }

    const res = await db.collection('dishes')
      .where({ submitted_by: OPENID })
      .orderBy('submitted_at', 'desc')
      .get()

    return { dishes: res.data || [] }
  } catch (e) {
    console.error('getMySubmissions error:', e)
    return { code: 'QUERY_FAILED', message: e.message }
  }
}
