import {defineTheme} from './config.ts';

// Sunset — warm oranges and pinks.
export const sunsetTheme = defineTheme(
  'sunset',
  'Warm oranges and pinks',
  {
    accent: [255, 121, 98], // coral
    table: [255, 143, 128], // soft coral
    column: [255, 204, 128], // peach
    key: [255, 220, 90], // yellow
    fk: [255, 143, 128], // soft coral
    unique: [255, 204, 128], // peach
    muted: [150, 130, 120], // dusty rose-gray
    code: [255, 121, 98], // coral
    heading: 'bold',
    title: 'bold',
    separator: [150, 130, 120], // dusty rose-gray
    dim: [150, 130, 120], // dusty rose-gray
    text: [255, 235, 220], // cream
  },
);
