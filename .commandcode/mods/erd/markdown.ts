import {t} from './theme.ts';

// Render a markdown string as styled terminal lines.
//
// Handles the markdown constructs the ERD mod's query functions emit:
//   **Bold text**        → bold heading (styled with the theme's heading role)
//   - **bold** item      → bullet list, bold lead, inline code styled
//   `code`               → code role (cyan by default)
//   | a | b |            → markdown table; the `|---|` separator row is dropped
//   > note               → muted blockquote
//
// Anything unrecognized passes through verbatim. Lines come back without
// trailing escape codes, so they're safe to print directly.

const INLINE = /\*\*(.+?)\*\*|`([^`]+)`/g;

function inline(text: string): string {
  return text.replace(INLINE, (m, bold, code) => {
    if (bold !== undefined) return t.bold(bold);
    return t.code(code);
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
  return cells.join('  ' + t.separator('|') + '  ');
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
      out.push(t.muted(line.trimStart().replace(/^>\s?/, '')));
      continue;
    }

    // Bullet list: `- **bold** rest` → `  • bold rest`
    const bullet = line.match(/^(\s*)-\s+(.*)$/);
    if (bullet) {
      const [, indent, rest] = bullet;
      out.push(`${indent}${t.separator('•')} ${inline(rest)}`);
      continue;
    }

    // Headings: `**Text**` or `**Text:**` (all-bold line)
    const heading = line.match(/^\*\*(.+?)\*\*:?$/);
    if (heading) {
      out.push(t.heading(inline(heading[1])));
      continue;
    }

    // Plain line with inline styling
    out.push(inline(line));
  }

  return out;
}
