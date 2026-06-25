import { create } from "zustand";

import type { TerminalInputMode } from "../../hooks/useTerminal";

import { clearAutoReturnTracking, armAutoReturn } from "./terminalAutoReturn";



interface SetInputModeOptions {

  /** 交互程序结束后自动回到 Command Bar */

  autoReturn?: boolean;

}



interface TerminalUiState {

  inputModes: Record<string, TerminalInputMode>;

  autoReturnToCommandBar: Record<string, boolean>;

  setInputMode: (

    sessionId: string,

    mode: TerminalInputMode,

    options?: SetInputModeOptions,

  ) => void;

  getInputMode: (sessionId: string) => TerminalInputMode;

  shouldAutoReturnToCommandBar: (sessionId: string) => boolean;

  returnToCommandBar: (sessionId: string) => void;

}



export const useTerminalUiStore = create<TerminalUiState>((set, get) => ({

  inputModes: {},

  autoReturnToCommandBar: {},



  setInputMode: (sessionId, mode, options) => {
    if (mode === "external") {
      clearAutoReturnTracking(sessionId);
    } else if (options?.autoReturn) {
      armAutoReturn(sessionId);
    }
    set((state) => {

      const autoReturnToCommandBar = { ...state.autoReturnToCommandBar };

      if (mode === "external") {

        delete autoReturnToCommandBar[sessionId];

      } else if (options?.autoReturn) {

        autoReturnToCommandBar[sessionId] = true;

      } else if (mode === "interactive") {

        delete autoReturnToCommandBar[sessionId];

      }

      return {

        inputModes: { ...state.inputModes, [sessionId]: mode },

        autoReturnToCommandBar,

      };

    });

  },



  getInputMode: (sessionId) => get().inputModes[sessionId] ?? "external",



  shouldAutoReturnToCommandBar: (sessionId) =>

    get().autoReturnToCommandBar[sessionId] === true,



  returnToCommandBar: (sessionId) => {

    clearAutoReturnTracking(sessionId);

    set((state) => {

      const autoReturnToCommandBar = { ...state.autoReturnToCommandBar };

      delete autoReturnToCommandBar[sessionId];

      return {

        inputModes: { ...state.inputModes, [sessionId]: "external" },

        autoReturnToCommandBar,

      };

    });

  },

}));

