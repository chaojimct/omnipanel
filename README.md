<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="logo/omni.png">
    <img src="logo/omni.png" alt="OmniPanel" width="96" height="96">
  </picture>
  <h1 align="center" style="font-family: 'Berkeley Mono', 'IBM Plex Mono', ui-monospace, monospace; font-weight: 700; letter-spacing: -0.02em;">OmniPanel</h1>
  <p align="center" style="font-family: 'Berkeley Mono', 'IBM Plex Mono', ui-monospace, monospace; font-size: 16px; color: #6e6e73;">
    AI-Native Cross-Platform Engineering Workstation
    <br>
    AI 原生跨平台运维工作站
  </p>
  <p align="center">
    <a href="https://github.com/anomalyco/omnipanel"><img src="https://img.shields.io/badge/status-pre--implementation-yellow?style=flat-square&color=ff9f0a" alt="Status"></a>
    <a href="https://github.com/anomalyco/omnipanel/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square&color=007aff" alt="License"></a>
    <a href="https://www.rust-lang.org"><img src="https://img.shields.io/badge/rust-1.85+-orange?style=flat-square&color=ff5f57" alt="Rust"></a>
    <a href="https://tauri.app"><img src="https://img.shields.io/badge/tauri-2.x-ffc131?style=flat-square" alt="Tauri"></a>
  </p>
  <br>
</div>

---

## 🇬🇧 English

**OmniPanel** is an AI-native, cross-platform engineering workstation for developers. It unifies terminal, SSH, database, Docker, server management, protocol debugging, and AI assistance into a single desktop application — eliminating context switching and letting you focus on what matters.

> One window to manage servers, databases, containers, and workflows. One AI that understands your entire engineering context.

### ✨ Key Features

| Module | Description |
|--------|-------------|
| **Terminal** | GPU-accelerated rendering (wgpu), multi-tab & split panes, Blocks output grouping, VT100/VT220 98%+ compatibility |
| **SSH / SFTP** | Connection manager, visual file transfer, port forwarding, jump hosts (ProxyJump), batch command execution |
| **Database** | SQL editor with syntax highlighting, virtual-scroll grid for millions of rows, NL2SQL, ER diagrams, data sync |
| **Docker** | Container lifecycle, real-time logs, one-click shell access, Compose orchestration, service topology |
| **Server** | Real-time system monitor, remote file management, process/service management, Baota & 1Panel API integration |
| **Protocol Lab** | HTTP/API debugger, WebSocket, MQTT, serial port — all in one workspace |
| **AI Assistant** | Context-aware (reads terminal output, DB schema, container state, logs), operation chain orchestration, multi-model support (Claude, GPT, Ollama, local CLI agents) |
| **Workflow** | Command templates, deployment pipelines, runbooks, parameterized execution with full audit trail |

### 🛠️ Tech Stack

```
UI Layer      │  Tauri (React/TypeScript + Rust backend)
Terminal Core │  alacritty_terminal
GPU Render    │  wgpu (Vulkan / Metal / DX12)
SSH           │  russh
Database      │  sqlx | tiberius | redis-rs | mongodb
Docker        │  bollard
AI            │  rig | async-openai | Ollama | CLI Agent Adapter
Storage       │  rusqlite / SQLCipher | keyring-core
```

### 🚀 Getting Started

```bash
# Prerequisites: Rust 1.85+, Node.js 20+
git clone https://github.com/anomalyco/omnipanel.git
cd omnipanel

# Build the Rust workspace
cargo build

# Run the Tauri desktop app
cd src-tauri && cargo run

# Or run the frontend dev server
cd frontend && npm install && npm run dev
```

### 📁 Project Structure

```
omnipanel/
├── src-tauri/                  # Tauri desktop shell (Rust)
│   ├── src/commands/           # IPC commands (updater, window, etc.)
│   └── capabilities/           # Tauri permissions
├── frontend/                   # React/TypeScript UI
│   └── src/
│       ├── components/         # UI components
│       │   ├── panels/         # Module panels
│       │   ├── shell/          # App shell (Sidebar, Topbar, etc.)
│       │   └── ui/             # Shared UI primitives
│       └── store/              # State management (Zustand)
├── crates/
│   ├── omnipanel-core/         # Core engine (terminal, SSH, DB, Docker, AI)
│   ├── omnipanel-ui/           # egui-based UI (legacy, Phase 2)
│   └── omnipanel-renderer/     # GPU rendering (wgpu glyph cache, terminal pass)
├── design/                     # Visual design prototypes (HTML/CSS)
├── logo/                       # Application icons
└── PRD.md                      # Product requirements document
```

### 🗺️ Development Roadmap

| Phase | Scope | Timeline |
|-------|-------|----------|
| **1** | MVP: GPU terminal + SSH client + basic AI | Month 1-4 |
| **2** | Database management (MySQL, PostgreSQL) | Month 5-7 |
| **3** | Docker + server management + panel integration | Month 8-10 |
| **4** | Blocks terminal, workflows, protocol debugging, AI agent chains | Month 11-13 |
| **5** | Polish and release v1.0 | Month 14-15 |

### 🎯 Performance Targets

| Metric | Target |
|--------|--------|
| Terminal throughput | > 500 MB/s (`cat` large files) |
| Input latency | < 5ms (keystroke to screen) |
| Memory per terminal tab | < 20 MB |
| VT emulation compatibility | > 98% (VT100/VT220) |
| Cold start time | < 500ms |
| Idle memory | < 50 MB |

### 🖥️ Cross-Platform Support

| Platform | PTY Backend | Notes |
|----------|-------------|-------|
| Windows 10+ | ConPTY | Native Windows terminal |
| macOS 12+ | POSIX PTY | Retina display support |
| Linux (Ubuntu 20.04+, Fedora 36+) | POSIX PTY | Wayland & X11 |

---

## 🇨🇳 中文

**OmniPanel** 是一个 AI 原生的跨平台个人工程工作台，为开发者而设计。它将终端、SSH、数据库、Docker、服务器管理、协议调试和 AI 辅助集成为一个桌面应用 —— 告别工具频繁切换，专注于真正重要的工作。

> 一个窗口，管理服务器、数据库、容器与工作流；一个 AI，贯穿开发运维上下文。

### ✨ 核心模块

| 模块 | 说明 |
|------|------|
| **终端** | GPU 加速渲染 (wgpu)，多标签分屏，Blocks 输出分组，VT100/VT220 98%+ 兼容率 |
| **SSH / SFTP** | 连接管理器，可视化文件传输，端口转发，跳板机 (ProxyJump)，批量命令执行 |
| **数据库** | SQL 语法高亮编辑器，百万行虚拟滚动网格，自然语言转 SQL，ER 图，数据同步 |
| **Docker** | 容器生命周期管理，实时日志流，一键进入 Shell，Compose 编排，服务拓扑图 |
| **服务器管理** | 实时系统监控，远程文件管理，进程/服务管理，宝塔 & 1Panel 面板 API 集成 |
| **协议调试** | HTTP/API 调试器，WebSocket，MQTT，串口 —— 统一工作区 |
| **AI 助手** | 上下文感知（读取终端输出、数据库结构、容器状态、日志），操作链编排，多模型支持 (Claude, GPT, Ollama, 本地 CLI Agent) |
| **工作流** | 命令模板，部署流水线，排障手册，参数化执行，完整审计记录 |

### 🛠️ 技术栈

```
UI 层        │  Tauri (React/TypeScript + Rust 后端)
终端核心     │  alacritty_terminal
GPU 渲染     │  wgpu (Vulkan / Metal / DX12)
SSH          │  russh
数据库       │  sqlx | tiberius | redis-rs | mongodb
Docker       │  bollard
AI           │  rig | async-openai | Ollama | CLI Agent Adapter
存储         │  rusqlite / SQLCipher | keyring-core
```

### 🚀 快速开始

```bash
# 前置要求: Rust 1.85+, Node.js 20+
git clone https://github.com/anomalyco/omnipanel.git
cd omnipanel

# 构建 Rust 工作区
cargo build

# 运行 Tauri 桌面应用
cd src-tauri && cargo run

# 或单独运行前端开发服务器
cd frontend && npm install && npm run dev
```

### 📁 项目结构

```
omnipanel/
├── src-tauri/                  # Tauri 桌面壳层 (Rust)
│   ├── src/commands/           # IPC 命令（更新器、窗口管理等）
│   └── capabilities/           # Tauri 权限配置
├── frontend/                   # React/TypeScript UI
│   └── src/
│       ├── components/         # UI 组件
│       │   ├── panels/         # 功能面板
│       │   ├── shell/          # 应用壳层（侧栏、顶栏等）
│       │   └── ui/             # 共享 UI 原语
│       └── store/              # 状态管理 (Zustand)
├── crates/
│   ├── omnipanel-core/         # 核心引擎（终端、SSH、数据库、Docker、AI）
│   ├── omnipanel-ui/           # egui 基础 UI（旧版，Phase 2 过渡）
│   └── omnipanel-renderer/     # GPU 渲染（wgpu 字形缓存、终端管线）
├── design/                     # 视觉设计原型 (HTML/CSS)
├── logo/                       # 应用图标
└── PRD.md                      # 产品需求文档
```

### 🗺️ 开发路线图

| 阶段 | 范围 | 时间 |
|------|------|------|
| **1** | MVP: GPU 终端 + SSH 客户端 + 基础 AI | 第 1-4 月 |
| **2** | 数据库管理 (MySQL, PostgreSQL) | 第 5-7 月 |
| **3** | Docker + 服务器管理 + 面板集成 | 第 8-10 月 |
| **4** | Blocks 终端、工作流、协议调试、AI Agent 链 | 第 11-13 月 |
| **5** | 打磨优化，发布 v1.0 | 第 14-15 月 |

### 🎯 性能目标

| 指标 | 目标 |
|------|------|
| 终端吞吐量 | > 500 MB/s（`cat` 大文件） |
| 输入延迟 | < 5ms（按键到屏幕） |
| 单终端标签内存 | < 20 MB |
| VT 仿真兼容率 | > 98%（VT100/VT220） |
| 冷启动时间 | < 500ms |
| 空载内存 | < 50 MB |

### 🖥️ 跨平台支持

| 平台 | PTY 后端 | 说明 |
|------|----------|------|
| Windows 10+ | ConPTY | 原生 Windows 终端 |
| macOS 12+ | POSIX PTY | 支持 Retina 显示屏 |
| Linux (Ubuntu 20.04+, Fedora 36+) | POSIX PTY | 支持 Wayland & X11 |

### 🤖 AI 三条能力线

OmniPanel AI 架构分为三条**相互独立**的能力线：

| 能力线 | 入口 | 用途 |
|--------|------|------|
| **InternalOrchestrator** | Tauri IPC `ai_chat_stream` | 内置 UI：HTTP/ACP 多 backend、直接注入 `omni_*` 工具、终端审批 |
| **Agent Router** | `http://127.0.0.1:8765/v1/*` | 纯 LLM 路由（OpenAI 兼容 SSE），供 curl / 外部脚本，**零 MCP 耦合** |
| **OmniMCP** | `http://127.0.0.1:12756/mcp` | Cursor / Claude Code 等外部 Agent 接入 DevOps 工具 |

内置对话走 InternalOrchestrator + ToolRegistry 直注入，不绕 MCP HTTP。Trace 按 `internal` / `gateway` / `mcp_external` 三分源持久化，可在 **设置 → Agent → AI 服务 → Trace 分析** 查看。

---

## 📄 License

MIT © 2026 [anomalyco](https://github.com/anomalyco)

---

<div align="center">
  <p style="font-family: 'Berkeley Mono', 'IBM Plex Mono', ui-monospace, monospace; color: #6e6e73; font-size: 13px;">
    All in One · 小而全而优而美
  </p>
</div>
