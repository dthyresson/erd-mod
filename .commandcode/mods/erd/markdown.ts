import {c} from './ansi.ts';

// Render a markdown string as styled terminal lines.
//
// Handles the markdown constructs the ERD mod's query functions emit:
//   **Bold text**        → bold (a line that is entirely bold is a heading)
//   - **bold** item      → bullet list, bold lead, inline code styled
//   `code`               → cyan
//   | a | b |            → markdown table; the `|---|` separator row is dropped
//   > note               → dim blockquote
//
// Anything unrecognized passes through verbatim. Lines come back without
// trailing escape codes, so they're safe to print directly.

const INLINE = /\*\*(.+?)\*\*|`([^`]+)`/g;

function inline(text: string): string {
  return text.replace(INLINE, (m, bold, code) => {
    if (bold !== undefined) return c.bold(bold);
    return c.cyan(code);
  });
}

function isTableSeparator(line: string): boolean {
  return /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(line) && line.includes('-');
}

function renderTableRow(line: string): string {
  const cells = line
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map(cell => inline(cell.trim()));
  return cells.join('  ' + c.dim('|') + '  ');
}

export function renderMarkdown(md: string): string[] {
  const out: string[] = [];

  for (const raw of md.split('\n')) {
    const line = raw.trimEnd();

    if (!line.trim()) {
      out.push('');
      continue;
    }

    // Table rows
    if (line.trim().startsWith('|')) {
      if (isTableSeparator(line)) continue; // drop the |---|---| header separator
      out.push(renderTableRow(line));
      continue;
    }

    // Blockquote
    if (line.trimStart().startsWith('>')) {
      out.push(c.dim(line.trimStart().replace(/^>\s?/, '')));
      continue;
    }

    // Bullet list: `- **bold** rest` → `  • bold rest`
    const bullet = line.match(/^(\s*)-\s+(.*)$/);
    if (bullet) {
      const [, indent, rest] = bullet;
      out.push(`${indent}${c.dim('•')} ${inline(rest)}`);
      continue;
    }

    // Headings: `**Text**` or `**Text:**` (all-bold line)
    const heading = line.match(/^\*\*(.+?)\*\*:?$/);
    if (heading) {
      out.push(c.bold(inline(heading[1])));
      continue;
    }

    // Plain line with inline styling
    out.push(inline(line));
  }

  return out;
}
