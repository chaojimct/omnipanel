# 知识库模块实现计划

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** 从零构建知识库模块——后端 rusqlite 存储 + FTS5 全文搜索 + 前端完整 CRUD + 标签过滤 + Markdown 渲染

**Architecture:** 复用 omnipanel-store 的 rusqlite 存储层，追加 v2 迁移创建 knowledge_entries 表 + FTS5 虚拟表。新增 Tauri commands 桥接前后端。前端用 zustand store + Monaco Editor 编辑 + react-markdown 渲染。

**Tech Stack:** rusqlite (FTS5), serde/specta, zustand, react-markdown, @monaco-editor/react

---

## Phase A: 后端存储层

### Task A1: 添加 rusqlite fts5 feature

**Objective:** 启用 rusqlite 的 FTS5 全文搜索支持

**Files:**
- Modify: `crates/omnipanel-store/Cargo.toml`

**实现:**
找到 rusqlite 依赖行，添加 `fts5` feature：
```toml
rusqlite = { version = "0.31", features = ["bundled", "fts5"] }
```

**验证:** `cargo check -p omnipanel-store` 编译通过

---

### Task A2: 定义 KnowledgeEntry 数据模型

**Objective:** 创建知识条目的 Rust 数据模型

**Files:**
- Create: `crates/omnipanel-store/src/knowledge.rs`

**实现:**
```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct KnowledgeEntry {
    pub id: String,
    pub kind: String,           // "snippet" | "case" | "ai"
    pub title: String,
    pub content: String,        // Markdown
    pub tags: Vec<String>,
    pub risk_level: String,     // "safe" | "readonly" | "medium" | "dangerous"
    pub source: String,         // 来源描述
    pub env_tag: String,        // "dev" | "staging" | "production"
    pub language: String,       // 代码片段的语言 (bash/sql/python/...)
    pub usage_count: i64,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct KnowledgeSearchResult {
    pub entry: KnowledgeEntry,
    pub snippet: String,        // 匹配的文本片段（高亮用）
}
```

---

### Task A3: 添加数据库迁移 v2

**Objective:** 创建 knowledge_entries 表和 FTS5 虚拟表

**Files:**
- Modify: `crates/omnipanel-store/src/storage.rs`（MIGRATIONS 数组）

**实现:**
在 MIGRATIONS 数组末尾追加 v2 迁移：
```sql
-- v2: 知识库
CREATE TABLE IF NOT EXISTS knowledge_entries (
    id TEXT PRIMARY KEY,
    kind TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT NOT NULL DEFAULT '[]',
    risk_level TEXT NOT NULL DEFAULT 'safe',
    source TEXT NOT NULL DEFAULT '',
    env_tag TEXT NOT NULL DEFAULT 'dev',
    language TEXT NOT NULL DEFAULT '',
    usage_count INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE VIRTUAL TABLE IF NOT EXISTS knowledge_fts USING fts5(
    title, content, tags,
    content=knowledge_entries,
    content_rowid=rowid
);

-- 触发器：自动同步 FTS
CREATE TRIGGER IF NOT EXISTS knowledge_ai AFTER INSERT ON knowledge_entries BEGIN
    INSERT INTO knowledge_fts(rowid, title, content, tags) VALUES (new.rowid, new.title, new.content, new.tags);
END;
CREATE TRIGGER IF NOT EXISTS knowledge_ad AFTER DELETE ON knowledge_entries BEGIN
    INSERT INTO knowledge_fts(knowledge_fts, rowid, title, content, tags) VALUES('delete', old.rowid, old.title, old.content, old.tags);
END;
CREATE TRIGGER IF NOT EXISTS knowledge_au AFTER UPDATE ON knowledge_entries BEGIN
    INSERT INTO knowledge_fts(knowledge_fts, rowid, title, content, tags) VALUES('delete', old.rowid, old.title, old.content, old.tags);
    INSERT INTO knowledge_fts(rowid, title, content, tags) VALUES (new.rowid, new.title, new.content, new.tags);
END;
```

---

### Task A4: 实现 Storage 上的 CRUD + 搜索方法

**Objective:** 在 knowledge.rs 中实现 list/get/save/delete/search 方法

**Files:**
- Modify: `crates/omnipanel-store/src/knowledge.rs`（扩展）

**实现:**
在 `impl Storage` 上添加方法（或在 knowledge.rs 中定义 impl 块）：

```rust
impl Storage {
    pub fn list_knowledge(&self, kind: Option<&str>, tag: Option<&str>) -> OmniResult<Vec<KnowledgeEntry>> {
        // SELECT * FROM knowledge_entries WHERE kind=? AND tags LIKE ? ORDER BY updated_at DESC
    }
    
    pub fn get_knowledge(&self, id: &str) -> OmniResult<Option<KnowledgeEntry>> {
        // SELECT * FROM knowledge_entries WHERE id=?
    }
    
    pub fn save_knowledge(&self, entry: &KnowledgeEntry) -> OmniResult<()> {
        // INSERT OR REPLACE, 自动设置 updated_at
    }
    
    pub fn delete_knowledge(&self, id: &str) -> OmniResult<()> {
        // DELETE FROM knowledge_entries WHERE id=?
    }
    
    pub fn search_knowledge(&self, query: &str, kind: Option<&str>) -> OmniResult<Vec<KnowledgeSearchResult>> {
        // FTS5 搜索: SELECT snippet(knowledge_fts, 1, '<b>', '</b>', '...', 32) FROM knowledge_fts WHERE knowledge_fts MATCH ? ORDER BY rank
    }
    
    pub fn list_knowledge_tags(&self) -> OmniResult<Vec<String>> {
        // 从所有条目的 tags JSON 数组中提取去重标签
    }
    
    pub fn increment_usage(&self, id: &str) -> OmniResult<()> {
        // UPDATE knowledge_entries SET usage_count = usage_count + 1 WHERE id=?
    }
}
```

---

### Task A5: 注册 knowledge.rs 模块

**Objective:** 在 storage 模块中导出 knowledge

**Files:**
- Modify: `crates/omnipanel-store/src/lib.rs`

**实现:**
添加 `pub mod knowledge;`

---

## Phase B: Tauri Commands 层

### Task B1: 创建 knowledge Tauri 命令

**Objective:** 定义知识库的 Tauri IPC 命令

**Files:**
- Create: `src-tauri/src/commands/knowledge.rs`

**实现:**
```rust
use crate::state::AppState;
use omnipanel_error::OmniError;
use omnipanel_store::knowledge::{KnowledgeEntry, KnowledgeSearchResult};
use tauri::State;

#[tauri::command]
pub async fn knowledge_list(
    state: State<'_, AppState>,
    kind: Option<String>,
    tag: Option<String>,
) -> Result<Vec<KnowledgeEntry>, OmniError> {
    state.storage().list_knowledge(kind.as_deref(), tag.as_deref())
}

#[tauri::command]
pub async fn knowledge_get(
    state: State<'_, AppState>,
    id: String,
) -> Result<Option<KnowledgeEntry>, OmniError> {
    state.storage().get_knowledge(&id)
}

#[tauri::command]
pub async fn knowledge_save(
    state: State<'_, AppState>,
    entry: KnowledgeEntry,
) -> Result<(), OmniError> {
    state.storage().save_knowledge(&entry)
}

#[tauri::command]
pub async fn knowledge_delete(
    state: State<'_, AppState>,
    id: String,
) -> Result<(), OmniError> {
    state.storage().delete_knowledge(&id)
}

#[tauri::command]
pub async fn knowledge_search(
    state: State<'_, AppState>,
    query: String,
    kind: Option<String>,
) -> Result<Vec<KnowledgeSearchResult>, OmniError> {
    state.storage().search_knowledge(&query, kind.as_deref())
}

#[tauri::command]
pub async fn knowledge_tags(
    state: State<'_, AppState>,
) -> Result<Vec<String>, OmniError> {
    state.storage().list_knowledge_tags()
}

#[tauri::command]
pub async fn knowledge_increment_usage(
    state: State<'_, AppState>,
    id: String,
) -> Result<(), OmniError> {
    state.storage().increment_usage(&id)
}
```

---

### Task B2: 注册命令到 lib.rs

**Objective:** 将知识库命令注册到 Tauri

**Files:**
- Modify: `src-tauri/src/lib.rs`
- Modify: `src-tauri/src/commands/mod.rs`

**实现:**
1. 在 `commands/mod.rs` 添加 `pub mod knowledge;`
2. 在 `lib.rs` 的 `collect_commands![]` 和 `generate_handler![]` 中添加所有 knowledge_ 命令

---

### Task B3: 更新 bindings.ts

**Objective:** 重新生成 TypeScript 类型绑定

**Files:**
- Regenerate: `frontend/src/ipc/bindings.ts`

**实现:**
运行 `cargo test -p omnipanel-store` 或开发模式启动后自动生成。如果 specta 配置正确，knowledge 命令和类型会自动出现在 bindings.ts 中。

**验证:** `grep -n "knowledge" frontend/src/ipc/bindings.ts` 应有结果

---

## Phase C: 前端 Store

### Task C1: 创建 knowledgeStore

**Objective:** zustand store 管理知识库状态

**Files:**
- Create: `frontend/src/stores/knowledgeStore.ts`

**实现:**
```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { commands, type KnowledgeEntry, type KnowledgeSearchResult } from "../ipc/bindings";

interface KnowledgeStore {
  // 数据
  entries: KnowledgeEntry[];
  searchResults: KnowledgeSearchResult[];
  allTags: string[];
  // UI 状态
  activeTab: "snippet" | "case" | "ai";
  searchQuery: string;
  selectedTag: string | null;
  selectedEntryId: string | null;
  editingEntry: KnowledgeEntry | null;
  isLoading: boolean;
  error: string | null;
  // Actions
  loadEntries: (kind?: string, tag?: string) => Promise<void>;
  loadTags: () => Promise<void>;
  search: (query: string, kind?: string) => Promise<void>;
  saveEntry: (entry: KnowledgeEntry) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  incrementUsage: (id: string) => Promise<void>;
  setActiveTab: (tab: "snippet" | "case" | "ai") => void;
  setSearchQuery: (q: string) => void;
  setSelectedTag: (tag: string | null) => void;
  setSelectedEntry: (id: string | null) => void;
  setEditingEntry: (entry: KnowledgeEntry | null) => void;
  clearError: () => void;
}
```

---

## Phase D: 前端 UI

### Task D1: 重写 KnowledgePanel 主框架

**Objective:** 替换静态 Demo 为完整功能面板

**Files:**
- Rewrite: `frontend/src/modules/knowledge/KnowledgePanel.tsx`

**实现:**
布局：左侧标签导航 + 中间列表 + 右侧详情/编辑

```
┌──────────┬──────────────────┬─────────────────┐
│ 侧边栏    │ 条目列表          │ 详情/编辑面板     │
│ - 搜索框  │ - 过滤器 (kind)   │ - Markdown 渲染  │
│ - 分类tab │ - 条目卡片列表     │ - 或 Monaco 编辑 │
│ - 标签云  │ - 新建按钮        │ - 标签编辑       │
│          │                  │ - 元信息         │
└──────────┴──────────────────┴─────────────────┘
```

---

### Task D2: 实现条目卡片组件

**Objective:** 知识条目卡片展示

**Files:**
- Create: `frontend/src/modules/knowledge/KnowledgeCard.tsx`

**实现:**
显示：标题、类型 badge、标签 pills、风险等级、来源、最近更新时间、使用次数。点击选中。

---

### Task D3: 实现详情/编辑面板

**Objective:** 条目详情查看和编辑

**Files:**
- Create: `frontend/src/modules/knowledge/KnowledgeDetail.tsx`

**实现:**
- 查看模式：react-markdown + rehype-highlight 渲染内容
- 编辑模式：Monaco Editor（language=markdown）
- 元信息编辑：标题、类型、标签（tag input）、风险等级、来源、环境标签
- 保存/删除按钮

---

### Task D4: 实现新建条目对话框

**Objective:** 创建新知识条目

**Files:**
- Create: `frontend/src/modules/knowledge/CreateEntryDialog.tsx`

**实现:**
表单：标题、类型（snippet/case/ai）、内容（Monaco Editor）、标签（tag input）、风险等级、语言

---

### Task D5: 实现搜索和标签过滤

**Objective:** 全文搜索 + 标签云过滤

**Files:**
- Modify: `frontend/src/modules/knowledge/KnowledgePanel.tsx`

**实现:**
- 搜索框调用 `knowledge_search` 命令（FTS5）
- 标签云从 `knowledge_tags` 加载，点击过滤
- 搜索结果高亮匹配片段

---

### Task D6: 更新 i18n 翻译

**Objective:** 添加新增功能的翻译 key

**Files:**
- Modify: `frontend/src/i18n/zh-CN.ts`
- Modify: `frontend/src/i18n/en-US.ts`

**实现:**
添加：新建/编辑/删除/搜索/保存/标签管理等操作文案

---

## 执行顺序

```
A1 → A2 → A3 → A4 → A5 → B1 → B2 → B3 → C1 → D1 → D2 → D3 → D4 → D5 → D6
```

后端先行（A1-A5 + B1-B3），然后前端 store（C1），最后 UI（D1-D6）。

---

## 验证清单

- [ ] `cargo check` 编译通过
- [ ] knowledge_entries 表创建成功
- [ ] FTS5 搜索返回结果
- [ ] Tauri commands 在 bindings.ts 中出现
- [ ] 前端能列出所有条目
- [ ] 能创建新条目并持久化
- [ ] 能编辑条目内容
- [ ] 能删除条目
- [ ] 搜索能找到匹配内容
- [ ] 标签过滤正常工作
- [ ] Markdown 内容正确渲染
- [ ] 代码块有语法高亮
