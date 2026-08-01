import {c} from './ansi.ts';
import type {ColorSpec, Theme, ThemeColors} from './themes/types.ts';
import {DEFAULT_COLORS, DEFAULT_THEME} from './themes/config.ts';
import {getTheme} from './themes/index.ts';

// Theme runtime. Holds the active theme and exposes semantic role helpers:
//   t.table('users')   → styled with the theme's "table" role
//   t.bold(...), t.dim(...)  → style helpers (always available)
//
// setTheme(name) switches the active theme for all subsequent renders.
// Each role resolves the theme's ColorSpec on every call, so switching themes
// is picked up immediately. Roles fall back to DEFAULT_COLORS when the theme
// omits them. A ColorSpec can be a named ANSI color/style ('cyan', 'dim',
// 'bold'), a 256-color index, an RGB triple, or a hex string.

type RoleFn = (s: string) => string;

export interface ThemeApi {
  readonly name: string;
  readonly description: string;
  /** Semantic color roles — one function per ThemeColors key. */
  [role: string]: RoleFn | string;
  /** Style helpers. */
  bold: RoleFn;
  dim: RoleFn;
  italic: RoleFn;
  underline: RoleFn;
}

let current: Theme = getTheme(DEFAULT_THEME);

function resolve(spec: ColorSpec): RoleFn {
  if (typeof spec === 'string') {
    if (spec.startsWith('#')) return c.hex(spec);
    const fn = (c as Record<string, (s: string) => string>)[spec];
    if (fn) return fn;
    return c.white;
  }
  if (typeof spec === 'number') return c.ansi(spec);
  if (Array.isArray(spec)) return c.rgb(spec[0], spec[1], spec[2]);
  return c.white;
}

export function setTheme(name: string | undefined): void {
  current = getTheme(name);
}

export function getThemeName(): string {
  return current.name;
}

export function getThemeDescription(): string {
  return current.description;
}

export const t: ThemeApi = {
  get name() {
    return current.name;
  },
  get description() {
    return current.description;
  },
};

// Populate role helpers. Each role resolves the theme color (falling back to
// DEFAULT_COLORS) on every call, so theme switches take effect immediately.
for (const role of Object.keys(DEFAULT_COLORS) as (keyof ThemeColors)[]) {
  Object.defineProperty(t, role, {
    enumerable: true,
    get() {
      const spec = current.colors[role] ?? DEFAULT_COLORS[role];
      return resolve(spec);
    },
  });
}

// Style helpers (bold/dim/italic/underline always available). `dim` is already
// a theme role (its default ColorSpec is the dim style), so only assign styles
// that aren't theme roles.
const STYLE_HELPERS: Record<string, RoleFn> = {
  bold: s => c.bold(s),
  dim: s => c.dim(s),
  italic: s => c.italic(s),
  underline: s => c.underline(s),
};
for (const [name, fn] of Object.entries(STYLE_HELPERS)) {
  if (!(name in t)) (t as Record<string, unknown>)[name] = fn;
}
