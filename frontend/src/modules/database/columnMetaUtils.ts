import type { DbColumnMeta } from "./api";

/** 判断列是否为自增（优先使用 schema 元数据，其次类型串特征）。 */
export function isAutoIncrementColumn(meta: DbColumnMeta, _pkCount: number): boolean {
  if (meta.isAutoIncrement === true) {
    return true;
  }
  if (meta.isAutoIncrement === false) {
    return false;
  }
  return /auto_increment|serial|identity/i.test(meta.type);
}
