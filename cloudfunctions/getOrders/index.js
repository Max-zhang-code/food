const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { status = 'active', page = 1, pageSize = 20 } = event

  try {
    if (!OPENID) {
      return { code: 'NOT_LOGGED_IN', message: '请先登录' }
    }

    const skip = (page - 1) * pageSize

    const totalRes = await db.collection('orders')
      .where({ status })
      .count()

    const res = await db.collection('orders')
      .where({ status })
      .orderBy('created_at', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get()

    return {
      orders: res.data || [],
      total: totalRes.total,
      hasMore: skip + pageSize < totalRes.total,
    }
  } catch (e) {
    console.error('getOrders error:', e)
    return { code: 'QUERY_FAILED', message: e.message }
  }
}
