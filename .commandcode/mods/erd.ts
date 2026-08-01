import type {ModApi} from '@commandcode/harness';
import {registerCommands} from './erd/commands/index.ts';
import {registerTools} from './erd/tools.ts';
import {registerRenderer} from './erd/renderer.ts';
import {THEME_NAMES} from './erd/themes/index.ts';

export default function (cmd: ModApi): void {
  cmd.addFlag('erd-format', {
    type: 'string',
    default: 'mermaid',
    description: 'Default ERD output format: mermaid, dbml, ascii, json, plantuml, graphviz',
  });

  cmd.addFlag('erd-dialect', {
    type: 'string',
    default: 'sqlite',
    description: 'Default SQL dialect: sqlite, postgres, mysql, mssql',
  });

  cmd.addFlag('erd-theme', {
    type: 'string',
    default: 'shades-of-purple',
    description: `Color theme: ${THEME_NAMES.join(', ')}`,
  });

  registerCommands(cmd);
  registerTools(cmd);
  registerRenderer(cmd);
}
