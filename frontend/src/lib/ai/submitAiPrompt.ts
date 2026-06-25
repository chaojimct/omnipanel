export interface SubmitAiPromptOptions {
  /** 新建会话（终端 # 自然语言等场景） */
  newConversation?: boolean;
  contextChips?: { type: string; label: string }[];
}

type SubmitAiPromptHandler = (
  prompt: string,
  options?: SubmitAiPromptOptions,
) => Promise<void>;

let submitHandler: SubmitAiPromptHandler | null = null;

export function registerAiPromptSubmit(handler: SubmitAiPromptHandler): () => void {
  submitHandler = handler;
  return () => {
    if (submitHandler === handler) submitHandler = null;
  };
}

export async function submitAiPrompt(
  prompt: string,
  options?: SubmitAiPromptOptions,
): Promise<void> {
  const text = prompt.trim();
  if (!text) return;
  if (submitHandler) {
    await submitHandler(text, options);
    return;
  }
  const { useAiStore } = await import("../../stores/aiStore");
  const store = useAiStore.getState();
  let convId = options?.newConversation ? null : store.activeConversationId;
  if (!convId) convId = store.createConversation();
  if (options?.contextChips) {
    for (const chip of options.contextChips) {
      store.addContext(convId, chip);
    }
  }
  store.addMessage(convId, { role: "user", content: text });
}
