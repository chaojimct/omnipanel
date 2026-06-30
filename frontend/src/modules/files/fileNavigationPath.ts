import { isComputerRoot, LOCAL_COMPUTER_ROOT } from "./localFilesystem";

export type ParseNavigationPathOptions = {
  platform?: string;
  homePath?: string;
};

/** 将当前路径格式化为地址栏展示文本。 */
export function formatPathForInput(
  path: string,
  protocol: string,
  options?: ParseNavigationPathOptions,
): string {
  if (protocol === "local") {
    if (!path || path === "~") {
      return options?.homePath ?? "~";
    }
    if (isComputerRoot(path)) {
      return LOCAL_COMPUTER_ROOT;
    }
    return path;
  }
  if (protocol === "s3") {
    if (!path) return "/";
    return path.startsWith("/") ? path : `/${path}`;
  }
  return path || "/";
}

/** 解析用户在地址栏输入的路径。 */
export function parseFileNavigationPath(
  raw: string,
  protocol: string,
  options?: ParseNavigationPathOptions,
): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    if (protocol === "local") return "";
    if (protocol === "s3") return "";
    return "/";
  }

  if (protocol === "local") {
    if (trimmed === "~") return "";
    if (trimmed.startsWith("~/")) return trimmed;

    const isWindows =
      options?.platform === "windows" ||
      (!options?.platform && (trimmed.includes("\\") || /^[A-Za-z]:/.test(trimmed)));

    if (isWindows) {
      if (trimmed === "\\" || trimmed === "\\\\" || isComputerRoot(trimmed)) {
        return LOCAL_COMPUTER_ROOT;
      }
      let normalized = trimmed.replace(/\//g, "\\");
      if (/^[A-Za-z]:[^\\]/.test(normalized)) {
        normalized = normalized.replace(/^([A-Za-z]:)/, "$1\\");
      }
      if (/^[A-Za-z]:$/.test(normalized)) {
        return `${normalized}\\`;
      }
      return normalized;
    }

    if (trimmed === "/") return "/";
    return trimmed.startsWith("/") ? trimmed.replace(/\/+$/, "") || "/" : `/${trimmed}`;
  }

  if (protocol === "s3") {
    return trimmed.replace(/^\/+/, "").replace(/\/+$/, "");
  }

  let posix = trimmed.replace(/\\/g, "/");
  if (!posix.startsWith("/")) {
    posix = `/${posix}`;
  }
  if (posix === "/") return "/";
  return posix.replace(/\/+$/, "") || "/";
}
