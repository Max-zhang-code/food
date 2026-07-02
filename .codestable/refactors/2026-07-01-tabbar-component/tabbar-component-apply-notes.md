---
doc_type: refactor-apply-notes
refactor: 2026-07-01-tabbar-component
---

# tabbar-component apply notes

## 步骤 1: 抽成 AppTabBar.vue + 删除原生 custom-tab-bar

- 完成时间: 2026-07-01
- 改动文件: `src/components/app-tab-bar/AppTabBar.vue`（新增）；`src/custom-tab-bar/*`（删除）；`src/pages/index|order|mine/index.vue`；`src/App.vue`
- 验证结果: `npm run type-check` 通过；`npm run build:mp-weixin` 通过，产物含 `components/app-tab-bar/AppTabBar.js`
- 偏离: 点菜页 `cart-bar` 的 `bottom` 上移到 tabBar 上方，避免被遮挡（布局修正，非功能变更）

## 步骤 2: 删除 getTabBar 桥接

- 完成时间: 2026-07-01
- 改动文件: `src/utils/tab-bar.ts`（删除）；3 个 tab 页去掉 `onShow` + `setTabBarSelected`
- 验证结果: grep 无 `setTabBarSelected` / `getTabBar` 残留
- 偏离: 无

## 步骤 3: 抽离 TAB_BAR_ITEMS 常量

- 完成时间: 2026-07-01
- 改动文件: `src/constants/tab-bar.ts`（新增）；`AppTabBar.vue` 引用
- 验证结果: type-check 通过；`pages.json` tabBar.list 与常量内容一致
- 偏离: 无

## 待 HUMAN 验证

微信开发者工具打开 `dist/build/mp-weixin`，点 3 个 tab：选中色正确、切换无闪烁、购物车浮条在 tabBar 上方。
