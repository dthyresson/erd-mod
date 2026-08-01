import type {ModApi} from '@commandcode/harness';
import type {Column, ForeignKey, Index} from './types.ts';
import {renderMarkdown} from './markdown.ts';
import {setTheme, t} from './theme.ts';

const SEP = t.separator('·');

// ── badge helpers ────────────────────────────────────────────────────────────

function badges(col: Column): string {
  const b: string[] = [];
  if (col.primaryKey) b.push(t.key('PK'));
  if (col.references) b.push(t.fk(`FK→ ${col.references.table}.${col.references.column}`));
  if (col.unique && !col.primaryKey) b.push(t.unique('UQ'));
  if (col.autoIncrement) b.push(t.dim('AUTO'));
  return b.join(' ');
}

function indexBadge(idx: Index): string {
  return idx.unique ? t.key('UNIQUE') : t.dim('INDEX');
}

// ── renderers ────────────────────────────────────────────────────────────────

export function registerRenderer(cmd: ModApi): void {
  setTheme(cmd.getFlag('erd-theme') as string | undefined);

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

    const header = `${t.accent(t.bold(d.format.toUpperCase()))} ${SEP} ${d.tables} tables ${SEP} ${d.indexes} indexes ${SEP} ${d.foreignKeys} FKs ${SEP} ${t.muted(d.dialect)}`;
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

    const lines = [t.heading('Schema Summary'), ''];
    const row = (k: string, v: string | number) => `  ${t.muted(k.padEnd(20))} ${t.title(String(v))}`;

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
    if (d.foreignKeys.length === 0) return [t.muted('No foreign keys found.')];

    const lines = [t.heading('Foreign Key Map') + ` ${t.muted(d.dialect)}`, ''];

    // Group incoming FKs by target table so each table shows its fan-in once.
    const byRef: Record<string, ForeignKey[]> = {};
    for (const fk of d.foreignKeys) {
      (byRef[fk.refTable] ||= []).push(fk);
    }

    for (const [refTable, fks] of Object.entries(byRef)) {
      lines.push(`  ${t.table(refTable)} ${t.muted(`← ${fks.length} reference${fks.length > 1 ? 's' : ''}`)}`);
      for (const fk of fks) {
        const actions: string[] = [];
        if (fk.onDelete) actions.push(`ON DELETE ${fk.onDelete}`);
        if (fk.onUpdate) actions.push(`ON UPDATE ${fk.onUpdate}`);
        const actionStr = actions.length > 0 ? ` ${t.muted(`[${actions.join(', ')}]`)}` : '';
        lines.push(
          `    ${t.column(fk.table)}(${fk.columns.join(', ')}) → ${t.table(refTable)}(${fk.refColumns.join(', ')})${actionStr}`,
        );
      }
    }
    return lines;
  });

  // /erd-indexes — all indexes
  cmd.addRenderer('erd-indexes', (data) => {
    const d = data as {dialect: string; indexes: Index[]};
    if (d.indexes.length === 0) return [t.muted('No indexes found.')];

    const lines = [t.heading('Indexes') + ` ${t.muted(d.dialect)}`, ''];
    for (const idx of d.indexes) {
      lines.push(
        `  ${t.title(idx.name)} ${t.muted('on')} ${t.table(idx.table)}(${idx.columns.join(', ')}) ${indexBadge(idx)}`,
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
    if (d.columns.length === 0) return [t.muted(`No columns matching "${d.query}" found.`)];

    const lines = [
      t.heading(`Found ${d.columns.length} column${d.columns.length > 1 ? 's' : ''} matching "${d.query}"`),
      '',
    ];
    for (const col of d.columns) {
      const badge = badges(col as Column);
      const def = col.defaultValue ? ` ${t.muted(`= ${col.defaultValue}`)}` : '';
      lines.push(
        `  ${t.column(col.tableName)}.${t.title(col.columnName)} ${t.muted(col.type)} ${badge}${def}`,
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
    lines.push(`${t.table(t.bold(tableName))} ${SEP} ${columns.length} columns ${SEP} ${t.muted(dialect)}`);
    lines.push('');

    const nameW = Math.max(...columns.map(c => c.name.length));

    for (const col of columns) {
      const name = col.name.padEnd(nameW);
      const nullTag = col.nullable ? t.dim('NULL') : t.title('NOT NULL');
      const def = col.defaultValue ? ` ${t.muted(`= ${col.defaultValue}`)}` : '';
      const badge = badges(col);

      lines.push(`  ${t.column(name)}  ${col.type}  ${nullTag}  ${badge}${def}`);
    }

    if (indexes.length > 0) {
      lines.push('');
      lines.push(t.heading('Indexes:'));
      for (const idx of indexes) {
        lines.push(`  ${t.muted(idx.name)} (${indexBadge(idx)}) on (${idx.columns.join(', ')})`);
      }
    }

    if (outgoingFks.length > 0) {
      lines.push('');
      lines.push(t.heading('References:'));
      for (const fk of outgoingFks) {
        const actions: string[] = [];
        if (fk.onDelete) actions.push(`ON DELETE ${fk.onDelete}`);
        if (fk.onUpdate) actions.push(`ON UPDATE ${fk.onUpdate}`);
        const actionStr = actions.length > 0 ? ` ${t.muted(`[${actions.join(', ')}]`)}` : '';
        lines.push(
          `  (${fk.columns.join(', ')}) → ${t.table(fk.refTable)}(${fk.refColumns.join(', ')})${actionStr}`,
        );
      }
    }

    if (incomingFks.length > 0) {
      lines.push('');
      lines.push(t.heading('Referenced by:'));
      for (const fk of incomingFks) {
        lines.push(
          `  ${t.table(fk.table)}(${fk.columns.join(', ')}) → (${fk.refColumns.join(', ')})`,
        );
      }
    }

    return lines;
  });
}
