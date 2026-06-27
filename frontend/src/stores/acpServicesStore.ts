import { create } from "zustand";

import { persist, createJSONStorage } from "zustand/middleware";



import {

  firstModelSelectionId,

  resolveModelSelection,

  useAiModelsStore,

} from "./aiModelsStore";

import { useSettingsStore } from "./settingsStore";



/** 内置 OmniPanel Agent（/agent）固定 ID，不可删除。 */

export const OMNIPANEL_BUILTIN_ACP_SERVICE_ID = "omnipanel-builtin-agent";



export interface AcpService {

  id: string;

  name: string;

  executablePath: string;

  /** aiModelsStore 中的 providerId::modelName */

  modelSelectionId: string | null;

  isActive: boolean;

  /** 系统内置 Agent，executablePath 为空时使用 Rust 侧默认命令。 */

  builtin?: boolean;

  createdAt: number;

}



interface AcpServicesState {

  services: AcpService[];

  addService: (

    input: Omit<AcpService, "id" | "createdAt" | "isActive" | "builtin"> & {

      isActive?: boolean;

      builtin?: boolean;

    },

  ) => AcpService;

  removeService: (id: string) => void;

  updateService: (

    id: string,

    patch: Partial<Omit<AcpService, "id" | "createdAt">>,

  ) => void;

  setActive: (id: string) => void;

  resetServices: () => void;

}



let idCounter = 0;



function genId(): string {

  return `acp_${Date.now()}_${++idCounter}`;

}



function normalizeName(name: string): string {

  return name.trim();

}



function normalizePath(path: string): string {

  return path.trim();

}



function normalizeLoaded(s: AcpService): AcpService {

  const isBuiltin = s.id === OMNIPANEL_BUILTIN_ACP_SERVICE_ID || Boolean(s.builtin);

  return {

    id: s.id,

    name: normalizeName(s.name ?? ""),

    executablePath: isBuiltin ? "" : normalizePath(s.executablePath ?? ""),

    modelSelectionId:

      typeof s.modelSelectionId === "string" && s.modelSelectionId.trim()

        ? s.modelSelectionId.trim()

        : null,

    isActive: Boolean(s.isActive),

    builtin: isBuiltin,

    createdAt: typeof s.createdAt === "number" ? s.createdAt : Date.now(),

  };

}



function enforceSingleActive(services: AcpService[], preferredId?: string): AcpService[] {

  const activeCount = services.filter((s) => s.isActive).length;

  if (activeCount <= 1) return services;

  if (preferredId) {

    return services.map((s) => ({ ...s, isActive: s.id === preferredId }));

  }

  const sortedActive = services

    .filter((s) => s.isActive)

    .slice()

    .sort((a, b) => a.createdAt - b.createdAt);

  const keepId = sortedActive[0]?.id;

  return services.map((s) => ({ ...s, isActive: s.id === keepId }));

}



function createBuiltinService(modelSelectionId: string | null, isActive: boolean): AcpService {

  return {

    id: OMNIPANEL_BUILTIN_ACP_SERVICE_ID,

    name: "OmniPanel Agent",

    executablePath: "",

    modelSelectionId,

    isActive,

    builtin: true,

    createdAt: 0,

  };

}



/** 解析 Agent 应使用的模型：服务配置 → AI 助手场景 → 首个可用模型。 */

export function resolveAcpModelSelectionId(active: AcpService | null): string | null {

  const providers = useAiModelsStore.getState().providers;

  const fromService = active?.modelSelectionId?.trim();

  if (fromService && resolveModelSelection(providers, fromService)) {

    return fromService;

  }



  const assistantId = useSettingsStore.getState().aiScenarioAssistantModelSelectionId;

  if (assistantId && resolveModelSelection(providers, assistantId)) {

    return assistantId;

  }



  return firstModelSelectionId(providers);

}



export function isBuiltinAcpService(service: AcpService): boolean {

  return service.id === OMNIPANEL_BUILTIN_ACP_SERVICE_ID || Boolean(service.builtin);

}



export const useAcpServicesStore = create<AcpServicesState>()(

  persist(

    (set, get) => ({

      services: [],

      addService: (input) => {

        const isActive = Boolean(input.isActive);

        const created: AcpService = {

          id: genId(),

          name: normalizeName(input.name),

          executablePath: normalizePath(input.executablePath),

          modelSelectionId: input.modelSelectionId ?? null,

          isActive,

          builtin: Boolean(input.builtin),

          createdAt: Date.now(),

        };

        const merged = enforceSingleActive([...get().services, created], created.id);

        set({ services: merged });

        return merged.find((s) => s.id === created.id) ?? created;

      },

      removeService: (id) => {

        if (id === OMNIPANEL_BUILTIN_ACP_SERVICE_ID) return;

        const next = get().services.filter((s) => s.id !== id);

        const enforced = next.some((s) => s.isActive)

          ? next

          : next.map((s) =>

              s.id === OMNIPANEL_BUILTIN_ACP_SERVICE_ID ? { ...s, isActive: true } : s,

            );

        set({ services: enforceSingleActive(enforced) });

      },

      updateService: (id, patch) => {

        const next = get().services.map((s) => {

          if (s.id !== id) return s;

          const isBuiltin = isBuiltinAcpService(s);

          return {

            ...s,

            ...patch,

            ...(patch.name !== undefined ? { name: normalizeName(patch.name) } : {}),

            ...(patch.executablePath !== undefined && !isBuiltin

              ? { executablePath: normalizePath(patch.executablePath) }

              : {}),

            ...(patch.modelSelectionId !== undefined

              ? {

                  modelSelectionId:

                    patch.modelSelectionId && patch.modelSelectionId.trim()

                      ? patch.modelSelectionId.trim()

                      : null,

                }

              : {}),

            ...(isBuiltin ? { executablePath: "", builtin: true } : {}),

          };

        });

        const enforced = enforceSingleActive(next, id);

        set({ services: enforced });

      },

      setActive: (id) => {

        const target = get().services.find((s) => s.id === id);

        if (!target) return;

        const next = get().services.map((s) => ({ ...s, isActive: s.id === id }));

        set({ services: next });

      },

      resetServices: () => {

        set({ services: [] });

      },

    }),

    {

      name: "omnipanel-acp-services",

      storage: createJSONStorage(() => localStorage),

      merge: (persisted, current) => {

        const raw = persisted as { services?: unknown[] } | undefined;

        if (!raw?.services) return current;

        return {

          ...current,

          services: raw.services.map((service) => normalizeLoaded(service as AcpService)),

        };

      },

    },

  ),

);



/** 确保内置 OmniPanel Agent 存在且为默认激活项（首次启动或无激活服务时）。 */

export function initAcpServicesStore(): void {

  const defaultModelId = resolveAcpModelSelectionId(null);

  let services = useAcpServicesStore.getState().services.map(normalizeLoaded);



  const builtinIndex = services.findIndex((s) => s.id === OMNIPANEL_BUILTIN_ACP_SERVICE_ID);

  if (builtinIndex === -1) {

    const hasActive = services.some((s) => s.isActive);

    services = [

      createBuiltinService(defaultModelId, !hasActive || services.length === 0),

      ...services,

    ];

  } else {

    services = services.map((s) => {

      if (s.id !== OMNIPANEL_BUILTIN_ACP_SERVICE_ID) return s;

      return {

        ...createBuiltinService(s.modelSelectionId ?? defaultModelId, s.isActive),

        modelSelectionId: s.modelSelectionId ?? defaultModelId,

        isActive: s.isActive,

      };

    });

  }



  if (!services.some((s) => s.isActive)) {

    services = services.map((s) => ({

      ...s,

      isActive: s.id === OMNIPANEL_BUILTIN_ACP_SERVICE_ID,

    }));

  }



  useAcpServicesStore.setState({ services: enforceSingleActive(services) });

}



export function getActiveAcpService(services: AcpService[]): AcpService | null {

  return (

    services.find((s) => s.isActive) ??

    services.find((s) => s.id === OMNIPANEL_BUILTIN_ACP_SERVICE_ID) ??

    null

  );

}

