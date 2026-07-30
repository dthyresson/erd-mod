import type {ModApi} from '@commandcode/harness';
import type {Dialect} from './types.ts';
import {detectDialect, parseSchema} from './parser.ts';

export function parseFlags(args: string): {flags: Record<string, string>; positional: string[]} {
  const flags: Record<string, string> = {};
  const positional: string[] = [];
  const tokens = args.match(/(?:--[^\s=]+(?:=[^\s]*)?|[^\s]+)/g) || [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.startsWith('--')) {
      const eqIdx = token.indexOf('=');
      if (eqIdx >= 0) {
        flags[token.slice(2, eqIdx)] = token.slice(eqIdx + 1);
      } else if (i + 1 < tokens.length && !tokens[i + 1].startsWith('--')) {
        flags[token.slice(2)] = tokens[i + 1];
        i++;
      } else {
        flags[token.slice(2)] = 'true';
      }
    } else {
      positional.push(token);
    }
  }

  return {flags, positional};
}

export function resolveSchemaPath(
  positional: string[],
): string {
  if (positional.length > 0) return positional[0];
  return 'schema/schema.sql';
}

export async function loadAndParse(
  filePath: string,
  cwd: string,
  dialect: Dialect,
  exec: ModApi['exec'],
): Promise<{schema: ReturnType<typeof parseSchema>; dialect: Dialect} | {error: string}> {
  try {
    const result = await exec({command: 'cat', args: [filePath], cwd});
    if (result.code !== 0) {
      return {error: `Could not read schema file: ${result.stderr || 'unknown error'}`};
    }
    const sql = result.stdout;
    if (!sql.trim()) return {error: `Schema file "${filePath}" is empty.`};

    const detected = detectDialect(sql);
    const finalDialect = dialect === 'sqlite' && detected !== 'sqlite' ? detected : dialect;

    const schema = parseSchema(sql, finalDialect);
    return {schema, dialect: finalDialect};
  } catch (e) {
    return {error: `Error reading schema: ${e}`};
  }
}
