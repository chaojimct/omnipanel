---
name: omnipanel
description: OmniPanel 工程工作站项目概览与模块说明
---

# OmniPanel Skill

当用户询问 OmniPanel 架构、模块或开发约定时使用本 Skill。

## 项目结构

- `src-tauri/` — Tauri 2 后端（Rust）
- `frontend/` — React + TypeScript 前端
- `crates/` — 共享 Rust 库（omnipanel-ai、omnipanel-store 等）
- `agent/` — 本 ACP 本地 Agent（DeepAgents + Skills + MCP）

## 模块

- Terminal / SSH / Database / Docker / Server / Files / Protocol / Knowledge
- AI 助手与 ACP 服务集成在 `crates/omnipanel-ai` 与前端设置页

## 开发

- 桌面开发：`npm run tauri dev`（仓库根目录）
- 本 Agent：`cd agent && npm start`
