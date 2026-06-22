import type { TableDesignerDriver, TableDesignerTypeOption } from "../types";
import {
  createEmptyField,
  createEmptyIndex,
  createGenericDriver,
  fromSchemaGeneric,
  validateGeneric,
} from "./genericDriver";
import { buildApplySqlPostgres } from "../applySql";

const PG_TYPES: TableDesignerTypeOption[] = [
  { value: "integer", label: "integer" },
  { value: "bigint", label: "bigint" },
  { value: "smallint", label: "smallint" },
  { value: "varchar", label: "varchar" },
  { value: "text", label: "text" },
  { value: "boolean", label: "boolean" },
  { value: "numeric", label: "numeric" },
  { value: "double precision", label: "double precision" },
  { value: "timestamp", label: "timestamp" },
  { value: "date", label: "date" },
  { value: "jsonb", label: "jsonb" },
  { value: "uuid", label: "uuid" },
];

export const postgresTableDesignerDriver: TableDesignerDriver = {
  ...createGenericDriver("postgresql", "PostgreSQL"),
  createEmptyField: () => createEmptyField("integer"),
  getTypeOptions: () => PG_TYPES,
  fromSchema: fromSchemaGeneric,
  validate: validateGeneric,
  buildPreviewSql(model, dbName) {
    const lines = model.fields.map((field) => {
      const type = field.length.trim() && /varchar|char|numeric/i.test(field.type)
        ? `${field.type}(${field.length.trim()})`
        : field.type;
      const parts = [`  "${field.name}" ${type}`];
      if (field.isPk) parts.push("PRIMARY KEY");
      if (!field.nullable) parts.push("NOT NULL");
      if (field.defaultValue.trim()) parts.push(`DEFAULT ${field.defaultValue.trim()}`);
      return parts.join(" ");
    });
    for (const index of model.indexes) {
      if (index.primary || index.columns.length === 0) continue;
      const cols = index.columns.map((c) => `"${c}"`).join(", ");
      const kind = index.unique ? "UNIQUE INDEX" : "INDEX";
      lines.push(`  ${kind} "${index.name || "idx_" + index.columns.join("_")}" (${cols})`);
    }
    return [
      `-- ${dbName}.${model.tableName}`,
      model.comment.trim() ? `-- ${model.comment.trim()}` : "",
      `CREATE TABLE "${dbName}"."${model.tableName}" (`,
      lines.join(",\n"),
      ");",
    ].filter(Boolean).join("\n");
  },
  buildApplySql: buildApplySqlPostgres,
  createEmptyIndex,
};
