# StoryEngine - 小说创作工具

基于 Vue 3 + TypeScript + Electron 的现代化小说创作应用，采用 SOLID 设计原则构建。

## 🚀 功能特性

- 📝 **智能写作编辑器** - 支持章节管理、角色提示
- 📚 **项目管理** - 小说项目的创建、编辑、删除
- 👥 **角色管理** - 角色信息管理和智能提示
- 📊 **写作统计** - 字数统计、写作进度跟踪
- 🎨 **多主题支持** - 8种精美主题可选
- 💾 **自动保存** - 防止数据丢失

## 🏗️ 架构设计

项目采用分层架构，严格遵循 SOLID 设计原则：

```
src/
├── domain/              # 领域层 - 业务核心
│   ├── entities/        # 实体定义
│   ├── repositories/    # 仓储接口
│   └── services/        # 领域服务
├── infrastructure/      # 基础设施层 - 技术实现
│   └── repositories/    # 仓储实现
├── application/         # 应用层 - 协调层
│   ├── stores/          # 状态管理 (Pinia)
│   ├── composables/     # 组合式函数
│   └── container.ts     # 依赖注入容器
└── components/          # 表现层 - UI组件
    ├── chapter/         # 章节相关组件
    ├── writing/         # 写作相关组件
    └── character/       # 角色相关组件
```

## 🛠️ 技术栈

- **前端框架**: Vue 3 + TypeScript
- **状态管理**: Pinia
- **路由**: Vue Router
- **构建工具**: Vite
- **桌面应用**: Electron
- **图标库**: Lucide Vue Next
- **样式**: CSS Variables + Scoped CSS

## 📦 安装和运行

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建应用
npm run build

# 构建桌面应用
npm run build:electron
```

## 🎯 设计原则

### SOLID 原则实现

- **单一职责原则 (SRP)**: 每个组件和服务只负责一个功能
- **开闭原则 (OCP)**: 通过接口抽象支持功能扩展
- **里氏替换原则 (LSP)**: 仓储实现可以互相替换
- **接口隔离原则 (ISP)**: 定义细粒度的接口
- **依赖倒置原则 (DIP)**: 通过依赖注入解耦模块

### 架构优势

- ✅ **高可维护性** - 清晰的分层结构
- ✅ **高可测试性** - 依赖注入和接口抽象
- ✅ **高可扩展性** - 开闭原则的应用
- ✅ **低耦合度** - 模块间通过接口通信
- ✅ **类型安全** - 完整的 TypeScript 支持

## 📝 使用指南

1. **创建项目**: 在首页点击"新建小说"
2. **写作**: 进入写作页面开始创作
3. **章节管理**: 左侧边栏管理章节结构
4. **角色提示**: 输入 @ 符号选择角色
5. **主题切换**: 侧边栏底部切换主题

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进项目。

## 📄 许可证

MIT License