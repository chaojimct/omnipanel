import { nativeConfirm, type NativeDialogOptions } from "./nativeDialog";

export type AppConfirmOptions = Pick<NativeDialogOptions, "okLabel" | "cancelLabel" | "kind"> & {
  confirmLabel?: string;
};

/** 系统原生确认框 */
export function appConfirm(
  message: string,
  title = "OmniPanel",
  options?: AppConfirmOptions,
): Promise<boolean> {
  return nativeConfirm(message, {
    title,
    kind: options?.kind ?? "warning",
    okLabel: options?.confirmLabel ?? options?.okLabel,
    cancelLabel: options?.cancelLabel,
  });
}
