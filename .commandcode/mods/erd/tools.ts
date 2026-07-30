import type {ModApi} from '@commandcode/harness';
import type {Dialect, Format} from './types.ts';
import {GENERATORS} from './generators.ts';
import {detectDialect, parseSchema} from './parser.ts';
import {
  listTables,
  listIndexes,
  listForeignKeys,
  findColumn,
  schemaSummary,
  describeTable,
} from './queries.ts';

export function registerTools(cmd: ModApi): void {
  // ── erd_generate ───────────────────────────────────────────────────────────────

  cmd.addTool({
    schema: {
      name: 'erd_generate',
      description:
        'Generate an ERD (Entity-Relationship Diagram) from a SQL schema file. Supports Mermaid, DBML, ASCII, JSON, PlantUML, and Graphviz formats.',
      input_schema: {
        type: 'object',
        properties: {
          file: {
            type: 'string',
            description: 'Path to the SQL schema file (default: schema/schema.sql)',
          },
          format: {
            type: 'string',
            enum: ['mermaid', 'dbml', 'ascii', 'json', 'plantuml', 'graphviz'],
            description: 'Output format for the ERD',
          },
          dialect: {
            type: 'string',
            enum: ['sqlite', 'postgres', 'mysql', 'mssql'],
            description: 'SQL dialect of the schema file',
          },
        },
        required: [],
      },
    },
    readOnly: true,
    run: async ({input}) => {
      const filePath = (typeof input.file === 'string' ? input.file : '') || 'schema/schema.sql';
      const format = (typeof input.format === 'string' ? input.format : 'mermaid') as Format;
      const dialect = (typeof input.dialect === 'string' ? input.dialect : 'sqlite') as Dialect;

      if (!GENERATORS[format]) {
        return {
          ok: false,
          error: `Unknown format "${format}". Supported: ${Object.keys(GENERATORS).join(', ')}`,
        };
      }

      try {
        const result = await cmd.exec({command: 'cat', args: [filePath]});
        if (result.code !== 0) {
          return {ok: false, error: `Could not read schema: ${result.stderr}`};
        }

        const sql = result.stdout;
        if (!sql.trim()) return {ok: false, error: `Schema file "${filePath}" is empty.`};

        const detected = detectDialect(sql);
        const finalDialect = dialect === 'sqlite' && detected !== 'sqlite' ? detected : dialect;
        const schema = parseSchema(sql, finalDialect);

        const erd = GENERATORS[format](schema);

        return {
          ok: true,
          content: [
            {
              type: 'text',
              text: [
                `Generated ${format.toUpperCase()} ERD from ${filePath} (dialect: ${finalDialect})`,
                `${schema.tables.length} tables · ${schema.indexes.length} indexes · ${schema.foreignKeys.length} FKs`,
                '',
                erd,
              ].join('\n'),
            },
          ],
        };
      } catch (e) {
        return {ok: false, error: `Failed to generate ERD: ${e}`};
      }
    },
  });

  // ── erd_query ──────────────────────────────────────────────────────────────────

  cmd.addTool({
    schema: {
      name: 'erd_query',
      description:
        'Query a SQL schema to list tables, indexes, foreign keys, find columns by name, describe a table, or get a schema summary.',
      input_schema: {
        type: 'object',
        properties: {
          file: {
            type: 'string',
            description: 'Path to the SQL schema file (default: schema/schema.sql)',
          },
          query: {
            type: 'string',
            enum: ['tables', 'indexes', 'foreign_keys', 'find_column', 'summary', 'table'],
            description: 'Type of query to run against the schema',
          },
          column_name: {
            type: 'string',
            description: 'Column name to search for (required when query=find_column)',
          },
          table_name: {
            type: 'string',
            description: 'Table name to describe (required when query=table)',
          },
          dialect: {
            type: 'string',
            enum: ['sqlite', 'postgres', 'mysql', 'mssql'],
            description: 'SQL dialect of the schema file',
          },
        },
        required: ['query'],
      },
    },
    readOnly: true,
    run: async ({input}) => {
      const filePath = (typeof input.file === 'string' ? input.file : '') || 'schema/schema.sql';
      const query = (typeof input.query === 'string' ? input.query : 'summary') as string;
      const columnName = typeof input.column_name === 'string' ? input.column_name : '';
      const tableName = typeof input.table_name === 'string' ? input.table_name : '';
      const dialect = (typeof input.dialect === 'string' ? input.dialect : 'sqlite') as Dialect;

      try {
        const result = await cmd.exec({command: 'cat', args: [filePath]});
        if (result.code !== 0) {
          return {ok: false, error: `Could not read schema: ${result.stderr}`};
        }

        const sql = result.stdout;
        if (!sql.trim()) return {ok: false, error: `Schema file "${filePath}" is empty.`};

        const detected = detectDialect(sql);
        const finalDialect = dialect === 'sqlite' && detected !== 'sqlite' ? detected : dialect;
        const schema = parseSchema(sql, finalDialect);

        let output: string;
        switch (query) {
          case 'tables':
            output = listTables(schema);
            break;
          case 'indexes':
            output = listIndexes(schema);
            break;
          case 'foreign_keys':
            output = listForeignKeys(schema);
            break;
          case 'find_column':
            if (!columnName) {
              return {ok: false, error: 'column_name is required when query=find_column'};
            }
            output = findColumn(schema, columnName);
            break;
          case 'table':
            if (!tableName) {
              return {ok: false, error: 'table_name is required when query=table'};
            }
            output = describeTable(schema, tableName, finalDialect);
            break;
          case 'summary':
            output = schemaSummary(schema, finalDialect);
            break;
          default:
            return {ok: false, error: `Unknown query type: ${query}`};
        }

        return {
          ok: true,
          content: [{type: 'text', text: output}],
        };
      } catch (e) {
        return {ok: false, error: `Failed to query schema: ${e}`};
      }
    },
  });
}
