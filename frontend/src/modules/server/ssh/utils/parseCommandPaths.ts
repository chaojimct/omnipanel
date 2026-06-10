/** 从进程命令行中提取绝对路径（去重、排序）。 */
export function parsePathsFromCommand(command: string): string[] {
  const found = new Set<string>();
  const re = /(?:^|[\s"'=,])(\/(?:[\w.\-+~@]+(?:\/[\w.\-+~@]+)*))/g;
  for (const match of command.matchAll(re)) {
    const raw = match[1];
    if (!raw || raw === "/") continue;
    const cleaned = raw.replace(/[,;:'"]+$/, "");
    if (cleaned.length > 1) {
      found.add(cleaned);
    }
  }
  return [...found].sort((a, b) => a.length - b.length || a.localeCompare(b));
}

/** 路径对应的 SFTP / 终端工作目录（文件则取父目录）。 */
export function pathToRemoteDir(path: string): string {
  const trimmed = path.replace(/\/+$/, "") || "/";
  if (trimmed === "/") return "/";
  const base = trimmed.split("/").pop() ?? "";
  if (base.includes(".") && !base.endsWith(".")) {
    const idx = trimmed.lastIndexOf("/");
    return idx <= 0 ? "/" : trimmed.slice(0, idx);
  }
  return trimmed;
}

export function shellCdCommand(dir: string): string {
  const safe = dir.replace(/'/g, `'\\''`);
  return `cd '${safe}'`;
}
