import type { Extension } from "@codemirror/state";
import { createFunctionSignaturePlugin } from "../../sqlEditor/language/signature";
export interface SqlIntelExtensionOptions {
  highlightActiveStatement?: boolean;
  getDbType?: () => string | undefined;
}

/** @deprecated 使用 sqlEditor/editor/extensions */
export function createSqlIntelExtensions(options: SqlIntelExtensionOptions = {}): Extension[] {
  const extensions: Extension[] = [];
  if (options.getDbType) {
    extensions.push(createFunctionSignaturePlugin(options.getDbType));
  }
  return extensions;
}
