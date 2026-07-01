const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { ingredient_ids = [] } = event

  try {
    if (ingredient_ids.length === 0) {
      return { code: 'EMPTY_INGREDIENTS', message: '请先选择食材' }
    }

    // 查询包含所选食材的已上架菜品
    const res = await db.collection('dishes')
      .where({
        status: 'approved',
        ingredient_ids: _.in(ingredient_ids),
      })
      .get()

    const dishes = (res.data || []).map(dish => {
      const matched = dish.ingredient_ids.filter(id => ingredient_ids.includes(id))
      return {
        _id: dish._id,
        name: dish.name,
        description: dish.description,
        image: dish.image,
        cooking_time: dish.cooking_time,
        matched_count: matched.length,
        total_count: dish.ingredient_ids.length,
      }
    })

    // 按匹配度降序排列（匹配越多越靠前）
    dishes.sort((a, b) => b.matched_count - a.matched_count)

    return { dishes }
  } catch (e) {
    console.error('getMatchedDishes error:', e)
    return { code: 'QUERY_FAILED', message: e.message }
  }
}
