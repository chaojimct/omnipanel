import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { UnlistenFn } from "@tauri-apps/api/event";

export interface TerminalOutputPayload {
  id: string;
  data: number[];
}

export interface TerminalExitedPayload {
  id: string;
  code: number | null;
}

const activeTerminals = new Map<string, TerminalSession>();

class TerminalSession {
  id: string;
  private unlistenOutput: UnlistenFn | null = null;
  private unlistenExit: UnlistenFn | null = null;
  private onDataCallback: ((data: Uint8Array) => void) | null = null;
  private onExitCallback: ((code: number | null) => void) | null = null;

  constructor(id: string) {
    this.id = id;
  }

  async connect(
    onData: (data: Uint8Array) => void,
    onExit: (code: number | null) => void,
  ): Promise<void> {
    this.onDataCallback = onData;
    this.onExitCallback = onExit;

    this.unlistenOutput = await listen<TerminalOutputPayload>(
      "terminal-output",
      (event) => {
        if (event.payload.id === this.id) {
          this.onDataCallback?.(new Uint8Array(event.payload.data));
        }
      },
    );

    this.unlistenExit = await listen<TerminalExitedPayload>(
      "terminal-exited",
      (event) => {
        if (event.payload.id === this.id) {
          this.onExitCallback?.(event.payload.code);
        }
      },
    );
  }

  async write(data: Uint8Array): Promise<void> {
    await invoke("write_terminal", {
      id: this.id,
      data: Array.from(data),
    });
  }

  async resize(cols: number, rows: number): Promise<void> {
    await invoke("resize_terminal", { id: this.id, cols, rows });
  }

  async close(): Promise<void> {
    this.unlistenOutput?.();
    this.unlistenExit?.();
    try {
      await invoke("close_terminal", { id: this.id });
    } catch {
      // ignore if already closed
    }
    activeTerminals.delete(this.id);
  }
}

export async function createTerminal(
  onData: (data: Uint8Array) => void,
  onExit: (code: number | null) => void,
  cols = 120,
  rows = 40,
): Promise<TerminalSession> {
  const id = await invoke<string>("create_terminal", { cols, rows });
  const session = new TerminalSession(id);
  await session.connect(onData, onExit);
  activeTerminals.set(id, session);
  return session;
}

export function getTerminal(id: string): TerminalSession | undefined {
  return activeTerminals.get(id);
}
