import type {ModApi} from '@commandcode/harness';
import type {Column, ForeignKey, Index} from './types.ts';
import {c} from './ansi.ts';
import {renderMarkdown} from './markdown.ts';

const SEP = c.dim('·');

// ── badge helpers ────────────────────────────────────────────────────────────

function badges(col: Column): string {
  const b: string[] = [];
  if (col.primaryKey) b.push(c.yellow('PK'));
  if (col.references) b.push(c.cyan(`FK→ ${col.references.table}.${col.references.column}`));
  if (col.unique && !col.primaryKey) b.push(c.green('UQ'));
  if (col.autoIncrement) b.push(c.dim('AUTO'));
  return b.join(' ');
}

function indexBadge(idx: Index): string {
  return idx.unique ? c.yellow('UNIQUE') : c.dim('INDEX');
}

// ── renderers ────────────────────────────────────────────────────────────────

export function registerRenderer(cmd: ModApi): void {
  // Any markdown string (from queries.ts) rendered as styled feed lines
  cmd.addRenderer('erd-markdown', (data) => {
    const d = data as {content: string};
    return renderMarkdown(d.content);
  });

  // /erd-generate — a generated ERD diagram
  cmd.addRenderer('erd-diagram', (data) => {
    const d = data as {
      format: string;
      dialect: string;
      tables: number;
      indexes: number;
      foreignKeys: number;
      content: string;
    };

    const header = `${c.bold(c.cyan(d.format.toUpperCase()))} ${SEP} ${d.tables} tables ${SEP} ${d.indexes} indexes ${SEP} ${d.foreignKeys} FKs ${SEP} ${c.dim(d.dialect)}`;
    return [header, '', ...d.content.split('\n')];
  });

  // /erd-about — schema summary and statistics
  cmd.addRenderer('erd-summary', (data) => {
    const d = data as {
      dialect: string;
      tables: number;
      indexes: number;
      foreignKeys: number;
      totalColumns: number;
      primaryKeys: number;
      foreignKeyColumns: number;
    };

    const lines = [c.bold('Schema Summary'), ''];
    const row = (k: string, v: string | number) => `  ${c.dim(k.padEnd(20))} ${c.bold(String(v))}`;

    lines.push(row('Database type', d.dialect));
    lines.push(row('Tables', d.tables));
    lines.push(row('Indexes', d.indexes));
    lines.push(row('Foreign Keys', d.foreignKeys));
    lines.push(row('Total columns', d.totalColumns));
    lines.push(row('Primary keys', d.primaryKeys));
    lines.push(row('FK columns', d.foreignKeyColumns));
    return lines;
  });

  // /erd-fk — visual FK graph
  cmd.addRenderer('erd-fk-map', (data) => {
    const d = data as {dialect: string; foreignKeys: ForeignKey[]};
    if (d.foreignKeys.length === 0) return [c.dim('No foreign keys found.')];

    const lines = [c.bold('Foreign Key Map') + ` ${c.dim(d.dialect)}`, ''];

    // Group incoming FKs by target table so each table shows its fan-in once.
    const byRef: Record<string, ForeignKey[]> = {};
    for (const fk of d.foreignKeys) {
      (byRef[fk.refTable] ||= []).push(fk);
    }

    for (const [refTable, fks] of Object.entries(byRef)) {
      lines.push(`  ${c.cyan(refTable)} ${c.dim(`← ${fks.length} reference${fks.length > 1 ? 's' : ''}`)}`);
      for (const fk of fks) {
        const actions: string[] = [];
        if (fk.onDelete) actions.push(`ON DELETE ${fk.onDelete}`);
        if (fk.onUpdate) actions.push(`ON UPDATE ${fk.onUpdate}`);
        const actionStr = actions.length > 0 ? ` ${c.dim(`[${actions.join(', ')}]`)}` : '';
        lines.push(
          `    ${c.green(fk.table)}(${fk.columns.join(', ')}) → ${c.cyan(refTable)}(${fk.refColumns.join(', ')})${actionStr}`,
        );
      }
    }
    return lines;
  });

  // /erd-indexes — all indexes
  cmd.addRenderer('erd-indexes', (data) => {
    const d = data as {dialect: string; indexes: Index[]};
    if (d.indexes.length === 0) return [c.dim('No indexes found.')];

    const lines = [c.bold('Indexes') + ` ${c.dim(d.dialect)}`, ''];
    for (const idx of d.indexes) {
      lines.push(
        `  ${c.bold(idx.name)} ${c.dim(`on`)} ${c.green(idx.table)}(${idx.columns.join(', ')}) ${indexBadge(idx)}`,
      );
    }
    return lines;
  });

  // /erd-find — matching columns
  cmd.addRenderer('erd-columns', (data) => {
    const d = data as {
      dialect: string;
      query: string;
      columns: {
        tableName: string;
        columnName: string;
        type: string;
        nullable: boolean;
        primaryKey: boolean;
        unique: boolean;
        autoIncrement: boolean;
        defaultValue?: string;
        references?: {table: string; column: string};
      }[];
    };
    if (d.columns.length === 0) return [c.dim(`No columns matching "${d.query}" found.`)];

    const lines = [
      c.bold(`Found ${d.columns.length} column${d.columns.length > 1 ? 's' : ''} matching "${d.query}"`),
      '',
    ];
    for (const col of d.columns) {
      const badge = badges(col as Column);
      const def = col.defaultValue ? ` ${c.dim(`= ${col.defaultValue}`)}` : '';
      lines.push(
        `  ${c.green(col.tableName)}.${c.bold(col.columnName)} ${c.dim(col.type)} ${badge}${def}`,
      );
    }
    return lines;
  });

  // /erd-table — full table detail
  cmd.addRenderer('erd-table', (data) => {
    const {tableName, columns, indexes, outgoingFks, incomingFks, dialect} = data as {
      tableName: string;
      columns: Column[];
      indexes: Index[];
      outgoingFks: ForeignKey[];
      incomingFks: ForeignKey[];
      dialect: string;
    };

    const lines: string[] = [];
    lines.push(`${c.bold(c.cyan(tableName))} ${SEP} ${columns.length} columns ${SEP} ${c.dim(dialect)}`);
    lines.push('');

    const nameW = Math.max(...columns.map(c => c.name.length));

    for (const col of columns) {
      const name = col.name.padEnd(nameW);
      const nullTag = col.nullable ? c.dim('NULL') : c.bold('NOT NULL');
      const def = col.defaultValue ? ` ${c.dim(`= ${col.defaultValue}`)}` : '';
      const badge = badges(col);

      lines.push(`  ${c.green(name)}  ${col.type}  ${nullTag}  ${badge}${def}`);
    }

    if (indexes.length > 0) {
      lines.push('');
      lines.push(c.bold('Indexes:'));
      for (const idx of indexes) {
        lines.push(`  ${c.dim(idx.name)} (${indexBadge(idx)}) on (${idx.columns.join(', ')})`);
      }
    }

    if (outgoingFks.length > 0) {
      lines.push('');
      lines.push(c.bold('References:'));
      for (const fk of outgoingFks) {
        const actions: string[] = [];
        if (fk.onDelete) actions.push(`ON DELETE ${fk.onDelete}`);
        if (fk.onUpdate) actions.push(`ON UPDATE ${fk.onUpdate}`);
        const actionStr = actions.length > 0 ? ` ${c.dim(`[${actions.join(', ')}]`)}` : '';
        lines.push(
          `  (${fk.columns.join(', ')}) → ${c.cyan(fk.refTable)}(${fk.refColumns.join(', ')})${actionStr}`,
        );
      }
    }

    if (incomingFks.length > 0) {
      lines.push('');
      lines.push(c.bold('Referenced by:'));
      for (const fk of incomingFks) {
        lines.push(
          `  ${c.cyan(fk.table)}(${fk.columns.join(', ')}) → (${fk.refColumns.join(', ')})`,
        );
      }
    }

    return lines;
  });
}
