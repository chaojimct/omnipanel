import type { FileConfigJson } from "./FileConnectionDialog";

function normalizeBaseUrl(domain: string): string {
  const trimmed = domain.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed.replace(/\/+$/, "");
  return `https://${trimmed.replace(/\/+$/, "")}`;
}

/** 保留路径分隔符，仅编码各段。 */
function encodeObjectKey(key: string): string {
  const normalized = key.replace(/^\/+/, "");
  if (!normalized) return "";
  return normalized.split("/").map(encodeURIComponent).join("/");
}

export function parseFileConfigJson(config: string): FileConfigJson {
  try {
    return JSON.parse(config || "{}") as FileConfigJson;
  } catch {
    return { protocol: "local" };
  }
}

/** 根据 S3 连接配置与对象 key 生成可分享的公开 URL。 */
export function buildS3PublicUrl(cfg: FileConfigJson, objectKey: string): string | null {
  if (!objectKey || objectKey.endsWith("/")) return null;

  const key = objectKey.replace(/^\/+/, "");
  const encodedKey = encodeObjectKey(key);
  if (!encodedKey) return null;

  const publicBase = normalizeBaseUrl(cfg.publicDomain ?? "");
  if (publicBase) {
    return `${publicBase}/${encodedKey}`;
  }

  const bucket = cfg.bucket?.trim() ?? "";
  const endpoint = normalizeBaseUrl(cfg.endpoint ?? "");
  if (endpoint && bucket) {
    try {
      const url = new URL(endpoint);
      const host = url.host;
      if (/^\d+\.\d+\.\d+\.\d+$/.test(host.split(":")[0] ?? "")) {
        return `${endpoint}/${encodeURIComponent(bucket)}/${encodedKey}`;
      }
      return `${url.protocol}//${bucket}.${host}/${encodedKey}`;
    } catch {
      return `${endpoint}/${encodeURIComponent(bucket)}/${encodedKey}`;
    }
  }

  const region = cfg.region?.trim() ?? "";
  if (bucket && region) {
    if (region === "us-east-1") {
      return `https://${bucket}.s3.amazonaws.com/${encodedKey}`;
    }
    return `https://${bucket}.s3.${region}.amazonaws.com/${encodedKey}`;
  }

  return null;
}
