import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface Ingredient {
  _id: string
  name: string
  category: string
  icon?: string
}

interface Dish {
  _id: string
  name: string
  description: string
  image?: string
  cooking_time: number
  ingredient_ids: string[]
  matched_count: number
  total_count: number
}

export const useMenuStore = defineStore('menu', () => {
  const ingredients = ref<Ingredient[]>([])
  const selectedIngredientIds = ref<Set<string>>(new Set())
  const dishes = ref<Dish[]>([])
  const loading = ref(false)

  const isSelected = (id: string) => selectedIngredientIds.value.has(id)

  const fetchAllIngredients = async () => {
    try {
      const db = wx.cloud.database()
      const res = await db.collection('ingredients').get()
      ingredients.value = (res.data || []) as Ingredient[]
    } catch (e: any) {
      console.error('获取食材列表失败:', e.message)
    }
  }

  const toggleIngredient = (id: string) => {
    const s = new Set(selectedIngredientIds.value)
    if (s.has(id)) s.delete(id)
    else s.add(id)
    selectedIngredientIds.value = s
    fetchMatchedDishes()
  }

  const fetchMatchedDishes = async () => {
    loading.value = true
    try {
      const ids = Array.from(selectedIngredientIds.value)
      if (ids.length === 0) {
        // 未选食材时加载全部已上架菜品
        const db = wx.cloud.database()
        const res = await db.collection('dishes')
          .where({ status: 'approved' })
          .get()
        dishes.value = (res.data || []).map((d: any) => ({
          ...d,
          matched_count: d.ingredient_ids?.length || 0,
          total_count: d.ingredient_ids?.length || 0,
        }))
      } else {
        const res = await wx.cloud.callFunction({
          name: 'getMatchedDishes',
          data: { ingredient_ids: ids }
        })
        dishes.value = ((res.result as any)?.dishes || []) as Dish[]
      }
    } catch (e: any) {
      console.error('获取菜品失败:', e.message)
    } finally {
      loading.value = false
    }
  }

  return {
    ingredients, selectedIngredientIds, dishes, loading,
    isSelected, fetchAllIngredients, toggleIngredient, fetchMatchedDishes,
  }
})
