import { useEffect, useRef } from "react";
import { mountModuleContextProvider, updateRegisteredProviderContext } from "../../../lib/ai/context";
import {
  terminalModuleContextProvider,
  TerminalModuleContextProvider,
} from "./TerminalModuleContextProvider";
import type { TerminalModuleContext } from "./types";
import { isTerminalModuleContextEmpty } from "./types";

export interface TerminalModuleContextBridgeProps {
  active: boolean;
  context: TerminalModuleContext;
}

export function TerminalModuleContextBridge({ active, context }: TerminalModuleContextBridgeProps) {
  const providerRef = useRef<TerminalModuleContextProvider>(terminalModuleContextProvider);

  useEffect(() => mountModuleContextProvider(providerRef.current), []);

  useEffect(() => {
    if (!active || isTerminalModuleContextEmpty(context)) {
      updateRegisteredProviderContext(providerRef.current, null);
      return;
    }
    updateRegisteredProviderContext(providerRef.current, context);
  }, [active, context]);

  return null;
}
