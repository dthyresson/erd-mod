import type {ModApi} from '@commandcode/harness';
import {register as registerGenerate} from './generate.ts';
import {register as registerTables} from './tables.ts';
import {register as registerIndexes} from './indexes.ts';
import {register as registerFk} from './fk.ts';
import {register as registerTable} from './table.ts';
import {register as registerFind} from './find.ts';
import {register as registerAbout} from './about.ts';
import {register as registerDescribe} from './describe.ts';

export function registerCommands(cmd: ModApi): void {
  registerGenerate(cmd);
  registerTables(cmd);
  registerIndexes(cmd);
  registerFk(cmd);
  registerTable(cmd);
  registerFind(cmd);
  registerAbout(cmd);
  registerDescribe(cmd);
}
