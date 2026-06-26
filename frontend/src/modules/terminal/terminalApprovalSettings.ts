import {
  DEFAULT_TERMINAL_APPROVAL_MODE,
  type TerminalApprovalMode,
} from "./terminalApprovalPolicy";
import { useSettingsStore } from "../../stores/settingsStore";

export function resolveTerminalApprovalMode(_sessionId?: string): TerminalApprovalMode {
  return useSettingsStore.getState().terminalApprovalMode ?? DEFAULT_TERMINAL_APPROVAL_MODE;
}

export function useTerminalApprovalMode(): TerminalApprovalMode {
  return useSettingsStore((s) => s.terminalApprovalMode ?? DEFAULT_TERMINAL_APPROVAL_MODE);
}
