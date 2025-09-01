# StoryEngine（故事引擎）

一个基于 Vue 3 + Vite + Electron 的跨平台桌面写作应用。内置项目管理、沉浸式故事编辑器（行号、右键菜单、自动缩进/自动保存、快捷键）、写作仪表盘（统计与写作日历），帮助作者高效管理创作过程。

<!-- 提示：包名当前为 my-novel-app，待修改。 -->

## 目录
- 项目简介
- 主要功能
- 技术栈
- 环境要求
- 安装与运行
- 使用说明
- 配置选项
- 脚本命令
- 截图（占位与路径约定）
- 贡献指南
- 许可证

---

## 项目简介

StoryEngine 面向长篇小说/剧本等文本创作场景，提供全流程支持：从项目建档、目标设定、写作编辑，到统计与回顾。应用采用本地存储（localStorage），无需后端即可使用。

## 主要功能

- 项目管理
  - 新建/编辑/删除项目、目标字数设定、状态与更新时间维护
  - 选择当前项目（在仪表盘与编辑器使用）
- 故事编辑器
  - 行号侧栏、沉浸式编辑界面
  - 右键菜单：复制/剪切/粘贴、全选、查找替换、插入日期时间、字数统计
  - 自动缩进（段首全角空格）、自动保存（2 秒）、手动保存
  - 快捷键：Ctrl+S 保存、Ctrl+F 查找
  - 底部状态栏：行/列位置、字数、最后保存时间
- 写作仪表盘
  - 总字数、目标进度、今日/本周字数
  - 写作日历（支持年月选择、今天快捷回到）
  - 项目快速切换
- 数据持久化
  - 使用 localStorage 存储项目列表、当前项目、项目内容与每日写作统计
  - 支持数据导出/导入（JSON）

## 技术栈

- 前端：Vue 3（Composition API / Options API 混用）、CSS
- 构建：Vite 5、@vitejs/plugin-vue
- 桌面：Electron 30、vite-plugin-electron（simple）
- 打包：electron-builder 24
- 语言：TypeScript（主流程与配置），部分渲染代码为 JS

## 环境要求

- Node.js ≥ 18（Vite 5 要求）
- npm ≥ 9（或使用 pnpm/yarn，命令自行替换）
- 操作系统：Windows / macOS / Linux

## 安装与运行

1) 克隆并安装依赖
```bash
git clone https://github.com/RinKokawa/StoryEngine.git
cd StoryEngine
npm install
```

2) 开发模式（启动 Vite + 自动启动 Electron）
```bash
npm run dev
```
- 首次启动后，Electron 窗口会自动打开并加载 Vite Dev Server。
- 如未自动启动 Electron，请检查 vite-plugin-electron 安装是否成功。

3) 生产构建与打包（生成安装包/可执行文件）
```bash
npm run build
```
- 这将执行：类型检查（vue-tsc）→ Vite 构建渲染进程 → electron-builder 打包
- 打包产物默认输出到 release/<version>/ 目录（见 electron-builder.json5）

4) 仅预览前端构建产物（非 Electron）
```bash
npm run preview
```
- 仅预览 dist 下的前端页面，不包含 Electron 能力

## 使用说明

- 首次启动
  - 进入“项目管理”页面，点击“新建项目”，设置名称/类型/目标字数
  - 选择项目后将其设为“当前项目”，仪表盘与编辑器将显示该项目数据
- 编辑器
  - 顶栏可切换项目、点击保存，或等待自动保存（2 秒）
  - 回车自动插入段首全角空格 `“　　”` 以保持中文段落习惯
  - 右键菜单包含：复制、剪切、粘贴、全选、查找替换、插入日期时间、字数统计(尚未完全实现)
  - 状态栏显示当前行列位置与字数，保存后显示时间
  - 快捷键：Ctrl+S 保存，Ctrl+F 查找
- 仪表盘
  - 显示总字数、目标进度、今日与本周字数
  - 写作日历按天展示写作字数，支持左右切换月份与选择年份/月份
  - 可在顶部下拉切换当前项目

### 数据导出/导入（尚未实现）

应用通过 storageManager（src/utils/storage.js）管理数据。你可以在渲染进程中直接调用它进行导出/导入（或在 DevTools Console 调试）。

```js
// 导出数据（JSON 字符串）
import storageManager from './src/utils/storage.js'
const json = storageManager.exportData()
// 例如下载为文件或复制到剪贴板
console.log(json)

// 导入数据（从文件选择或粘贴 JSON）
const ok = storageManager.importData(json)
console.log('导入结果:', ok)
```

注意：数据保存在本机 localStorage。清理应用数据或重装系统可能导致丢失，建议定期导出备份。

## 脚本命令

- dev：启动 Vite 开发服务器，并自动启动 Electron
- build：类型检查 + 前端构建 + Electron 打包（输出安装包到 release/<version>/）
- preview：本地预览前端构建产物（非 Electron）

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc && vite build && electron-builder",
    "preview": "vite preview"
  }
}
```

<!-- ## 截图 -->

<!-- 请将截图放在 docs/screenshots/ 下，并在下方替换为实际文件名。 -->

<!-- - 仪表盘
  - ![仪表盘](docs/screenshots/dashboard.png)
- 项目管理
  - ![项目管理](docs/screenshots/projects.png)
- 故事编辑器
  - ![故事编辑器](docs/screenshots/editor.png)
- 右键菜单
  - ![右键菜单](docs/screenshots/context-menu.png)
- 写作日历
  - ![写作日历](docs/screenshots/calendar.png) -->


## 贡献指南

欢迎贡献功能、优化代码与文档！

- Fork 本仓库
- 新建分支：feature/your-feature-name 或 fix/your-fix
- 提交信息：遵循简洁明了的风格（如 feat: xxx / fix: yyy）
- 提交 Pull Request，描述变更动机、实现与截图（如有）
- 代码风格：保持与现有代码一致；避免引入敏感信息；不提交二进制或打包产物

开发建议：
- Node ≥ 18
- 在提交前本地运行：npm run dev 验证功能，必要时补充说明性注释

## 许可证

本项目建议采用 MIT License。

```
MIT License

Copyright (c) 2025 ...

Permission is hereby granted, free of charge, to any person obtaining a copy
...
```


---

## 附：目录结构（简要）

```
StoryEngine/
├─ electron/               # Electron 主进程与预加载
│  ├─ main.ts
│  └─ preload.ts
├─ src/
│  ├─ components/
│  │  ├─ Dashboard.vue
│  │  ├─ ProjectManager.vue
│  │  ├─ NovelEditor.vue
│  │  └─ ContextMenu.vue
│  ├─ views/
│  │  └─ StoryEditor.vue
│  ├─ utils/
│  │  └─ storage.js        # 本地存储与统计
│  ├─ App.vue
│  ├─ main.ts
│  └─ main.js
├─ public/
├─ vite.config.ts
├─ electron-builder.json5  # 打包配置
├─ package.json
└─ README.md
```

如需进一步定制（如多窗口、多语言、同步云端等），可在现有架构基础上扩展。