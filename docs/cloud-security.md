# 微信云开发数据库权限规则

> 在微信云开发控制台 → 数据库 → 集合 → 权限设置 中逐个配置。

## 各集合权限规则

### `ingredients` — 食材

```
{
  "read": true,
  "write": false
}
```

- 所有用户可读，仅云函数可写
- 食材数据由管理员在控制台维护

### `dishes` — 菜品

```
{
  "read": true,
  "write": false
}
```

- 所有用户可读，仅云函数可写
- 菜品创建/审核/驳回全部通过云函数（submitDish / approveDish 等），不直写数据库
- 云函数端已做权限校验（审核人身份、重复检测）

### `orders` — 订单

```
{
  "read": "doc.user_openid == auth.openid",
  "write": false
}
```

- ⚠️ 当前设计为家庭共享——所有家庭成员可以看到所有订单
- 如需严格限制（每人只看自己的订单），改为：
  `"read": "doc.user_openid == auth.openid"`
- 如需家庭共享（推荐）：
  `"read": true`
- 始终仅云函数可写

### `settings` — 系统配置

```
{
  "read": true,
  "write": false
}
```

- 所有用户可读（审核人列表需要被读取），仅云函数可写

### `users` — 用户资料

```
{
  "read": true,
  "write": false
}
```

- 所有用户可读（审核人列表需查用户头像昵称），仅云函数可写（login 时 upsert）

---

## 越权测试清单

配置完成后逐条验证：

| # | 测试 | 操作 | 期望结果 |
|---|---|---|---|
| T1 | 前端直写 orders | 小程序中尝试 `db.collection('orders').add(...)` | 返回 permission denied |
| T2 | 前端直改 dishes status | 小程序中尝试 `db.collection('dishes').doc(x).update(...)` | 返回 permission denied |
| T3 | 前端直改 settings | 小程序中尝试 `db.collection('settings').doc('approvers').update(...)` | 返回 permission denied |
| T4 | 非审核人调 approveDish | 普通用户在云函数测试面板调 approveDish | 返回 `NOT_APPROVER` |
| T5 | 非审核人调 getPendingDishes | 普通用户调 getPendingDishes | 返回 `NOT_APPROVER` |
| T6 | 非提交人调 resubmitDish | A 用户尝试编辑 B 用户被驳回的菜品 | 返回 `NOT_OWNER` |
| T7 | 编辑非驳回菜品 | 尝试 resubmitDish 一个 approved 状态的菜品 | 返回 `NOT_REJECTED` |
| T8 | 重复菜名检测 | 提交一个与已上架菜品同名的菜 | 返回 `DUPLICATE_NAME` |
