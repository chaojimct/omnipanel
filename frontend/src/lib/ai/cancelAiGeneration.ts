type CancelAiGenerationHandler = () => void;

let cancelHandler: CancelAiGenerationHandler | null = null;

export function registerAiGenerationCancel(handler: CancelAiGenerationHandler): () => void {
  cancelHandler = handler;
  return () => {
    if (cancelHandler === handler) cancelHandler = null;
  };
}

/** 中止当前 AI 流式生成（侧栏与终端内联共用） */
export function cancelAiGeneration(): void {
  cancelHandler?.();
}
