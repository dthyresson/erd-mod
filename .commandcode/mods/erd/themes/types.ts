import type {ColorName, ColorStyle} from '../ansi.ts';

// A theme color can be any of:
//   - a named ANSI color ('cyan')
//   - a 256-color palette index (0–255)
//   - an RGB triple ([r, g, b])
//   - a hex string ('#ff5733' or '#f53')
export type ColorSpec = ColorName | number | [number, number, number] | string;

// Semantic color roles used across the ERD renderers.
export interface ThemeColors {
  // Accent / primary color (diagram format, titles)
  accent: ColorSpec;
  // Table names / entities
  table: ColorSpec;
  // Column names
  column: ColorSpec;
  // Primary key badges
  key: ColorSpec;
  // Foreign key badges / references
  fk: ColorSpec;
  // Unique badges
  unique: ColorSpec;
  // Muted / secondary text (metadata, counts)
  muted: ColorSpec;
  // Inline code
  code: ColorSpec;
  // Bold headings
  heading: ColorSpec;
  // General highlighted text
  title: ColorSpec;
  // Separator / subtle markers
  separator: ColorSpec;
  // Dim (secondary) text
  dim: ColorSpec;
  // Plain text
  text: ColorSpec;
}

export interface Theme {
  name: string;
  description: string;
  colors: ThemeColors;
}
