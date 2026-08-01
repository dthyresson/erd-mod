import type {Theme, ThemeColors} from './types.ts';

// ── Theme configuration ──────────────────────────────────────────────────────
//
// DEFAULT_COLORS declares the fallback semantic palette used when no theme is
// active (or when the chosen theme omits a role). Edit these to change the
// baseline look.
//
// A theme is a named set of semantic color roles. Roles accept any ColorSpec:
// a named ANSI color, a 256-color palette index, an RGB triple, or a hex
// string. See themes/ for the built-in palettes.

export const DEFAULT_COLORS: ThemeColors = {
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
};

// The theme used when `--mod-option erd-theme` is not set.
export const DEFAULT_THEME = 'shades-of-purple';

// Factory for defining a theme object (keeps config self-documenting).
export function defineTheme(name: string, description: string, colors: ThemeColors): Theme {
  return {name, description, colors};
}
