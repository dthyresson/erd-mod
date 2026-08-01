import {defineTheme} from './config.ts';

// Default theme — bright, high-contrast palette with cyan/green/yellow accents.
export const defaultTheme = defineTheme(
  'default',
  'Bright, high-contrast default palette',
  {
    accent: 'cyan',
    table: 'cyan',
    column: 'green',
    key: 'yellow',
    fk: 'cyan',
    unique: 'green',
    muted: 'dim',
    code: 'cyan',
    heading: 'bold',
    title: 'bold',
    separator: 'dim',
    dim: 'dim',
    text: 'white',
  },
);
