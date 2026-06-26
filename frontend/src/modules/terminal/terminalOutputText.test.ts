import { describe, expect, it } from "vitest";
import { extractCommandOutput, stripTerminalControlSequences } from "./terminalOutputText";

describe("terminalOutputText", () => {
  it("strips command echo and a normal trailing shell prompt", () => {
    const raw = "pwd\r\n/root\r\n[root@iZ2zeegvvzs5ggqihlcawl3cc4Z ~]# ";

    expect(extractCommandOutput(raw, "pwd")).toBe("/root");
  });

  it("strips a trailing shell prompt wrapped by a too-narrow PTY", () => {
    const raw = [
      "pwd",
      "/root",
      "[ro",
      "ot@",
      "iZ2",
      "zee",
      "gvv",
      "zs5",
      "ggq",
      "ihl",
      "caw",
      "l3c",
      "c4Z",
      "~]",
      "# ",
    ].join("\r\n");

    expect(extractCommandOutput(raw, "pwd")).toBe("/root");
  });

  it("does not turn standalone carriage returns into extra lines", () => {
    expect(stripTerminalControlSequences("download 10%\rdownload 20%\r\nok")).toBe(
      "download 10%download 20%\nok",
    );
  });
});
