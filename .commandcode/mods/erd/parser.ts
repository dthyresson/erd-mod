import type {Column, Dialect, ForeignKey, Index, ParsedSchema, Table} from './types.ts';

function normalizeIdentifier(name: string, dialect: Dialect): string {
  let n = name.trim();
  if (dialect === 'mysql' && n.startsWith('`') && n.endsWith('`')) n = n.slice(1, -1);
  if (dialect === 'mssql' && n.startsWith('[') && n.endsWith(']')) n = n.slice(1, -1);
  if (n.startsWith('"') && n.endsWith('"')) n = n.slice(1, -1);
  return n;
}

function stripComments(sql: string): string {
  return sql
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');
}

function splitStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = '';
  let depth = 0;
  let inString = false;
  let stringChar = '';

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    if (inString) {
      current += ch;
      if (ch === stringChar && sql[i - 1] !== '\\') inString = false;
    } else if (ch === "'" || ch === '"' || ch === '`') {
      inString = true;
      stringChar = ch;
      current += ch;
    } else if (ch === '(') {
      depth++;
      current += ch;
    } else if (ch === ')') {
      depth--;
      current += ch;
    } else if (ch === ';' && depth === 0) {
      statements.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }

  const remainder = current.trim();
  if (remainder) statements.push(remainder);
  return statements.filter(s => s.length > 0);
}

function splitTopLevel(text: string, delimiter: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  let inString = false;
  let stringChar = '';

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      current += ch;
      if (ch === stringChar && text[i - 1] !== '\\') inString = false;
    } else if (ch === "'" || ch === '"' || ch === '`') {
      inString = true;
      stringChar = ch;
      current += ch;
    } else if (ch === '(') {
      depth++;
      current += ch;
    } else if (ch === ')') {
      depth--;
      current += ch;
    } else if (ch === delimiter && depth === 0) {
      parts.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current) parts.push(current);
  return parts;
}

function parseColumnDef(colDef: string, dialect: Dialect): Column {
  const col: Column = {
    name: '',
    type: '',
    nullable: true,
    primaryKey: false,
    unique: false,
    autoIncrement: false,
  };

  const tokens = colDef.trim().split(/\s+/);
  if (tokens.length === 0) return col;

  col.name = normalizeIdentifier(tokens[0], dialect);

  const typeMatch = colDef.match(
    /^\s*\S+\s+([A-Za-z_]+(?:\s*\([^)]*(?:\([^)]*\)[^)]*)*\))?(?:\s|$))/i,
  );
  if (typeMatch) {
    col.type = typeMatch[1].replace(/\s+/g, ' ').trim();
  } else if (tokens.length > 1) {
    col.type = tokens[1];
  }

  const upper = colDef.toUpperCase();

  if (/\bNOT\s+NULL\b/i.test(upper) || /\bPRIMARY\s+KEY\b/i.test(colDef)) {
    col.nullable = false;
  }

  if (/\bPRIMARY\s+KEY\b/i.test(upper)) {
    col.primaryKey = true;
    col.nullable = false;
  }

  if (/\bUNIQUE\b/i.test(upper)) {
    col.unique = true;
  }

  if (
    /\bAUTOINCREMENT\b/i.test(upper) ||
    /\bAUTO_INCREMENT\b/i.test(upper) ||
    /\b(?:SMALL)?SERIAL\b/i.test(upper) ||
    /\bBIGSERIAL\b/i.test(upper) ||
    /\bIDENTITY\b/i.test(upper)
  ) {
    col.autoIncrement = true;
  }

  const defaultMatch = colDef.match(
    /\bDEFAULT\s+(.+?)(?:\s+(?:NOT\s+NULL|NULL|PRIMARY\s+KEY|UNIQUE|CHECK|REFERENCES|AUTOINCREMENT|AUTO_INCREMENT|$))/i,
  );
  if (!defaultMatch) {
    const altMatch = colDef.match(/\bDEFAULT\s+(.+)$/i);
    if (altMatch) {
      col.defaultValue = altMatch[1].trim().replace(/[,;]$/, '');
    }
  } else {
    col.defaultValue = defaultMatch[1].trim();
  }

  const refMatch = colDef.match(
    /\bREFERENCES\s+(\S+?)\s*\(\s*(\S+?)\s*\)/i,
  );
  if (refMatch) {
    col.references = {
      table: normalizeIdentifier(refMatch[1], dialect),
      column: normalizeIdentifier(refMatch[2], dialect),
    };
  }

  return col;
}

function parseCreateTable(sql: string, dialect: Dialect): {table: Table; fks: ForeignKey[]} | null {
  const match = sql.match(
    /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\S+?)\s*\(([\s\S]*)\)\s*;?\s*$/i,
  );
  if (!match) return null;

  const tableName = normalizeIdentifier(match[1], dialect);
  const body = match[2];

  const table: Table = {name: tableName, columns: []};
  const fks: ForeignKey[] = [];
  const pkCols: string[] = [];

  const parts = splitTopLevel(body, ',');

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const upper = trimmed.toUpperCase();

    const pkMatch = trimmed.match(
      /^\s*PRIMARY\s+KEY\s*\(\s*([^)]+)\s*\)/i,
    );
    if (pkMatch) {
      pkCols.push(
        ...pkMatch[1].split(',').map(c => normalizeIdentifier(c.trim(), dialect)),
      );
      continue;
    }

    const fkMatch = trimmed.match(
      /^\s*(?:CONSTRAINT\s+\S+\s+)?FOREIGN\s+KEY\s*\(\s*([^)]+)\s*\)\s*REFERENCES\s+(\S+?)\s*\(\s*([^)]+)\s*\)\s*(.*)/i,
    );
    if (fkMatch) {
      const fkCols = fkMatch[1].split(',').map(c => normalizeIdentifier(c.trim(), dialect));
      const refTable = normalizeIdentifier(fkMatch[2], dialect);
      const refCols = fkMatch[3].split(',').map(c => normalizeIdentifier(c.trim(), dialect));
      const rest = fkMatch[4].toUpperCase();

      const fk: ForeignKey = {
        table: tableName,
        columns: fkCols,
        refTable,
        refColumns: refCols,
      };

      const onDeleteMatch = rest.match(/\bON\s+DELETE\s+(\S+)/i);
      if (onDeleteMatch) fk.onDelete = onDeleteMatch[1];

      const onUpdateMatch = rest.match(/\bON\s+UPDATE\s+(\S+)/i);
      if (onUpdateMatch) fk.onUpdate = onUpdateMatch[1];

      fks.push(fk);
      continue;
    }

    if (/^\s*(?:UNIQUE|CHECK|CONSTRAINT)\b/i.test(trimmed)) continue;

    const col = parseColumnDef(trimmed, dialect);
    if (col.name) {
      table.columns.push(col);
    }
  }

  for (const col of table.columns) {
    if (pkCols.includes(col.name)) {
      col.primaryKey = true;
      col.nullable = false;
    }
  }

  return {table, fks};
}

function parseCreateIndex(sql: string, dialect: Dialect): Index | null {
  const match = sql.match(
    /CREATE\s+(UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?(\S+?)\s+ON\s+(\S+?)\s*\(\s*([^)]+)\s*\)/i,
  );
  if (!match) return null;

  return {
    name: normalizeIdentifier(match[2], dialect),
    table: normalizeIdentifier(match[3], dialect),
    columns: match[4].split(',').map(c => normalizeIdentifier(c.trim(), dialect)),
    unique: !!match[1],
  };
}

export function detectDialect(sql: string): Dialect {
  const upper = sql;
  if (/\bAUTOINCREMENT\b/i.test(upper)) return 'sqlite';
  if (/\b(?:SMALL)?SERIAL\b|\bBIGSERIAL\b|\bIDENTITY\b/i.test(upper)) return 'postgres';
  if (/`[^`]+`/.test(upper) || /\bAUTO_INCREMENT\b/i.test(upper) || /\bENGINE\s*=/i.test(upper))
    return 'mysql';
  if (/\[[^\]]+\]/.test(upper)) return 'mssql';
  return 'sqlite';
}

export function parseSchema(sql: string, dialect: Dialect): ParsedSchema {
  const clean = stripComments(sql);
  const statements = splitStatements(clean);

  const schema: ParsedSchema = {tables: [], indexes: [], foreignKeys: []};

  for (const stmt of statements) {
    if (/^\s*CREATE\s+TABLE\b/i.test(stmt)) {
      const result = parseCreateTable(stmt, dialect);
      if (result) {
        schema.tables.push(result.table);
        schema.foreignKeys.push(...result.fks);
      }
      continue;
    }

    if (/^\s*CREATE\s+(?:UNIQUE\s+)?INDEX\b/i.test(stmt)) {
      const idx = parseCreateIndex(stmt, dialect);
      if (idx) schema.indexes.push(idx);
      continue;
    }
  }

  for (const table of schema.tables) {
    for (const col of table.columns) {
      if (col.references) {
        schema.foreignKeys.push({
          table: table.name,
          columns: [col.name],
          refTable: col.references.table,
          refColumns: [col.references.column],
        });
      }
    }
  }

  return schema;
}
