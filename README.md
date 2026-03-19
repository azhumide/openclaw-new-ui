# 🦀 OpenClaw New UI

**OpenClaw New UI** 是一款专为 OpenClaw 网关设计的现代化、高性能、且极富设计感的 Web 控制台。基于 Next.js 打造，旨在为用户提供最流畅的 AI 交互体验与最直观的网关管理能力。

---

## ✨ 核心特性

- 🎨 **极致美学**：采用模块化玻璃拟态（Glassmorphism）设计，支持灵动的主题切换与细腻的交互动画。
- ⚙️ **智能控制**：
  - **详细输出模式**：一键切换 AI 思考过程（Reasoning）与工具执行记录（EXEC）的显示/隐藏。
  - **极简状态行**：在简化模式下，复杂的工具调用将转换为精致的状态条，保持界面清爽。
- 📊 **动态监控**：实时渲染 Token 消耗概览、会话健康度及系统运行状态。
- 📱 **全平台适配**：针对移动端进行深度优化，确保在手机、平板与桌面端均有完美的响应式体验。
- 🚀 **极速部署**：支持 Docker 容器化一键部署，镜像体积小，启动飞快。
- 🛠️ **多会话管理**：直观的会话切换与管理界面，支持多智能体状态查看。

---

## 🛠️ 技术栈

- **框架**: [Next.js 15 (App Router)](https://nextjs.org/)
- **样式**: [Tailwind CSS 4](https://tailwindcss.com/)
- **组件库**: [Shadcn/UI](https://ui.shadcn.com/)
- **动画**: [Framer Motion](https://www.framer.com/motion/)
- **图标**: [Lucide React](https://lucide.dev/)
- **状态/表单**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)

---

## 🚀 快速开始

### 方式一：本地开发 (Local Development)

确保已安装 Node.js 20+ 环境：

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

打开浏览器访问 [http://localhost:3000](http://localhost:3000) 即可开始使用。

### 方式二：Docker 部署 (推荐)

项目内置了完整的 Dockerfish 支持，支持一键启动：

```bash
# 使用 Docker Compose 启动
docker-compose up -d
```

镜像构建完成后，服务将运行在 `3000` 端口。

---

## 🐳 Docker 指南 (Docker Guide)

### 手动构建镜像
```bash
docker build -t openclaw-new-ui .
```

### 运行容器
```bash
docker run -d -p 3000:3000 --name openclaw-ui openclaw-new-ui
```

---

## 🔐 环境配置

OpenClaw New UI 采用**零后端环境要求**设计。所有网关连接参数（WebSocket URL、Token、密码等）均通过前端登录界面配置，并安全地持久化在您的浏览器 LocalStorage 中。

1. 在登录界面输入您的网关地址与权限信息。
2. 点击“连接”即可进入管理面板。
3. 系统会自动保存设置，下次访问无需重复输入。

---

## 🤝 贡献与反馈

如果您在使用过程中遇到任何问题或有更好的改进建议，欢迎提交 Issue 或 Pull Request。

---

## 📄 开源协议

本项目基于 [MIT License](LICENSE) 开源。

---

<p align="center">
  Made with ❤️ for the OpenClaw Community
</p>
