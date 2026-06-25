export type CompletionSource =
  | "history"
  | "command"
  | "path"
  | "resource"
  | "template"
  | "ai";

export type CompletionPriority = "high" | "default" | "low";

export interface ReplacementRange {
  start: number;
  end: number;
}

export interface CompletionCandidate {
  id: string;
  label: string;
  insertText: string;
  description?: string;
  source: CompletionSource;
  priority: CompletionPriority;
  replacement: ReplacementRange;
}

export interface TerminalCompletionContext {
  sessionId: string;
  cwd: string;
  input: string;
  cursor: number;
  resourceId: string | null;
  sessionType: "local" | "remote";
}

export interface CompletionProvider {
  id: string;
  suggest: (ctx: TerminalCompletionContext) => CompletionCandidate[] | Promise<CompletionCandidate[]>;
}

export interface ParsedCommandToken {
  text: string;
  start: number;
  end: number;
  kind: "command" | "argument" | "path" | "resource" | "flag";
}

export interface ParsedCommandLine {
  tokens: ParsedCommandToken[];
  activeToken: ParsedCommandToken | null;
}
