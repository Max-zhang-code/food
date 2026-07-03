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

    // 验证订单存在且状态为 active
    const orderDoc = await db.collection('orders').doc(order_id).get()
    if (!orderDoc.data) {
      return { code: 'ORDER_NOT_FOUND', message: '订单不存在' }
    }
    if (orderDoc.data.status !== 'active') {
      return { code: 'ALREADY_COMPLETED', message: '该订单已完成或已撤销' }
    }

    await db.collection('orders').doc(order_id).update({
      data: {
        status: 'completed',
        completed_at: new Date(),
      },
    })

    return {
      success: true,
      order: { _id: order_id, ...orderDoc.data, status: 'completed', completed_at: new Date() },
    }
  } catch (e) {
    console.error('completeOrder error:', e)
    return { code: 'COMPLETE_FAILED', message: e.message }
  }
}
