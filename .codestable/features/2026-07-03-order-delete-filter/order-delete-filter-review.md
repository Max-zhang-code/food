---
doc_type: feature-review
feature: 2026-07-03-order-delete-filter
status: passed
reviewed: 2026-07-03
round: 1
reviewer: subagent+ocr
---

# order-delete-filter 代码审查报告

## 1. Scope And Inputs

- Design: `.codestable/features/2026-07-03-order-delete-filter/order-delete-filter-design.md` (approved)
- Checklist: `.codestable/features/2026-07-03-order-delete-filter/order-delete-filter-checklist.yaml` (steps 全 done)
- Diff: 5 文件（2 新增云函数 + 3 修改），+165/-18 行
- Code files reviewed: 全部人写代码（5/5）

### Independent Review

- Status: completed（双环节）
- Detection: native-agent + ocr
- Agent: general-purpose subagent
- OCR: open-code-review v1.x (Alibaba), connection test passed
- Merge policy: 两路结果已逐条本地事实核验合并

---

## 2. Review Summary

| 维度 | 评估 |
|---|---|
| Design fit | ✅ 5 挂载点与 design 2.3 完全吻合，无范围外改动 |
| 逻辑正确性 | ✅ 取消/筛选核心路径正确，幂等保护（前端+后端）到位 |
| 权限模型 | ✅ NOT_OWNER 校验区分"本人取消"和"任何人完成" |
| 清洁度 | ✅ 无调试残留/TODO/注释代码/无用 import |

---

## 3. Findings

### blocking

none（B1 已在审查中修复）

### important

none（I1-I3 已在审查中修复）

### nit

- [ ] **REV-001** `src/pages/order/index.vue:18` 筛选栏在无用户时完全隐藏，严格来说与 design "仅显示全部和我的" 略有偏差。但实际无订单时空态已覆盖，影响极低。建议保持现状或后续改进。
  - Source: ocr + local
  - Evidence: `v-if="orderUsers.length > 0"` 在首次加载/错误时隐藏筛选栏
  - Impact: 极低——无订单时空态已覆盖

- [ ] **REV-002** `cloudfunctions/cancelOrder/index.js:46` 响应中 `_id: order_id` 被 `...order` 覆盖，是冗余代码。
  - Source: subagent
  - Evidence: `{ _id: order_id, ...order, ... }` — spread 后 `_id` 来自 `orderDoc.data`
  - Impact: 无运行时影响，仅可读性

- [ ] **REV-003** `cloudfunctions/getOrders/index.js:22` `if (user_openid)` 用 truthy 而非 `!== undefined`。当前调用方不会传空字符串，但精确匹配 design 语义更安全。
  - Source: subagent

- [ ] **REV-004** `src/stores/order.ts` + `src/pages/order/index.vue` 订单类型为 `any[]`，缺少 TypeScript 接口定义。建议后续补充 `interface Order`。
  - Source: subagent

### suggestion

- [ ] **REV-S1** `cancelOrder` 可改用 `collection().where({ _id, status: _.neq('cancelled') }).update()` 替代 read-then-write，消除并发竞态窗口。需在微信开发者工具验证权限。
  - Source: subagent

### learning

- 状态机扩展（active→cancelled, completed→cancelled）实现正确，cancelled 为终态的幂等保护（ALREADY_CANCELLED + 前端 v-if 双重防线）到位
- `formatTime` 回退链 `completed_at || cancelled_at || created_at` 正确覆盖了 3 种时间字段
- Store 层遵循项目既有错误处理模式（`if (data.code) throw new Error(data.message)`）

### praise

- 改动面精确：5 挂载点与 design 2.3 完全吻合，无多余文件
- 权限区分正确：NOT_OWNER（仅本人取消）vs 完成（任何人可点）
- 分页+筛选重置逻辑正确：`setFilter` 清空列表+重置页码

### residual-risk

- **R1** `userStore.openid` 未就绪时 `myOpenid` 为 `""`，"我的"筛选功能和取消按钮可能暂时不可用。取决于 userStore 初始化时机，实际风险低。
  - Source: subagent + ocr
  - 缓解：已加 `v-if="myOpenid"` 守卫"我的"标签

- **R2** `completeOrder` 与 `cancelOrder` 并发竞态——两人同时操作同一订单可能后写覆盖。家庭场景概率极低。
  - Source: subagent

---

## 4. Test And QA Focus

| 优先级 | 场景 | 原因 |
|---|---|---|
| P0 | 取消进行中订单 → 历史 tab 出现 cancelled 状态 | 核心路径 |
| P0 | "我的"筛选 → 仅显示本人订单 | 筛选核心 |
| P1 | 从进行中 tab 取消 → 切历史 tab → 订单可见 | 跨 tab 数据一致性 |
| P1 | A 用户取消 B 的订单 → NOT_OWNER | 安全验证 |
| P1 | 筛选+分页：换条件后页码重置 | 分页一致性 |
| P2 | 网络断开时取消 → toast + 列表不刷新 | 异常路径 |
| P2 | 已取消订单无取消按钮（前端+后端） | 幂等防线 |

---

## 5. Verdict

- Status: **passed**
- Next: 进入 `cs-feat-qa`
- 审查中已修复 4 条（B1 + I1 + I2 + myOpenid guard），剩余 4 nit + 1 suggestion + 2 residual-risk 不阻塞 QA
