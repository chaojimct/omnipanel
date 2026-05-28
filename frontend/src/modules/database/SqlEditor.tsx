import { useRef, useEffect, useCallback } from "react";
import Editor, { type OnMount, loader } from "@monaco-editor/react";
import type { editor as MonacoEditor, languages, IDisposable } from "monaco-editor";

interface SchemaTable {
  name: string;
  columns: { name: string; type: string; isPk?: boolean; isFk?: boolean }[];
}

interface SqlEditorProps {
  value: string;
  onChange: (value: string) => void;
  onRun?: () => void;
  schema?: SchemaTable[];
  readOnly?: boolean;
}

const SQL_KEYWORDS = [
  "SELECT", "FROM", "WHERE", "INSERT", "INTO", "VALUES", "UPDATE", "SET",
  "DELETE", "CREATE", "TABLE", "ALTER", "DROP", "INDEX", "VIEW", "TRIGGER",
  "JOIN", "INNER", "LEFT", "RIGHT", "OUTER", "CROSS", "FULL", "ON", "AS",
  "AND", "OR", "NOT", "IN", "BETWEEN", "LIKE", "IS", "NULL", "EXISTS",
  "HAVING", "GROUP", "BY", "ORDER", "ASC", "DESC", "LIMIT", "OFFSET",
  "UNION", "ALL", "DISTINCT", "CASE", "WHEN", "THEN", "ELSE", "END",
  "BEGIN", "COMMIT", "ROLLBACK", "TRANSACTION", "SAVEPOINT",
  "GRANT", "REVOKE", "WITH", "RECURSIVE", "RETURNING", "CONFLICT",
  "PRIMARY", "KEY", "FOREIGN", "REFERENCES", "UNIQUE", "CHECK", "DEFAULT",
  "NOT", "AUTO_INCREMENT", "SERIAL", "BIGSERIAL", "CONSTRAINT",
  "CASCADE", "RESTRICT", "SET", "NULL", "NO", "ACTION",
  "IF", "TEMPORARY", "TEMP", "EXPLAIN", "ANALYZE", "VACUUM", "REINDEX",
  "COPY", "FORCE", "ENABLE", "DISABLE", "TRUNCATE", "RENAME",
  "PARTITION", "OVER", "WINDOW", "RANGE", "ROWS", "PRECEDING", "FOLLOWING",
  "UNBOUNDED", "CURRENT", "ROW", "NTH_VALUE", "LEAD", "LAG",
];

const SQL_FUNCTIONS = [
  "COUNT", "SUM", "AVG", "MIN", "MAX", "COALESCE", "NULLIF", "IFNULL",
  "CAST", "CONVERT", "TYPEOF", "LENGTH", "CHAR_LENGTH", "UPPER", "LOWER",
  "TRIM", "LTRIM", "RTRIM", "SUBSTRING", "SUBSTR", "REPLACE", "REVERSE",
  "CONCAT", "CONCAT_WS", "FORMAT", "LPAD", "RPAD", "LEFT", "RIGHT",
  "POSITION", "STRPOS", "REPEAT", "SPACE", "ASCII", "CHR",
  "NOW", "CURRENT_TIMESTAMP", "CURRENT_DATE", "CURRENT_TIME",
  "DATE", "TIME", "DATETIME", "TIMESTAMP", "EXTRACT", "DATE_PART",
  "DATE_TRUNC", "DATE_ADD", "DATE_SUB", "DATEDIFF", "DATE_FORMAT",
  "YEAR", "MONTH", "DAY", "HOUR", "MINUTE", "SECOND",
  "ABS", "CEIL", "CEILING", "FLOOR", "ROUND", "TRUNC", "MOD", "POWER",
  "SQRT", "EXP", "LN", "LOG", "LOG10", "LOG2", "SIGN", "RANDOM",
  "ROW_NUMBER", "RANK", "DENSE_RANK", "NTILE", "PERCENT_RANK",
  "CUME_DIST", "FIRST_VALUE", "LAST_VALUE", "NTH_VALUE",
  "JSON_EXTRACT", "JSON_OBJECT", "JSON_ARRAY", "JSON_VALID",
  "JSON_LENGTH", "JSON_KEYS", "JSON_VALUE", "JSON_QUERY",
  "ARRAY_AGG", "ARRAY_APPEND", "ARRAY_PREPEND", "ARRAY_CAT",
  "STRING_AGG", "GROUP_CONCAT", "GROUPING",
  "EXISTS", "ANY", "SOME", "INTERSECT", "EXCEPT",
];

const THEME_DEFINITIONS: Record<string, MonacoEditor.IStandaloneThemeData> = {
  "omnipanel-dark": {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "keyword", foreground: "007aff", fontStyle: "bold" },
      { token: "keyword.sql", foreground: "007aff", fontStyle: "bold" },
      { token: "predefined.sql", foreground: "ff9f0a" },
      { token: "string", foreground: "30d158" },
      { token: "string.sql", foreground: "30d158" },
      { token: "number", foreground: "ff9f0a" },
      { token: "comment", foreground: "6e6e73", fontStyle: "italic" },
      { token: "comment.sql", foreground: "6e6e73", fontStyle: "italic" },
      { token: "operator.sql", foreground: "fdfcfc" },
      { token: "predefined", foreground: "ff9f0a" },
      { token: "identifier", foreground: "fdfcfc" },
      { token: "type", foreground: "007aff" },
      { token: "variable", foreground: "c8c6c4" },
    ],
    colors: {
      "editor.background": "#1a1717",
      "editor.foreground": "#fdfcfc",
      "editor.lineHighlightBackground": "#302c2c40",
      "editor.selectionBackground": "#007aff30",
      "editor.inactiveSelectionBackground": "#007aff18",
      "editorCursor.foreground": "#fdfcfc",
      "editorLineNumber.foreground": "#6e6e73",
      "editorLineNumber.activeForeground": "#c8c6c4",
      "editorIndentGuide.background": "#302c2c",
      "editorIndentGuide.activeBackground": "#464343",
      "editorBracketMatch.background": "#007aff20",
      "editorBracketMatch.border": "#007aff50",
      "editorWidget.background": "#302c2c",
      "editorWidget.border": "#464343",
      "editorSuggestWidget.background": "#302c2c",
      "editorSuggestWidget.border": "#464343",
      "editorSuggestWidget.foreground": "#fdfcfc",
      "editorSuggestWidget.selectedBackground": "#007aff25",
      "editorSuggestWidget.highlightForeground": "#007aff",
      "editorHoverWidget.background": "#302c2c",
      "editorHoverWidget.border": "#464343",
      "list.activeSelectionBackground": "#007aff25",
      "list.activeSelectionForeground": "#fdfcfc",
      "list.highlightForeground": "#007aff",
      "scrollbarSlider.background": "#46434350",
      "scrollbarSlider.hoverBackground": "#46434380",
      "scrollbarSlider.activeBackground": "#464343a0",
      "minimap.background": "#1a1717",
    },
  },
  "omnipanel-light": {
    base: "vs",
    inherit: true,
    rules: [
      { token: "keyword", foreground: "007aff", fontStyle: "bold" },
      { token: "keyword.sql", foreground: "007aff", fontStyle: "bold" },
      { token: "predefined.sql", foreground: "ff9500" },
      { token: "string", foreground: "34c759" },
      { token: "string.sql", foreground: "34c759" },
      { token: "number", foreground: "ff9500" },
      { token: "comment", foreground: "aeaeb2", fontStyle: "italic" },
      { token: "comment.sql", foreground: "aeaeb2", fontStyle: "italic" },
      { token: "operator.sql", foreground: "1d1d1f" },
      { token: "predefined", foreground: "ff9500" },
      { token: "identifier", foreground: "1d1d1f" },
      { token: "type", foreground: "007aff" },
      { token: "variable", foreground: "424245" },
    ],
    colors: {
      "editor.background": "#e8e8ed",
      "editor.foreground": "#1d1d1f",
      "editor.lineHighlightBackground": "#ffffff60",
      "editor.selectionBackground": "#007aff20",
      "editor.inactiveSelectionBackground": "#007aff10",
      "editorCursor.foreground": "#1d1d1f",
      "editorLineNumber.foreground": "#aeaeb2",
      "editorLineNumber.activeForeground": "#424245",
      "editorIndentGuide.background": "#d2d2d7",
      "editorIndentGuide.activeBackground": "#aeaeb2",
      "editorBracketMatch.background": "#007aff15",
      "editorBracketMatch.border": "#007aff40",
      "editorWidget.background": "#ffffff",
      "editorWidget.border": "#d2d2d7",
      "editorSuggestWidget.background": "#ffffff",
      "editorSuggestWidget.border": "#d2d2d7",
      "editorSuggestWidget.foreground": "#1d1d1f",
      "editorSuggestWidget.selectedBackground": "#007aff18",
      "editorSuggestWidget.highlightForeground": "#007aff",
      "editorHoverWidget.background": "#ffffff",
      "editorHoverWidget.border": "#d2d2d7",
      "list.activeSelectionBackground": "#007aff18",
      "list.activeSelectionForeground": "#1d1d1f",
      "list.highlightForeground": "#007aff",
      "scrollbarSlider.background": "#d2d2d760",
      "scrollbarSlider.hoverBackground": "#d2d2d790",
      "scrollbarSlider.activeBackground": "#d2d2d7b0",
      "minimap.background": "#e8e8ed",
    },
  },
};

function getActiveTheme(): string {
  return document.documentElement.getAttribute("data-theme") === "light"
    ? "omnipanel-light"
    : "omnipanel-dark";
}

function registerCompletionProvider(
  monaco: typeof import("monaco-editor"),
  schema: SchemaTable[]
): IDisposable {
  return monaco.languages.registerCompletionItemProvider("sql", {
    triggerCharacters: [".", " ", "("],
    provideCompletionItems(model, position) {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endLineNumber: position.lineNumber,
        endColumn: word.endColumn,
      };

      const suggestions: languages.CompletionItem[] = [];

      // Check if we're after a dot (table.column completion)
      const lastLine = model.getLineContent(position.lineNumber).substring(0, position.column - 1);
      const dotMatch = lastLine.match(/(\w+)\.$/);
      if (dotMatch) {
        const tableName = dotMatch[1].toLowerCase();
        const table = schema.find((t) => t.name.toLowerCase() === tableName);
        if (table) {
          for (const col of table.columns) {
            suggestions.push({
              label: col.name,
              kind: monaco.languages.CompletionItemKind.Field,
              detail: `${col.type}${col.isPk ? " (PK)" : ""}${col.isFk ? " (FK)" : ""}`,
              insertText: col.name,
              range,
            });
          }
          return { suggestions };
        }
      }

      // SQL keywords
      for (const kw of SQL_KEYWORDS) {
        suggestions.push({
          label: kw,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: kw,
          range,
        });
      }

      // SQL functions
      for (const fn of SQL_FUNCTIONS) {
        suggestions.push({
          label: fn,
          kind: monaco.languages.CompletionItemKind.Function,
          detail: "function",
          insertText: `${fn}($1)`,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
        });
      }

      // Schema tables
      for (const table of schema) {
        suggestions.push({
          label: table.name,
          kind: monaco.languages.CompletionItemKind.Struct,
          detail: `table (${table.columns.length} cols)`,
          insertText: table.name,
          range,
        });

        // Also add table columns (unqualified) for convenience
        for (const col of table.columns) {
          suggestions.push({
            label: `${table.name}.${col.name}`,
            kind: monaco.languages.CompletionItemKind.Field,
            detail: `${col.type}${col.isPk ? " (PK)" : ""}${col.isFk ? " (FK)" : ""}`,
            insertText: `${table.name}.${col.name}`,
            range,
          });
        }
      }

      return { suggestions };
    },
  });
}

export function SqlEditor({ value, onChange, onRun, schema = [], readOnly = false }: SqlEditorProps) {
  const disposables = useRef<IDisposable[]>([]);
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);

  const handleMount: OnMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;

      // Define themes
      for (const [name, data] of Object.entries(THEME_DEFINITIONS)) {
        monaco.editor.defineTheme(name, data);
      }
      monaco.editor.setTheme(getActiveTheme());

      // Register SQL language basics
      monaco.languages.setLanguageConfiguration("sql", {
        comments: {
          lineComment: "--",
          blockComment: ["/*", "*/"],
        },
        brackets: [
          ["(", ")"],
          ["[", "]"],
        ],
        autoClosingPairs: [
          { open: "(", close: ")" },
          { open: "'", close: "'" },
          { open: '"', close: '"' },
          { open: "`", close: "`" },
          { open: "[", close: "]" },
        ],
        surroundingPairs: [
          { open: "(", close: ")" },
          { open: "'", close: "'" },
          { open: '"', close: '"' },
          { open: "`", close: "`" },
          { open: "[", close: "]" },
        ],
      });

      // Register completion provider
      const completionDisposable = registerCompletionProvider(monaco, schema);
      disposables.current.push(completionDisposable);

      // Ctrl+Enter / Cmd+Enter to run query
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
        onRun?.();
      });

      // Focus editor
      editor.focus();
    },
    [schema, onRun]
  );

  // Theme observer: switch Monaco theme when data-theme changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const monaco = editorRef.current;
      if (monaco) {
        const model = monaco.getModel();
        if (model) {
          loader.init().then((m) => {
            m.editor.setTheme(getActiveTheme());
          });
        }
      }
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  // Update completion provider when schema changes
  useEffect(() => {
    let cancelled = false;
    loader.init().then((monaco) => {
      if (cancelled) return;
      // Dispose old completion providers and re-register
      for (const d of disposables.current) {
        d.dispose();
      }
      disposables.current = [];
      const disposable = registerCompletionProvider(monaco, schema);
      disposables.current.push(disposable);
    });
    return () => {
      cancelled = true;
      for (const d of disposables.current) {
        d.dispose();
      }
      disposables.current = [];
    };
  }, [schema]);

  return (
    <div className="sql-monaco-editor">
      <Editor
        defaultLanguage="sql"
        value={value}
        onChange={(val) => onChange(val ?? "")}
        onMount={handleMount}
        theme={getActiveTheme()}
        options={{
          fontSize: 13,
          fontFamily: "var(--font-mono)",
          lineHeight: 22,
          tabSize: 2,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          padding: { top: 12, bottom: 12 },
          renderLineHighlight: "line",
          renderWhitespace: "selection",
          wordWrap: "on",
          automaticLayout: true,
          suggestOnTriggerCharacters: true,
          quickSuggestions: true,
          wordBasedSuggestions: "off",
          snippetSuggestions: "inline",
          tabCompletion: "on",
          suggest: {
            showKeywords: true,
            showFunctions: true,
            showSnippets: true,
            preview: true,
            insertMode: "replace",
          },
          folding: true,
          foldingStrategy: "indentation",
          bracketPairColorization: { enabled: true },
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          smoothScrolling: true,
          readOnly,
          contextmenu: true,
          mouseWheelZoom: true,
        }}
      />
    </div>
  );
}
