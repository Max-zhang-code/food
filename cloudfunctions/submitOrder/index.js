const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { items = [] } = event

  try {
    if (!OPENID) {
      return { code: 'NOT_LOGGED_IN', message: '请先登录' }
    }

    if (!items || items.length === 0) {
      return { code: 'EMPTY_ITEMS', message: '请至少选择一道菜品' }
    }

    // 获取用户信息
    const userDoc = await db.collection('users').doc(OPENID).get()
    const user = userDoc.data || {}

    const order = {
      user_openid: OPENID,
      user_name: user.nickName || '家人',
      user_avatar: user.avatarUrl || '',
      items: items.map(i => ({
        dish_id: i.dish_id,
        dish_name: i.dish_name,
        quantity: i.quantity || 1,
      })),
      status: 'active',
      created_at: new Date(),
    }

    const res = await db.collection('orders').add({ data: order })

    return {
      success: true,
      order: { _id: res._id, ...order },
    }
  } catch (e) {
    console.error('submitOrder error:', e)
    return { code: 'SUBMIT_FAILED', message: e.message }
  }
}
