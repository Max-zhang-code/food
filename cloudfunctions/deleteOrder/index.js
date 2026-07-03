const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { order_id } = event

  try {
    if (!OPENID) {
      return { code: 'NOT_LOGGED_IN', message: '请先登录' }
    }

    if (!order_id) {
      return { code: 'MISSING_ORDER_ID', message: '缺少订单 ID' }
    }

    const orderDoc = await db.collection('orders').doc(order_id).get()
    if (!orderDoc.data) {
      return { code: 'ORDER_NOT_FOUND', message: '订单不存在' }
    }

    const order = orderDoc.data

    // 仅本人可删除
    if (order.user_openid !== OPENID) {
      return { code: 'NOT_OWNER', message: '只能删除自己的订单' }
    }

    // 仅已撤销的订单可删除
    if (order.status !== 'revoked') {
      return { code: 'NOT_REVOKED', message: '只能删除已撤销的订单' }
    }

    await db.collection('orders').doc(order_id).remove()

    return { success: true }
  } catch (e) {
    console.error('deleteOrder error:', e)
    return { code: 'DELETE_FAILED', message: e.message }
  }
}
