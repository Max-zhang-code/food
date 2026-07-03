import { defineStore } from 'pinia'

interface CartItem {
  dish_id: string
  dish_name: string
  quantity: number
}

interface OrderUser {
  openid: string
  user_name: string
  user_avatar: string
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

  const fetchActiveOrders = async (user_openid?: string) => {
    const res = await wx.cloud.callFunction({
      name: 'getOrders',
      data: { status: 'active', page: 1, pageSize: 50, user_openid },
    })
    const data = res.result as any
    if (data.code) throw new Error(data.message)
    return data.orders || []
  }

  const fetchHistoryOrders = async (page: number, user_openid?: string) => {
    const res = await wx.cloud.callFunction({
      name: 'getOrders',
      data: { status: ['completed', 'revoked'], page, pageSize: 20, user_openid },
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

  const revokeOrder = async (order_id: string) => {
    const res = await wx.cloud.callFunction({
      name: 'revokeOrder',
      data: { order_id },
    })
    const data = res.result as any
    if (data.code) throw new Error(data.message)
    return data.order
  }

  const deleteOrder = async (order_id: string) => {
    const res = await wx.cloud.callFunction({
      name: 'deleteOrder',
      data: { order_id },
    })
    const data = res.result as any
    if (data.code) throw new Error(data.message)
  }

  const fetchOrderUsers = async (): Promise<OrderUser[]> => {
    const res = await wx.cloud.callFunction({
      name: 'getOrderUsers',
      data: {},
    })
    const data = res.result as any
    if (data.code) throw new Error(data.message)
    return data.users || []
  }

  return { submitOrder, fetchActiveOrders, fetchHistoryOrders, completeOrder, revokeOrder, deleteOrder, fetchOrderUsers }
})
