import { defineStore } from 'pinia'

interface DishFormData {
  name: string
  description: string
  cooking_time: number
  image?: string
  ingredient_ids: string[]
}

export const useDishManageStore = defineStore('dish-manage', () => {

  const submitDish = async (data: DishFormData) => {
    const res = await uniCloud.callFunction({
      name: 'submitDish',
      data,
    })
    const result = res.result as any
    if (result.code) throw new Error(result.message)
    return result.dish
  }

  const resubmitDish = async (dish_id: string, data: DishFormData) => {
    const res = await uniCloud.callFunction({
      name: 'resubmitDish',
      data: { dish_id, ...data },
    })
    const result = res.result as any
    if (result.code) throw new Error(result.message)
    return result.dish
  }

  const fetchPendingDishes = async () => {
    const res = await uniCloud.callFunction({
      name: 'getPendingDishes',
      data: {},
    })
    const result = res.result as any
    if (result.code) throw new Error(result.message)
    return result.dishes || []
  }

  const approveDish = async (dish_id: string) => {
    const res = await uniCloud.callFunction({
      name: 'approveDish',
      data: { dish_id },
    })
    const result = res.result as any
    if (result.code) throw new Error(result.message)
    return result.dish
  }

  const rejectDish = async (dish_id: string) => {
    const res = await uniCloud.callFunction({
      name: 'rejectDish',
      data: { dish_id },
    })
    const result = res.result as any
    if (result.code) throw new Error(result.message)
    return result.dish
  }

  const fetchMySubmissions = async () => {
    const res = await uniCloud.callFunction({
      name: 'getMySubmissions',
      data: {},
    })
    const result = res.result as any
    if (result.code) throw new Error(result.message)
    return result.dishes || []
  }

  return {
    submitDish, resubmitDish, fetchPendingDishes,
    approveDish, rejectDish, fetchMySubmissions,
  }
})
