# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OmniPanel is an AI-native cross-platform engineering workstation for developers. It unifies terminal, SSH, database, Docker, server management, and AI assistance into a single desktop application.

**Status:** Pre-implementation. Only `PRD.md` (product requirements document, in Chinese) exists. No source code yet.

## Technology Stack

- **Language:** Rust (single binary, zero runtime dependencies)
- **Terminal core:** alacritty_terminal (VT parsing engine)
- **GPU rendering:** wgpu (Vulkan/Metal/DX12 abstraction)
- **GUI framework:** egui (immediate-mode GUI)
- **Window management:** winit
- **SSH:** russh + russh-sftp (preferred) or ssh2-rs (fallback)
- **Database drivers:** sqlx (MySQL/PostgreSQL/SQLite), tiberius (SQL Server), redis-rs, mongodb
- **Docker:** bollard
- **AI:** rig (multi-model), async-openai, Ollama HTTP API, CLI Agent adapter
- **Storage:** rusqlite/SQLCipher (local config), keyring-core (credentials)
- **HTTP:** reqwest
- **Protocols:** serialport (serial), rumqttc (MQTT), tokio-tungstenite (WebSocket)

## Project Structure

```
omnipanel/
├── Cargo.toml                    # Rust workspace
├── crates/
│   ├── omnipanel-core/           # Core engine (terminal, SSH, DB, Docker, AI, storage)
│   ├── omnipanel-ui/             # egui-based UI (panels, widgets, theme)
│   └── omnipanel-renderer/       # GPU rendering (wgpu glyph cache, terminal pass)
├── src/
│   └── main.rs                   # Application entry point
└── docs/
    └── PRD.md                    # Product requirements
```

## Crate Responsibilities

**omnipanel-core** — All non-UI logic: terminal emulation, SSH connections, database connectors, Docker API client, server monitoring, panel API adapters (宝塔/1Panel), AI module (cloud API / local model / CLI agent), encrypted storage.

**omnipanel-ui** — egui panels (terminal, SSH, database, Docker, server, AI chat), custom widgets, theme system. Entry point: `app.rs`.

**omnipanel-renderer** — wgpu-based GPU rendering: glyph cache, terminal rendering pipeline, text renderer.

## Build Commands

```bash
# Build the workspace
cargo build

# Run the application
cargo run

# Run tests
cargo test

# Run a single crate's tests
cargo test -p omnipanel-core

# Check formatting
cargo fmt --check

# Run clippy lints
cargo clippy -- -D warnings
```

## Architecture Principles

- **Local-first:** Credentials, history, config stored locally by default. Optional cloud sync, never mandatory.
- **Workspace model:** Each workspace groups connections (SSH/DB/Docker), resources, history, workflows, and security policies for a project or environment.
- **Context continuity:** Terminal, SSH, database, Docker, and AI share context — no copy-paste between modules.
- **AI safety:** AI suggests but never executes without user confirmation. Dangerous commands require explicit approval. All high-risk operations are auditable.
- **Environment tagging:** All resources tagged as dev/test/staging/prod. Production operations get strong warnings.

## Development Phases

| Phase | Scope |
|-------|-------|
| 1 (Month 1-4) | MVP: GPU terminal + SSH client + basic AI |
| 2 (Month 5-7) | Database management (MySQL, PostgreSQL) |
| 3 (Month 8-10) | Docker + server management + panel integration |
| 4 (Month 11-13) | Blocks terminal, workflows, protocol debugging, AI agent chains |
| 5 (Month 14-15) | Polish and release v1.0 |

## Cross-Platform Targets

- **Windows 10+:** conpty for terminal PTY
- **macOS 12+:** posix PTY
- **Linux:** posix PTY, Wayland/X11

## Performance Targets

- Terminal throughput: >500MB/s (`cat` large files)
- Input latency: <5ms (keystroke to screen)
- Memory per terminal tab: <20MB
- VT emulation compatibility: >98% (VT100/VT220)
