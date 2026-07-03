export interface TabBarItem {
  pagePath: string
  text: string
  emoji: string
}

/** 与 pages.json tabBar.list 保持同步 */
export const TAB_BAR_ITEMS: TabBarItem[] = [
  { pagePath: 'pages/index/index', text: '点菜', emoji: '🍽️' },
  { pagePath: 'pages/cart/index', text: '购物车', emoji: '🛍️' },
  { pagePath: 'pages/order/index', text: '订单', emoji: '📝' },
  { pagePath: 'pages/mine/index', text: '我的', emoji: '😊' },
]
