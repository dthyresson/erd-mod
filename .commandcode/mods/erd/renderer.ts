import type {ModApi} from '@commandcode/harness';
import type {Column, ForeignKey, Index} from './types.ts';

const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

interface TableEntry {
  tableName: string;
  columns: Column[];
  indexes: Index[];
  outgoingFks: ForeignKey[];
  incomingFks: ForeignKey[];
  dialect: string;
}

function badges(col: Column): string {
  const b: string[] = [];
  if (col.primaryKey) b.push(`${YELLOW}PK${RESET}`);
  if (col.references) b.push(`${CYAN}FK${RESET} → ${col.references.table}.${col.references.column}`);
  if (col.unique && !col.primaryKey) b.push(`${GREEN}UQ${RESET}`);
  if (col.autoIncrement) b.push(`${DIM}AUTO${RESET}`);
  return b.join(' ');
}

export function registerRenderer(cmd: ModApi): void {
  cmd.addRenderer('erd-table', (data) => {
    const {tableName, columns, indexes, outgoingFks, incomingFks, dialect} = data as TableEntry;
    const lines: string[] = [];

    // Header
    lines.push(`${BOLD}Table: ${CYAN}${tableName}${RESET} — ${columns.length} columns · ${dialect}`);
    lines.push('');

    // Column width
    const nameW = Math.max(...columns.map(c => c.name.length));

    for (const col of columns) {
      const name = col.name.padEnd(nameW);
      const nullTag = col.nullable ? `${DIM}NULL${RESET}` : `${BOLD}NOT NULL${RESET}`;
      const def = col.defaultValue ? ` ${DIM}= ${col.defaultValue}${RESET}` : '';
      const badge = badges(col);

      lines.push(`  ${GREEN}${name}${RESET}  ${col.type}  ${nullTag}  ${badge}${def}`);
    }

    // Indexes
    if (indexes.length > 0) {
      lines.push('');
      lines.push(`${BOLD}Indexes:${RESET}`);
      for (const idx of indexes) {
        const type = idx.unique ? `${YELLOW}UNIQUE${RESET}` : 'INDEX';
        lines.push(`  ${DIM}${idx.name}${RESET} (${type}) on (${idx.columns.join(', ')})`);
      }
    }

    // Outgoing FKs
    if (outgoingFks.length > 0) {
      lines.push('');
      lines.push(`${BOLD}References:${RESET}`);
      for (const fk of outgoingFks) {
        const actions: string[] = [];
        if (fk.onDelete) actions.push(`ON DELETE ${fk.onDelete}`);
        if (fk.onUpdate) actions.push(`ON UPDATE ${fk.onUpdate}`);
        const actionStr = actions.length > 0 ? ` [${actions.join(', ')}]` : '';
        lines.push(
          `  (${fk.columns.join(', ')}) → ${CYAN}${fk.refTable}${RESET}(${fk.refColumns.join(', ')})${actionStr}`,
        );
      }
    }

    // Incoming FKs
    if (incomingFks.length > 0) {
      lines.push('');
      lines.push(`${BOLD}Referenced by:${RESET}`);
      for (const fk of incomingFks) {
        lines.push(
          `  ${CYAN}${fk.table}${RESET}(${fk.columns.join(', ')}) → (${fk.refColumns.join(', ')})`,
        );
      }
    }

    return lines;
  });
}
