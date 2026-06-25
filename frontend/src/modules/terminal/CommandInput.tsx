import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import { useI18n } from "../../i18n";
import { Button } from "../../components/ui/Button";

const CMD_INPUT_LINE_HEIGHT_PX = 24;
const CMD_INPUT_MAX_HEIGHT_PX = 100;

function syncCommandInputHeight(element: HTMLTextAreaElement) {
  element.style.height = "auto";
  if (!element.value) {
    element.style.height = `${CMD_INPUT_LINE_HEIGHT_PX}px`;
    return;
  }
  element.style.height = `${Math.min(element.scrollHeight, CMD_INPUT_MAX_HEIGHT_PX)}px`;
}

export type CommandInputHandle = {
  focus: () => void;
};

export const CommandInput = forwardRef<
  CommandInputHandle,
  { onSend: (cmd: string) => void; promptSymbol?: string }
>(function CommandInput({ onSend, promptSymbol = "$" }, ref) {
    const [value, setValue] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { t } = useI18n();

    useImperativeHandle(ref, () => ({
      focus: () => {
        textareaRef.current?.focus();
      },
    }));

    const submit = useCallback(() => {
      const trimmed = value.trim();
      if (!trimmed) return;
      onSend(trimmed);
      setValue("");
    }, [onSend, value]);

    useLayoutEffect(() => {
      const element = textareaRef.current;
      if (!element) return;
      syncCommandInputHeight(element);
    }, [value]);

    useEffect(() => {
      const element = textareaRef.current;
      if (!element) return;
      const root = element.closest(".term-cmd-input") ?? element;
      const observer = new ResizeObserver(() => syncCommandInputHeight(element));
      observer.observe(root);
      const onWindowResize = () => syncCommandInputHeight(element);
      window.addEventListener("resize", onWindowResize);
      return () => {
        observer.disconnect();
        window.removeEventListener("resize", onWindowResize);
      };
    }, []);

    return (
      <div className="term-cmd-input">
        <span className="term-cmd-prompt">{promptSymbol}</span>
        <textarea
          ref={textareaRef}
          className="term-cmd-textarea"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
          placeholder={t("terminal.command.placeholder")}
          rows={1}
          spellCheck={false}
        />
        <Button
          variant="primary"
          size="xs"
          className="term-cmd-send"
          onClick={submit}
          title={t("terminal.command.send")}
          type="button"
        >
          ↵
        </Button>
      </div>
    );
  },
);
