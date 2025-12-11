# Novel Editor 桌面应用

基于 Vue 3 + Vite + Electron 的本地小说创作工具，内置卷章结构、角色卡、世界观条目、笔记管理，以及接入通义千问的写作助手。

- **项目/首页**：最近项目展示、新建/导入项目（含封面图读取）。
- **正文三栏**：左侧卷章树，中间正文编辑，右侧 AI 聊天（调用 `ai:chat`，需 QWEN_API_KEY）。
- **角色管理**：新增/编辑角色，读取头像，查看详情；数据存储在 `characters/` 下并记录日志。
- **世界观与笔记**：自动生成世界观索引文件，笔记支持增删改并写入 `notes/`。
- **日志仪表盘**：读取 `log/*.log` 展示最近操作；统计卷/章数量和字数。

## 目录结构（关键部分）

- `src/`：渲染进程（Vue）代码。
  - `views/index/*`：首页导航、项目列表、设置页（写入 Qwen Key）。
  - `views/editor/*`：编辑器布局、角色/正文/设定/笔记等子页面。
- `electron/`：主进程与文件读写。
  - `main.ts`：注册 IPC（项目/角色/大纲/笔记/AI/窗口控制）。
  - `service/projectService.ts`：磁盘数据结构与日志写入。
  - `preload.ts`：暴露 `ipcRenderer` 到渲染进程。

项目数据存放在用户自选的项目目录，基本文件包括：
- `novel.json`：项目元数据。
- `outline/`：卷章数据与 `outline.json`、`volumes.json`。
- `characters/`：角色索引与角色 JSON。
- `notes/`：笔记索引与笔记内容。
- `worldviews/`：世界观索引与条目。
- `log/*.log`：操作日志。

## 快速开始

1) 安装依赖（建议 Node 18+）  
`npm install`

2) 启动开发模式（Vite + Electron 热重载）  
`npm run dev`

3) 打包（包含类型检查、前端构建与 electron-builder 打包）  
`npm run build`  
产物位于 `dist/`（前端）和 `dist-electron/`，安装包在 `release/`。

## 配置通义千问

AI 聊天使用 `ai:chat` IPC 调用 DashScope 兼容接口：
- 在应用“设置”页填写 Qwen API Key，写入 `userData/.env` 的 `QWEN_API_KEY`。
- 正文页右栏可直接与 AI 对话获取创作建议。

## 实用说明

- 最近项目保存在浏览器 `localStorage`（键：`novel-recent-projects`）。
- 项目操作（创建卷章、保存角色/笔记等）会写入 `log/YYYY-MM-DD.log`，仪表盘可查看。
- 关闭编辑器可用 `Esc`；侧边栏可折叠，正文三栏宽度可拖拽调整。
