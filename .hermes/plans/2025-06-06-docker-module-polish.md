# Docker 模块全方位完善计划

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** 修复所有已知 bug，统一 UI 交互模式，添加过渡动画和 loading 状态，全面打磨 Docker 模块。

**Architecture:** 纯前端改动为主（CSS 动画 + React 组件优化），后端仅修复 2 个 bug。不改变数据流架构。

**Tech Stack:** React 18, TypeScript, CSS transitions/animations, Tauri IPC

---

## Phase A: Bug 修复（P0）

### Task A1: 修复 DockerStatsPanel 事件匹配 bug

**Objective:** stats 面板完全不能工作的根本原因——事件 payload 字段名不匹配

**Files:**
- Modify: `frontend/src/modules/docker/DockerStatsPanel.tsx`

**问题:**
- `docker.rs` L474 发出 `{ streamId, stats }`，但前端 L53 用 `e.payload.containerId` 匹配
- `docker.rs` L518 发出 `{ streamId, error }`，但前端 L60 用 `e.payload.containerId` 匹配

**修复:**
将 `DockerStatsPanel.tsx` 中所有 `containerId` 引用改为 `streamId`：
- L53: `e.payload.containerId === statsStreamId` → `e.payload.streamId === statsStreamId`
- L60: `e.payload.containerId === statsStreamId` → `e.payload.streamId === statsStreamId`

**验证:** 启动 `npm run tauri dev`，打开 Docker 面板，点击容器的 Stats tab，应看到实时 CPU/内存数据流。

---

### Task A2: 修复 canExec 判断逻辑

**Objective:** SSH 连接也能使用容器 exec 终端

**Files:**
- Modify: `frontend/src/modules/docker/DockerPanel.tsx`

**问题:**
L671 硬编码 `canExec={selectedConnection?.source === "local-engine"}`，但 SSH 也支持 exec（ssh.rs L319 `create_exec`）。

**修复:**
改为检查 probe capabilities：
```tsx
canExec={probe?.capabilities?.canContainerExec ?? false}
```

**验证:** 连接一个 SSH Docker 源，打开容器 drawer，应能看到 Terminal tab。

---

## Phase B: UI 统一（P1）

### Task B1: 统一确认对话框——替换所有 window.confirm

**Objective:** 5 处 `window.confirm` 替换为项目自有的 `ConfirmModal` 组件

**Files:**
- Modify: `frontend/src/modules/docker/DockerNetworksTab.tsx` (L71)
- Modify: `frontend/src/modules/docker/DockerVolumesTab.tsx` (L39, L82)
- Modify: `frontend/src/modules/docker/DockerImageDrawer.tsx` (L196)
- Modify: `frontend/src/modules/docker/DockerNetworkDrawer.tsx` (L154)
- Modify: `frontend/src/modules/docker/DockerVolumeDrawer.tsx` (L117)

**模式:**
每个文件：
1. 添加 `useState` 控制 confirm modal 显示
2. 将 `window.confirm(...)` 替换为设置 state 触发 ConfirmModal
3. ConfirmModal 的 onConfirm 执行原逻辑

参考 DockerPanel.tsx 中已有的 ConfirmModal 用法（约 L500-520）。

---

### Task B2: 统一错误处理——添加全局 Error Banner

**Objective:** 所有 Docker 子 tab 的错误都通过统一 banner 展示

**Files:**
- Modify: `frontend/src/modules/docker/DockerPanel.tsx`

**实现:**
在 DockerPanel 的统计卡片下方添加 error banner：
```tsx
{error && !isOffline && (
  <div className="docker-error-banner">
    <span className="docker-error-icon">⚠</span>
    <span>{error}</span>
    <button onClick={() => setError(null)} className="docker-error-dismiss">×</button>
  </div>
)}
```

对应 CSS 添加到 global.css 或组件内。

---

### Task B3: 统一 Loading 状态——Skeleton 加载器

**Objective:** 替换所有 "加载中…" 文字为统一的 skeleton loading 组件

**Files:**
- Create: `frontend/src/components/ui/SkeletonLoader.tsx`
- Modify: `frontend/src/modules/docker/DockerPanel.tsx`（容器/镜像列表加载区）
- Modify: 各 Drawer 组件的 loading 状态

**SkeletonLoader 组件:**
```tsx
interface SkeletonProps {
  rows?: number;
  variant?: 'card' | 'list' | 'text';
}
export function SkeletonLoader({ rows = 3, variant = 'list' }: SkeletonProps) {
  return (
    <div className={`skeleton skeleton-${variant}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-row" style={{ animationDelay: `${i * 0.1}s` }} />
      ))}
    </div>
  );
}
```

---

## Phase C: 动画与过渡（P1）

### Task C1: Drawer 开关动画

**Objective:** 所有 Drawer（Container/Image/Network/Volume/Compose）有滑入/滑出动画

**Files:**
- Modify: `frontend/src/styles/global.css`（或新增 `docker-animations.css`）

**CSS:**
```css
/* Drawer 基础过渡 */
.drawer, .docker-drawer {
  transform: translateX(100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform;
}
.drawer.open, .docker-drawer.open {
  transform: translateX(0);
}

/* Drawer 遮罩 */
.drawer-overlay {
  opacity: 0;
  transition: opacity 0.25s ease;
}
.drawer-overlay.open {
  opacity: 1;
}
```

如果 Drawer 是条件渲染（非 display toggle），需要用 `useEffect` + `requestAnimationFrame` 添加 enter class。

---

### Task C2: Tab 切换过渡

**Objective:** Docker 面板的 6 个子 tab 切换有淡入效果

**Files:**
- Modify: `frontend/src/modules/docker/DockerPanel.tsx`

**实现:**
给 tab content 包裹 fade-in 动画：
```tsx
<div key={activeTab} className="tab-content-animate">
  {activeTab === 'containers' && <ContainersContent ... />}
  {activeTab === 'images' && <ImagesContent ... />}
  ...
</div>
```

CSS:
```css
@keyframes tabFadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.tab-content-animate {
  animation: tabFadeIn 0.2s ease-out;
}
```

---

### Task C3: 列表项入场动画

**Objective:** 容器/镜像列表项有 stagger 入场效果

**Files:**
- Modify: `frontend/src/modules/docker/DockerPanel.tsx`（容器列表渲染处）

**CSS:**
```css
@keyframes listItemEnter {
  from { opacity: 0; transform: translateX(-12px); }
  to { opacity: 1; transform: translateX(0); }
}
.docker-list-item {
  animation: listItemEnter 0.25s ease-out both;
}
```

列表渲染时给每个 item 加 `style={{ animationDelay: `${index * 0.03}s` }}`。

---

### Task C4: Toast 通知动画

**Objective:** Toast 消息有 fade-in + slide-up 入场，自动消失时 fade-out

**Files:**
- Modify: `frontend/src/modules/docker/DockerPanel.tsx`（Toast 渲染处）

**CSS:**
```css
@keyframes toastIn {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes toastOut {
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(-8px); }
}
.docker-toast {
  animation: toastIn 0.3s ease-out;
}
.docker-toast.exiting {
  animation: toastOut 0.2s ease-in forwards;
}
```

---

### Task C5: 统计卡片数字动画

**Objective:** 统计卡片的数字变化有 count-up 效果

**Files:**
- Modify: `frontend/src/modules/docker/DockerPanel.tsx`（StatCard 区域）

**实现:**
创建 `useCountUp` hook：
```tsx
function useCountUp(target: number, duration = 600) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const from = value;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(Math.round(from + (target - from) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target]);
  return value;
}
```

---

### Task C6: 连接切换 Loading Overlay

**Objective:** 切换 Docker 连接源时显示全屏 loading overlay

**Files:**
- Modify: `frontend/src/modules/docker/DockerPanel.tsx`

**实现:**
在 `switchConnection` 期间显示 overlay：
```tsx
{switching && (
  <div className="docker-switch-overlay">
    <div className="docker-switch-spinner" />
    <span>正在连接...</span>
  </div>
)}
```

---

## Phase D: 交互增强（P2）

### Task D1: 文件浏览器面包屑导航

**Objective:** DockerFilesTab 有可点击的面包屑路径导航

**Files:**
- Modify: `frontend/src/modules/docker/DockerFilesTab.tsx`

**实现:**
```tsx
function Breadcrumb({ path, onNavigate }: { path: string; onNavigate: (p: string) => void }) {
  const parts = path.split('/').filter(Boolean);
  return (
    <div className="breadcrumb">
      <span onClick={() => onNavigate('/')}>/</span>
      {parts.map((part, i) => {
        const subPath = '/' + parts.slice(0, i + 1).join('/');
        return <span key={i} onClick={() => onNavigate(subPath)}>{part}</span>;
      })}
    </div>
  );
}
```

---

### Task D2: 空状态插图

**Objective:** 各 tab 无数据时显示友好的空状态插图（SVG + 文案）

**Files:**
- Modify: `frontend/src/modules/docker/DockerPanel.tsx`（容器/镜像空列表）
- Modify: `DockerNetworksTab.tsx`, `DockerVolumesTab.tsx`, `DockerFilesTab.tsx`

**模式:**
```tsx
function EmptyState({ icon, title, desc }: { icon: string; title: string; desc?: string }) {
  return (
    <div className="docker-empty-state">
      <div className="docker-empty-icon">{icon}</div>
      <div className="docker-empty-title">{title}</div>
      {desc && <div className="docker-empty-desc">{desc}</div>}
    </div>
  );
}
```

---

### Task D3: 搜索防抖

**Objective:** 容器/镜像搜索输入添加 300ms 防抖

**Files:**
- Modify: `frontend/src/modules/docker/DockerPanel.tsx`

**实现:**
```tsx
const [searchInput, setSearchInput] = useState('');
const [searchQuery, setSearchQuery] = useState('');
useEffect(() => {
  const timer = setTimeout(() => setSearchQuery(searchInput), 300);
  return () => clearTimeout(timer);
}, [searchInput]);
```

---

### Task D4: DockerFileEditor 语法高亮

**Objective:** Dockerfile 编辑器使用 Monaco 替换纯 textarea

**Files:**
- Modify: `frontend/src/modules/docker/DockerFileEditor.tsx`

**实现:**
引入 Monaco Editor（项目已有 `monacoSetup.ts`），使用 `language: 'dockerfile'`。

---

## Phase E: 后端修复（P1）

### Task E1: 修复 list_networks created_at 字段

**Objective:** Local 和 OnePanel 适配器的 list_networks 正确返回 created_at

**Files:**
- Modify: `crates/omnipanel-docker/src/local.rs` (~L1030)
- Modify: `crates/omnipanel-docker/src/onepanel.rs` (~L675)

**修复:** local.rs 中 bollard 的 NetworkListResponse 有 `created_at` 字段，确保正确解析。onepanel.rs 中从 API 响应提取时间戳。

---

### Task E2: 修复 SSH stream_stats 优雅退出

**Objective:** SSH stats 流在 stop 信号发出后能及时退出

**Files:**
- Modify: `crates/omnipanel-docker/src/ssh.rs` (~L806-841)

**修复:** 将 `stop.changed()` 检查放入 `tokio::select!` 内部，与 `rx.recv()` 并列。

---

## 执行顺序

```
A1 → A2 → B1 → B2 → B3 → C1 → C2 → C3 → C4 → C5 → C6 → D1 → D2 → D3 → D4 → E1 → E2
```

A 组（Bug）优先，B/C 组（UI/动画）可并行，D 组（增强）后续，E 组（后端）独立。

---

## 验证清单

- [ ] Stats 面板能显示实时 CPU/内存数据
- [ ] SSH 连接的容器能打开 exec 终端
- [ ] 所有删除操作使用统一 ConfirmModal
- [ ] 错误有 banner 提示，不会静默失败
- [ ] 列表加载显示 skeleton 而非文字
- [ ] Drawer 有滑入/滑出动画
- [ ] Tab 切换有淡入效果
- [ ] 列表项有 stagger 入场
- [ ] Toast 有 fade 动画
- [ ] 统计数字有 count-up 效果
- [ ] 连接切换有 loading overlay
- [ ] 文件浏览器有面包屑
- [ ] 空状态有友好插图
- [ ] 搜索输入有防抖
- [ ] Dockerfile 编辑器有语法高亮
