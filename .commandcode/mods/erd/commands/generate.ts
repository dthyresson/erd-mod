import type {ModApi} from '@commandcode/harness';
import type {Dialect, Format} from '../types.ts';
import {GENERATORS} from '../generators.ts';
import {parseFlags, resolveSchemaPath, loadAndParse} from '../helpers.ts';

export function register(cmd: ModApi): void {
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
}
