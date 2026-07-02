---
doc_type: learning
track: pitfall
date: 2026-07-01
slug: uni-app-custom-tabbar-index-vue-not-compiled
component: custom-tab-bar / mp-weixin
severity: medium
tags: [uni-app, vue3, wechat-miniprogram, tabbar, build]
related: .codestable/refactors/2026-07-01-tabbar-component/
---

# uni-app Vue3：`custom-tab-bar/index.vue` 编译到微信小程序不生效

## 问题

在 uni-app Vue3 项目中，按文档在 `src/custom-tab-bar/index.vue` 放置自定义 tabBar，并在 `pages.json` 设置 `"custom": true`，期望微信自动挂载该组件。

## 症状

- `npm run build:mp-weixin` 能通过，但微信开发者工具里 tabBar 不显示或报 `Component is not found in path "custom-tab-bar/index"`
- 检查 `dist/build/mp-weixin/custom-tab-bar/`：**只有 `index.vue` 原文件被复制**，没有 `index.js` / `index.wxml` / `index.wxss` / `index.json`
- 若改用微信原生四件套（`index.js` 等），tabBar 可正常渲染，但与项目 Vue3 + TS 技术栈割裂

## 没用的做法

- 仅依赖 `pages.json` 的 `"custom": true`，不写任何页面侧代码——Vue3 编译到微信小程序时自动实例化不可靠
- 在 tab 页 `onShow` 里用 `getTabBar().setData({ selected })` 同步选中态——能勉强工作，但依赖微信私有 API，类型需断言，与 Vue 响应式模型脱节
- 在 `custom-tab-bar/index.vue` 里写完整 UI 后期待 uni-app 像普通页面一样编译——**该路径在 mp-weixin 构建管线中不会被编译成小程序组件**

## 解法

采用「显式 Vue 组件 + 各 tab 页引入」：

1. `pages.json` 保留 `"custom": true`（预留底部空间、告知微信使用自定义 tabBar 模式）
2. 新建 `src/components/app-tab-bar/AppTabBar.vue`，props 传 `current`，内部 `uni.switchTab`
3. 每个 tab 页 template 底部写 `<AppTabBar :current="n" />`
4. `App.vue` 的 `onLaunch` 调用 `uni.hideTabBar({ animation: false })`
5. 删除 `src/custom-tab-bar/` 原生四件套（若存在）

## 为什么有效

uni-app Vue3 对普通 `components/` 下的 `.vue` 走标准编译管线，产物为 `AppTabBar.js` + wxml/wxss，各 tab 页 `usingComponents` 正确注册。绕开了 `custom-tab-bar/index.vue` 这条不被 mp-weixin 编译的特殊路径。

## 预防

- 新增自定义 tabBar 时，**默认用 `components/` + 显式引入**，不要先写 `custom-tab-bar/index.vue`
- 构建后检查 `dist/build/mp-weixin/components/app-tab-bar/` 是否有编译产物，而非只有 `.vue` 原文件
- 若必须用微信 `getTabBar()` 协议槽位，在 `custom-tab-bar/` 放**原生四件套**，不要放 `.vue`
