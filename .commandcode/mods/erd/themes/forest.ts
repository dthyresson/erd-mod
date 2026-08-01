import {defineTheme} from './config.ts';

// Forest — earthy greens and warm browns.
export const forestTheme = defineTheme(
  'forest',
  'Earthy greens and warm browns',
  {
    accent: [126, 198, 100], // leaf green
    table: [126, 198, 100], // leaf green
    column: [187, 224, 140], // light green
    key: [240, 198, 90], // golden
    fk: [126, 198, 100], // leaf green
    unique: [187, 224, 140], // light green
    muted: [130, 128, 110], // warm gray
    code: [126, 198, 100], // leaf green
    heading: 'bold',
    title: 'bold',
    separator: [130, 128, 110], // warm gray
    dim: [130, 128, 110], // warm gray
    text: [224, 220, 190], // cream
  },
);
