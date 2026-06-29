import { describe, expect, it } from "vitest";
import {
  computeLongFieldWidths,
  detectLongFieldFormat,
  padLongField,
} from "./formatLongFields";
import { tryParseLsListing } from "./parseLsListing";

describe("formatLongFields", () => {
  it("unix ll 各字段独立列宽", () => {
    const output = [
      "-rwxr-xr-x 1 root root 78676152 May 23 12:00 agent",
      "-rwxr-xr-x 1 root root      449 May 23 12:00 ctl",
      "-rw-r--r-- 1 root root 224418677 Dec 3 2025 pig-upms-biz.jar",
    ].join("\n");
    const listing = tryParseLsListing("ll", output)!;
    const format = detectLongFieldFormat(listing.entries);
    const widths = computeLongFieldWidths(listing.entries, format);

    expect(format).toBe("unix");
    expect(widths[4]).toBe("224418677".length);

    const small = listing.entries[1]!;
    const paddedSize = padLongField(small.longFields![4]!, 4, widths[4]!, format);
    expect(paddedSize).toBe("      449");
    expect(paddedSize.length).toBe(widths[4]!);
  });

  it("ll -h 可读大小列仍右对齐", () => {
    const output = [
      "-rw-r--r-- 1 1001 1001 4.4K May 23 12:00 a.init",
      "-rw-r--r-- 1 1001 1001  819 May 23 12:00 b.init",
    ].join("\n");
    const listing = tryParseLsListing("ll -h", output)!;
    const format = detectLongFieldFormat(listing.entries);
    const widths = computeLongFieldWidths(listing.entries, format);

    const a = padLongField(listing.entries[0]!.longFields![4]!, 4, widths[4]!, format);
    const b = padLongField(listing.entries[1]!.longFields![4]!, 4, widths[4]!, format);
    expect(a.length).toBe(b.length);
    expect(a.endsWith("4.4K")).toBe(true);
    expect(b.endsWith("819")).toBe(true);
  });
});
