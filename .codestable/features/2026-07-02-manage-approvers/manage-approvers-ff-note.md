---
doc_type: feature-ff-note
feature: manage-approvers
date: 2026-07-02
requirement: smart-menu
tags: [审核人, 权限管理, 云函数]
---

## 做了什么

审核人管理原来只能在云开发控制台手动改 `settings` 集合。本次新增一个管理页面，审核人可以在小程序内直接添加/移除其他审核人，不再依赖数据库后台操作。

## 改了哪些

- `cloudfunctions/manageApprovers/index.js` — 新增云函数，支持 list/add/remove，校验审核人身份，防移除最后一人
- `cloudfunctions/manageApprovers/package.json` — 云函数依赖声明
- `src/pages/manage/approvers/index.vue` — 新增管理页面：审核人列表 + 从 users 选择添加 + 确认弹窗移除
- `src/pages.json:42-48` — manage 分包注册新页面
- `src/pages/mine/index.vue:20-23` — 审核人可见入口「👥 管理审核人」
- `src/pages/mine/index.vue:80` — 新增 goToApprovers 跳转方法

## 怎么验证的

`npm run type-check` 通过；`npm run build:mp-weixin` 通过；待微信开发者工具上传云函数后走通添加→移除完整路径。

## 顺手发现

无。
