// Minimal picocolors-style ANSI helper — zero dependencies, terminal-safe.
// Colors and styles are disabled when NO_COLOR is set or the stream isn't a TTY.
//
// Usage:
//   const c = color();
//   c.bold(c.cyan('Table: ') + c.green('users'));
//   c.dim('— 5 columns')
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

export function color(): Ansi {
  const api = {} as Ansi;
  for (const [name, code] of Object.entries(STYLE)) api[name as ColorStyle] = make(code);
  for (const [name, code] of Object.entries(FG)) api[name as ColorName] = make(code);
  for (const [name, code] of Object.entries(BG)) api[name] = make(code);
  api.reset = (s: string) => (enabled ? `\x1b[0m${s}\x1b[0m` : s);
  return api;
}

export const c = color();
