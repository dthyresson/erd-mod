import type {ModApi} from '@commandcode/harness';
import type {Dialect} from '../types.ts';
import {parseFlags, resolveSchemaPath, loadAndParse} from '../helpers.ts';

export function register(cmd: ModApi): void {
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
}
