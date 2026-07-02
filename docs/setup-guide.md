---
doc_type: dev-guide
slug: setup-guide
component: smart-menu
status: current
summary: 微信云开发上线前配置清单——数据库建集合、云函数上传、编译预览、越权测试
tags: [微信云开发, 部署, 数据库, 云函数]
last_reviewed: 2026-07-02
---

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

## 三、上传云函数

### 3.1 CLI 项目特别注意

uni-app CLI 项目编译产物在 `dist/build/mp-weixin/`，而 `cloudfunctions/` 在项目根目录。微信开发者工具打开的是 dist 目录，**默认看不到云函数文件夹**。

项目已配置自动复制（`package.json`）：

```
postbuild:mp-weixin → 每次 build 后自动将 cloudfunctions/ 复制到 dist
postdev:mp-weixin   → 每次 dev 后同样自动复制
```

运行 `npm run build:mp-weixin` 或 `npm run dev:mp-weixin` 后，`dist/*/mp-weixin/cloudfunctions/` 下即包含全部 11 个云函数。

### 3.2 上传步骤

- [ ] 微信开发者工具中，左侧文件树展开 `cloudfunctions/`
- [ ] 右键每个云函数文件夹 →「上传并部署：云端安装依赖」
- [ ] 全部 11 个：`login`, `getMatchedDishes`, `submitOrder`, `getOrders`, `completeOrder`, `submitDish`, `resubmitDish`, `approveDish`, `rejectDish`, `getPendingDishes`, `getMySubmissions`

### 3.3 本地调试（不占额度）

开发期间**开启云函数本地调试**，云函数调用不消耗免费额度：

1. 微信开发者工具 → 左侧栏"云开发" → 展开 `cloudfunctions/`
2. 右键**每个云函数目录** → "开启云函数本地调试"
3. 开启后云函数在你本机运行，调用次数不计入每月 20 万次限额

> 数据库读写仍然走云端，但免费额度 150 万次读/月，开发阶段远远用不完，正常调试即可。

## 四、编译与预览

- [ ] 运行 `npm run build:mp-weixin`
- [ ] 确认 `dist/build/mp-weixin/cloudfunctions/` 下已有 11 个云函数（`postbuild` 脚本自动复制）
- [ ] 微信开发者工具打开 `dist/build/mp-weixin`
- [ ] 真机预览测试全部 21 条验收场景

### CLI 项目关键配置（已内置，无需手动改）

以下配置已在代码中完成，此处仅作说明：

| 配置 | 位置 | 说明 |
|------|------|------|
| 云环境初始化 | `src/App.vue` → `wx.cloud.init({ env: '...' })` | CLI 项目必须手动调用，HBuilderX 项目自动处理 |
| 微信全局类型 | `src/env.d.ts` → `declare const wx: any` | CLI 项目无 `@types/wechat-miniprogram`，需手动声明 |
| API 适配 | 全部 Store + submit 页面 | CLI 不支持 `uniCloud.*`，已替换为 `wx.cloud.*` |
| 自定义 TabBar | `src/components/app-tab-bar/AppTabBar.vue` | Vue 组件方式，非原生 `custom-tab-bar/` 目录 |

## 五、越权测试

- [ ] 按 `docs/cloud-security.md` 中 T1-T8 逐条验证
