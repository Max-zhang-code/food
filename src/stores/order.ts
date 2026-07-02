import { defineStore } from 'pinia'

interface CartItem {
  dish_id: string
  dish_name: string
  quantity: number
}

export const useOrderStore = defineStore('order', () => {

  const submitOrder = async (items: CartItem[]) => {
    const res = await wx.cloud.callFunction({
      name: 'submitOrder',
      data: { items },
    })
    const data = res.result as any
    if (data.code) throw new Error(data.message)
    return data.order
  }

  const fetchActiveOrders = async () => {
    const res = await wx.cloud.callFunction({
      name: 'getOrders',
      data: { status: 'active', page: 1, pageSize: 50 },
    })
    const data = res.result as any
    if (data.code) throw new Error(data.message)
    return data.orders || []
  }

  const fetchHistoryOrders = async (page: number) => {
    const res = await wx.cloud.callFunction({
      name: 'getOrders',
      data: { status: 'completed', page, pageSize: 20 },
    })
    const data = res.result as any
    if (data.code) throw new Error(data.message)
    return { orders: data.orders || [], hasMore: data.hasMore || false }
  }

  const completeOrder = async (order_id: string) => {
    const res = await wx.cloud.callFunction({
      name: 'completeOrder',
      data: { order_id },
    })
    const data = res.result as any
    if (data.code) throw new Error(data.message)
    return data.order
  }

  return { submitOrder, fetchActiveOrders, fetchHistoryOrders, completeOrder }
})
