import type {ModApi} from '@commandcode/harness';
import type {Dialect, Format} from './types.ts';
import {GENERATORS, FORMAT_LABELS} from './generators.ts';
import {parseFlags, resolveSchemaPath, loadAndParse} from './helpers.ts';
import {listTables} from './queries.ts';

export function registerCommands(cmd: ModApi): void {
  // ── /erd-generate ──────────────────────────────────────────────────────────────

  cmd.addCommand({
    name: 'erd-generate',
    description: 'Generate an ERD from a SQL schema file',
    argumentHint: '[file] [--format=mermaid|dbml|ascii|json|plantuml|graphviz] [--dialect=sqlite|postgres|mysql|mssql]',
    handler: async ({args, cwd, exec}) => {
      const {flags, positional} = parseFlags(args);
      const filePath = resolveSchemaPath(positional);
      const format = (flags.format || cmd.getFlag('erd-format') || 'mermaid') as Format;
      const dialect = (flags.dialect || cmd.getFlag('erd-dialect') || 'sqlite') as Dialect;

      if (!GENERATORS[format]) {
        return {message: `Unknown format "${format}". Supported: ${Object.keys(GENERATORS).join(', ')}`};
      }

      const result = await loadAndParse(filePath, cwd, dialect, exec);
      if ('error' in result) return {message: result.error};

      const erd = GENERATORS[format](result.schema);

      // File extensions per format
      const extensions: Record<Format, string> = {
        mermaid: 'md',
        dbml: 'dbml',
        ascii: 'txt',
        json: 'json',
        plantuml: 'puml',
        graphviz: 'dot',
      };

      // Save to erd/ directory with timestamp
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      const outDir = `${cwd}/erd`;
      const outFile = `${outDir}/erd-${ts}.${extensions[format]}`;

      let saved = false;
      try {
        await exec({command: 'sh', args: ['-c', `mkdir -p "${outDir}" && cat > "${outFile}" << 'ERDEOF'
${erd}
ERDEOF`]});
        saved = true;
      } catch {}

      // Copy to clipboard (macOS)
      try {
        const tmpFile = `${cwd}/.commandcode/.erd-copy`;
        await exec({command: 'sh', args: ['-c', `cat > "${tmpFile}" << 'ERDEOF'
${erd}
ERDEOF`]});
        await exec({command: 'sh', args: ['-c', `cat "${tmpFile}" | pbcopy && rm "${tmpFile}"`]});
      } catch {}

      const statusParts: string[] = [];
      if (saved) statusParts.push(`saved to \`${outFile}\``);
      statusParts.push('copied to clipboard');

      cmd.showEntry('erd-diagram', {
        format,
        dialect: result.dialect,
        tables: result.schema.tables.length,
        indexes: result.schema.indexes.length,
        foreignKeys: result.schema.foreignKeys.length,
        content: erd,
      });

      cmd.showEntry('erd-markdown', {content: statusParts.join(', ')});
    },
  });

  // ── /erd-tables ────────────────────────────────────────────────────────────────

  cmd.addCommand({
    name: 'erd-tables',
    description: 'List all tables in a SQL schema file',
    argumentHint: '[file] [--dialect=sqlite|postgres|mysql|mssql]',
    handler: async ({args, cwd, exec}) => {
      const {flags, positional} = parseFlags(args);
      const filePath = resolveSchemaPath(positional);
      const dialect = (flags.dialect || cmd.getFlag('erd-dialect') || 'sqlite') as Dialect;

      const result = await loadAndParse(filePath, cwd, dialect, exec);
      if ('error' in result) return {message: result.error};

      cmd.showEntry('erd-markdown', {content: listTables(result.schema)});
    },
  });

  // ── /erd-indexes ───────────────────────────────────────────────────────────────

  cmd.addCommand({
    name: 'erd-indexes',
    description: 'List all indexes in a SQL schema file',
    argumentHint: '[file] [--dialect=sqlite|postgres|mysql|mssql]',
    handler: async ({args, cwd, exec}) => {
      const {flags, positional} = parseFlags(args);
      const filePath = resolveSchemaPath(positional);
      const dialect = (flags.dialect || cmd.getFlag('erd-dialect') || 'sqlite') as Dialect;

      const result = await loadAndParse(filePath, cwd, dialect, exec);
      if ('error' in result) return {message: result.error};

      cmd.showEntry('erd-indexes', {
        dialect: result.dialect,
        indexes: result.schema.indexes,
      });
    },
  });

  // ── /erd-fk ────────────────────────────────────────────────────────────────────

  cmd.addCommand({
    name: 'erd-fk',
    description: 'List all foreign key relationships in a SQL schema file',
    argumentHint: '[file] [--dialect=sqlite|postgres|mysql|mssql]',
    handler: async ({args, cwd, exec}) => {
      const {flags, positional} = parseFlags(args);
      const filePath = resolveSchemaPath(positional);
      const dialect = (flags.dialect || cmd.getFlag('erd-dialect') || 'sqlite') as Dialect;

      const result = await loadAndParse(filePath, cwd, dialect, exec);
      if ('error' in result) return {message: result.error};

      cmd.showEntry('erd-fk-map', {
        dialect: result.dialect,
        foreignKeys: result.schema.foreignKeys,
      });
    },
  });

  // ── /erd-table ─────────────────────────────────────────────────────────────────

  cmd.addCommand({
    name: 'erd-table',
    description: 'Describe a table — columns, indexes, and foreign keys',
    argumentHint: '<table-name> [file] [--dialect=sqlite|postgres|mysql|mssql]',
    handler: async ({args, cwd, exec}) => {
      const {flags, positional} = parseFlags(args);

      if (positional.length === 0) {
        return {message: 'Usage: /erd-table <table-name> [file] [--dialect=...]'};
      }

      const tableName = positional[0];
      const filePath = positional.length > 1 ? positional[1] : resolveSchemaPath([]);
      const dialect = (flags.dialect || cmd.getFlag('erd-dialect') || 'sqlite') as Dialect;

      const result = await loadAndParse(filePath, cwd, dialect, exec);
      if ('error' in result) return {message: result.error};

      const schema = result.schema;
      const table = schema.tables.find(
        t => t.name.toLowerCase() === tableName.toLowerCase(),
      );
      if (!table) return {message: `Table "${tableName}" not found.`};

      const indexes = schema.indexes.filter(
        i => i.table.toLowerCase() === tableName.toLowerCase(),
      );
      const outgoingFks = schema.foreignKeys.filter(
        fk => fk.table.toLowerCase() === tableName.toLowerCase(),
      );
      const incomingFks = schema.foreignKeys.filter(
        fk => fk.refTable.toLowerCase() === tableName.toLowerCase(),
      );

      cmd.showEntry('erd-table', {
        tableName: table.name,
        columns: table.columns,
        indexes,
        outgoingFks,
        incomingFks,
        dialect: result.dialect,
      });
    },
  });

  // ── /erd-find ──────────────────────────────────────────────────────────────────

  cmd.addCommand({
    name: 'erd-find',
    description: 'Find a column by name across all tables',
    argumentHint: '<column-name> [file] [--dialect=sqlite|postgres|mysql|mssql]',
    handler: async ({args, cwd, exec}) => {
      const {flags, positional} = parseFlags(args);

      if (positional.length === 0) {
        return {message: 'Usage: /erd-find <column-name> [file] [--dialect=...]'};
      }

      const query = positional[0];
      const filePath = positional.length > 1 ? positional[1] : resolveSchemaPath([]);
      const dialect = (flags.dialect || cmd.getFlag('erd-dialect') || 'sqlite') as Dialect;

      const result = await loadAndParse(filePath, cwd, dialect, exec);
      if ('error' in result) return {message: result.error};

      const q = query.toLowerCase();
      const matches: {
        tableName: string;
        columnName: string;
        type: string;
        nullable: boolean;
        primaryKey: boolean;
        unique: boolean;
        autoIncrement: boolean;
        defaultValue?: string;
        references?: {table: string; column: string};
      }[] = [];

      for (const table of result.schema.tables) {
        for (const col of table.columns) {
          if (col.name.toLowerCase().includes(q)) {
            matches.push({
              tableName: table.name,
              columnName: col.name,
              type: col.type,
              nullable: col.nullable,
              primaryKey: col.primaryKey,
              unique: col.unique,
              autoIncrement: col.autoIncrement,
              defaultValue: col.defaultValue,
              references: col.references,
            });
          }
        }
      }

      cmd.showEntry('erd-columns', {
        dialect: result.dialect,
        query,
        columns: matches,
      });
    },
  });

  // ── /erd-about ─────────────────────────────────────────────────────────────────

  cmd.addCommand({
    name: 'erd-about',
    description: 'Show schema summary and statistics',
    argumentHint: '[file] [--dialect=sqlite|postgres|mysql|mssql]',
    handler: async ({args, cwd, exec}) => {
      const {flags, positional} = parseFlags(args);
      const filePath = resolveSchemaPath(positional);
      const dialect = (flags.dialect || cmd.getFlag('erd-dialect') || 'sqlite') as Dialect;

      const result = await loadAndParse(filePath, cwd, dialect, exec);
      if ('error' in result) return {message: result.error};

      const totalColumns = result.schema.tables.reduce(
        (sum, t) => sum + t.columns.length,
        0,
      );
      const primaryKeys = result.schema.tables.reduce(
        (sum, t) => sum + t.columns.filter(c => c.primaryKey).length,
        0,
      );
      const foreignKeyColumns = result.schema.tables.reduce(
        (sum, t) => sum + t.columns.filter(c => c.references).length,
        0,
      );

      cmd.showEntry('erd-summary', {
        dialect: result.dialect,
        tables: result.schema.tables.length,
        indexes: result.schema.indexes.length,
        foreignKeys: result.schema.foreignKeys.length,
        totalColumns,
        primaryKeys,
        foreignKeyColumns,
      });
    },
  });

  // ── /erd-describe (alias for /erd-about) ───────────────────────────────────────

  cmd.addCommand({
    name: 'erd-describe',
    description: 'Describe the database schema (alias for /erd-about)',
    argumentHint: '[file] [--dialect=sqlite|postgres|mysql|mssql]',
    handler: async ({args, cwd, exec}) => {
      const {flags, positional} = parseFlags(args);
      const filePath = resolveSchemaPath(positional);
      const dialect = (flags.dialect || cmd.getFlag('erd-dialect') || 'sqlite') as Dialect;

      const result = await loadAndParse(filePath, cwd, dialect, exec);
      if ('error' in result) return {message: result.error};

      const totalColumns = result.schema.tables.reduce(
        (sum, t) => sum + t.columns.length,
        0,
      );
      const primaryKeys = result.schema.tables.reduce(
        (sum, t) => sum + t.columns.filter(c => c.primaryKey).length,
        0,
      );
      const foreignKeyColumns = result.schema.tables.reduce(
        (sum, t) => sum + t.columns.filter(c => c.references).length,
        0,
      );

      cmd.showEntry('erd-summary', {
        dialect: result.dialect,
        tables: result.schema.tables.length,
        indexes: result.schema.indexes.length,
        foreignKeys: result.schema.foreignKeys.length,
        totalColumns,
        primaryKeys,
        foreignKeyColumns,
      });
    },
  });
}
