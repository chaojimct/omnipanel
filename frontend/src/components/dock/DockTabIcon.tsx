export type DockTabIconKind =
  | "sql"
  | "table"
  | "database"
  | "file-local"
  | "file-ftp"
  | "file-sftp"
  | "file-s3";

const iconProps = {
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  width: 14,
  height: 14,
  "aria-hidden": true,
} as const;

export function DockTabIcon({ kind }: { kind: DockTabIconKind }) {
  if (kind === "table") {
    return (
      <svg {...iconProps}>
        <rect x="2" y="3" width="12" height="10" rx="1" />
        <path d="M2 7h12M6 3v10M10 3v10" />
      </svg>
    );
  }

  if (kind === "database") {
    return (
      <svg {...iconProps}>
        <ellipse cx="8" cy="4.5" rx="5" ry="2" />
        <path d="M3 4.5v7c0 1.1 2.2 2 5 2s5-.9 5-2v-7" />
        <path d="M3 8c0 1.1 2.2 2 5 2s5-.9 5-2" />
      </svg>
    );
  }

  if (kind === "file-local") {
    return (
      <svg {...iconProps}>
        <rect x="2" y="2" width="12" height="12" rx="1" />
        <path d="M5 6h6M5 8h4" />
      </svg>
    );
  }

  if (kind === "file-ftp") {
    return (
      <svg {...iconProps}>
        <rect x="2" y="3" width="12" height="10" rx="1" />
        <path d="M5 7h6M5 9h4" />
      </svg>
    );
  }

  if (kind === "file-sftp") {
    return (
      <svg {...iconProps}>
        <rect x="3" y="5" width="10" height="8" rx="1" />
        <path d="M5 5V4a3 3 0 016 0v1" />
        <circle cx="8" cy="10" r="1" />
      </svg>
    );
  }

  if (kind === "file-s3") {
    return (
      <svg {...iconProps}>
        <path d="M8 2L2 5v6l6 3 6-3V5z" />
        <path d="M2 5l6 3 6-3" />
      </svg>
    );
  }

  return (
    <svg {...iconProps}>
      <path d="M4 3h8l2 2v8H4V3z" />
      <path d="M12 3v2h2M6 8h4M6 10.5h2.5" />
    </svg>
  );
}
