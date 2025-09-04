# StoryEngine（故事引擎）

一个基于 Vue 3 + Vite + Electron 的跨平台桌面写作应用。内置项目管理、沉浸式故事编辑器（行号、右键菜单、自动缩进/自动保存、快捷键）、写作仪表盘（统计与写作日历），帮助作者高效管理创作过程。

**应用标识**：`com.rinkokawa.storyengine`

## 目录
- [StoryEngine（故事引擎）](#storyengine故事引擎)
  - [目录](#目录)
  - [项目简介](#项目简介)
  - [主要功能](#主要功能)
  - [技术栈](#技术栈)
  - [环境要求](#环境要求)
  - [安装与运行](#安装与运行)
  - [使用说明](#使用说明)
  - [数据管理](#数据管理)
  - [脚本命令](#脚本命令)
  - [贡献指南](#贡献指南)
  - [许可证](#许可证)
  - [附：目录结构（简要）](#附目录结构简要)

---

## 项目简介

StoryEngine 面向长篇小说/剧本等文本创作场景，提供全流程支持：从项目建档、目标设定、写作编辑，到统计与回顾。应用采用本地文件存储，支持离线使用，保障创作数据安全。

## 主要功能

- **项目管理**
  - 新建/编辑/删除项目、目标字数设定、状态与更新时间维护
  - 选择当前项目（在仪表盘与编辑器使用）
- **故事编辑器**
  - 行号侧栏、沉浸式编辑界面
  - 右键菜单：复制/剪切/粘贴、全选、查找替换、插入日期时间、字数统计
  - 自动缩进（段首全角空格）、自动保存（2 秒）、手动保存
  - 快捷键：Ctrl+S 保存、Ctrl+F 查找
  - 底部状态栏：行/列位置、字数、最后保存时间
- **卷章节管理**
  - 支持多卷多章节结构
  - 章节排序、状态管理
  - 章节内容独立存储与编辑
- **角色与世界观管理**
  - 角色档案创建与管理
  - 世界设定记录与查询
- **写作仪表盘**
  - 总字数、目标进度、今日/本周字数
  - 写作日历（支持年月选择、今天快捷回到）
  - 项目快速切换
- **应用设置**
  - 编辑器设置：字体大小、行高、自动保存、自动缩进
  - 界面设置：主题切换（浅色/深色/自动）、侧边栏状态、窗口大小
  - 数据管理：导出/导入/清空数据、打开存储位置
  - 应用行为：启动项目、系统托盘、更新检查
- **数据持久化**
  - 使用文件系统存储项目列表、当前项目、项目内容与每日写作统计
  - 支持数据导出/导入（JSON）
  - 浏览器环境下自动降级使用 localStorage

## 技术栈

- **前端**：Vue 3（Composition API / Options API 混用）、CSS
- **构建**：Vite 5、@vitejs/plugin-vue
- **桌面**：Electron 30、vite-plugin-electron
- **打包**：electron-builder 24
- **语言**：TypeScript（主流程与配置），部分渲染代码为 JS

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
- 生成两个版本：
  - `StoryEngine-Windows-0.0.0-Setup.exe`：安装程序版本
  - `StoryEngine-Windows-0.0.0-Portable.exe`：便携版，无需安装直接运行

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
- **章节管理**
  - 在左侧章节面板中创建和管理卷与章节
  - 选择章节后在编辑器中编辑内容
  - 支持章节重排序和状态管理
- **仪表盘**
  - 显示总字数、目标进度、今日与本周字数
  - 写作日历按天展示写作字数，支持左右切换月份与选择年份/月份
  - 可在顶部下拉切换当前项目

## 数据管理

应用通过 storageManager（src/utils/storage.js）管理数据，在设置页面提供完整的数据管理功能：

- **导出数据**：将所有项目和设置导出为JSON文件
- **导入数据**：从JSON文件恢复数据（会覆盖现有数据）
- **打开存储位置**：在桌面应用中直接打开数据存储文件夹
- **清空数据**：永久删除所有数据（危险操作）

数据存储架构：
- 在 Electron 环境中使用文件系统存储（userData 目录）
- 在浏览器环境中自动降级使用 localStorage
- 通过 storageAdapter 提供统一的同步/异步 API

你也可以在渲染进程中直接调用 storageManager 进行操作：

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

注意：数据保存在本机文件系统或 localStorage。清理应用数据或重装系统可能导致丢失，建议定期导出备份。

## 脚本命令

- **dev**：启动 Vite 开发服务器，并自动启动 Electron
- **build**：类型检查 + 前端构建 + Electron 打包（输出安装包到 release/<version>/）
- **preview**：本地预览前端构建产物（非 Electron）

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

本项目采用 MIT License。

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
│  ├─ main.ts              # 主进程入口
│  └─ preload.ts           # 预加载脚本
├─ src/
│  ├─ components/          # 组件
│  │  ├─ Dashboard.vue     # 仪表盘组件
│  │  ├─ ProjectManager.vue # 项目管理组件
│  │  ├─ NovelEditor.vue   # 编辑器组件
│  │  ├─ ContextMenu.vue   # 右键菜单组件
│  │  └─ common/           # 通用组件
│  ├─ views/               # 视图
│  │  ├─ StoryEditor.vue   # 故事编辑器视图
│  │  ├─ CharacterManagement.vue # 角色管理视图
│  │  └─ WorldBuilding.vue # 世界观构建视图
│  ├─ utils/               # 工具函数
│  │  ├─ storage.js        # 存储管理器
│  │  ├─ storageAdapter.js # 存储适配器
│  │  └─ fileStorage.js    # 文件存储实现
│  ├─ App.vue              # 应用根组件
│  ├─ main.ts              # 渲染进程入口
│  └─ main.js              # 兼容入口
├─ public/                 # 静态资源
├─ vite.config.ts          # Vite 配置
├─ electron-builder.json5  # 打包配置
├─ package.json            # 项目配置
└─ README.md               # 项目说明
```

如需进一步定制（如多窗口、多语言、同步云端等），可在现有架构基础上扩展。