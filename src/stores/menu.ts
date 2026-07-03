import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface Ingredient {
  _id: string
  name: string
  category: string
  icon?: string
  image?: string
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
    // 先读缓存立即渲染
    const cached = wx.getStorageSync('ingredients')
    if (cached && cached.length > 0) {
      ingredients.value = cached as Ingredient[]
    }
    try {
      const db = wx.cloud.database()
      const res = await db.collection('ingredients').get()
      const data = (res.data || []) as Ingredient[]
      ingredients.value = data
      wx.setStorageSync('ingredients', data)
    } catch (e: any) {
      console.error('获取食材列表失败:', e.message)
    }
  }

  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  const toggleIngredient = (id: string) => {
    const s = new Set(selectedIngredientIds.value)
    if (s.has(id)) s.delete(id)
    else s.add(id)
    selectedIngredientIds.value = s
    // 300ms 防抖：快速点击多个食材只发最后一次请求
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => fetchMatchedDishes(), 300)
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
