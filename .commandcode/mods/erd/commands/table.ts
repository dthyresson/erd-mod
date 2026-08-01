import type {ModApi} from '@commandcode/harness';
import type {Dialect} from '../types.ts';
import {parseFlags, resolveSchemaPath, loadAndParse} from '../helpers.ts';

export function register(cmd: ModApi): void {
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
}
