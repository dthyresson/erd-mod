import {defineTheme} from './config.ts';

// Mono — monochrome, dim and subtle. Everything is shades of gray.
export const monoTheme = defineTheme(
  'mono',
  'Monochrome grayscale',
  {
    accent: 'white',
    table: 'white',
    column: 'gray',
    key: 'white',
    fk: 'gray',
    unique: 'white',
    muted: 'dim',
    code: 'gray',
    heading: 'bold',
    title: 'bold',
    separator: 'dim',
    dim: 'dim',
    text: 'white',
  },
);
