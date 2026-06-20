import type { FileEntry } from "../../ipc/bindings";

export const LOCAL_CONNECTION_ID = "__local__";

export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null || bytes === 0) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function formatFileTime(ts: number | null | undefined): string {
  if (!ts) return "—";
  const d = new Date(ts * 1000);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

export function fileTypeLabel(entry: FileEntry): string {
  if (entry.kind === "dir") return "文件夹";
  const ext = entry.name.includes(".") ? entry.name.split(".").pop()?.toUpperCase() : "";
  return ext || "文件";
}

export function joinRemotePath(base: string, name: string, protocol: string): string {
  if (protocol === "s3") {
    const prefix = base.endsWith("/") ? base : base ? `${base}/` : "";
    return `${prefix}${name}`;
  }
  if (protocol === "local") {
    const sep = base.includes("\\") ? "\\" : "/";
    if (!base || base === sep) return `${sep}${name}`;
    return `${base.replace(/[\\/]+$/, "")}${sep}${name}`;
  }
  if (base === "/" || !base) return `/${name}`;
  return `${base.replace(/\/+$/, "")}/${name}`;
}

export function parentPath(path: string, protocol: string): string {
  if (protocol === "local") {
    const sep = path.includes("\\") ? "\\" : "/";
    const parts = path.split(sep).filter(Boolean);
    if (parts.length <= 1) return parts[0] ? `${parts[0]}${sep}` : sep;
    return parts.slice(0, -1).join(sep);
  }
  if (protocol === "s3") {
    const trimmed = path.replace(/\/+$/, "");
    const idx = trimmed.lastIndexOf("/");
    if (idx <= 0) return "";
    return `${trimmed.slice(0, idx + 1)}`;
  }
  if (path === "/") return "/";
  const parent = path.split("/").slice(0, -1).join("/");
  return parent || "/";
}

export function fmtError(e: unknown): string {
  if (e instanceof Error) {
    const extra = e as Error & { code?: unknown; cause?: unknown };
    if (typeof extra.cause === "string" && extra.cause && !e.message.includes(extra.cause)) {
      return `${e.message}（${extra.cause}）`;
    }
    return e.message;
  }
  if (typeof e === "string") return e;
  if (e && typeof e === "object") {
    const err = e as Record<string, unknown>;
    const message = typeof err.message === "string" ? err.message : null;
    const cause = typeof err.cause === "string" ? err.cause : null;
    if (message && cause && !message.includes(cause)) return `${message}（${cause}）`;
    if (message) return message;
  }
  return String(e);
}
