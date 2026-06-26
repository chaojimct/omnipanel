import { describe, expect, it } from "vitest";
import {
  isReadOnlyTerminalCommand,
  shouldRequireTerminalApproval,
} from "./terminalApprovalPolicy";

describe("terminalApprovalPolicy", () => {
  it("查看类命令在 view 模式免审批", () => {
    expect(shouldRequireTerminalApproval("ls -la", "view")).toBe(false);
    expect(shouldRequireTerminalApproval("cd /tmp", "view")).toBe(false);
    expect(shouldRequireTerminalApproval("df -h", "view")).toBe(false);
    expect(shouldRequireTerminalApproval("date", "view")).toBe(false);
    expect(shouldRequireTerminalApproval("git status", "view")).toBe(false);
  });

  it("修改类命令在 view 模式需审批", () => {
    expect(shouldRequireTerminalApproval("rm file.txt", "view")).toBe(true);
    expect(shouldRequireTerminalApproval("touch a.txt", "view")).toBe(true);
    expect(shouldRequireTerminalApproval("npm install foo", "view")).toBe(true);
  });

  it("严格模式全部需审批", () => {
    expect(shouldRequireTerminalApproval("ls", "strict")).toBe(true);
  });

  it("宽松模式全部免审批", () => {
    expect(shouldRequireTerminalApproval("rm -rf /tmp/x", "loose")).toBe(false);
  });

  it("重定向写入不算只读", () => {
    expect(isReadOnlyTerminalCommand("echo hi > out.txt")).toBe(false);
  });
});
