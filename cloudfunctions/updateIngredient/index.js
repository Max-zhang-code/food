const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { ingredient_id, name, category, icon, image } = event

  try {
    const approversDoc = await db.collection('settings').doc('approvers').get()
    const approvers = approversDoc.data?.approvers || []
    if (!approvers.some(a => a.openid === OPENID)) {
      return { code: 'NOT_APPROVER', message: '仅审核人可编辑食材' }
    }

    const ingDoc = await db.collection('ingredients').doc(ingredient_id).get()
    if (!ingDoc.data) {
      return { code: 'INGREDIENT_NOT_FOUND', message: '食材不存在' }
    }

    // 重名检测
    if (name && name.trim() !== ingDoc.data.name) {
      const exist = await db.collection('ingredients')
        .where({ name: name.trim() })
        .get()
      if (exist.data && exist.data.length > 0) {
        return { code: 'DUPLICATE_NAME', message: '已存在同名食材' }
      }
    }

    const updateData = {}
    if (name !== undefined) updateData.name = name.trim()
    if (category !== undefined) updateData.category = category
    if (icon !== undefined) updateData.icon = icon
    if (image !== undefined) updateData.image = image

    await db.collection('ingredients').doc(ingredient_id).update({ data: updateData })

    const updated = await db.collection('ingredients').doc(ingredient_id).get()
    return { success: true, ingredient: updated.data }
  } catch (e) {
    console.error('updateIngredient error:', e)
    return { code: 'UPDATE_FAILED', message: e.message }
  }
}
