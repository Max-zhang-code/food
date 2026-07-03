---
doc_type: feature-ff-note
feature: 2026-07-03-rename-cancel-to-revoke
date: 2026-07-03
tags: [refactor, terminology, order]
---

## 做了什么

将订单状态术语从"取消/cancel/cancelled"统一改为"撤销/revoke/revoked"。仅改命名，行为不变。

## 改了哪些

- `cloudfunctions/revokeOrder/` — cancelOrder 目录重命名，状态值 cancelled→revoked，错误码 ALREADY_CANCELLED→ALREADY_REVOKED，CANCEL_FAILED→REVOKE_FAILED
- `cloudfunctions/completeOrder/index.js` — 中文提示"已取消"→"已撤销"
- `src/stores/order.ts` — cancelOrder→revokeOrder，status 值 cancelled→revoked
- `src/pages/order/index.vue` — 全部 UI 文案/class/方法名同步更名
- `.codestable/features/2026-07-03-order-delete-filter/order-delete-filter-design.md` — 术语表同步更新

## 怎么验证的

`npm run build:mp-weixin` → DONE Build complete，编译通过。
