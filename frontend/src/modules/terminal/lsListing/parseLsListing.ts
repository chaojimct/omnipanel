/** ls 列表项类型（对齐 GNU ls --color 语义） */
export type LsEntryKind =
  | "directory"
  | "symlink"
  | "executable"
  | "archive"
  | "image"
  | "media"
  | "code"
  | "config"
  | "file";

export type LsEntry = {
  name: string;
  kind: LsEntryKind;
  /** 是否可点击执行 cd（目录、目录型符号链接等） */
  navigable?: boolean;
};

export type LsListing = {
  entries: LsEntry[];
  layout: "grid" | "long";
};

const EXTENSIONLESS_FILES = new Set(
  [
    "Makefile",
    "makefile",
    "GNUmakefile",
    "README",
    "LICENSE",
    "LICENCE",
    "COPYING",
    "Dockerfile",
    "Containerfile",
    "Jenkinsfile",
    "Gemfile",
    "Rakefile",
    "Vagrantfile",
    "Procfile",
    "BUILD",
    "WORKSPACE",
    "CMakeLists.txt",
  ].map((s) => s.toLowerCase()),
);

const ARCHIVE_EXT = new Set([
  "zip",
  "tar",
  "gz",
  "tgz",
  "bz2",
  "xz",
  "7z",
  "rar",
  "deb",
  "rpm",
  "dmg",
  "iso",
  "apk",
  "whl",
]);
const IMAGE_EXT = new Set(["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg", "ico", "tiff", "psd"]);
const MEDIA_EXT = new Set(["mp4", "mkv", "avi", "mov", "mp3", "wav", "flv", "m4v", "aac", "ogg"]);
const CODE_EXT = new Set([
  "py",
  "js",
  "ts",
  "tsx",
  "jsx",
  "rs",
  "go",
  "java",
  "c",
  "cpp",
  "h",
  "sh",
  "bash",
  "zsh",
  "php",
  "rb",
  "sql",
  "html",
  "css",
  "vue",
  "ipynb",
]);
const CONFIG_EXT = new Set(["json", "yaml", "yml", "toml", "xml", "ini", "cfg", "conf", "env"]);

function unquoteName(raw: string): string {
  const trimmed = raw.trim();
  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function extractExtension(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith(".tar.gz")) return "tgz";
  if (lower.endsWith(".tar.bz2")) return "bz2";
  if (lower.endsWith(".tar.xz")) return "xz";
  const dot = lower.lastIndexOf(".");
  if (dot <= 0 || dot === lower.length - 1) return "";
  return lower.slice(dot + 1);
}

function isExtensionlessFile(name: string): boolean {
  return EXTENSIONLESS_FILES.has(name.toLowerCase());
}

function hasFileExtension(name: string): boolean {
  if (name.startsWith(".")) return name.length > 1 && name.includes(".", 1);
  return extractExtension(name).length > 0;
}

function classifyByExtension(name: string): LsEntryKind {
  const ext = extractExtension(name);
  if (!ext) return "file";
  if (ext === "sh" || ext === "bash" || ext === "exe" || ext === "bat" || ext === "cmd") {
    return "executable";
  }
  if (ARCHIVE_EXT.has(ext)) return "archive";
  if (IMAGE_EXT.has(ext)) return "image";
  if (MEDIA_EXT.has(ext)) return "media";
  if (CODE_EXT.has(ext)) return "code";
  if (CONFIG_EXT.has(ext)) return "config";
  return "file";
}

/** 按文件名扩展名推断类型（供 SFTP 元数据修正后回退使用）。 */
export function classifyLsEntryKindFromName(name: string): LsEntryKind {
  if (isExtensionlessFile(name)) return "file";
  if (!hasFileExtension(name)) return "file";
  return classifyByExtension(name);
}

export function isLsExtensionlessFileName(name: string): boolean {
  const base = name.split("/").pop() ?? name;
  return isExtensionlessFile(base);
}

function classifyPlainName(raw: string): LsEntry {
  let name = unquoteName(raw);
  let kind: LsEntryKind = "file";

  if (name.endsWith("/")) {
    kind = "directory";
    name = name.slice(0, -1);
  } else if (name.endsWith("*")) {
    kind = "executable";
    name = name.slice(0, -1);
  } else if (name.endsWith("@")) {
    kind = "symlink";
    name = name.slice(0, -1);
  } else if (name.endsWith("=")) {
    kind = "file";
    name = name.slice(0, -1);
  } else if (!hasFileExtension(name) && !isExtensionlessFile(name)) {
    kind = "directory";
  } else {
    kind = classifyByExtension(name);
  }

  const entry: LsEntry = { name: unquoteName(name), kind };
  if (kind === "directory" || kind === "symlink") {
    return { ...entry, navigable: true };
  }
  return entry;
}

function modeToKind(modeChar: string, mode: string): LsEntryKind {
  if (modeChar === "d") return "directory";
  if (modeChar === "l") return "symlink";
  if (modeChar === "b" || modeChar === "c" || modeChar === "p" || modeChar === "s") return "file";
  if (mode.includes("x")) return "executable";
  return "file";
}

function parseLongLine(line: string): LsEntry | null {
  const match = line.match(/^([-dlbcps])([rwx-]{9})\s+/);
  if (!match) return null;

  const parts = line.trim().split(/\s+/);
  if (parts.length < 8) return null;

  let nameStart = 8;
  if (/^\d{4}-\d{2}-\d{2}$/.test(parts[5] ?? "")) {
    nameStart = 7;
  }

  let rawName = parts.slice(nameStart).join(" ");
  if (rawName.includes(" -> ")) {
    rawName = rawName.split(" -> ")[0]!.trim();
  }

  const name = unquoteName(rawName);
  if (!name) return null;

  const modeChar = match[1]!;
  const kind = modeToKind(modeChar, match[2]!);

  return {
    name,
    kind,
    navigable: modeChar === "d" || modeChar === "l",
  };
}

function tokenizePlainLsOutput(output: string): string[] {
  const entries: string[] = [];
  const pattern = /'([^']*)'|"([^"]*)"|(\S+)/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(output)) !== null) {
    const token = match[1] ?? match[2] ?? match[3];
    if (token) entries.push(token);
  }
  return entries;
}

function isLsCommand(command: string): boolean {
  const cmd = command.trim();
  if (!cmd) return false;
  const base = cmd.split(/\s+/)[0] ?? "";
  return base === "ls" || base === "dir";
}

function isLongListing(command: string): boolean {
  return /(^|\s)-[a-zA-Z]*l[a-zA-Z]*(\s|$)/.test(command) || /\bll\b/.test(command);
}

/** 解析 ls / dir 输出为结构化列表；无法识别时返回 null */
export function tryParseLsListing(command: string, output: string): LsListing | null {
  if (!isLsCommand(command)) return null;

  const text = output.trim();
  if (!text) return null;

  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  if (isLongListing(command) || lines.some((line) => /^[-dlbcps][rwx-]{9}\s/.test(line))) {
    const entries: LsEntry[] = [];
    for (const line of lines) {
      if (line.startsWith("total ")) continue;
      const entry = parseLongLine(line);
      if (!entry) {
        if (entries.length > 0) return null;
        continue;
      }
      entries.push(entry);
    }
    if (entries.length > 0) return { entries, layout: "long" };
  }

  const tokens = tokenizePlainLsOutput(text);
  if (tokens.length < 2) return null;

  const invalid = tokens.some(
    (token) => token.length > 260 || token.includes("=") && token.includes("error"),
  );
  if (invalid) return null;

  return {
    entries: tokens.map(classifyPlainName),
    layout: "grid",
  };
}

export function shellQuotePath(name: string): string {
  if (/^[a-zA-Z0-9._@+-]+$/.test(name)) return name;
  return `'${name.replace(/'/g, `'\\''`)}'`;
}
