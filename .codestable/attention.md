# Attention

本文件是 CodeStable 技能启动必读的项目注意事项入口。所有 CodeStable 子技能开始工作前必须读取它。

## 报告语言

CodeStable 所有落盘产出的正文用**中文**：plan / design、plan review / design-review、code review、QA、验收、issue（report / analysis / fix-note）、refactor、roadmap、goal、沉淀（compound）等所有人读报告都用中文表达。机器状态（YAML / JSON / `state.yaml` / frontmatter 字段）保持机读格式不翻译。

## Shell 偏好

默认使用 PowerShell。仅在明确指定或 POSIX 兼容需求时使用 Bash。

## Git 规范

- Commit message 使用中文
- **禁止自动执行 `git push`** — 所有推送操作由用户本人完成
- **禁止自动执行 `git commit`** — 所有提交操作由用户本人完成
- 可以执行 `git status`、`git log`、`git diff`、`git branch`、`git stash` 等只读命令

## 项目碎片知识

<!-- cs-note managed: 用 cs-note 维护，新条目按下面分节追加 -->

### 编译与构建

- `npm run dev:mp-weixin` — uni-app 编译到微信小程序开发模式
- `npm run build:mp-weixin` — uni-app 编译到微信小程序生产模式

### 运行与本地起服务

- 微信开发者工具打开 `dist/dev/mp-weixin` 目录预览

### 测试

### 命令与脚本陷阱

### 路径与目录约定

- uni-app 标准项目结构：`pages/`（页面）、`components/`（组件）、`stores/`（Pinia）、`cloudfunctions/`（微信云函数）
- `.codestable/tools/` 下 Python 脚本使用 `python` 调用

### 环境变量与凭证

- 微信小程序 AppID：`wxb11440d17b9e5054`
- 微信云开发环境 ID：`cloudbase-d4gszdfotaac057f6`
- 云环境免费基础版，月额度自动刷新

### 其他
