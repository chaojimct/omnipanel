import { useEffect, useState, type ComponentType } from "react";
import { invoke } from "@tauri-apps/api/core";
import { SplashScreen } from "./components/shell/SplashScreen";
import { initSettings, useSettingsStore } from "./stores/settingsStore";
import { initConnections } from "./stores/connectionStore";
import { initActionListener } from "./stores/actionStore";

const MIN_SPLASH_MS = 1400;
const EXIT_ANIM_MS = 520;

type BootPhase = "splash" | "exit" | "app";

function removeHtmlBootSplash() {
  document.getElementById("boot-splash")?.remove();
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function Bootstrap() {
  const [phase, setPhase] = useState<BootPhase>("splash");
  const [AppComponent, setAppComponent] = useState<ComponentType | null>(null);
  const [bootStep, setBootStep] = useState(0);

  useEffect(() => {
    removeHtmlBootSplash();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      const started = Date.now();

      const advance = (step: number) => {
        if (!cancelled) setBootStep(step);
      };

      advance(1);
      initSettings();

      // Sync persisted proxy config to backend
      const proxy = useSettingsStore.getState().proxy;
      if (proxy.enabled) {
        invoke("set_proxy_config", { config: proxy }).catch(() => {});
      }

      advance(2);
      initConnections();
      initActionListener();

      advance(3);
      await import("./lib/monacoSetup");
      await import("@xterm/xterm/css/xterm.css");

      advance(4);
      const { default: App } = await import("./App");

      const remain = MIN_SPLASH_MS - (Date.now() - started);
      if (remain > 0) await wait(remain);

      if (cancelled) return;

      setAppComponent(() => App);
      setPhase("exit");
      await wait(EXIT_ANIM_MS);

      if (!cancelled) setPhase("app");
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, []);

  if (phase === "app" && AppComponent) {
    return <AppComponent />;
  }

  return (
    <SplashScreen
      exiting={phase === "exit"}
      step={bootStep}
      totalSteps={4}
    />
  );
}
