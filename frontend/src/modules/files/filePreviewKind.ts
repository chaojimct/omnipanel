import { isGridImageFile } from "./utils";

export type FilePreviewKind = "text" | "image" | "unsupported";

const TEXT_EXTENSIONS = new Set([
  "txt", "md", "json", "xml", "yaml", "yml", "toml", "ini", "cfg", "conf",
  "js", "ts", "tsx", "jsx", "css", "html", "rs", "go", "py", "sh", "sql", "log",
]);

export function isTextPreviewFile(name: string): boolean {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return TEXT_EXTENSIONS.has(ext);
}

export function resolveFilePreviewKind(name: string): FilePreviewKind {
  if (isGridImageFile(name)) return "image";
  if (isTextPreviewFile(name)) return "text";
  return "unsupported";
}

export function decodePreviewBytes(bytes: number[]): string {
  try {
    return new TextDecoder("utf-8", { fatal: false }).decode(new Uint8Array(bytes));
  } catch {
    return "";
  }
}
