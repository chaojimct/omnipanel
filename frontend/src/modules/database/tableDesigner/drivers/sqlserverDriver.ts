import type { TableDesignerTypeOption } from "../types";
import {
  createEmptyField,
  createEmptyIndex,
  createGenericDriver,
} from "./genericDriver";

const SQLSERVER_TYPES: TableDesignerTypeOption[] = [
  { value: "INT", label: "INT" },
  { value: "BIGINT", label: "BIGINT" },
  { value: "BIT", label: "BIT" },
  { value: "NVARCHAR", label: "NVARCHAR" },
  { value: "VARCHAR", label: "VARCHAR" },
  { value: "TEXT", label: "TEXT" },
  { value: "DECIMAL", label: "DECIMAL" },
  { value: "DATETIME2", label: "DATETIME2" },
  { value: "DATE", label: "DATE" },
  { value: "UNIQUEIDENTIFIER", label: "UNIQUEIDENTIFIER" },
];

export const sqlserverTableDesignerDriver = {
  ...createGenericDriver("sqlserver", "SQL Server"),
  createEmptyField: () => createEmptyField("INT"),
  getTypeOptions: () => SQLSERVER_TYPES,
  createEmptyIndex,
};
