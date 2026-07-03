---
doc_type: feature-ff-note
feature: 2026-07-03-order-hard-delete
date: 2026-07-03
tags: [order, delete, hard-delete]
---

## 做了什么

新增订单硬删除功能——仅本人可物理删除自己已撤销（revoked）的订单。

## 改了哪些

- `cloudfunctions/deleteOrder/` — 新增云函数，校验 NOT_OWNER + NOT_REVOKED 后物理删除
- `src/stores/order.ts` — 新增 `deleteOrder` 方法
- `src/pages/order/index.vue` — 历史 tab 已撤销订单旁增加"删除"按钮 + 确认弹窗

## 怎么验证的

`npm run build:mp-weixin` → DONE Build complete
