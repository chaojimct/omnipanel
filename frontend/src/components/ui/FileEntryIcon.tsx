import { IconFile, IconFolder, IconLink } from "./Icons";

export type FileEntryType = "dir" | "file" | "symlink";

interface FileEntryIconProps {
  type: FileEntryType;
  size?: number;
  className?: string;
}

/** 文件/目录/符号链接行内图标，SFTP 与 Docker 文件浏览共用。 */
export function FileEntryIcon({ type, size = 14, className }: FileEntryIconProps) {
  const mergedClass = className ? `file-entry-icon ${className}` : "file-entry-icon";
  if (type === "dir") return <IconFolder size={size} className={mergedClass} />;
  if (type === "symlink") return <IconLink size={size} className={mergedClass} />;
  return <IconFile size={size} className={mergedClass} />;
}
