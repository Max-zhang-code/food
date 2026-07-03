---
doc_type: feature-design
feature: 2026-07-03-order-hard-delete
status: approved
summary: 订单硬删除——仅本人可物理删除自己已撤销的订单
tags: [订单, 删除, 云函数]
---

# 订单硬删除 Design

## 0. 术语

| 术语 | 定义 |
|---|---|
| 删除 (delete) | 从数据库物理移除订单记录，不可恢复。仅已撤销（revoked）的订单可删除 |
| 撤销 (revoke) | 软删除，状态变 revoked，数据保留。删除的前置条件 |

## 1. 决策

- **做什么**：新增硬删除能力——仅本人可物理删除自己已撤销的订单
- **明确不做**：批量删除、删除非 revoked 订单、他人删除、删除后恢复

## 2. 名词与编排

### `deleteOrder` 云函数（新增）

```
输入: { order_id }
输出: { success: true }

错误:
  NOT_LOGGED_IN / MISSING_ORDER_ID / ORDER_NOT_FOUND
  NOT_OWNER（仅本人）/ NOT_REVOKED（仅已撤销可删）/ DELETE_FAILED
```

实现要点：
- 校验 OPENID → 查订单 → 校验 `user_openid === OPENID` → 校验 `status === 'revoked'` → `db.collection('orders').doc(order_id).remove()`

### Store 扩展

`useOrderStore` 新增 `deleteOrder(order_id): Promise<void>`

### UI 变化

历史 tab 中已撤销（revoked）的本人订单："已撤销"标签旁增加"删除"按钮。点击 → 确认弹窗 → 删除 → toast + 刷新。

## 3. 验收

| # | 场景 | 期望 |
|---|---|---|
| S1 | 本人在历史 tab 对已撤销订单点删除 → 确认 | 订单从列表消失，数据库无此记录 |
| S2 | 他人已撤销订单 | 无删除按钮 |
| S3 | 非 revoked 订单 | 无删除按钮 |
| S4 | 非本人调 deleteOrder | NOT_OWNER |
| S5 | 删除非 revoked 订单 | NOT_REVOKED |
