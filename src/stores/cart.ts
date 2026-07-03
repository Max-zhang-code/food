import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface CartItem {
  dish_id: string
  dish_name: string
  dish_image?: string
  quantity: number
}

interface Dish {
  _id: string
  name: string
  image?: string
}

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])

  const totalCount = computed(() => items.value.reduce((sum, i) => sum + i.quantity, 0))

  const addDish = (dish: Dish) => {
    const existing = items.value.find(i => i.dish_id === dish._id)
    if (existing) {
      existing.quantity++
    } else {
      items.value.push({ dish_id: dish._id, dish_name: dish.name, dish_image: dish.image, quantity: 1 })
    }
    uni.showToast({ title: `已加入：${dish.name}`, icon: 'none', duration: 1000 })
  }

  const removeDish = (dish_id: string) => {
    items.value = items.value.filter(i => i.dish_id !== dish_id)
  }

  const updateQuantity = (dish_id: string, qty: number) => {
    if (qty <= 0) {
      removeDish(dish_id)
      return
    }
    const item = items.value.find(i => i.dish_id === dish_id)
    if (item) item.quantity = qty
  }

  const clear = () => { items.value = [] }

  return { items, totalCount, addDish, removeDish, updateQuantity, clear }
})
