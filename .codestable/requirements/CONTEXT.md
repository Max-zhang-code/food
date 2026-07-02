# 智能点菜

家庭内部微信小程序。家人提交菜品建议 → 审核人审核上架 → 按食材筛选可做菜品 → 点菜下单 → 查看历史订单。

## Language

### 核心实体

**食材 (Ingredient)**：
菜品的原材料，如"鸡蛋""西红柿"。按类别分组（蔬菜、肉类、调味等），可带 emoji 图标。
对应云数据库 `ingredients` 集合。字段：`_id`, `name`, `category`, `icon`, `createdAt`。
_Avoid_: 原材料、原料、材料

**菜品 (Dish)**：
由若干食材组成的可点菜肴，如"番茄炒蛋"。生命周期受状态机控制：`pending` → `approved` / `rejected`；`rejected` → `pending`（通过 resubmit 重提）。只有 `approved` 的菜品出现在首页点菜列表中。已上架菜品不可编辑。
对应云数据库 `dishes` 集合。字段：`_id`, `name`, `description`, `image`, `cooking_time`, `ingredient_ids`, `status`, `submitted_by`, `submitted_by_name`, `submitted_at`, `approved_by`, `approved_at`, `createdAt`。
_Avoid_: 菜、菜单项、餐品

**订单 (Order)**：
一次点菜记录，包含下单人及其所选菜品。状态机：`active` → `completed` / `cancelled`，不设删除。
对应云数据库 `orders` 集合。字段：`_id`, `user_openid`, `user_name`, `items: [{ dish_id, dish_name, quantity }]`, `status`, `created_at`, `completed_at`。
_Avoid_: 点单、下单记录、工单

### 用户与权限

**审核人 (Approver)**：
家里负责审核菜品的人（通常是做饭的人），由开发者在云开发控制台的 `settings` 集合中手动配置。审核人可审核自己提交的菜品（家庭信任模型，不做自审限制）。
存储在 `settings` 集合，`_id: "approvers"` 固定 key。字段：`approvers: [{ openid, nickName, avatarUrl }]`。
_Avoid_: 管理员、审核员、admin

**用户 (User)**：
家人身份标识。通过微信登录获取 openid 作为唯一 ID，昵称和头像在每次登录时缓存到 `users` 集合供展示用。
对应云数据库 `users` 集合。`_id` 即 openid。字段：`nickName`, `avatarUrl`, `lastLoginAt`。
_Avoid_: 成员、家人、account

### 状态

**待审核 (pending)**：
菜品提交后的初始状态，不出现在点菜列表中，仅提交人和审核人可见。
_Avoid_: 未审核、待处理、审核中

**已上架 (approved)**：
审核通过的菜品，出现在首页可点列表中。
_Avoid_: 已通过、已发布、上架、在线

**已驳回 (rejected)**：
审核未通过的菜品。提交人在"我的提交"页可见驳回状态及"编辑"按钮，修改后可重新提交（status 回到 pending）。
_Avoid_: 拒绝、不通过、退回

**进行中 (active)**：
订单状态——已下单但尚未完成。
_Avoid_: 未完成、待处理、进行中的订单

**已完成 (completed)**：
订单状态——做饭的人标记完成，移入历史列表。
_Avoid_: 完成、结束、已处理

**驳回重提 (resubmit)**：
被驳回菜品的提交人修改后重新提交审核的操作，不是独立状态。操作后菜品 status 从 `rejected` 回到 `pending`。
_Avoid_: 重新提交、再次提交、编辑重提
