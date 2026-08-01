import {defineTheme} from './config.ts';

// Dark — near-black base (#090909) with a bright blue accent (#51ABF6).
export const darkTheme = defineTheme(
  'dark',
  'Near-black with bright blue accent',
  {
    accent: '#51ABF6', // bright blue
    table: '#51ABF6', // bright blue
    column: '#7DC4FB', // light blue
    key: '#F4D03F', // yellow
    fk: '#4C9BE8', // medium blue
    unique: '#8FE3A0', // green
    muted: '#8A8A8A', // gray
    code: '#51ABF6', // bright blue
    heading: 'bold',
    title: 'bold',
    separator: '#5A5A5A', // dark gray
    dim: '#8A8A8A', // gray
    text: '#EBEBEB', // near-white
  },
);
