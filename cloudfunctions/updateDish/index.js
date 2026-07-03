const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { dish_id, name, description, cooking_time, image, ingredient_ids } = event

  try {
    const approversDoc = await db.collection('settings').doc('approvers').get()
    const approvers = approversDoc.data?.approvers || []
    if (!approvers.some(a => a.openid === OPENID)) {
      return { code: 'NOT_APPROVER', message: '仅审核人可编辑菜品' }
    }

    const dishDoc = await db.collection('dishes').doc(dish_id).get()
    if (!dishDoc.data) {
      return { code: 'DISH_NOT_FOUND', message: '菜品不存在' }
    }

    // 重名检测（排除自身）
    if (name && name.trim() !== dishDoc.data.name) {
      const exist = await db.collection('dishes')
        .where({ name: name.trim() })
        .get()
      if (exist.data && exist.data.length > 0) {
        return { code: 'DUPLICATE_NAME', message: '已存在同名菜品' }
      }
    }

    const updateData = {}
    if (name !== undefined) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description
    if (cooking_time !== undefined) updateData.cooking_time = cooking_time
    if (image !== undefined) updateData.image = image
    if (ingredient_ids !== undefined) updateData.ingredient_ids = ingredient_ids

    await db.collection('dishes').doc(dish_id).update({ data: updateData })

    const updated = await db.collection('dishes').doc(dish_id).get()
    return { success: true, dish: updated.data }
  } catch (e) {
    console.error('updateDish error:', e)
    return { code: 'UPDATE_FAILED', message: e.message }
  }
}
