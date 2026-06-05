import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ServerConnectionGroup {
  id: string;
  name: string;
  builtin?: boolean;
}

export const BUILTIN_SERVER_GROUPS: ServerConnectionGroup[] = [
  { id: "default", name: "默认", builtin: true },
  { id: "test", name: "测试", builtin: true },
  { id: "production", name: "生产", builtin: true },
];

interface ServerGroupState {
  groups: ServerConnectionGroup[];
  activeGroupId: string;
  addGroup: (name: string) => { ok: true; group: ServerConnectionGroup } | { ok: false; reason: "empty" | "duplicate" };
  setActiveGroupId: (id: string) => void;
  getGroupById: (id: string) => ServerConnectionGroup | undefined;
  getGroupName: (id: string) => string;
}

export const useServerGroupStore = create<ServerGroupState>()(
  persist(
    (set, get) => ({
      groups: BUILTIN_SERVER_GROUPS,
      activeGroupId: "default",
      addGroup: (name) => {
        const trimmed = name.trim();
        if (!trimmed) {
          return { ok: false, reason: "empty" };
        }
        if (get().groups.some((group) => group.name === trimmed)) {
          return { ok: false, reason: "duplicate" };
        }
        const group: ServerConnectionGroup = {
          id: `server-group-${Date.now()}`,
          name: trimmed,
        };
        set((state) => ({
          groups: [...state.groups, group],
          activeGroupId: group.id,
        }));
        return { ok: true, group };
      },
      setActiveGroupId: (id) => {
        if (get().groups.some((group) => group.id === id)) {
          set({ activeGroupId: id });
        }
      },
      getGroupById: (id) => get().groups.find((group) => group.id === id),
      getGroupName: (id) => get().getGroupById(id)?.name ?? BUILTIN_SERVER_GROUPS[0].name,
    }),
    {
      name: "omnipanel-server-groups",
      partialize: (state) => ({
        groups: state.groups,
        activeGroupId: state.activeGroupId,
      }),
    },
  ),
);
