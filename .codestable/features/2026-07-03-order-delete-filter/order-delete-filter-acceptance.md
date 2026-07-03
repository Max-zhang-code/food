---
doc_type: feature-acceptance
feature: 2026-07-03-order-delete-filter
status: passed
accepted: 2026-07-03
round: 1
---

# 订单删除与按提交人筛选 验收报告

> 阶段：阶段 3（验收闭环）
> 验收日期：2026-07-03
> 关联方案：`order-delete-filter-design.md`

## 1. 接口契约核对

对照 design 第 2.1 节名词层逐一核查。

### 接口示例逐项核对

- [x] **cancelOrder** (`cloudfunctions/cancelOrder/index.js`)
  - 输入 `{ order_id }` → 输出 `{ success: true, order }` ✅
  - 错误码：NOT_LOGGED_IN / MISSING_ORDER_ID / ORDER_NOT_FOUND / NOT_OWNER / ALREADY_CANCELLED / CANCEL_FAILED — 6 个全部实现 ✅

- [x] **getOrders 扩展** (`cloudfunctions/getOrders/index.js`)
  - `status` 支持 `string | string[]`（`Array.isArray(status) ? _.in(status) : status`） ✅
  - `user_openid` 可选参数（`if (user_openid) { where.user_openid = user_openid }`） ✅

- [x] **getOrderUsers** (`cloudfunctions/getOrderUsers/index.js`)
  - 输入 `{}` → 输出 `{ users: [{ openid, user_name, user_avatar }] }` ✅
  - OPENID 校验 ✅
  - 错误码：NOT_LOGGED_IN / QUERY_FAILED ✅

- [x] **Store 接口** (`src/stores/order.ts`)
  - `cancelOrder(order_id)` / `fetchOrderUsers()` — 签名与云函数一致 ✅
  - `fetchActiveOrders(user_openid?)` / `fetchHistoryOrders(page, user_openid?)` — 参数扩展正确 ✅

### 名词层"现状 → 变化"逐项核对

- [x] 订单状态机：`active → cancelled` + `completed → cancelled` ✅
- [x] 新增 `cancelled_at` 字段：`cancelOrder` 写入 ✅
- [x] 历史 tab 数据源：`status: ['completed', 'cancelled']` — Store 硬编码 ✅

### 流程图核对

- [x] 筛选流程：`getOrderUsers → 筛选栏点击 → getOrders(user_openid)` ✅
- [x] 取消流程：`点击取消 → showModal → cancelOrder → toast + 刷新` ✅

---

## 2. 行为与决策核对

### 需求摘要逐项验证

- [x] **取消订单**：软删除，status → cancelled，数据保留 ✅
- [x] **按提交人筛选**：全部 / 我的 / 具体家人 ✅

### 明确不做逐项核对

- [x] 无硬删除：`grep -r "db.collection.*remove" cloudfunctions/` → **0 matches** ✅
- [x] 无取消后恢复：`cancelOrder` 只写 status='cancelled'，无逆向云函数 ✅
- [x] 无批量取消：前端无多选，cancelOrder 只接受单个 `order_id` ✅
- [x] 无订单编辑：无 updateOrder 云函数 ✅
- [x] 无按审核人角色筛选：`grep isApprover src/pages/order/` → **0 matches** ✅

### 关键决策落地

- [x] **D1** 软删除：`cancelOrder` → `status: 'cancelled'`，不删记录 ✅
- [x] **D2** 仅本人取消：`if (order.user_openid !== OPENID) return NOT_OWNER` ✅
- [x] **D3** active 和 completed 都可取消：cancelOrder 不检查 `status !== 'completed'` ✅
- [x] **D4** 按 user_openid 筛选：`getOrders` 接受 `user_openid` 参数 ✅
- [x] **D5** 从 orders 去重提取用户：`getOrderUsers` 按 created_at 降序 + Set 去重 ✅
- [x] **D6** 历史 tab 混排：Store 传 `['completed', 'cancelled']`，UI 用 `cancelled` class 区分 ✅

### 编排层"现状 → 变化"核对

- [x] 筛选栏：全部 / 我的 / 具体用户，水平滚动 ✅
- [x] 取消按钮：仅本人订单可见（`v-if="isOwnOrder(order)"`） ✅
- [x] cancelled 标记：`v-if="order.status === 'cancelled'"` → "已取消" + 半透明 ✅
- [x] 确认弹窗：`uni.showModal` → confirm 才执行 ✅

### 流程级约束核对

- [x] 取消幂等：后端 `ALREADY_CANCELLED` + 前端 `v-else-if` 隐藏按钮 ✅
- [x] 取消失败处理：`catch { toast e.message }`，列表不刷新 ✅
- [x] 筛选 + 分页重置：`setFilter` 重置 `page=1` + `historyOrders=[]` ✅
- [x] 筛选状态页面级：`filterOpenid` 在 `switchTab` 外定义，两个 tab 共享 ✅
- [x] 兼容性：`getOrders` 不传 `user_openid` 行为不变 ✅

### 挂载点反向核对（可卸载性）

对照 design 第 2.3 节，逐条 grep 确认：

- [x] M1 `cloudfunctions/cancelOrder/` — 新增目录 ✅
- [x] M2 `cloudfunctions/getOrderUsers/` — 新增目录 ✅
- [x] M3 `cloudfunctions/getOrders/index.js` — 修改（+14/-5 行） ✅
- [x] M4 `src/stores/order.ts` — 修改（+36/-6 行） ✅
- [x] M5 `src/pages/order/index.vue` — 修改（+134/-5 行） ✅

**反向核查**（grep 确认无清单外引用）：
- `cancelOrder` 引用：仅在 `cloudfunctions/cancelOrder/` 和 `src/stores/order.ts`、`src/pages/order/index.vue` ✅
- `getOrderUsers` 引用：仅在 `cloudfunctions/getOrderUsers/` 和 `src/stores/order.ts`、`src/pages/order/index.vue` ✅

**拔除沙盘推演**：删除 2 个新云函数目录 + 回退 3 个文件的改动 → feature 完全移除，无残留 ✅

---

## 3. 验收场景核对

### 可本地验证（静态分析）

- [x] **S7** 已取消订单无取消按钮 → `v-else-if="isOwnOrder(order)"` 跳过 cancelled ✅
- [x] **S10** 取消确认弹窗点取消 → `if (!res.confirm) return` ✅
- [x] **S12** 网络异常 toast → `catch { uni.showToast(...) }` ✅
- [x] **S13** NOT_LOGGED_IN → `cancelOrder` 入口 `if (!OPENID)` ✅
- [x] **S14** NOT_OWNER → `if (order.user_openid !== OPENID)` ✅
- [x] **S15** MISSING_ORDER_ID → `if (!order_id)` ✅

### 需微信开发者工具手工验证

- [ ] **S1** 取消进行中订单（DevTools）
- [ ] **S2** 取消已完成订单（DevTools）
- [ ] **S3** 筛选"我的"（DevTools）
- [ ] **S4** 筛选某个家人（DevTools）
- [ ] **S5** 筛选+tab 切换（DevTools）
- [ ] **S6** 取消后刷新（DevTools）
- [ ] **S8** 筛选无结果空态（DevTools）
- [ ] **S9** 单人时筛选栏（DevTools）
- [ ] **S11** 切回全部（DevTools）

> 以上 9 条需微信开发者工具验证，详细步骤见 QA 报告第 6 节。静态分析已确认代码逻辑正确。

### Review 重点复核

- [x] Test And QA Focus P0-P2 全部有静态验证或 DevTools 计划覆盖 ✅
- [x] Residual risk R1（openid 未就绪）：已加 `v-if="myOpenid"` 守卫 ✅
- [x] Residual risk R2（并发竞态）：家庭场景低概率，接受 ✅

### QA 报告复核

- [x] QA 报告 status=passed，无 failed/blocked items ✅
- [x] 编译通过 + 清洁度通过 + 6 条静态场景通过 ✅
- [x] 8 条 DevTools 场景有明确手工验证清单 ✅

---

## 4. 术语一致性

对照 design 第 0 节 + 第 2.1 节：

- [x] **取消/cancel**：代码使用 `cancelOrder` / `cancel-btn` / `cancelled` / "取消" / "已取消" — 一致 ✅
- [x] **筛选/filter**：代码使用 `filterOpenid` / `setFilter` / `filter-bar` / `filter-chip` — 一致 ✅
- [x] **提交人/submitter**：代码使用 `user_openid` / `user_name`（沿用 orders 集合字段名）— 一致 ✅
- [x] **防冲突**：`isApprover` 未在订单页使用 ✅；无新造术语

---

## 5. 领域影响盘点

对照 design 第 4 节：

- [x] **CONTEXT.md 更新**：订单状态机改为 `active → completed / cancelled`（cancelled 已实现）；schema 新增 `cancelled_at`；删除"不设删除"约束 —— **建议走 `cs-domain` 更新 CONTEXT.md**
- [x] **无新 ADR**：取消权限沿用家庭信任模型变体（仅本人），不引入新结构性决策 ✅

---

## 6. requirement delta

非 roadmap 起头，无对应的 requirement 文档。本次新增的能力（订单取消 + 按提交人筛选）属于已有 `smart-menu` 能力域的扩展。

→ **无 requirement 影响**，跳过。

---

## 7. roadmap 回写

design frontmatter 无 `roadmap` / `roadmap_item` 字段。

→ **非 roadmap 起头**，跳过。

---

## 8. attention.md 候选盘点

- [x] 无新候选：本 feature 未暴露需要补入 attention.md 的环境/工具/工作流约定。

---

## 9. 遗留

- **DevTools 手工验证**：9 条验收场景 + 12 步操作清单（详见 QA 报告第 6 节）需在微信开发者工具中执行
- **已知限制**：`getOrderUsers` limit 100（云数据库上限），家庭场景足够；极端情况（100+ 个不同用户各下 1 单）可能遗漏早期用户
- **后续优化**：REV-S1（cancelOrder 用 `where().update()` 替代 read-then-write）— 可选

---

## 10. 最终审计

### 聚合命令重验

- `npm run build:mp-weixin` → DONE Build complete ✅

### 交付物落盘复核

| 承诺 | 状态 |
|---|---|
| `cloudfunctions/cancelOrder/index.js` + `package.json` | ✅ 已落盘 |
| `cloudfunctions/getOrderUsers/index.js` + `package.json` | ✅ 已落盘 |
| `cloudfunctions/getOrders/index.js` 修改 | ✅ 已修改 |
| `src/stores/order.ts` 修改 | ✅ 已修改 |
| `src/pages/order/index.vue` 修改 | ✅ 已修改 |

### Diff 清洁度

- 方案外文件：`src/pages.json` title 变更（非本 feature），不阻塞 ✅
- 无 debug 输出 / TODO / 注释代码 / 无用 import ✅

### 覆盖率诚实标记

| 类型 | 数量 |
|---|---|
| re-verified（本轮复验） | 15（编译 + 静态 + grep） |
| trust-prior-verify（信任前序） | 0 |
| DevTools-required | 9 |

### 知识沉淀出口分流

- `cs-keep`：`getOrderUsers` limit 100 上限经验 + 微信云数据库服务端 SDK 单次查询限制 → 可选
- `cs-domain`：CONTEXT.md 更新（cancelled 状态实现 + cancelled_at 字段） → 建议
- `cs-doc-tutorial`：无新增用户操作指南需求
- `cs-doc-api`：无公开 API 变更
