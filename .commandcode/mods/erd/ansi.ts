// Minimal picocolors-style ANSI helper — zero dependencies, terminal-safe.
// Colors and styles are disabled when NO_COLOR is set or the stream isn't a TTY.
//
// Usage:
//   const c = color();
//   c.bold(c.cyan('Table: ') + c.green('users'));
//   c.dim('— 5 columns')
//   c.ansi(196)('hot pink')          // 256-color palette
//   c.rgb(255, 87, 51)('orange')     // 24-bit true color
//   c.hex('#ff5733')('orange')       // hex shorthand
//   c.bg.ansi(52)('bg')              // 256-color background
//   c.bg.rgb(255, 0, 0)('red bg')
//   c.bg.hex('#ff0000')('red bg')
//
// Named styles: bold, dim, italic, underline, hidden, strikethrough
// Named colors:  black, red, green, yellow, blue, magenta, cyan, white, gray
// Bright variants:  brightRed, brightGreen, brightYellow, brightBlue,
//                   brightMagenta, brightCyan, brightWhite
// Backgrounds: bgBlack, bgRed, bgGreen, bgYellow, bgBlue, bgMagenta, bgCyan, bgWhite

export type ColorStyle = 'bold' | 'dim' | 'italic' | 'underline' | 'hidden' | 'strikethrough';
export type ColorName =
  | 'black'
  | 'red'
  | 'green'
  | 'yellow'
  | 'blue'
  | 'magenta'
  | 'cyan'
  | 'white'
  | 'gray'
  | 'brightRed'
  | 'brightGreen'
  | 'brightYellow'
  | 'brightBlue'
  | 'brightMagenta'
  | 'brightCyan'
  | 'brightWhite';

export type Ansi = {
  [K in ColorStyle | ColorName]: (s: string) => string;
} & {
  bgBlack: (s: string) => string;
  bgRed: (s: string) => string;
  bgGreen: (s: string) => string;
  bgYellow: (s: string) => string;
  bgBlue: (s: string) => string;
  bgMagenta: (s: string) => string;
  bgCyan: (s: string) => string;
  bgWhite: (s: string) => string;
  // 256-color palette (0–255)
  ansi: (code: number) => (s: string) => string;
  // 24-bit true color
  rgb: (r: number, g: number, b: number) => (s: string) => string;
  hex: (hex: string) => (s: string) => string;
  // Background variants of the extended palette
  bg: {
    ansi: (code: number) => (s: string) => string;
    rgb: (r: number, g: number, b: number) => (s: string) => string;
    hex: (hex: string) => (s: string) => string;
  };
  reset: (s: string) => string;
};

// SGR codes
const STYLE: Record<ColorStyle, string> = {
  bold: '1',
  dim: '2',
  italic: '3',
  underline: '4',
  hidden: '8',
  strikethrough: '9',
};

const FG: Record<ColorName, string> = {
  black: '30',
  red: '31',
  green: '32',
  yellow: '33',
  blue: '34',
  magenta: '35',
  cyan: '36',
  white: '37',
  gray: '90',
  brightRed: '91',
  brightGreen: '92',
  brightYellow: '93',
  brightBlue: '94',
  brightMagenta: '95',
  brightCyan: '96',
  brightWhite: '97',
};

const BG: Record<string, string> = {
  bgBlack: '40',
  bgRed: '41',
  bgGreen: '42',
  bgYellow: '43',
  bgBlue: '44',
  bgMagenta: '45',
  bgCyan: '46',
  bgWhite: '47',
};

const enabled =
  !process.env.NO_COLOR &&
  process.env.FORCE_COLOR !== '0' &&
  process.stdout.isTTY === true;

function make(code: string): (s: string) => string {
  if (!enabled) return (s: string) => s;
  return (s: string) => `\x1b[${code}m${s}\x1b[0m`;
}

function clamp(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)));
}

// Parse #rgb / #rrggbb (with or without leading #) into [r, g, b]
export function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace(/^#/, '');
  if (h.length === 3) h = h.split('').map(ch => ch + ch).join('');
  const num = parseInt(h, 16);
  if (Number.isNaN(num) || h.length !== 6) return [0, 0, 0];
  return [(num >> 16) & 0xff, (num >> 8) & 0xff, num & 0xff];
}

function parseHex(hex: string): [number, number, number] {
  return hexToRgb(hex);
}

export function color(): Ansi {
  const api = {} as Ansi;

  for (const [name, code] of Object.entries(STYLE)) api[name as ColorStyle] = make(code);
  for (const [name, code] of Object.entries(FG)) api[name as ColorName] = make(code);
  for (const [name, code] of Object.entries(BG)) api[name] = make(code);

  // 256-color / true-color foreground
  api.ansi = (code: number) => make(`38;5;${Math.max(0, Math.min(255, Math.round(code)))}`);
  api.rgb = (r: number, g: number, b: number) => make(`38;2;${clamp(r)};${clamp(g)};${clamp(b)}`);
  api.hex = (hex: string) => {
    const [r, g, b] = parseHex(hex);
    return api.rgb(r, g, b);
  };

  // 256-color / true-color background
  api.bg = {
    ansi: (code: number) => make(`48;5;${Math.max(0, Math.min(255, Math.round(code)))}`),
    rgb: (r: number, g: number, b: number) => make(`48;2;${clamp(r)};${clamp(g)};${clamp(b)}`),
    hex: (hex: string) => {
      const [r, g, b] = parseHex(hex);
      return api.bg.rgb(r, g, b);
    },
  };

  api.reset = (s: string) => (enabled ? `\x1b[0m${s}\x1b[0m` : s);
  return api;
}

export const c = color();
