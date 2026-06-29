declare module "node-sql-parser-cjs" {
  import type { Option, AST, TableColumnAst } from "node-sql-parser";

  export class Parser {
    constructor();
    parse(sql: string, opt?: Option): TableColumnAst;
    astify(sql: string, opt?: Option): AST[] | AST;
    sqlify(ast: AST[] | AST, opt?: Option): string;
    exprToSQL(ast: unknown, opt?: Option): string;
    whiteListCheck(
      sql: string,
      whiteList: string[],
      opt?: Option
    ): Error | undefined;
    tableList(sql: string, opt?: Option): string[];
    columnList(sql: string, opt?: Option): string[];
  }

  export const util: unknown;

  const mod: {
    Parser: typeof Parser;
    util: typeof util;
  };

  export default mod;
}
