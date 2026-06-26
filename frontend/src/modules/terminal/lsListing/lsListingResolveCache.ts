import type { LsListing } from "./parseLsListing";

const resolvedListingCache = new Map<string, LsListing>();

export function buildLsListingResolveKey(
  sessionId: string,
  command: string,
  cwd: string,
  listing: LsListing,
): string {
  return `${sessionId}\0${command}\0${cwd}\0${listing.layout}\0${listing.entries
    .map((entry) => entry.name)
    .join("\0")}`;
}

export function readResolvedLsListing(key: string): LsListing | null {
  return resolvedListingCache.get(key) ?? null;
}

export function writeResolvedLsListing(key: string, listing: LsListing): void {
  resolvedListingCache.set(key, listing);
}
