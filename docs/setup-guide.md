# 微信云开发上线前配置清单

## 一、微信公众平台

- [ ] 注册微信小程序，获取 **AppID**
- [ ] 开通微信云开发，获取 **云环境 ID**
- [ ] 将 AppID 填入 `src/manifest.json` → `mp-weixin.appid`
- [ ] 将云环境 ID 填入 `src/manifest.json` → `mp-weixin.cloudEnv`

## 二、云开发控制台 → 数据库

- [ ] 创建集合 `ingredients`
- [ ] 创建集合 `dishes`
- [ ] 创建集合 `orders`
- [ ] 创建集合 `settings`
- [ ] 创建集合 `users`
- [ ] 按 `docs/cloud-security.md` 配置各集合权限规则
- [ ] 在 `settings` 中新增文档 `_id: "approvers"`，格式：

```json
{
  "_id": "approvers",
  "approvers": [
    {
      "openid": "审核人的_openid",
      "nickName": "张三",
      "avatarUrl": ""
    }
  ]
}
```

> 审核人 openid 获取方式：审核人先用小程序登录一次 → 在 `users` 集合中找到对应记录 → 复制 `_id`

- [ ] 录入测试食材数据（示例）：

```json
{ "name": "鸡蛋", "category": "其他", "icon": "🥚", "createdAt": "<当前时间>" }
{ "name": "西红柿", "category": "蔬菜", "icon": "🍅", "createdAt": "<当前时间>" }
{ "name": "猪肉", "category": "肉类", "icon": "🥩", "createdAt": "<当前时间>" }
{ "name": "青椒", "category": "蔬菜", "icon": "🫑", "createdAt": "<当前时间>" }
{ "name": "豆腐", "category": "豆制品", "icon": "🧈", "createdAt": "<当前时间>" }
```

- [ ] 录入测试菜品数据（初始就设为 approved）：

```json
{
  "name": "番茄炒蛋",
  "description": "家常下饭菜",
  "cooking_time": 15,
  "ingredient_ids": ["<西红柿_id>", "<鸡蛋_id>"],
  "status": "approved",
  "submitted_by": "admin",
  "submitted_by_name": "管理员",
  "submitted_at": "<当前时间>",
  "createdAt": "<当前时间>"
}
```

## 三、云开发控制台 → 云函数

- [ ] 上传全部 11 个云函数（在微信开发者工具中右键每个云函数目录 → 上传并部署）
- [ ] uploadDish (11个): login, getMatchedDishes, submitOrder, getOrders, completeOrder, submitDish, resubmitDish, approveDish, rejectDish, getPendingDishes, getMySubmissions

## 四、编译与预览

- [ ] 运行 `npm run dev:mp-weixin`（开发模式）或 `npm run build:mp-weixin`（生产模式）
- [ ] 微信开发者工具打开 `dist/dev/mp-weixin`（开发）或 `dist/build/mp-weixin`（生产）
- [ ] 真机预览测试全部 21 条验收场景

## 五、越权测试

- [ ] 按 `docs/cloud-security.md` 中 T1-T8 逐条验证
