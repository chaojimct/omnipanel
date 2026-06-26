import { memo, useCallback } from "react";
import type { LsEntry, LsListing } from "./parseLsListing";
import { joinListingEntryPath } from "./resolveLsListingDirectory";
import { terminalCdCommand } from "../terminalPathCrumbs";

type LsListingViewProps = {
  listing: LsListing;
  listingDirectory: string;
  onRunCommand?: (command: string) => void;
};
const KIND_CLASS: Record<LsEntry["kind"], string> = {
  directory: "term-ls-entry--dir",
  symlink: "term-ls-entry--link",
  executable: "term-ls-entry--exec",
  archive: "term-ls-entry--archive",
  image: "term-ls-entry--image",
  media: "term-ls-entry--media",
  code: "term-ls-entry--code",
  config: "term-ls-entry--config",
  file: "term-ls-entry--file",
};

function isLsEntryNavigable(entry: LsEntry): boolean {
  return entry.navigable ?? entry.kind === "directory";
}

function LsEntryChip({
  entry,
  listingDirectory,
  onRunCommand,
}: {
  entry: LsEntry;
  listingDirectory: string;
  onRunCommand?: (command: string) => void;
}) {
  const navigable = isLsEntryNavigable(entry);
  const className = `term-ls-entry ${KIND_CLASS[entry.kind]}${navigable ? " term-ls-entry--clickable" : ""}`;
  const displayName = entry.kind === "directory" ? `${entry.name}/` : entry.name;
  const absolutePath = joinListingEntryPath(listingDirectory, entry.name);
  const cdCommand = terminalCdCommand(absolutePath);

  const handleClick = useCallback(() => {
    if (!navigable || !onRunCommand) return;
    onRunCommand(cdCommand);
  }, [navigable, onRunCommand, cdCommand]);

  if (navigable) {
    return (
      <button
        type="button"
        className={className}
        title={cdCommand}
        onClick={handleClick}
      >
        {displayName}
      </button>
    );
  }
  return (
    <span className={className} title={entry.name}>
      {displayName}
    </span>
  );
}

function LsListingViewInner({ listing, listingDirectory, onRunCommand }: LsListingViewProps) {
  return (
    <div
      className={`term-ls-listing term-ls-listing--${listing.layout}`}
      role="list"
      aria-label="目录列表"
    >
      {listing.entries.map((entry) => (
        <LsEntryChip
          key={entry.name}
          entry={entry}
          listingDirectory={listingDirectory}
          onRunCommand={onRunCommand}
        />
      ))}
    </div>
  );
}
export const LsListingView = memo(LsListingViewInner);
