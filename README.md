# 智能点菜小程序

家庭内部微信小程序——通过食材反查能做哪些菜、点菜下单、查看历史订单。

## 技术栈

Vue 3 + uni-app + Pinia + 微信云开发

## 快速开始

```bash
npm install
npm run dev:mp-weixin   # 开发模式
npm run build:mp-weixin # 生产构建
```

微信开发者工具打开 `dist/dev/mp-weixin`（开发）或 `dist/build/mp-weixin`（生产）。

## 上线配置

详见 [`docs/setup-guide.md`](docs/setup-guide.md)。

关键配置项在 `src/manifest.json`：

| 字段 | 说明 |
|---|---|
| `mp-weixin.appid` | 微信小程序 AppID |
| `mp-weixin.cloudEnv` | 微信云开发环境 ID |

## 项目结构

```
src/
├── pages/            ← 页面
│   ├── index/        ← 首页（食材选择 + 菜品匹配 + 点菜）
│   ├── cart/         ← 购物车
│   ├── submit/       ← 提交 / 编辑菜品
│   ├── order/        ← 订单（进行中 / 历史）
│   ├── mine/         ← 我的（我的提交 + 审核入口）
│   └── manage/review/← 审核页（仅审核人）
├── stores/           ← Pinia Store（user / menu / cart / order / dish-manage）
├── pages.json        ← 路由 / 分包 / tabBar
└── manifest.json     ← 小程序配置
cloudfunctions/       ← 11 个云函数
docs/                 ← 上线指南 + 安全规则
```

## 文档

| 文档 | 说明 |
|---|---|
| [`docs/setup-guide.md`](docs/setup-guide.md) | 上线前配置清单 |
| [`docs/cloud-security.md`](docs/cloud-security.md) | 数据库权限规则与越权测试 |
| [`.codestable/requirements/smart-menu.md`](.codestable/requirements/smart-menu.md) | 能力愿景 |
| [`.codestable/features/2026-07-01-smart-menu/smart-menu-design.md`](.codestable/features/2026-07-01-smart-menu/smart-menu-design.md) | 详细设计 |
