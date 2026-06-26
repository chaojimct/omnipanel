import { useCallback, useRef } from "react";
import { listSessionCommandHistoryFast } from "./useSessionCommandHistory";

type BrowseState = {
  index: number;
  draft: string;
};

export function useCommandHistoryBrowse(
  sessionId: string,
  value: string,
  setValue: (next: string) => void,
  setCursor: (next: number) => void,
) {
  const browseRef = useRef<BrowseState>({ index: -1, draft: "" });
  const programmaticRef = useRef(false);

  const resetBrowse = useCallback(() => {
    browseRef.current = { index: -1, draft: "" };
  }, []);

  const applyCommand = useCallback(
    (command: string) => {
      programmaticRef.current = true;
      setValue(command);
      setCursor(command.length);
    },
    [setCursor, setValue],
  );

  const browseOlder = useCallback(() => {
    const history = listSessionCommandHistoryFast(sessionId);
    if (history.length === 0) return false;

    const state = browseRef.current;
    if (state.index === -1) {
      state.draft = value;
      state.index = 0;
    } else if (state.index < history.length - 1) {
      state.index += 1;
    } else {
      return true;
    }

    applyCommand(history[state.index]!);
    return true;
  }, [applyCommand, sessionId, value]);

  const browseNewer = useCallback(() => {
    const state = browseRef.current;
    if (state.index === -1) return false;

    const history = listSessionCommandHistoryFast(sessionId);
    if (state.index === 0) {
      const draft = state.draft;
      resetBrowse();
      applyCommand(draft);
      return true;
    }

    state.index -= 1;
    applyCommand(history[state.index]!);
    return true;
  }, [applyCommand, resetBrowse, sessionId]);

  const onManualEdit = useCallback(() => {
    if (browseRef.current.index !== -1) {
      resetBrowse();
    }
  }, [resetBrowse]);

  return {
    resetBrowse,
    browseOlder,
    browseNewer,
    onManualEdit,
    applyCommand,
    isProgrammaticEdit: () => programmaticRef.current,
    clearProgrammaticEdit: () => {
      programmaticRef.current = false;
    },
  };
}
