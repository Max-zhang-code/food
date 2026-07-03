const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { status = 'active', page = 1, pageSize = 20, user_openid } = event

  try {
    if (!OPENID) {
      return { code: 'NOT_LOGGED_IN', message: '请先登录' }
    }

    const skip = (page - 1) * pageSize

    // 构建查询条件：status 支持单值或数组
    const where = {
      status: Array.isArray(status) ? _.in(status) : status,
    }
    if (user_openid) {
      where.user_openid = user_openid
    }

    const totalRes = await db.collection('orders')
      .where(where)
      .count()

    const res = await db.collection('orders')
      .where(where)
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
