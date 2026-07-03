export type TabBarIcon = 'menu' | 'cart' | 'order' | 'mine'

export interface TabBarItem {
  pagePath: string
  text: string
  icon: TabBarIcon
}

/** 与 pages.json tabBar.list 保持同步 */
export const TAB_BAR_ITEMS: TabBarItem[] = [
  { pagePath: 'pages/index/index', text: '点菜', icon: 'menu' },
  { pagePath: 'pages/cart/index', text: '购物车', icon: 'cart' },
  { pagePath: 'pages/order/index', text: '订单', icon: 'order' },
  { pagePath: 'pages/mine/index', text: '我的', icon: 'mine' },
]
