import { commands } from "../../ipc/bindings";
import { isTauriRuntime } from "../isTauriRuntime";
import { useSettingsStore } from "../../stores/settingsStore";

let lastKey = "";
let applying = false;

/** 把当前 Agent Router 设置下发到后端（仅在变更时调用，去重）。 */
async function apply(): Promise<void> {
  if (!isTauriRuntime() || applying) return;
  const s = useSettingsStore.getState();
  const key = `${s.aiGatewayEnabled}|${s.aiGatewayPort}|${s.aiGatewayApiKey}|${s.aiGatewayBindLan}`;
  if (key === lastKey) return;
  lastKey = key;
  applying = true;
  try {
    await commands.aiGatewayConfigure(
      s.aiGatewayEnabled,
      s.aiGatewayPort || 8765,
      s.aiGatewayApiKey.trim() ? s.aiGatewayApiKey.trim() : null,
      s.aiGatewayBindLan,
    );
  } catch (err) {
    console.error("[gateway] configure failed:", err);
  } finally {
    applying = false;
  }
}

/** 启动时同步一次，并订阅设置变更自动重配 Agent Router。 */
export async function syncGatewayConfig(): Promise<void> {
  await apply();
  useSettingsStore.subscribe(() => {
    void apply();
  });
}
