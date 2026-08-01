import {defineTheme} from './config.ts';

// Light — white base (#FFFFFF) with near-black accent (#18181B).
export const lightTheme = defineTheme(
  'light',
  'White base with near-black accent',
  {
    accent: '#18181B', // near-black
    table: '#3B3B40', // dark gray
    column: '#52525B', // gray
    key: '#B45309', // amber
    fk: '#3B3B40', // dark gray
    unique: '#15803D', // green
    muted: '#71717A', // medium gray
    code: '#18181B', // near-black
    heading: 'bold',
    title: 'bold',
    separator: '#A1A1AA', // light gray
    dim: '#71717A', // medium gray
    text: '#09090B', // near-black
  },
);
