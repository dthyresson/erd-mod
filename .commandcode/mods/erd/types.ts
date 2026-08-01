export interface Column {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey: boolean;
  unique: boolean;
  defaultValue?: string;
  references?: {table: string; column: string};
  autoIncrement: boolean;
}

export interface Index {
  name: string;
  table: string;
  columns: string[];
  unique: boolean;
}

export interface ForeignKey {
  name?: string;
  table: string;
  columns: string[];
  refTable: string;
  refColumns: string[];
  onDelete?: string;
  onUpdate?: string;
}

export interface Table {
  name: string;
  columns: Column[];
}

export interface ParsedSchema {
  tables: Table[];
  indexes: Index[];
  foreignKeys: ForeignKey[];
}

export type Dialect = 'sqlite' | 'postgres' | 'mysql' | 'mssql';
export type Format = 'mermaid' | 'dbml' | 'ascii' | 'json' | 'plantuml' | 'graphviz';

// ── Structured data entries passed to cmd.showEntry ──────────────────────────

export interface DiagramEntry {
  format: Format;
  dialect: Dialect;
  tables: number;
  indexes: number;
  foreignKeys: number;
  content: string;
}

export interface SummaryEntry {
  dialect: Dialect;
  tables: number;
  indexes: number;
  foreignKeys: number;
  totalColumns: number;
  primaryKeys: number;
  foreignKeyColumns: number;
}

export interface FkMapEntry {
  dialect: Dialect;
  foreignKeys: ForeignKey[];
}

export interface IndexesEntry {
  dialect: Dialect;
  indexes: Index[];
}

export interface ColumnEntry {
  tableName: string;
  columnName: string;
  type: string;
  nullable: boolean;
  primaryKey: boolean;
  unique: boolean;
  autoIncrement: boolean;
  defaultValue?: string;
  references?: {table: string; column: string};
}

export interface ColumnsEntry {
  dialect: Dialect;
  query: string;
  columns: ColumnEntry[];
}

export interface TableEntry {
  tableName: string;
  columns: Column[];
  indexes: Index[];
  outgoingFks: ForeignKey[];
  incomingFks: ForeignKey[];
  dialect: string;
}

export type ErdiEntry =
  | DiagramEntry
  | SummaryEntry
  | FkMapEntry
  | IndexesEntry
  | ColumnsEntry
  | TableEntry;
