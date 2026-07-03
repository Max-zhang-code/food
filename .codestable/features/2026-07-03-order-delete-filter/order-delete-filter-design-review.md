---
doc_type: feature-design-review
feature: 2026-07-03-order-delete-filter
status: passed
reviewed: 2026-07-03
round: 2
---

# order-delete-filter feature design 审查报告（第 2 轮）

## 1. Scope And Inputs

- Design: `.codestable/features/2026-07-03-order-delete-filter/order-delete-filter-design.md`（已修订）
- Checklist: `.codestable/features/2026-07-03-order-delete-filter/order-delete-filter-checklist.yaml`（已修订）
- Previous review: round 1（1 blocking + 6 important + 3 nit）
- Changes: 按 FDR-001~010 逐一修复
- Related docs: `.codestable/requirements/CONTEXT.md`
- Code facts re-checked: `cloudfunctions/getOrders/index.js`, `src/stores/order.ts`

### Independent Review

- Status: skipped（第 2 轮仅验证修订，改动均为针对性修复，无需重新异构审查）
- Detection: local-only
- Provider / agent: none
- Merge policy: 直接逐条核对 round 1 findings 的修复状态
- Gate effect: none

---

## 2. Design Summary

修订范围：
- 术语措辞修正（FDR-002）
- getOrders 接口扩展支持多 status（FDR-001）
- cancelOrder 补兜底错误码（FDR-003）+ 流程补错误路径（FDR-004）
- getOrderUsers 补 OPENID 校验（FDR-005）
- Step 2 拆分 2a/2b（FDR-006）
- 筛选状态生命周期明确（FDR-007）
- 结构健康度备注 + "全部"语义明确 + CONTEXT.md 更新范围补全（FDR-008~010）

---

## 3. Findings

### blocking

none

### important

none

### nit

none

### suggestion

none

### learning

- **Round 1 → Round 2 修复速度验证了 design-review 的价值**：10 条 findings 中有 2 条（FDR-001 getOrders 多 status、FDR-005 OPENID 校验）如果在 implement 阶段才发现，会导致返工或安全不一致。方案阶段的独立审查将这些问题提前暴露，节省了下游成本。

### praise

- **Round 1 的 10 条 findings 全部被采纳并修复**，无遗漏、无争议驳回。design 作者与 reviewer 的协作效率高。

---

## 4. User Review Focus

- **需要重点拍板**：
  - D2 ✅ 已确认：仅订单提交人可取消自己的订单（`user_openid === OPENID`）
  - D6 ✅ 已确认：已取消订单在历史 tab 中与 completed 混排
  - 筛选状态 ✅ 已确认：页面级共享（两个 tab 共用筛选用户）

- **implement 需要重点遵守**：
  - `getOrders` 的 `status` 参数用 `_.in()` 支持数组
  - `cancelOrder` 必须有 `CANCEL_FAILED` 兜底
  - 取消失败后列表不刷新、订单状态不变

- **code review / QA / acceptance 需要重点复核**：
  - 历史 tab 中 cancelled 和 completed 是否确实混排
  - 筛选 + tab 切换是否保留选中用户
  - cancelled 订单的取消按钮是否正确隐藏

---

## 5. Evidence Confidence Ledger

| Check | Verdict | Evidence Class | Basis | Follow-up |
|---|---|---|---|---|
| Acceptance Coverage Matrix | pass | E | design#3 + checklist accept-1~13 | none |
| DoD Contract | pass | E | design#3 DOD + CMD-001 | implement 前重跑 build |
| Steps and checks traceability | pass | E | 6 steps（含 2a/2b）独立可验证；30 checks 全部追溯 | none |
| Roadmap contract compliance | pass | E | 非 roadmap 起头 | none |
| Validation and artifacts | pass | E | CMD-001 明确；基线预检说明清楚 | implement Step 0 重跑 build |

Summary: E=5, C=0, H=0, H-only core checks=none。

---

## 6. Residual Risk

- **基线未实际验证**（同 round 1）：implement 前需 `npm run build:mp-weixin` 确认绿灯。
- **`getOrderUsers` 去重范围**：design 限 500 条最近订单去重。如果家庭订单量极大（超过 500 条且早期下单用户无近期订单），个别用户可能不出现在筛选列表中。风险低（家庭 3-10 人、数百条订单），acceptance 阶段观察即可。

---

## 7. Verdict

- Status: **passed**
- Next: 交给用户整体 review，确认后 design `status: draft` → `approved`，进入 `cs-feat-impl`
