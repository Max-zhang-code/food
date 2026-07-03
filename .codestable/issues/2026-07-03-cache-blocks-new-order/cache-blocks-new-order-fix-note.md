---
doc_type: issue-fix
issue: 2026-07-03-cache-blocks-new-order
severity: medium
tags: [bug, cache, order]
---

# 下单后订单页无数据

## 根因

性能优化加的 30s 缓存（`fetchActiveIfStale`）在 `onShow` 中阻断了刷新。购物车下单后 `uni.switchTab` 触发订单页 `onShow`，缓存未过期 → 不拉数据 → 新订单不可见。

## 修复

- `cart/index.vue`：下单成功后设 `wx.setStorageSync('forceOrderRefresh', true)`
- `order/index.vue`：`onShow` 检测到标记 → 强制刷新并清除标记；否则走缓存逻辑

## 验证

`npm run build:mp-weixin` → DONE
