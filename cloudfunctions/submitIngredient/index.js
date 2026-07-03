const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { name, category, icon, image } = event

  if (!name || !category) {
    return { code: 'MISSING_FIELDS', message: '食材名和分类不能为空' }
  }

  try {
    // 检查同名食材
    const exist = await db.collection('ingredients')
      .where({ name: name.trim() })
      .get()
    if (exist.data && exist.data.length > 0) {
      return { code: 'DUPLICATE_NAME', message: '已存在同名食材' }
    }

    const ingredient = {
      name: name.trim(),
      category,
      icon: icon || '',
      image: image || '',
      createdAt: new Date(),
    }

    const res = await db.collection('ingredients').add({ data: ingredient })

    return {
      success: true,
      ingredient: { _id: res._id, ...ingredient },
    }
  } catch (e) {
    console.error('submitIngredient error:', e)
    return { code: 'SUBMIT_FAILED', message: e.message }
  }
}
