import { normalizeTerminalCwdForSftp } from "@/modules/server/ssh/utils/parseCommandPaths";
import { resolveAbsoluteTerminalCwd } from "../terminalPathCrumbs";

import { isLsExtensionlessFileName, isLsListingCommand, lsListingCommandBase } from "./parseLsListing";
import { normalizeBlockCommand } from "../terminalOutputText";

function normalizeRemotePath(path: string): string {
  const parts: string[] = [];
  for (const part of path.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") {
      parts.pop();
      continue;
    }
    parts.push(part);
  }
  return `/${parts.join("/")}` || "/";
}

function remoteDirname(path: string): string {
  const trimmed = path.replace(/\/+$/, "") || "/";
  if (trimmed === "/") return "/";
  const idx = trimmed.lastIndexOf("/");
  return idx <= 0 ? "/" : trimmed.slice(0, idx);
}

function unquoteArg(raw: string): string {
  const trimmed = raw.trim();
  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function resolveBlockCwd(cwd: string, sessionUser?: string | null): string | null {
  const trimmed = cwd.trim();
  if (/^[A-Za-z]:$/.test(trimmed)) {
    return `${trimmed}\\`;
  }
  if (/^[A-Za-z]:[\\/]/.test(trimmed)) {
    return trimmed.replace(/\//g, "\\");
  }
  return normalizeTerminalCwdForSftp(cwd) ?? resolveAbsoluteTerminalCwd(cwd, sessionUser);
}

function isWindowsPath(path: string): boolean {
  return /^[A-Za-z]:[\\/]/.test(path);
}

function joinWindowsListingPath(base: string, segment: string): string {
  const root = base.replace(/[\\/]+$/, "") || base;
  const name = segment.replace(/^[\\/]+/, "");
  return `${root}\\${name}`;
}

function looksLikeExplicitFile(name: string): boolean {
  if (name.endsWith("/")) return false;
  const base = name.split("/").pop() ?? name;
  if (!base || base === "." || base === "..") return false;
  if (isLsExtensionlessFileName(base)) return true;
  if (base.includes(".")) return true;
  return /\.(?:sh|bash|zsh|py|js|mjs|cjs|ts|tsx|jsx|json|ya?ml|toml|ini|conf|cfg|xml|properties|env|log|pid|sock|jar|war|go|rs|java|php|rb|pl|sql|db|sqlite|pem|key|crt|cer|zip|tar|gz|tgz|bz2|xz|7z|rar|deb|rpm)$/i.test(
    base,
  );
}

/** 从 ls 命令与 block cwd 推断 SFTP 应列出的目录（绝对路径）。 */
export function resolveLsListingDirectory(
  command: string,
  cwd: string,
  sessionUser?: string | null,
): string | null {
  if (!isLsListingCommand(command)) return null;

  const trimmed = normalizeBlockCommand(command).trim();
  const parts = trimmed.split(/\s+/);
  const base = lsListingCommandBase(command);

  const blockCwd = resolveBlockCwd(cwd, sessionUser);
  if (!blockCwd) return null;

  let index = 1;
  if (base === "ls" || base === "dir") {
    while (index < parts.length && /^-[a-zA-Z][a-zA-Z0-9]*$/.test(parts[index]!)) {
      index += 1;
    }
  }

  const rawTarget = parts[index];
  if (!rawTarget) return blockCwd;

  const target = unquoteArg(rawTarget);
  if (isWindowsPath(blockCwd)) {
    if (target.endsWith("\\") || target.endsWith("/")) {
      return target.replace(/\//g, "\\");
    }
    if (/^[A-Za-z]:[\\/]/.test(target)) {
      return target.replace(/\//g, "\\");
    }
    return joinWindowsListingPath(blockCwd, target);
  }

  if (target.endsWith("/")) {
    return target.startsWith("/")
      ? normalizeRemotePath(target)
      : normalizeRemotePath(`${blockCwd}/${target}`);
  }

  const absolute = target.startsWith("/")
    ? normalizeRemotePath(target)
    : normalizeRemotePath(`${blockCwd}/${target}`);

  if (looksLikeExplicitFile(target)) {
    return remoteDirname(absolute);
  }

  return absolute;
}

/** 将 ls 列表所在目录与条目名拼接为绝对路径。 */
export function joinListingEntryPath(listingDir: string, entryName: string): string {
  const name = entryName.replace(/[/\\]+$/, "");
  const driveRoot = listingDir.match(/^([A-Za-z]:)[\\/]?$/);
  if (driveRoot) {
    return `${driveRoot[1]}\\${name}`;
  }
  if (/^[A-Za-z]:[\\/]/.test(listingDir) || listingDir.includes("\\")) {
    const base = listingDir.replace(/[\\/]+$/, "") || listingDir;
    return `${base}\\${name}`;
  }
  if (listingDir === "/") return `/${name}`;
  const base = listingDir.replace(/\/+$/, "") || "/";
  return `${base}/${name}`;
}

export function resolveListingDirectoryForBlock(
  command: string,
  cwd: string,
  sessionUser?: string | null,
): string {
  return (
    resolveLsListingDirectory(command, cwd, sessionUser) ??
    resolveAbsoluteTerminalCwd(cwd, sessionUser)
  );
}
