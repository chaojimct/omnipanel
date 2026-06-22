import type { TableDesignerTypeOption } from "../types";
import {
  createEmptyField,
  createEmptyIndex,
  createGenericDriver,
} from "./genericDriver";

const SQLITE_TYPES: TableDesignerTypeOption[] = [
  { value: "INTEGER", label: "INTEGER" },
  { value: "TEXT", label: "TEXT" },
  { value: "REAL", label: "REAL" },
  { value: "BLOB", label: "BLOB" },
  { value: "NUMERIC", label: "NUMERIC" },
];

export const sqliteTableDesignerDriver = {
  ...createGenericDriver("sqlite", "SQLite"),
  createEmptyField: () => createEmptyField("INTEGER"),
  getTypeOptions: () => SQLITE_TYPES,
  createEmptyIndex,
};
