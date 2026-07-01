import { nativeAlert, type NativeDialogOptions } from "./nativeDialog";

/** 系统原生提示框 */
export function appAlert(
  message: string,
  title = "OmniPanel",
  options?: Pick<NativeDialogOptions, "kind">,
): Promise<void> {
  return nativeAlert(message, {
    title,
    kind: options?.kind ?? "info",
  });
}
