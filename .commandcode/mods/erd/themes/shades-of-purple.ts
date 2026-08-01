import {defineTheme} from './config.ts';

// Shades of Purple — violet and lavender on a dark navy base (#191830).
// Accent is the yellow (#FAD000) from the palette.
export const shadesOfPurpleTheme = defineTheme(
  'shades-of-purple',
  'Shades of purple and violet on dark navy',
  {
    accent: '#FAD000', // yellow accent
    table: '#B388FF', // light purple
    column: '#D1A3FF', // lilac
    key: '#FFD54F', // soft gold
    fk: '#9575CD', // medium purple
    unique: '#CE93D8', // orchid
    muted: '#8C7BB0', // muted lavender
    code: '#B388FF', // light purple
    heading: 'bold',
    title: 'bold',
    separator: '#6A5ACD', // slate blue-purple
    dim: '#8C7BB0', // muted lavender
    text: '#EDE7F6', // near-white lavender
  },
);
