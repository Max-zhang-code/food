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

    // 查询订单
    const orderDoc = await db.collection('orders').doc(order_id).get()
    if (!orderDoc.data) {
      return { code: 'ORDER_NOT_FOUND', message: '订单不存在' }
    }

    const order = orderDoc.data

    // 仅提交人可取消自己的订单
    if (order.user_openid !== OPENID) {
      return { code: 'NOT_OWNER', message: '只能取消自己的订单' }
    }

    // 幂等保护
    if (order.status === 'cancelled') {
      return { code: 'ALREADY_CANCELLED', message: '该订单已被取消' }
    }

    await db.collection('orders').doc(order_id).update({
      data: {
        status: 'cancelled',
        cancelled_at: new Date(),
      },
    })

    return {
      success: true,
      order: { _id: order_id, ...order, status: 'cancelled', cancelled_at: new Date() },
    }
  } catch (e) {
    console.error('cancelOrder error:', e)
    return { code: 'CANCEL_FAILED', message: e.message }
  }
}
