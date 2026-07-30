import type {Dialect, ParsedSchema} from './types.ts';

export function listTables(schema: ParsedSchema): string {
  if (schema.tables.length === 0) return 'No tables found.';
  const lines = [`**Tables (${schema.tables.length}):**`, ''];
  for (const t of schema.tables) {
    const pkCols = t.columns.filter(c => c.primaryKey).map(c => c.name);
    const pkStr = pkCols.length > 0 ? ` (PK: ${pkCols.join(', ')})` : '';
    lines.push(`- **${t.name}** — ${t.columns.length} columns${pkStr}`);
  }
  return lines.join('\n');
}

export function listIndexes(schema: ParsedSchema): string {
  if (schema.indexes.length === 0) return 'No indexes found.';
  const lines = [`**Indexes (${schema.indexes.length}):**`, ''];
  for (const idx of schema.indexes) {
    const type = idx.unique ? 'UNIQUE' : 'INDEX';
    lines.push(`- **${idx.name}** (${type}) on \`${idx.table}\`(${idx.columns.join(', ')})`);
  }
  return lines.join('\n');
}

export function listForeignKeys(schema: ParsedSchema): string {
  if (schema.foreignKeys.length === 0) return 'No foreign keys found.';
  const lines = [`**Foreign Keys (${schema.foreignKeys.length}):**`, ''];
  for (const fk of schema.foreignKeys) {
    const deleteAction = fk.onDelete ? ` ON DELETE ${fk.onDelete}` : '';
    const updateAction = fk.onUpdate ? ` ON UPDATE ${fk.onUpdate}` : '';
    lines.push(
      `- \`${fk.table}\`(${fk.columns.join(', ')}) → \`${fk.refTable}\`(${fk.refColumns.join(', ')})${deleteAction}${updateAction}`,
    );
  }
  return lines.join('\n');
}

export function findColumn(schema: ParsedSchema, query: string): string {
  const q = query.toLowerCase();
  const found: string[] = [];

  for (const table of schema.tables) {
    for (const col of table.columns) {
      if (col.name.toLowerCase().includes(q)) {
        const tags: string[] = [];
        if (col.primaryKey) tags.push('PK');
        if (col.unique) tags.push('UNIQUE');
        if (!col.nullable) tags.push('NOT NULL');
        if (col.references) tags.push(`FK→${col.references.table}.${col.references.column}`);
        if (col.autoIncrement) tags.push('AUTO-INCREMENT');

        const tagStr = tags.length > 0 ? ` [${tags.join(', ')}]` : '';
        found.push(`- \`${table.name}\`.\`${col.name}\` — ${col.type}${tagStr}${col.defaultValue ? ` DEFAULT ${col.defaultValue}` : ''}`);
      }
    }
  }

  if (found.length === 0) return `No columns matching "${query}" found.`;

  return `**Found ${found.length} column(s) matching "${query}":**\n\n${found.join('\n')}`;
}

export function schemaSummary(schema: ParsedSchema, dialect: Dialect): string {
  const lines: string[] = [
    `**Schema Summary**`,
    '',
    `- **Database type:** ${dialect}`,
    `- **Tables:** ${schema.tables.length}`,
    `- **Indexes:** ${schema.indexes.length}`,
    `- **Foreign Keys:** ${schema.foreignKeys.length}`,
    '',
  ];

  const totalCols = schema.tables.reduce((sum, t) => sum + t.columns.length, 0);
  const pkCols = schema.tables.reduce(
    (sum, t) => sum + t.columns.filter(c => c.primaryKey).length,
    0,
  );
  const fkCols = schema.tables.reduce(
    (sum, t) => sum + t.columns.filter(c => c.references).length,
    0,
  );

  lines.push(`- **Total columns:** ${totalCols}`);
  lines.push(`- **Primary keys:** ${pkCols}`);
  lines.push(`- **Foreign key columns:** ${fkCols}`);

  return lines.join('\n');
}

export function describeTable(schema: ParsedSchema, tableName: string, dialect: Dialect): string {
  const table = schema.tables.find(
    t => t.name.toLowerCase() === tableName.toLowerCase(),
  );
  if (!table) return `Table "${tableName}" not found.`;

  const indexes = schema.indexes.filter(
    i => i.table.toLowerCase() === tableName.toLowerCase(),
  );
  const outgoingFks = schema.foreignKeys.filter(
    fk => fk.table.toLowerCase() === tableName.toLowerCase(),
  );
  const incomingFks = schema.foreignKeys.filter(
    fk => fk.refTable.toLowerCase() === tableName.toLowerCase(),
  );

  const lines: string[] = [
    `**Table: \`${table.name}\`** — ${table.columns.length} columns · ${dialect}`,
    '',
  ];

  lines.push('| # | Column | Type | Nullable | PK | Unique | FK | Default | Auto |');
  lines.push('|---|--------|------|----------|----|--------|----|---------|------|');

  table.columns.forEach((col, i) => {
    const nullable = col.nullable ? 'YES' : 'NO';
    const pk = col.primaryKey ? '✓' : '';
    const unique = col.unique ? '✓' : '';
    const fk = col.references ? `→ ${col.references.table}.${col.references.column}` : '';
    const def = col.defaultValue || '';
    const auto = col.autoIncrement ? '✓' : '';

    lines.push(
      `| ${i + 1} | \`${col.name}\` | ${col.type} | ${nullable} | ${pk} | ${unique} | ${fk} | ${def} | ${auto} |`,
    );
  });

  lines.push('');

  if (indexes.length > 0) {
    lines.push('**Indexes:**');
    for (const idx of indexes) {
      const type = idx.unique ? 'UNIQUE' : 'INDEX';
      lines.push(`- \`${idx.name}\` (${type}) on (${idx.columns.join(', ')})`);
    }
    lines.push('');
  }

  if (outgoingFks.length > 0) {
    lines.push('**Foreign keys from this table:**');
    for (const fk of outgoingFks) {
      const actions: string[] = [];
      if (fk.onDelete) actions.push(`ON DELETE ${fk.onDelete}`);
      if (fk.onUpdate) actions.push(`ON UPDATE ${fk.onUpdate}`);
      const actionStr = actions.length > 0 ? ` [${actions.join(', ')}]` : '';
      lines.push(
        `- (${fk.columns.join(', ')}) → \`${fk.refTable}\`(${fk.refColumns.join(', ')})${actionStr}`,
      );
    }
    lines.push('');
  }

  if (incomingFks.length > 0) {
    lines.push('**Referenced by:**');
    for (const fk of incomingFks) {
      lines.push(
        `- \`${fk.table}\`(${fk.columns.join(', ')}) → (${fk.refColumns.join(', ')})`,
      );
    }
    lines.push('');
  }

  return lines.join('\n');
}
