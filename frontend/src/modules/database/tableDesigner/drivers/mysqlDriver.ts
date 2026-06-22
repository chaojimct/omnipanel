import type { TableDesignerDriver, TableDesignerTypeOption } from "../types";
import {
  buildPreviewSqlGeneric,
  createEmptyField,
  createEmptyIndex,
  createGenericDriver,
  fromSchemaGeneric,
  validateGeneric,
} from "./genericDriver";

const MYSQL_TYPES: TableDesignerTypeOption[] = [
  { value: "INT", label: "INT" },
  { value: "BIGINT", label: "BIGINT" },
  { value: "TINYINT", label: "TINYINT" },
  { value: "VARCHAR", label: "VARCHAR" },
  { value: "CHAR", label: "CHAR" },
  { value: "TEXT", label: "TEXT" },
  { value: "DECIMAL", label: "DECIMAL" },
  { value: "DOUBLE", label: "DOUBLE" },
  { value: "DATETIME", label: "DATETIME" },
  { value: "TIMESTAMP", label: "TIMESTAMP" },
  { value: "DATE", label: "DATE" },
  { value: "JSON", label: "JSON" },
  { value: "BLOB", label: "BLOB" },
];

export const mysqlTableDesignerDriver: TableDesignerDriver = {
  ...createGenericDriver("mysql", "MySQL"),
  createEmptyField: () => createEmptyField("INT"),
  getTypeOptions: () => MYSQL_TYPES,
  fromSchema: fromSchemaGeneric,
  validate: validateGeneric,
  buildPreviewSql(model, dbName) {
    return buildPreviewSqlGeneric(model, dbName).replace(
      `CREATE TABLE \`${model.tableName}\``,
      `CREATE TABLE \`${dbName}\`.\`${model.tableName}\``,
    );
  },
  createEmptyIndex,
};
