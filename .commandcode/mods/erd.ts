import type {ModApi} from '@commandcode/harness';
import {registerCommands} from './erd/commands.ts';
import {registerTools} from './erd/tools.ts';
import {registerRenderer} from './erd/renderer.ts';

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

  registerCommands(cmd);
  registerTools(cmd);
  registerRenderer(cmd);
}
