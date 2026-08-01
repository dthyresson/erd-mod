import type {ModApi} from '@commandcode/harness';
import type {Dialect} from '../types.ts';
import {parseFlags, resolveSchemaPath, loadAndParse} from '../helpers.ts';

export function register(cmd: ModApi): void {
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
