import type { SftpEntry } from "@/ipc/bindings";
import type { LsEntry, LsListing } from "./parseLsListing";
import { classifyLsEntryKindFromName } from "./parseLsListing";

/** 用 SFTP 目录元数据修正 plain ls 对无扩展名条目的类型猜测。 */
export function enrichLsListingWithSftp(
  listing: LsListing,
  sftpEntries: SftpEntry[],
): LsListing {
  if (listing.layout !== "grid" || sftpEntries.length === 0) {
    return listing;
  }

  const byName = new Map(sftpEntries.map((entry) => [entry.name, entry]));

  const entries: LsEntry[] = listing.entries.map((entry) => {
    const meta = byName.get(entry.name);
    if (!meta) return entry;

    if (meta.isSymlink) {
      return { ...entry, kind: "symlink", navigable: meta.isDir };
    }

    if (meta.isDir) {
      return { ...entry, kind: "directory", navigable: true };
    }

    if (entry.kind === "directory") {
      return { ...entry, kind: classifyLsEntryKindFromName(entry.name) };
    }

    return entry;
  });

  return { ...listing, entries };
}
