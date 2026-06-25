/** 剥离 ANSI/OSC 等控制序列，用于 Block 纯文本采集 */
import type { TerminalBlock } from "../../stores/blocksStore";

export function stripTerminalControlSequences(text: string): string {
  return text
    .replace(/\x1b\[[0-9;?]*[ -/]*[@-~]/g, "")
    .replace(/\x1b\][^\x07]*(?:\x07|\x1b\\)/g, "")
    .replace(/\r/g, "");
}

export function decodeTerminalBytes(bytes: Uint8Array): string {
  return stripTerminalControlSequences(new TextDecoder().decode(bytes));
}

/** Ctrl+C(130) 与 SIGPIPE(141) 不按普通失败处理 */
export function resolveBlockStatus(exitCode: number): TerminalBlockStatus {
  if (exitCode === 0 || exitCode === 130 || exitCode === 141) {
    return "completed";
  }
  return "failed";
}

export type TerminalBlockStatus = "running" | "completed" | "failed";

const PROMPT_LINE_RE = /^[^\n]*[$#>]\s*$/;
const PROMPT_WITH_CMD_RE = /^[^\n]*[$#>]\s+/;

/** 从终端原始输出中剥离命令回显与提示符，保留命令结果 */
export function extractCommandOutput(raw: string, command: string): string {
  const sent = command.trim();
  const sentNorm = sent.replace(/\s+/g, " ");
  const lines = raw
    .split("\n")
    .map((line) => line.replace(/\r/g, "").trim())
    .filter((line) => line.length > 0);

  const filtered = lines.filter((line) => {
    if (PROMPT_LINE_RE.test(line)) return false;
    const withoutPrompt = line.replace(PROMPT_WITH_CMD_RE, "").trim();
    const lineNorm = withoutPrompt.replace(/\s+/g, " ");
    if (lineNorm === sentNorm) return false;
    if (line.replace(/\s+/g, " ") === sentNorm) return false;
    return true;
  });

  return filtered.join("\n").trim();
}

export function isMeaningfulTerminalBlock(
  block: TerminalBlock,
  command: string,
): boolean {
  if (block.output.trim().length > 0) return true;
  const blockCmd = block.command
    .trim()
    .replace(/^[^#$>]*[$#>]\s*/, "")
    .replace(/\s+/g, " ");
  const sent = command.trim().replace(/\s+/g, " ");
  return blockCmd.length > 0 && (blockCmd === sent || blockCmd.includes(sent));
}

