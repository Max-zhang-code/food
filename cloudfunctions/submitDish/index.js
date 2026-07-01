const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { name, description, cooking_time, image, ingredient_ids } = event

  try {
    if (!OPENID) {
      return { code: 'NOT_LOGGED_IN', message: '请先登录' }
    }

    if (!name || !ingredient_ids || ingredient_ids.length === 0) {
      return { code: 'MISSING_FIELDS', message: '菜品名和食材不能为空' }
    }

    // 查重：同名已上架菜品
    const existing = await db.collection('dishes')
      .where({ name, status: 'approved' })
      .count()
    if (existing.total > 0) {
      return { code: 'DUPLICATE_NAME', message: '已存在同名菜品' }
    }

    // 获取提交人信息
    const userDoc = await db.collection('users').doc(OPENID).get()
    const user = userDoc.data || {}

    const dish = {
      name,
      description: description || '',
      cooking_time: cooking_time || 15,
      image: image || '',
      ingredient_ids,
      status: 'pending',
      submitted_by: OPENID,
      submitted_by_name: user.nickName || '家人',
      submitted_at: new Date(),
      createdAt: new Date(),
    }

    const res = await db.collection('dishes').add({ data: dish })

    return {
      success: true,
      dish: { _id: res._id, ...dish },
    }
  } catch (e) {
    console.error('submitDish error:', e)
    return { code: 'SUBMIT_FAILED', message: e.message }
  }
}
