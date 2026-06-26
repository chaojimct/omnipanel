import { describe, expect, it } from "vitest";
import { tryParseLsListing } from "./parseLsListing";

describe("tryParseLsListing", () => {
  it("解析 plain ls 多列输出", () => {
    const output = "docker  demo.py  a.sh  anaconda3  README.zip";
    const result = tryParseLsListing("ls", output);
    expect(result).not.toBeNull();
    expect(result!.layout).toBe("grid");
    const byName = Object.fromEntries(result!.entries.map((e) => [e.name, e.kind]));
    expect(byName.docker).toBe("directory");
    expect(byName.anaconda3).toBe("directory");
    expect(byName["demo.py"]).toBe("code");
    expect(byName["a.sh"]).toBe("executable");
    expect(byName["README.zip"]).toBe("archive");
  });

  it("解析 ls -l 长格式", () => {
    const output = [
      "total 8",
      "drwxr-xr-x 2 root root 4096 Jan  1 12:00 projects",
      "-rwxr-xr-x 1 root root  128 Jan  1 12:00 run.sh",
      "lrwxrwxrwx 1 root root   10 Jan  1 12:00 link -> target",
    ].join("\n");
    const result = tryParseLsListing("ls -l", output);
    expect(result?.layout).toBe("long");
    const kinds = Object.fromEntries(result!.entries.map((e) => [e.name, e.kind]));
    expect(kinds.projects).toBe("directory");
    expect(kinds["run.sh"]).toBe("executable");
    expect(kinds.link).toBe("symlink");
    expect(result!.entries.find((e) => e.name === "link")?.navigable).toBe(true);
    expect(result!.entries.find((e) => e.name === "projects")?.navigable).toBe(true);
  });
});
