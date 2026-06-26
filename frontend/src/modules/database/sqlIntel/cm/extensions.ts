import type { Extension } from "@codemirror/state";
import { activeStatementPlugin } from "./activeStatement";
import { createFunctionSignaturePlugin } from "./functionSignature";

export interface SqlIntelExtensionOptions {
  /** 是否高亮当前语句外框（只读 DDL 预览同样启用）。 */
  highlightActiveStatement?: boolean;
  /** 连接 db_type，驱动函数签名提示。 */
  getDbType?: () => string | undefined;
}

/** Phase 1+：语句高亮、函数签名等 SqlIntel CodeMirror 扩展。 */
export function createSqlIntelExtensions(options: SqlIntelExtensionOptions = {}): Extension[] {
  const extensions: Extension[] = [];
  if (options.highlightActiveStatement !== false) {
    extensions.push(activeStatementPlugin);
  }
  if (options.getDbType) {
    extensions.push(createFunctionSignaturePlugin(options.getDbType));
  }
  return extensions;
}
