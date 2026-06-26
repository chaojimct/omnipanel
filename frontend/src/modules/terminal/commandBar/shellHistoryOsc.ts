import { normalizeHistoryCommands } from "./internalHistoryCommands";
import { useSessionShellHistoryStore } from "./sessionShellHistoryStore";
import {
  decodeShellHistoryOscPayload,
  finishSilentHistorySync,
  isSilentHistorySync,
} from "./shellHistorySync";
import { invalidateSessionHistoryIndex } from "./historyIndexCache";

const OSC_1337_RE = /\x1b\]1337;([^\x07]+)\x07/g;

const streamCarry = new Map<string, string>();
const blobParts = new Map<string, string[]>();
const pendingLines = new Map<string, string[]>();

function decodeHistoryBlob(b64: string): string {
  try {
    const binary = atob(b64);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return "";
  }
}

function flushShellHistory(sessionId: string) {
  const pending = pendingLines.get(sessionId) ?? [];
  pendingLines.delete(sessionId);
  if (pending.length > 0) {
    const commands = normalizeHistoryCommands([...pending].reverse());
    useSessionShellHistoryStore.getState().setCommands(sessionId, commands);
    invalidateSessionHistoryIndex(sessionId);
  }
  finishSilentHistorySync(sessionId);
}

function handleOscPayload(sessionId: string, payload: string) {
  if (payload.startsWith("HistoryPart=")) {
    const parts = blobParts.get(sessionId) ?? [];
    parts.push(payload.slice("HistoryPart=".length));
    blobParts.set(sessionId, parts);
    return;
  }

  if (payload === "HistoryBlobEnd") {
    const parts = blobParts.get(sessionId) ?? [];
    blobParts.delete(sessionId);
    if (parts.length > 0) {
      const decoded = decodeHistoryBlob(parts.join(""));
      const lines = decoded.split(/\r?\n/);
      const bucket = pendingLines.get(sessionId) ?? [];
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed) bucket.push(trimmed);
      }
      pendingLines.set(sessionId, bucket);
    }
    flushShellHistory(sessionId);
    return;
  }

  if (payload.startsWith("History=")) {
    const command = decodeShellHistoryOscPayload(payload.slice("History=".length));
    if (!command) return;
    const bucket = pendingLines.get(sessionId) ?? [];
    bucket.push(command);
    pendingLines.set(sessionId, bucket);
    return;
  }

  if (payload === "HistoryDone") {
    flushShellHistory(sessionId);
  }
}

function stripShellHistoryOsc(sessionId: string, text: string): string {
  let carry = streamCarry.get(sessionId) ?? "";
  const input = carry + text;
  streamCarry.set(sessionId, "");

  const lastEsc = input.lastIndexOf("\x1b");
  let processable = input;
  if (lastEsc !== -1) {
    const tail = input.slice(lastEsc);
    if (!tail.includes("\x07")) {
      streamCarry.set(sessionId, tail);
      processable = input.slice(0, lastEsc);
    }
  }

  if (!processable.includes("\x1b]1337;")) {
    return processable;
  }

  let cleaned = "";
  let lastIndex = 0;
  for (const match of processable.matchAll(OSC_1337_RE)) {
    const index = match.index ?? 0;
    cleaned += processable.slice(lastIndex, index);
    lastIndex = index + match[0].length;
    const payload = match[1] ?? "";
    if (
      payload.startsWith("History") ||
      payload === "HistoryBlobEnd" ||
      payload === "HistoryDone"
    ) {
      handleOscPayload(sessionId, payload);
    }
  }
  cleaned += processable.slice(lastIndex);
  return cleaned;
}

/** 从 PTY 原始输出解析 Shell 历史 OSC（支持分片与 Blob 批量传输） */
export function processShellHistoryOsc(sessionId: string, text: string): string {
  if (!text.includes("\x1b]1337;") && !streamCarry.has(sessionId)) {
    return text;
  }

  const cleaned = stripShellHistoryOsc(sessionId, text);
  if (isSilentHistorySync(sessionId) && cleaned.trim().length === 0) {
    return "";
  }
  return cleaned;
}

export function resetShellHistoryOsc(sessionId: string): void {
  streamCarry.delete(sessionId);
  blobParts.delete(sessionId);
  pendingLines.delete(sessionId);
}
