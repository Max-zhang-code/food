const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { dish_id, name, description, cooking_time, image, ingredient_ids } = event

  try {
    if (!OPENID) {
      return { code: 'NOT_LOGGED_IN', message: '请先登录' }
    }

    if (!dish_id) {
      return { code: 'MISSING_DISH_ID', message: '缺少菜品 ID' }
    }

    // 验证菜品存在
    const dishDoc = await db.collection('dishes').doc(dish_id).get()
    if (!dishDoc.data) {
      return { code: 'DISH_NOT_FOUND', message: '菜品不存在' }
    }

    // 只有原提交人可以编辑
    if (dishDoc.data.submitted_by !== OPENID) {
      return { code: 'NOT_OWNER', message: '只能编辑自己提交的菜品' }
    }

    // 只能编辑被驳回的菜品
    if (dishDoc.data.status !== 'rejected') {
      return { code: 'NOT_REJECTED', message: '只能编辑被驳回的菜品' }
    }

    // 查重：同名已上架菜品
    if (name && name !== dishDoc.data.name) {
      const existing = await db.collection('dishes')
        .where({ name, status: 'approved' })
        .count()
      if (existing.total > 0) {
        return { code: 'DUPLICATE_NAME', message: '已存在同名菜品' }
      }
    }

    const updateData = {
      name: name || dishDoc.data.name,
      description: description !== undefined ? description : dishDoc.data.description,
      cooking_time: cooking_time || dishDoc.data.cooking_time,
      image: image !== undefined ? image : dishDoc.data.image,
      ingredient_ids: ingredient_ids || dishDoc.data.ingredient_ids,
      status: 'pending',
      submitted_at: new Date(),
    }

    await db.collection('dishes').doc(dish_id).update({ data: updateData })

    return {
      success: true,
      dish: { _id: dish_id, ...dishDoc.data, ...updateData },
    }
  } catch (e) {
    console.error('resubmitDish error:', e)
    return { code: 'RESUBMIT_FAILED', message: e.message }
  }
}
