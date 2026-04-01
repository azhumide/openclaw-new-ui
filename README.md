# 🦀 OpenClaw New UI

**OpenClaw New UI** 是一款专为 OpenClaw 网关设计的现代化、高性能、且极富设计感的 Web 控制台。基于 Next.js 打造，旨在为用户提供最流畅的 AI 交互体验与最直观的网关管理能力。

---

## 🖼️ 界面预览 (Interface Preview)

<p align="center">
  <img src="img/登录界面.png" alt="登录界面" width="800">
  <br>
  <em>登录界面 - 极简流线型设计</em>
</p>

<p align="center">
  <img src="img/操作界面.png" alt="操作界面" width="800">
  <br>
  <em>操作界面 - 动态流式渲染与简化模式</em>
</p>

---

## 📱 移动端极效适配 (Mobile-First Aesthetic)

**OpenClaw New UI** 针对移动端进行了像素级的深度重构，采用了“微型 UI”与“超高信息密度”设计。即使在 5 英寸的小型设备上，也能实现 IDE 级的调试能力与沉浸式日志流浏览。

<p align="center">
  <img src="img/手机端操作界面.png" alt="手机端操作界面1" width="260">
  &nbsp;&nbsp;
  <img src="img/手机端操作界面2.png" alt="手机端操作界面2" width="260">
  &nbsp;&nbsp;
  <img src="img/手机端操作界面3.png" alt="手机端操作界面3" width="260">
  <br>
  <em>移动端适配 - 极致空间压榨与实验室级调试台</em>
</p>

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

### 📥 获取代码 (Get Code)

在开始之前，请先将项目克隆到本地：

```bash
# 克隆仓库
git clone https://github.com/azhumide/openclaw-new-ui.git

# 进入项目目录
cd openclaw-new-ui
```

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

---

## 🌙 后台运行 (Background Running)

如果您在服务器上部署并希望关闭终端后服务依然运行，可以选择以下方式：

### 方式一：使用 PM2 (推荐)
PM2 是 Node.js 进程管理器，支持自动重启与性能监控。
```bash
# 全局安装 PM2
npm install pm2 -g

# 启动服务
pm2 start npm --name "openclaw-ui" -- run start

# 查看状态
pm2 list
```

### 方式二：使用 nohup (通用)
在 Linux 环境下，可以使用原生 `nohup` 命令实现持久运行。
```bash
nohup npm run start > output.log 2>&1 &
```

### 方式三：Docker 后台运行
如果您使用 Docker，确保带上 `-d` 参数即可：
```bash
docker-compose up -d
```

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

## 🍎 iOS 原生应用支持 (iOS App Support)

**OpenClaw New UI** 现已支持通过 [Capacitor](https://capacitorjs.com/) 转换为原生 iOS 应用。

### 准备工作
- 确保已安装 Xcode (建议版本 16.0+ / iOS 26.0+)。
- 确保已安装 CocoaPods (如果使用旧版 Capacitor) 或最新的 Swift Package Manager 环境。

### 编译与运行
项目中已集成快捷指令：

```bash
# 1. 编译 Web 项目并同步至 iOS
npm run ios:build

# 2. 在 Xcode 中打开项目
npm run ios:open
```

### 真机调试注意事项
1. **开发者证书**: 在 Xcode 的 `Signing & Capabilities` 中配置您的 Apple ID 签名。
2. **安全区域**: UI 已适配 iPhone 刘海屏（Safe Area），各组件均会自动避让状态栏与底部横条。
3. **网关连接**: 在真机测试时，请确保手机与电脑在同一局域网，并在登录界面使用 **Mac 的内网 IP**（如 `192.168.x.x`）而非 `localhost`。

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
