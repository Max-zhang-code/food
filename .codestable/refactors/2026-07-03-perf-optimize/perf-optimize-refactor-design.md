---
doc_type: refactor-design
refactor: 2026-07-03-perf-optimize
status: approved
scope: 首页+订单页+menuStore+orderStore 性能优化
summary: 加本地缓存 + 防抖 + 请求去重，不改行为
---

# perf-optimize refactor design

## 1. 本次范围

全部 5 条：

| # | 优化项 | 方法 |
|---|---|---|
| 1+5 | 食材列表缓存 | M-L4-01 wx.setStorageSync |
| 2 | 用户列表缓存 | M-L4-01 wx.setStorageSync |
| 3 | 食材切换防抖 | M-L4-03 300ms debounce |
| 4 | 订单页 onShow 去重 | M-L4-02 30s 时间窗口 |

预估：15 min，全低风险，AI 自证（编译通过）。

## 2. 执行顺序

### Step 1: 食材列表缓存 (menu.ts)
- `fetchAllIngredients` 先读 `wx.getStorageSync('ingredients')` 立即渲染
- 异步拉取云数据库，更新内存 + 缓存
- 退出信号：编译通过

### Step 2: 食材切换防抖 (menu.ts)
- `toggleIngredient` → 300ms debounce 后调 `fetchMatchedDishes`
- 退出信号：编译通过

### Step 3: 用户列表缓存 (order/index.vue)
- `fetchUsers` 先读 `wx.getStorageSync('orderUsers')` 立即渲染筛选栏
- 异步调云函数，更新内存 + 缓存
- 退出信号：编译通过

### Step 4: 订单页 onShow 去重 (order/index.vue)
- `onShow` 记录 `lastFetchTime`，30s 内跳过 `fetchActive`
- `handleComplete/handleRevoke/handleDelete` 等操作后强制刷新（不检查缓存）
- 退出信号：编译通过

## 3. 风险

全部低风险，不改接口签名、不改数据流、不改 UI 行为。
