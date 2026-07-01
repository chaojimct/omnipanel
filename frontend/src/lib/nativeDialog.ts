import { confirm, message } from "@tauri-apps/plugin-dialog";

import { isTauriRuntime } from "./isTauriRuntime";

export interface NativeDialogOptions {
  title?: string;
  okLabel?: string;
  cancelLabel?: string;
  kind?: "info" | "warning" | "error";
}

function resolveOptions(options?: string | NativeDialogOptions): NativeDialogOptions {
  if (typeof options === "string") {
    return { title: options };
  }
  return options ?? {};
}

/** 系统原生确认框（Tauri）；浏览器开发模式回退 window.confirm */
export async function nativeConfirm(
  text: string,
  options?: string | NativeDialogOptions,
): Promise<boolean> {
  const opts = resolveOptions(options);
  const title = opts.title ?? "OmniPanel";
  if (isTauriRuntime()) {
    return confirm(text, {
      title,
      kind: opts.kind ?? "warning",
      okLabel: opts.okLabel,
      cancelLabel: opts.cancelLabel,
    });
  }
  return window.confirm(`${title}\n\n${text}`);
}

/** 系统原生提示框（Tauri）；浏览器开发模式回退 window.alert */
export async function nativeAlert(
  text: string,
  options?: string | NativeDialogOptions,
): Promise<void> {
  const opts = resolveOptions(options);
  const title = opts.title ?? "OmniPanel";
  if (isTauriRuntime()) {
    await message(text, {
      title,
      kind: opts.kind ?? "info",
    });
    return;
  }
  window.alert(`${title}\n\n${text}`);
}
