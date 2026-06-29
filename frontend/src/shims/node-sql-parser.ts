/**
 * node-sql-parser 为 CommonJS；通过独立 alias `node-sql-parser-cjs` 引入真实包。
 */
import mod from "node-sql-parser-cjs";

type SqlParserModule = {
  Parser: new () => {
    astify(sql: string, opt?: unknown): unknown;
  };
  util?: unknown;
};

const resolved =
  (mod as SqlParserModule & { default?: SqlParserModule }).default ?? (mod as SqlParserModule);

export const Parser = resolved.Parser;
export const util = resolved.util;
export default resolved;
