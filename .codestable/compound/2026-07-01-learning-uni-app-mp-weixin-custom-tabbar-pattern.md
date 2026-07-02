---
doc_type: learning
track: knowledge
date: 2026-07-01
slug: uni-app-mp-weixin-custom-tabbar-pattern
component: tabBar / navigation
tags: [uni-app, vue3, wechat-miniprogram, tabbar, components]
related: .codestable/refactors/2026-07-01-tabbar-component/
---

# uni-app 微信小程序自定义 tabBar 推荐模式

## 背景

微信小程序原生 tabBar 只支持图片路径（`iconPath`），无法直接用 CSS / 字体图标。要用纯 CSS 绘制图标，必须走自定义 tabBar。本项目为 uni-app Vue3 + TypeScript，需要与页面代码风格一致、可维护。

## 指导原则

### 1. 组件化：放 `components/`，不要绑死在协议目录

```
src/
├── constants/tab-bar.ts       # tab 项配置（pagePath / text / icon）
├── components/app-tab-bar/
│   └── AppTabBar.vue          # 展示 + switchTab
└── pages/{index,order,mine}/
    └── index.vue              # <AppTabBar :current="0|1|2" />
```

`custom-tab-bar/` 是微信协议槽位名，**不是**普通组件目录。业务 UI 应放在 `components/`。

### 2. 选中态用 props，不用 getTabBar 桥接

```vue
<!-- 各 tab 页 -->
<AppTabBar :current="0" />
```

当前页索引由路由决定，声明式传入即可。避免 `getCurrentInstance().proxy.$scope.getTabBar().setData()`。

### 3. 配置双写要有意识

`pages.json` 的 `tabBar.list` 无法 import TS 常量，改 tab 时需同步：

- `src/constants/tab-bar.ts` → `TAB_BAR_ITEMS`
- `src/pages.json` → `tabBar.list`（pagePath + text）

在常量文件顶部注释标明「与 pages.json 保持同步」。

### 4. 启动时隐藏原生栏

```ts
// App.vue onLaunch
uni.hideTabBar({ animation: false })
```

配合 `custom: true`，减少原生栏闪现。

### 5. 页面底部留白

tab 页 container 加：

```css
padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
```

有浮动底栏（如购物车条）时，`bottom` 要叠在 tabBar 高度之上。

## 为什么重要

- 一套 Vue 语法维护，不用在 wxml / vue 间切换
- 构建产物可验证（`dist/.../components/app-tab-bar/AppTabBar.js` 存在）
- 去掉微信私有 API 依赖，TypeScript 类型干净

## 何时适用

- uni-app Vue3 编译目标包含 **mp-weixin**
- 需要自定义 tabBar 样式（CSS 图标、非图片、特殊布局）
- tab 数量固定、由 `pages.json` 声明

## 反例 / 不适用

- **仅 App 端**：可用 `pages.json` 的 `iconfont` + `iconfontSrc`（仅 App/H5，小程序不支持）
- **仅 H5**：可用 uni-app 内置 `<custom-tab-bar>` 组件（与微信小程序机制不同）
- **需要微信 `getTabBar()` 全局单例**：若坚持协议槽位，保留 `custom-tab-bar/index.js` 原生实现，不要用 `.vue`

## 示例

```ts
// src/constants/tab-bar.ts
export const TAB_BAR_ITEMS = [
  { pagePath: 'pages/index/index', text: '点菜', icon: 'menu' },
  { pagePath: 'pages/order/index', text: '订单', icon: 'order' },
  { pagePath: 'pages/mine/index', text: '我的', icon: 'mine' },
]
```

```vue
<!-- AppTabBar.vue 核心 -->
<script setup lang="ts">
import { TAB_BAR_ITEMS } from '@/constants/tab-bar'
const props = defineProps<{ current: number }>()
const switchTab = (index: number) => {
  if (index === props.current) return
  uni.switchTab({ url: `/${TAB_BAR_ITEMS[index].pagePath}` })
}
</script>
```
