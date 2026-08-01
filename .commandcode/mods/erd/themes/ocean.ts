import {defineTheme} from './config.ts';

// Ocean — cool blues and teals with a soft cyan accent.
export const oceanTheme = defineTheme(
  'ocean',
  'Cool blues and teals',
  {
    accent: [0, 174, 219], // bright cyan
    table: [86, 156, 214], // soft blue
    column: [78, 201, 176], // teal
    key: [220, 220, 170], // pale yellow
    fk: [86, 156, 214], // soft blue
    unique: [78, 201, 176], // teal
    muted: [110, 118, 129], // slate
    code: [86, 156, 214], // soft blue
    heading: 'bold',
    title: 'bold',
    separator: [110, 118, 129], // slate
    dim: [110, 118, 129], // slate
    text: [206, 222, 232], // light blue-white
  },
);
