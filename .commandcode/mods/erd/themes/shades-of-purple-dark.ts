import {defineTheme} from './config.ts';

// Shades of Purple Dark — deeper, more saturated purples on a near-black base.
export const shadesOfPurpleDarkTheme = defineTheme(
  'shades-of-purple-dark',
  'Deep saturated purples on near-black',
  {
    accent: '#FAD000', // yellow accent (kept)
    table: '#9A6BFF', // vivid purple
    column: '#C4A3FF', // lavender
    key: '#FFD54F', // soft gold
    fk: '#7C4DFF', // deep violet
    unique: '#B388FF', // light purple
    muted: '#6B5B95', // muted violet
    code: '#9A6BFF', // vivid purple
    heading: 'bold',
    title: 'bold',
    separator: '#4A3A8C', // dark violet
    dim: '#6B5B95', // muted violet
    text: '#EDE7F6', // near-white lavender
  },
);
