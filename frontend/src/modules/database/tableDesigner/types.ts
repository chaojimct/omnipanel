import type { DbTableSchema } from "../api";

export interface TableDesignerFieldRow {
  id: string;
  name: string;
  type: string;
  length: string;
  nullable: boolean;
  isPk: boolean;
  isAutoIncrement: boolean;
  defaultValue: string;
  comment: string;
}

export interface TableDesignerIndexRow {
  id: string;
  name: string;
  columns: string[];
  unique: boolean;
  primary: boolean;
}

export interface TableDesignerModel {
  tableName: string;
  comment: string;
  fields: TableDesignerFieldRow[];
  indexes: TableDesignerIndexRow[];
}

export interface TableDesignerTypeOption {
  value: string;
  label: string;
}

export interface TableDesignerDriver {
  engine: string;
  displayName: string;
  supportsTableDesign: boolean;
  createEmptyField(): TableDesignerFieldRow;
  createEmptyIndex(): TableDesignerIndexRow;
  getTypeOptions(): TableDesignerTypeOption[];
  fromSchema(schema: DbTableSchema): TableDesignerModel;
  validate(model: TableDesignerModel): string | null;
  buildPreviewSql(model: TableDesignerModel, dbName: string): string;
  buildApplySql(baseline: TableDesignerModel, model: TableDesignerModel, dbName: string): string[];
  hasModelChanges(baseline: TableDesignerModel, model: TableDesignerModel): boolean;
}

export function createDesignerRowId(): string {
  return `d:${Date.now()}:${Math.random().toString(36).slice(2, 9)}`;
}
