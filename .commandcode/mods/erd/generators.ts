import type {Format, ParsedSchema} from './types.ts';

function generateMermaid(schema: ParsedSchema): string {
  const lines: string[] = ['```mermaid', 'erDiagram'];

  for (const table of schema.tables) {
    lines.push(`    ${table.name} {`);
    for (const col of table.columns) {
      const keyParts: string[] = [];
      if (col.primaryKey) keyParts.push('PK');
      if (col.references) keyParts.push('FK');
      if (col.unique && !col.primaryKey) keyParts.push('UK');

      const commentParts: string[] = [];
      if (col.nullable) commentParts.push('nullable');
      if (col.defaultValue) commentParts.push(`default: ${col.defaultValue}`);
      if (col.references) commentParts.push(`ref: ${col.references.table}.${col.references.column}`);

      const keyStr = keyParts.length > 0 ? ` ${keyParts.join(' ')}` : '';
      const commentStr = commentParts.length > 0 ? ` "${commentParts.join(', ')}"` : '';

      lines.push(`        ${col.type.toLowerCase()} ${col.name}${keyStr}${commentStr}`);
    }
    lines.push('    }');
  }

  const drawn = new Set<string>();
  for (const fk of schema.foreignKeys) {
    const key = `${fk.refTable}->${fk.table}`;
    if (drawn.has(key)) continue;
    drawn.add(key);

    const label = fk.columns.join(', ');
    lines.push(
      `    ${fk.refTable} ||--o{ ${fk.table} : "${label}"`,
    );
  }

  lines.push('```');
  return lines.join('\n');
}

function generateDbml(schema: ParsedSchema): string {
  const lines: string[] = [];

  for (const table of schema.tables) {
    lines.push(`Table ${table.name} {`);
    for (const col of table.columns) {
      const constraints: string[] = [];
      if (col.primaryKey) constraints.push('pk');
      if (col.autoIncrement) constraints.push('increment');
      if (!col.nullable) constraints.push('not null');
      if (col.unique) constraints.push('unique');
      if (col.defaultValue !== undefined) constraints.push(`default: \`${col.defaultValue}\``);
      if (col.references) constraints.push(`ref: > ${col.references.table}.${col.references.column}`);

      const constraintStr = constraints.length > 0 ? ` [${constraints.join(', ')}]` : '';
      lines.push(`  ${col.name} ${col.type}${constraintStr}`);
    }
    lines.push('}');
    lines.push('');
  }

  const drawn = new Set<string>();
  for (const fk of schema.foreignKeys) {
    for (let i = 0; i < fk.columns.length; i++) {
      const key = `${fk.table}.${fk.columns[i]}>${fk.refTable}.${fk.refColumns[i] || fk.refColumns[0]}`;
      if (drawn.has(key)) continue;
      drawn.add(key);

      let ref = `Ref: ${fk.table}.${fk.columns[i]} > ${fk.refTable}.${fk.refColumns[i] || fk.refColumns[0]}`;
      if (fk.onDelete) ref += ` [delete: ${fk.onDelete.toLowerCase().replace(/_/g, ' ')}]`;
      if (fk.onUpdate) ref += ` [update: ${fk.onUpdate.toLowerCase().replace(/_/g, ' ')}]`;
      lines.push(ref);
    }
  }

  return lines.join('\n');
}

function generateAscii(schema: ParsedSchema): string {
  const lines: string[] = [];

  for (const table of schema.tables) {
    const width = 60;
    const header = ` ${table.name} `;
    const padLen = width - 2 - header.length;
    lines.push('┌' + '─'.repeat(width - 2) + '┐');
    lines.push('│' + header + ' '.repeat(padLen) + '│');
    lines.push('├' + '─'.repeat(width - 2) + '┤');

    for (const col of table.columns) {
      let marker = '  ';
      if (col.primaryKey) marker = 'PK';
      else if (col.unique) marker = 'UQ';
      else if (col.references) marker = 'FK';

      const colStr = `${marker} ${col.name}: ${col.type}${col.nullable ? '' : ' NOT NULL'}${col.defaultValue ? ' DEFAULT ' + col.defaultValue : ''}`;
      const truncated = colStr.length > width - 4 ? colStr.slice(0, width - 5) + '…' : colStr;
      lines.push('│ ' + truncated + ' '.repeat(Math.max(1, width - 3 - truncated.length)) + '│');
    }
    lines.push('└' + '─'.repeat(width - 2) + '┘');
    lines.push('');
  }

  if (schema.foreignKeys.length > 0) {
    lines.push('Relationships:');
    for (const fk of schema.foreignKeys) {
      let rel = `  ${fk.refTable}.(${fk.refColumns.join(', ')}) ──► ${fk.table}.(${fk.columns.join(', ')})`;
      if (fk.onDelete) rel += ` ON DELETE ${fk.onDelete}`;
      if (fk.onUpdate) rel += ` ON UPDATE ${fk.onUpdate}`;
      lines.push(rel);
    }
  }

  return lines.join('\n');
}

function generateJson(schema: ParsedSchema): string {
  return JSON.stringify(schema, null, 2);
}

function generatePlantUml(schema: ParsedSchema): string {
  const lines: string[] = ['@startuml', ''];

  for (const table of schema.tables) {
    lines.push(`entity "${table.name}" as ${table.name} {`);
    for (const col of table.columns) {
      let marker = '';
      if (col.primaryKey) marker = ' <<PK>>';
      const nullable = col.nullable ? '' : ' <<NOT NULL>>';
      let fkMarker = '';
      if (col.references) fkMarker = ` <<FK>>`;
      lines.push(
        `  ${marker}${nullable}${fkMarker} ${col.name} : ${col.type}`,
      );
    }
    lines.push('}');
    lines.push('');
  }

  for (const fk of schema.foreignKeys) {
    lines.push(
      `${fk.table} }|--|| ${fk.refTable}`,
    );
  }

  lines.push('@enduml');
  return lines.join('\n');
}

function generateGraphviz(schema: ParsedSchema): string {
  const lines: string[] = [
    'digraph ERD {',
    '  rankdir=LR;',
    '  node [shape=record, fontname="monospace"];',
    '  edge [fontname="monospace", fontsize=9];',
    '',
  ];

  for (const table of schema.tables) {
    const labelParts: string[] = [`{${table.name}`];
    for (const col of table.columns) {
      let marker = '';
      if (col.primaryKey) marker = ' (PK)';
      else if (col.unique) marker = ' (UQ)';
      else if (col.references) marker = ` (FK→${col.references.table})`;
      labelParts.push(`| ${col.name}: ${col.type}${marker}`);
    }
    labelParts.push('}');
    lines.push(`  ${table.name} [label="${labelParts.join('\\l')}\\l"];`);
  }

  lines.push('');

  const drawn = new Set<string>();
  for (const fk of schema.foreignKeys) {
    const key = `${fk.refTable}->${fk.table}`;
    if (drawn.has(key)) continue;
    drawn.add(key);
    const label = fk.columns.join(', ');
    lines.push(
      `  ${fk.refTable} -> ${fk.table} [label="${label}"];`,
    );
  }

  lines.push('}');
  return lines.join('\n');
}

export const GENERATORS: Record<Format, (s: ParsedSchema) => string> = {
  mermaid: generateMermaid,
  dbml: generateDbml,
  ascii: generateAscii,
  json: generateJson,
  plantuml: generatePlantUml,
  graphviz: generateGraphviz,
};

export const FORMAT_LABELS: Record<Format, string> = {
  mermaid: 'Mermaid.js ERD',
  dbml: 'DBML',
  ascii: 'ASCII ERD',
  json: 'JSON Schema',
  plantuml: 'PlantUML ERD',
  graphviz: 'Graphviz DOT',
};
