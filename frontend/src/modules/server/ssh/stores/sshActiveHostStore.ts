import { create } from "zustand";
import { persist } from "zustand/middleware";

const LEGACY_STORAGE_KEY = "omnipanel.ssh.activeHostId";
const STORE_KEY = "omnipanel.ssh.activeHostId.v2";

function readLegacyHostId(): string | null {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw || raw.startsWith("{")) return null;
    return raw;
  } catch {
    return null;
  }
}

type State = {
  activeHostId: string | null;
  setActiveHostId: (id: string | null) => void;
};

/** SSH 侧栏与右侧详情共用的当前主机（跨 Dock panel / Context 边界同步）。 */
export const useSshActiveHostStore = create<State>()(
  persist(
    (set) => ({
      activeHostId: readLegacyHostId(),
      setActiveHostId: (activeHostId) => set({ activeHostId }),
    }),
    {
      name: STORE_KEY,
      partialize: (state) => ({ activeHostId: state.activeHostId }),
    },
  ),
);
