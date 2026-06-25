import type { ParsedCommandLine, ParsedCommandToken } from "./types";

function classifyToken(text: string, index: number): ParsedCommandToken["kind"] {
  if (index === 0) return "command";
  if (text.startsWith("@")) return "resource";
  if (text.startsWith("-")) return "flag";
  if (text.includes("/") || text.startsWith(".") || text.startsWith("~")) return "path";
  return "argument";
}

/** 轻量命令行解析：按空白拆分并定位光标所在 token */
export function parseCommandLineForCompletion(input: string, cursor: number): ParsedCommandLine {
  const tokens: ParsedCommandToken[] = [];
  const regex = /\S+/g;
  let match: RegExpExecArray | null = regex.exec(input);

  while (match) {
    const text = match[0];
    const start = match.index;
    const end = start + text.length;
    tokens.push({
      text,
      start,
      end,
      kind: classifyToken(text, tokens.length),
    });
    match = regex.exec(input);
  }

  let activeToken: ParsedCommandToken | null = null;
  for (const token of tokens) {
    if (cursor >= token.start && cursor <= token.end) {
      activeToken = token;
      break;
    }
  }

  if (!activeToken && tokens.length > 0 && cursor > tokens[tokens.length - 1].end) {
    const last = tokens[tokens.length - 1];
    activeToken = {
      text: "",
      start: cursor,
      end: cursor,
      kind: "argument",
    };
    if (input.slice(last.end, cursor).trim() === "" && cursor === input.length) {
      activeToken = {
        text: "",
        start: cursor,
        end: cursor,
        kind: tokens.length === 0 ? "command" : "argument",
      };
    }
  }

  if (!activeToken && tokens.length === 0) {
    activeToken = {
      text: input.slice(0, cursor),
      start: 0,
      end: cursor,
      kind: "command",
    };
  }

  if (activeToken && activeToken.text === "" && activeToken.start === activeToken.end) {
    const prefix = input.slice(0, cursor);
    const lastSpace = prefix.lastIndexOf(" ");
    const start = lastSpace === -1 ? 0 : lastSpace + 1;
    activeToken = {
      text: prefix.slice(start),
      start,
      end: cursor,
      kind: tokens.length === 0 ? "command" : classifyToken(prefix.slice(start), tokens.length),
    };
  }

  return { tokens, activeToken };
}

export function buildReplacementRange(token: ParsedCommandToken | null, cursor: number): { start: number; end: number } {
  if (!token) return { start: cursor, end: cursor };
  return { start: token.start, end: Math.max(token.end, cursor) };
}
