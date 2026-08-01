import type {Theme} from './types.ts';
import {DEFAULT_THEME} from './config.ts';
import {defaultTheme} from './default.ts';
import {oceanTheme} from './ocean.ts';
import {forestTheme} from './forest.ts';
import {sunsetTheme} from './sunset.ts';
import {monoTheme} from './mono.ts';
import {shadesOfPurpleTheme} from './shades-of-purple.ts';
import {shadesOfPurpleDarkTheme} from './shades-of-purple-dark.ts';
import {darkTheme} from './dark.ts';
import {lightTheme} from './light.ts';

// Registry of built-in themes, keyed by name. Add new themes here.
export const THEMES: Record<string, Theme> = {
  default: defaultTheme,
  ocean: oceanTheme,
  forest: forestTheme,
  sunset: sunsetTheme,
  mono: monoTheme,
  'shades-of-purple': shadesOfPurpleTheme,
  'shades-of-purple-dark': shadesOfPurpleDarkTheme,
  dark: darkTheme,
  light: lightTheme,
};

export const THEME_NAMES = Object.keys(THEMES);

export function getTheme(name: string | undefined): Theme {
  if (name && THEMES[name]) return THEMES[name];
  return THEMES[DEFAULT_THEME];
}
