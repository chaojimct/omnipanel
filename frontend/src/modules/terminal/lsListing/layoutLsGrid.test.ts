import { describe, expect, it } from "vitest";
import { layoutLsGrid, lsEntryDisplayName } from "./layoutLsGrid";
import type { LsEntry } from "./parseLsListing";

function entry(name: string, kind: LsEntry["kind"] = "file"): LsEntry {
  return { name, kind };
}

describe("layoutLsGrid", () => {
  it("纵列填充且每列宽度独立", () => {
    const entries = [
      entry("1panel-v2.1.13-linux-amd64", "directory"),
      entry("AgentService.tar", "archive"),
      entry("logs", "directory"),
      entry("go", "directory"),
    ];

    const layout = layoutLsGrid(entries, 80, 2);
    expect(layout.columns.length).toBeGreaterThan(1);

    const names = layout.columns.flatMap((col) => col.entries.map((e) => e.name));
    expect(names).toEqual(entries.map((e) => e.name));

    for (const col of layout.columns) {
      const maxInCol = Math.max(...col.entries.map((e) => lsEntryDisplayName(e).length), 1);
      expect(col.width).toBe(maxInCol);
    }
  });

  it("宽终端可容纳更多列（非全局最长名限制列数）", () => {
    const entries = [
      entry("NVIDIA-Linux-x86_64-530.95.05.run"),
      entry("test", "directory"),
      entry("go", "directory"),
      entry("logs", "directory"),
      entry("a.sh", "executable"),
      entry("b.sh", "executable"),
    ];

    const narrow = layoutLsGrid(entries, 50, 2);
    const wide = layoutLsGrid(entries, 200, 2);
    expect(wide.columns.length).toBeGreaterThan(narrow.columns.length);
  });
});
