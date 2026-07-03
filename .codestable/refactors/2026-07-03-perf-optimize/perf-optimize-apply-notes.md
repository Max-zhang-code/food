---
doc_type: refactor-apply-notes
refactor: 2026-07-03-perf-optimize
---

# perf-optimize apply notes

## Step 1: 食材列表缓存

- 改动: `src/stores/menu.ts` — `fetchAllIngredients`
- 验证: `npm run build:mp-weixin` → DONE ✅
- 行为: 首次加载：缓存空 → 云数据库拉取 → 写入缓存；再次进入：缓存命中 → 立即渲染 → 异步刷新

## Step 2: 食材切换防抖

- 改动: `src/stores/menu.ts` — `toggleIngredient` 加 300ms debounce
- 验证: `npm run build:mp-weixin` → DONE ✅
- 行为: 快速点 3 个食材 → 只发 1 次云函数请求

## Step 3: 用户列表缓存

- 改动: `src/pages/order/index.vue` — `fetchUsers`
- 验证: `npm run build:mp-weixin` → DONE ✅
- 行为: 筛选栏先读缓存立即显示 → 异步更新

## Step 4: 订单页 30s 去重

- 改动: `src/pages/order/index.vue` — `onShow` + `fetchActiveIfStale` + `forceRefresh`
- 验证: `npm run build:mp-weixin` → DONE ✅
- 行为: 30s 内切 tab 不重复拉取；完成/撤销/删除后强制刷新
