import { useRef, useCallback } from "react";
import Editor, { type OnMount, type BeforeMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { getCompletionItems } from "./lsp/sqlCompletion";
import { MOCK_SCHEMA } from "./lsp/schema";

interface SqlEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function SqlEditor({ value, onChange }: SqlEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleEditorDidMount: OnMount = (ed, monaco) => {
    editorRef.current = ed;

    monaco.languages.registerCompletionItemProvider("sql", {
      triggerCharacters: [".", " ", "(", ","],
      provideCompletionItems: (model, position) => {
        const offset = model.getOffsetAt(position);
        const text = model.getValue();
        const items = getCompletionItems(text, offset, MOCK_SCHEMA);

        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        return {
          suggestions: items.map((item) => {
            const kindMap: Record<number, monaco.languages.CompletionItemKind> = {
              0: monaco.languages.CompletionItemKind.Keyword,
              3: monaco.languages.CompletionItemKind.Function,
              5: monaco.languages.CompletionItemKind.Field,
              14: monaco.languages.CompletionItemKind.Keyword,
              22: monaco.languages.CompletionItemKind.Struct,
            };
            return {
              label: item.label,
              kind: kindMap[item.kind ?? 0] ?? monaco.languages.CompletionItemKind.Keyword,
              insertText: item.insertText ?? item.label,
              detail: item.detail,
              range,
              insertTextRules: item.snippet
                ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
                : undefined,
            };
          }),
        };
      },
    });
  };

  const handleBeforeMount: BeforeMount = (monaco) => {
    monaco.editor.defineTheme("sql-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "keyword", foreground: "7ec8e3", fontStyle: "bold" },
        { token: "string.sql", foreground: "a3d977" },
        { token: "number", foreground: "c084fc" },
        { token: "comment", foreground: "636d83", fontStyle: "italic" },
        { token: "function", foreground: "e5a86b" },
        { token: "type", foreground: "7ec8e3" },
        { token: "variable", foreground: "d4d4d4" },
        { token: "operator", foreground: "888888" },
      ],
      colors: {
        "editor.background": "#14151a",
        "editor.foreground": "#d4d4d4",
        "editor.lineHighlightBackground": "#1e1f26",
        "editor.selectionBackground": "#2a2d37",
        "editor.inactiveSelectionBackground": "#252830",
        "editorCursor.foreground": "#d4d4d4",
        "editorLineNumber.foreground": "#3b3e48",
        "editorLineNumber.activeForeground": "#636d83",
        "editorIndentGuide.background": "#1e1f26",
        "editorIndentGuide.activeBackground": "#2a2d37",
        "editorWidget.background": "#1b1c23",
        "editorWidget.border": "#2a2d37",
        "input.background": "#14151a",
        "input.border": "#2a2d37",
        "list.hoverBackground": "#252830",
        "list.activeSelectionBackground": "#2a2d37",
        "list.highlightForeground": "#7ec8e3",
      },
    });
  };

  const handleChange = useCallback(
    (val: string | undefined) => {
      onChange(val ?? "");
    },
    [onChange],
  );

  return (
    <Editor
      language="sql"
      theme="sql-dark"
      value={value}
      onChange={handleChange}
      beforeMount={handleBeforeMount}
      onMount={handleEditorDidMount}
      options={{
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        fontSize: 13,
        fontFamily: "'JetBrains Mono', 'Cascadia Code', 'Fira Code', monospace",
        lineNumbers: "on",
        renderLineHighlight: "line",
        tabSize: 4,
        insertSpaces: true,
        wordWrap: "on",
        folding: true,
        foldingHighlight: true,
        suggestOnTriggerCharacters: true,
        quickSuggestions: true,
        bracketPairColorization: { enabled: true },
        automaticLayout: true,
        padding: { top: 8, bottom: 8 },
        scrollbar: {
          verticalScrollbarSize: 8,
          horizontalScrollbarSize: 8,
        },
        overviewRulerBorder: false,
        hideCursorInOverviewRuler: true,
        cursorBlinking: "smooth",
        smoothScrolling: true,
      }}
    />
  );
}
