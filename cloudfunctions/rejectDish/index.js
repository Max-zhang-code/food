const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { dish_id } = event

  try {
    // 校验审核人身份
    const approversDoc = await db.collection('settings').doc('approvers').get()
    const approvers = approversDoc.data?.approvers || []
    const isApprover = approvers.some(a => a.openid === OPENID)

    if (!isApprover) {
      return { code: 'NOT_APPROVER', message: '只有审核人可以审核菜品' }
    }

    // 验证菜品存在且为 pending
    const dishDoc = await db.collection('dishes').doc(dish_id).get()
    if (!dishDoc.data) {
      return { code: 'DISH_NOT_FOUND', message: '菜品不存在' }
    }
    if (dishDoc.data.status !== 'pending') {
      return { code: 'ALREADY_REVIEWED', message: '该菜品已被审核' }
    }

    await db.collection('dishes').doc(dish_id).update({
      data: {
        status: 'rejected',
        approved_by: OPENID,
        approved_at: new Date(),
      },
    })

    return {
      success: true,
      dish: { _id: dish_id, ...dishDoc.data, status: 'rejected', approved_by: OPENID, approved_at: new Date() },
    }
  } catch (e) {
    console.error('rejectDish error:', e)
    return { code: 'REJECT_FAILED', message: e.message }
  }
}
