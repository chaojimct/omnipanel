import type { WorkspaceDockTab } from "../stores/workspaceBottomDockStore";
import { MAX_WORKSPACE_PANELS } from "../stores/workspaceBottomDockStore";
import type { WorkspaceTabPreviewData } from "./workspaceTabPreview";

/** 开启后 WorkspacePreview 每个工作区展示假面板（仅 UI 测试） */
export const WORKSPACE_PREVIEW_USE_MOCK_PANELS = false;

const MOCK_PREVIEW_SAMPLES: WorkspaceTabPreviewData[] = [
  {
    kind: "terminal",
    title: "本地 Shell",
    source: "终端",
    status: "connected",
    lines: ["~/workspace/omnipanel", "$ git status", "On branch main", "nothing to commit"],
  },
  {
    kind: "terminal",
    title: "prod-web-01",
    source: "终端",
    status: "connected",
    lines: ["root@prod-web-01:/var/log", "# tail -f nginx/access.log", "200 GET /api/health"],
  },
  {
    kind: "database-sql",
    title: "analytics · SQL",
    source: "数据库",
    lines: ["SELECT user_id, COUNT(*)", "FROM events", "WHERE ts > NOW() - INTERVAL 1 DAY", "GROUP BY 1"],
  },
  {
    kind: "database-table",
    title: "orders",
    source: "数据库",
    lines: ["prod-mysql", "库: shop", "表: orders", "12,408 rows"],
  },
  {
    kind: "database-sql",
    title: "staging-pg",
    source: "数据库",
    status: "running",
    lines: ["EXPLAIN ANALYZE", "SELECT * FROM users", "执行中…"],
  },
  {
    kind: "docker-logs",
    title: "api-gateway",
    source: "Docker",
    lines: ["[INFO] Listening :8080", "[WARN] retry upstream", "200 OK /v1/users", "health check pass"],
  },
  {
    kind: "docker-terminal",
    title: "redis-cache",
    source: "Docker",
    status: "exec",
    lines: ["容器: redis-cache", "ID: a3f91c2b4e10", "redis-cli", "127.0.0.1:6379>"],
  },
  {
    kind: "docker-logs",
    title: "worker-queue",
    source: "Docker",
    lines: ["Processing job #8842", "ack in 42ms", "queue depth: 3", "idle"],
  },
  {
    kind: "fallback",
    title: "工作流 · 部署",
    source: "工作区",
    lines: ["deploy-staging.yml", "step: build", "step: push", "step: rollout"],
  },
  {
    kind: "database-table",
    title: "users",
    source: "数据库",
    lines: ["staging-pg", "库: app", "表: users", "索引: email_unique"],
  },
];

const MOCK_PANEL_ID_RE = /^ws-preview-mock:[^:]+:(\d+)$/;

export function isMockWorkspacePreviewPanel(tabId: string): boolean {
  return MOCK_PANEL_ID_RE.test(tabId);
}

export function resolveMockWorkspaceTabPreview(tabId: string): WorkspaceTabPreviewData | null {
  const match = MOCK_PANEL_ID_RE.exec(tabId);
  if (!match) return null;
  const idx = Number(match[1]);
  const sample = MOCK_PREVIEW_SAMPLES[idx % MOCK_PREVIEW_SAMPLES.length];
  return { ...sample };
}

/** 为指定工作区生成假面板 Tab（仅预览 UI，不写入 store） */
export function buildMockWorkspacePreviewPanels(workspaceId: string): WorkspaceDockTab[] {
  return Array.from({ length: MAX_WORKSPACE_PANELS }, (_, index) => {
    const sample = MOCK_PREVIEW_SAMPLES[index % MOCK_PREVIEW_SAMPLES.length];
    return {
      id: `ws-preview-mock:${workspaceId}:${index}`,
      label: sample.title,
      kind: "payload" as const,
      panelType: sample.kind.startsWith("database")
        ? "database"
        : sample.kind.startsWith("docker")
          ? "docker"
          : sample.kind === "terminal"
            ? "terminal"
            : "workspace",
      closable: false,
    };
  });
}
