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
