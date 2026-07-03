const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()

  try {
    if (!OPENID) {
      return { code: 'NOT_LOGGED_IN', message: '请先登录' }
    }

    // 查询最近订单，提取下单用户信息（微信云数据库单次查询上限 100）
    const res = await db.collection('orders')
      .field({ user_openid: true, user_name: true, user_avatar: true })
      .orderBy('created_at', 'desc')
      .limit(100)
      .get()

    // 内存去重（按 user_openid）
    const seen = new Set()
    const users = []
    for (const order of res.data || []) {
      if (!seen.has(order.user_openid)) {
        seen.add(order.user_openid)
        users.push({
          openid: order.user_openid,
          user_name: order.user_name || '家人',
          user_avatar: order.user_avatar || '',
        })
      }
    }

    return { users }
  } catch (e) {
    console.error('getOrderUsers error:', e)
    return { code: 'QUERY_FAILED', message: e.message }
  }
}
