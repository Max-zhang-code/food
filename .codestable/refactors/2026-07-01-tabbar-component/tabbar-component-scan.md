---
doc_type: refactor-scan
refactor: 2026-07-01-tabbar-component
status: user-reviewed
scope: 底部 tabBar 相关——src/custom-tab-bar/*、src/utils/tab-bar.ts、src/pages.json tabBar 段、3 个 tab 页面
summary: 发现 4 条优化点：结构 3 / 可读性 1；低风险 2 / 中 2 / 高 0
---

# tabbar-component scan

## 总览

- 扫描范围：`src/custom-tab-bar/`（4 个微信原生文件）、`src/utils/tab-bar.ts`、`src/pages.json`（tabBar 段）、`src/pages/index|order|mine/index.vue`
- 发现 4 条优化点：结构 3 / 可读性 1 / 性能 0
- 按风险：低 2 / 中 2 / 高 0
- 建议先做：#1 #2（统一到 Vue 组件 + 去掉 getTabBar 桥接，是后续一切的前提）
- 建议慎做 / 后做：#4（需 HUMAN 目视确认 tab 切换无闪烁、选中态正确）
- 前置检查 7 条全过：✓

## 背景结论（回答「能不能做成组件」）

**可以，但有两种含义，约束不同：**

| 方案 | 做法 | 能否放 `components/` | 说明 |
|------|------|---------------------|------|
| A. 业务 Vue 组件（推荐） | `components/app-tab-bar/AppTabBar.vue`，各 tab 页 `<AppTabBar :current="n" />` | ✓ | uni-app Vue3 编译到微信小程序时，`custom-tab-bar/index.vue` **不会**自动编译挂载（上次构建只复制了 `.vue` 原文件）。显式引入是社区验证过的稳定做法 |
| B. 微信协议槽位 | 必须保留 `src/custom-tab-bar/` 目录名 | ✗ | 微信 `getTabBar()` 只认这个路径；内部可以是原生四件套（现状）或极薄 wrapper |

当前实现用方案 B（原生 `index.js/wxml/wxss`），与项目其余 Vue3 + TS 技术栈不一致，且 tab 配置在 `pages.json` 与 `index.js` 各写一份。

**推荐 refactor 方向**：走方案 A——抽成标准 Vue 组件，保留 `pages.json` 里 `"custom": true` 预留底部空间，删除原生四件套和 `setTabBarSelected` 桥接。

## 条目

### [1] 将 tabBar UI 抽成 Vue 组件 AppTabBar ✓

- **位置**：`src/custom-tab-bar/index.{js,wxml,wxss,json}`（整目录）
- **分类**：结构
- **现状**：底部导航用微信原生 Component 四件套实现，约 150 行 wxml/wxss/js，与项目 Vue3 + `<script setup>` 页面风格割裂
- **问题**：同一 UI 逻辑无法复用 Vue 生态（props、computed、子组件）；维护要在 wxml 与 vue 两套语法间切换；构建产物依赖微信原生目录约定而非 uni-app 组件管线
- **建议**：新建 `src/components/app-tab-bar/AppTabBar.vue`，把 wxml/wxss 等价迁移为 template + scoped style；props 接收 `current: number`；点击用 `uni.switchTab`；3 个 tab 页 template 底部加 `<AppTabBar :current="n" />`
- **建议映射的方法**：M-L3-01 Component Split（展示组件）
- **风险**：中——切换实现方式后，微信小程序 tab 切换可能出现短暂闪烁（社区常见坑），需配合 `custom: true` 预留空间
- **验证**：AI 自证（`npm run type-check`、`npm run build:mp-weixin`）｜ HUMAN（微信开发者工具点 3 个 tab，确认无闪烁、选中色正确）
- **范围**：约 120 行新增 / 4 文件删除 / 3 文件改 template

### [2] 删除 getTabBar/setData 桥接，改用 props 传选中索引 ✓

- **位置**：`src/utils/tab-bar.ts:1-10`；`src/pages/index/index.vue:65-70`；`src/pages/order/index.vue:59-69`；`src/pages/mine/index.vue:50-57`
- **分类**：结构
- **现状**：每个 tab 页 `onShow` 调用 `setTabBarSelected(n)`，通过 `getTabBar().setData` 同步微信原生组件实例的 `selected`
- **问题**：3 处重复调用同一桥接逻辑；依赖微信小程序私有 API `$scope.getTabBar`，类型需 `as` 断言；与 Vue 响应式模型脱节（选中态由外部 setData 推送而非 props）
- **建议**：完成 #1 后删除 `src/utils/tab-bar.ts`；各 tab 页去掉 `onShow` + import，改为 `<AppTabBar :current="0|1|2" />` 声明式传参
- **建议映射的方法**：M-L3-03 State Lifting（选中态由页面传给展示组件）
- **风险**：低——纯删除桥接代码，行为等价（当前索引由页面路由决定）
- **验证**：AI 自证（grep 确认无 `setTabBarSelected` / `getTabBar` 残留；type-check）｜ HUMAN（切换 tab 后高亮与当前页一致）
- **范围**：约 15 行删除 / 1 文件删除 / 3 文件各改 2-3 行

### [3] 抽离 tab 项配置为单一数据源 ✓

- **位置**：`src/pages.json:53-65`（text/pagePath）；`src/custom-tab-bar/index.js:4-8`（pagePath/text/icon 重复定义）
- **分类**：可读性
- **现状**：tab 列表在两个文件各维护一份；`pages.json` 无 icon 字段，`index.js` 额外有 `icon` 映射，改一个 tab 需改两处
- **问题**：2 处数据源，重复项 3 条；新增/调整 tab 时易漏改导致跳转路径与文案不一致
- **建议**：新建 `src/constants/tab-bar.ts` 导出 `TAB_BAR_ITEMS`（含 pagePath、text、icon）；`AppTabBar.vue` 唯一消费；`pages.json` 的 list 保持与常量一致（pages.json 无法 import，需在注释或 apply-notes 注明「改 tab 时同步两处」，或写脚本校验——本次不做脚本）
- **建议映射的方法**：M-L2-04 Move Function（配置集中到 constants）
- **风险**：低——纯数据搬迁，不改跳转逻辑
- **验证**：AI 自证（type-check；grep `TAB_BAR_ITEMS` 引用）｜ HUMAN（3 个 tab 文案与跳转路径与改前一致）
- **范围**：约 20 行新增 / 2 文件改引用

### [4] 将 CSS 图标拆为 TabBarIcon 子组件 ✗

- **位置**：`src/custom-tab-bar/index.wxml:10-25`；`src/custom-tab-bar/index.wxss:47-99`
- **分类**：结构
- **现状**：单个 tab 项内用 `wx:if/wx:elif` 三分支渲染 3 种 CSS 图标，样式约 50 行堆在同一 wxss
- **问题**：`wx:if` 分支 3 路 + 图标样式 6 个 class，新增第 4 个 tab 需改模板分支；图标逻辑与 tab 容器未分离
- **建议**：在 `src/components/app-tab-bar/TabBarIcon.vue` 接收 `name: 'menu'|'order'|'mine'` 和 `active: boolean`，内部 switch 渲染对应 CSS 图标；`AppTabBar.vue` 只负责布局和 switchTab
- **建议映射的方法**：M-L3-07 Single Responsibility Split
- **风险**：中——纯展示拆分，但图标 CSS 迁移后需目视确认形状未变
- **验证**：AI 自证（type-check）｜ HUMAN（对比改前改后 3 个图标外观）
- **范围**：约 80 行新增 / 1 文件拆分
