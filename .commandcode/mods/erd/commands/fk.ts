import type {ModApi} from '@commandcode/harness';
import type {Dialect} from '../types.ts';
import {parseFlags, resolveSchemaPath, loadAndParse} from '../helpers.ts';

export function register(cmd: ModApi): void {
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
}
