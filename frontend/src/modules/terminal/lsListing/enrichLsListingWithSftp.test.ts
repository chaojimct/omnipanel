import { describe, expect, it } from "vitest";
import { enrichLsListingWithSftp } from "./enrichLsListingWithSftp";
import type { LsListing } from "./parseLsListing";
import { resolveLsListingDirectory, joinListingEntryPath } from "./resolveLsListingDirectory";

describe("resolveLsListingDirectory", () => {
  it("ll 使用 block cwd", () => {
    expect(resolveLsListingDirectory("ll", "/root/projects", "root")).toBe("/root/projects");
  });

  it("dir 在 C: 盘使用 block cwd", () => {
    expect(resolveLsListingDirectory("dir", "C:", null)).toBe("C:\\");
    expect(resolveLsListingDirectory("ls", "C:\\", null)).toBe("C:\\");
  });

  it("无参数时使用 block cwd", () => {
    expect(resolveLsListingDirectory("ls", "/root/projects", "root")).toBe("/root/projects");
  });

  it("解析相对子目录", () => {
    expect(resolveLsListingDirectory("ls docker", "/root", "root")).toBe("/root/docker");
  });

  it("显式文件参数时列出父目录", () => {
    expect(resolveLsListingDirectory("ls Makefile", "/root", "root")).toBe("/root");
  });

  it("C: 盘根路径拼接", () => {
    expect(joinListingEntryPath("C:", "Windows")).toBe("C:\\Windows");
    expect(joinListingEntryPath("C:\\", "Windows")).toBe("C:\\Windows");
  });

  it("Windows cwd 下拼接路径", () => {
    expect(joinListingEntryPath("C:\\Users\\chaoj", ".cursor")).toBe("C:\\Users\\chaoj\\.cursor");
  });

  it("拼接列表条目绝对路径", () => {
    expect(joinListingEntryPath("/", "sbin.usr-is-merged")).toBe("/sbin.usr-is-merged");
    expect(joinListingEntryPath("/tmp", "foo")).toBe("/tmp/foo");
  });
});

describe("enrichLsListingWithSftp", () => {
  const baseListing: LsListing = {
    layout: "grid",
    entries: [
      { name: "docker", kind: "directory" },
      { name: "Makefile", kind: "directory" },
      { name: "demo.py", kind: "code" },
    ],
  };

  it("用 SFTP isDir 修正无扩展名条目", () => {
    const enriched = enrichLsListingWithSftp(baseListing, [
      { name: "docker", isDir: false, isSymlink: false, linkTarget: null, size: 42 },
      { name: "Makefile", isDir: false, isSymlink: false, linkTarget: null, size: 128 },
      { name: "demo.py", isDir: false, isSymlink: false, linkTarget: null, size: 256 },
    ]);

    const kinds = Object.fromEntries(enriched.entries.map((entry) => [entry.name, entry.kind]));
    expect(kinds.docker).toBe("file");
    expect(kinds.Makefile).toBe("file");
    expect(kinds["demo.py"]).toBe("code");
  });

  it("确认目录型符号链接可点击", () => {
    const enriched = enrichLsListingWithSftp(
      {
        layout: "grid",
        entries: [{ name: "lib", kind: "file" }],
      },
      [{ name: "lib", isDir: true, isSymlink: true, linkTarget: "usr/lib", size: 7 }],
    );

    expect(enriched.entries[0]?.kind).toBe("symlink");
    expect(enriched.entries[0]?.navigable).toBe(true);
  });

  it("长格式列表不做修正", () => {
    const longListing: LsListing = {
      layout: "long",
      entries: [{ name: "projects", kind: "directory" }],
    };
    const enriched = enrichLsListingWithSftp(longListing, [
      { name: "projects", isDir: false, isSymlink: false, linkTarget: null, size: 1 },
    ]);
    expect(enriched).toBe(longListing);
  });
});
