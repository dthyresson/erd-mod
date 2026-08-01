# ERD Mod — Schema Visualizer

A Command Code mod that parses SQL schema files and generates Entity-Relationship Diagrams in multiple formats, plus schema query and inspection commands.

## Project Structure

```
.commandcode/mods/
├── erd.ts                          # Entry point — flags, commands, tools, renderer
└── erd/
    ├── types.ts                    # Column, Table, ForeignKey, ParsedSchema, Dialect, Format
    ├── parser.ts                   # SQL parsing: CREATE TABLE, CREATE INDEX, dialect detection
    ├── generators.ts               # ERD output: Mermaid, DBML, ASCII, JSON, PlantUML, Graphviz
    ├── queries.ts                  # listTables, listIndexes, listForeignKeys, findColumn, schemaSummary, describeTable
    ├── helpers.ts                  # Flag parsing, schema path resolution, schema file loading
    ├── commands/                   # One file per slash command
    │   ├── index.ts                # Registry: registerCommands() wires all commands
    │   ├── generate.ts             # /erd-generate
    │   ├── tables.ts               # /erd-tables
    │   ├── indexes.ts              # /erd-indexes
    │   ├── fk.ts                   # /erd-fk
    │   ├── table.ts                # /erd-table
    │   ├── find.ts                 # /erd-find
    │   ├── about.ts                # /erd-about
    │   └── describe.ts             # /erd-describe
    ├── tools.ts                    # All model-callable tool registrations
    ├── renderer.ts                 # Custom feed renderers for command output
    ├── markdown.ts                 # Markdown → styled feed lines (bold, bullets, inline code, tables)
    ├── theme.ts                    # Theme runtime (setTheme, t.* semantic roles)
    ├── ansi.ts                     # Picocolors-style ANSI color/style helpers (zero-dep)
    └── themes/
        ├── types.ts                # ThemeColors roles + ColorSpec (name | 256 | rgb | hex)
        ├── config.ts               # DEFAULT_COLORS + DEFAULT_THEME + defineTheme()
        ├── index.ts                # THEMES registry (name → Theme)
        ├── default.ts              # Bright cyan/green/yellow palette
        ├── ocean.ts                # Cool blues and teals
        ├── forest.ts               # Earthy greens and warm browns
        ├── sunset.ts               # Warm oranges and pinks
        ├── mono.ts                 # Monochrome grayscale
        ├── shades-of-purple.ts     # Violet/lavender on dark navy (default)
        ├── shades-of-purple-dark.ts # Deep saturated purples on near-black
        ├── dark.ts                 # Near-black with bright blue accent
        └── light.ts                # White base with near-black accent
```

## Supported SQL Dialects

| Dialect | Detected by |
|---------|-------------|
| `sqlite` | `AUTOINCREMENT`, default |
| `postgres` | `SERIAL`, `BIGSERIAL`, `IDENTITY` |
| `mysql` | backtick identifiers, `AUTO_INCREMENT`, `ENGINE=` |
| `mssql` | bracket identifiers `[name]` |

Auto-detection runs unless you explicitly pass `--dialect`.

## Slash Commands

### `/erd-generate` — Generate an ERD

```
/erd-generate [file] [--format=<fmt>] [--dialect=<dialect>]
```

Generates an ERD, saves it to `erd/erd-<timestamp>.md` (or `.dbml`/`.json`/etc. per format), copies the output to clipboard, and displays it in the feed. Defaults to `schema/schema.sql` with Mermaid output.

### `/erd-tables` — List all tables

```
/erd-tables [file] [--dialect=<dialect>]
```

Shows each table with column count and primary key columns.

### `/erd-table` — Describe a specific table

```
/erd-table <table-name> [file] [--dialect=<dialect>]
```

Renders a formatted table view with columns, types, nullability, PK/FK badges, defaults, auto-increment, plus indexes and foreign keys (outgoing and incoming).

### `/erd-indexes` — List all indexes

```
/erd-indexes [file] [--dialect=<dialect>]
```

### `/erd-fk` — List all foreign key relationships

```
/erd-fk [file] [--dialect=<dialect>]
```

### `/erd-find` — Search for a column by name

```
/erd-find <column-name> [file] [--dialect=<dialect>]
```

Searches across all tables and reports which table each matching column belongs to.

### `/erd-about` — Schema summary and statistics

```
/erd-about [file] [--dialect=<dialect>]
```

Shows database type, table/index/FK counts, total columns, primary keys, and foreign key columns.

### `/erd-describe` — Alias for `/erd-about`

```
/erd-describe [file] [--dialect=<dialect>]
```

## Output

`/erd-generate` saves output to the `erd/` directory in the project root, with timestamped filenames for uniqueness:

```
erd/erd-2026-07-30T10-45-00-000Z.md      # Mermaid (.md)
erd/erd-2026-07-30T11-22-00-000Z.dbml    # DBML
erd/erd-2026-07-30T12-00-00-000Z.txt     # ASCII
erd/erd-2026-07-30T12-00-00-000Z.json    # JSON
erd/erd-2026-07-30T12-00-00-000Z.puml    # PlantUML
erd/erd-2026-07-30T12-00-00-000Z.dot     # Graphviz
```

Output is also copied to the clipboard (macOS).

## Output Formats

### Mermaid (`--format=mermaid`)

Rendered natively by GitHub/GitLab markdown. The output is a fenced `mermaid` code block ready to paste.

**How to view:** Paste into any `.md` file, use the [Mermaid Live Editor](https://mermaid.live), or install the VS Code "Mermaid Preview" extension.

### DBML (`--format=dbml`)

Database Markup Language — renders on [dbdiagram.io](https://dbdiagram.io).

**How to view:** Paste into [dbdiagram.io](https://dbdiagram.io), or use [dbdocs.io](https://dbdocs.io) for docs.

### ASCII (`--format=ascii`)

Plain text box-drawing diagram viewable directly in the terminal.

### JSON (`--format=json`)

Structured schema representation for piping into other tools.

### PlantUML (`--format=plantuml`)

**How to view:** [PlantUML Online Server](https://www.plantuml.com/plantuml/), VS Code "PlantUML" extension, or `brew install plantuml`.

### Graphviz (`--format=graphviz`)

DOT format. **How to view:** `brew install graphviz && dot -Tpng schema.dot -o schema.png`, or [Graphviz Online](https://dreampuf.github.io/GraphvizOnline/).

## Model Tools

The model can call these tools directly:

- **`erd_generate`** — takes `file`, `format`, `dialect` and returns the ERD
- **`erd_query`** — takes `query` (`tables`|`indexes`|`foreign_keys`|`find_column`|`summary`|`table`), optional `file`, `column_name`, `table_name`, `dialect`

Example prompt: *"Show me the posts table"* or *"Generate a Mermaid ERD from schema/schema.sql"*

## Custom Feed Renderers

Command output renders through custom feed entries (registered with `cmd.addRenderer`, pushed with `cmd.showEntry`). Each command emits a typed entry:

| Renderer | Entry type | Used by | Shows |
|---|---|---|---|
| Diagram | `erd-diagram` | `/erd-generate` | Colored ERD header + raw diagram content |
| Summary | `erd-summary` | `/erd-about`, `/erd-describe` | Schema stats with aligned key/value rows |
| FK map | `erd-fk-map` | `/erd-fk` | Visual FK graph grouped by referenced table |
| Indexes | `erd-indexes` | `/erd-indexes` | Colored index list with UNIQUE badges |
| Columns | `erd-columns` | `/erd-find` | Matching columns with PK/FK/UQ badges |
| Table | `erd-table` | `/erd-table` | Full table detail (columns, indexes, FKs) |
| Markdown | `erd-markdown` | `/erd-tables`, `/erd-generate` (status) | Markdown → styled feed lines (bold, bullets, inline code, tables) |

An unregistered custom type would pretty-print as JSON; renderers are line-based and styled with ANSI escapes. Headless (`-p`) runs drop feed entries.

### UI Showcase

Every command outputs through its custom renderer. Sample output against `schema/schema.sql` (colors render in the TUI; shown here as plain text):

**`/erd-generate`** — diagram with header, plus save/clipboard status:

```
MERMAID · 4 tables · 6 indexes · 5 FKs · sqlite

erDiagram
    users {
        INTEGER id PK
    }
```

> Saved to `erd/erd-...md`, copied to clipboard — status returned as a message row.

**`/erd-tables`** — markdown list (unchanged, `{message}` output):

```
**Tables (4):**
- **users** — 7 columns (PK: id)
- **projects** — 4 columns (PK: id)
- **tasks** — 6 columns (PK: id)
- **comments** — 5 columns (PK: id)
```

**`/erd-table users`** — full detail with badges:

```
users · 7 columns · sqlite

  id             INTEGER  NOT NULL  PK AUTO
  email          VARCHAR(255)  NOT NULL  UQ
  name           VARCHAR(100)  NOT NULL
  password_hash  VARCHAR(255)  NOT NULL
  role           VARCHAR(20)  NULL   = 'user'
  created_at     TIMESTAMP  NULL   = CURRENT_TIMESTAMP
  updated_at     TIMESTAMP  NULL   = CURRENT_TIMESTAMP

Indexes:
  idx_users_email (INDEX) on (email)

Referenced by:
  tasks(assigned_to) → (id)
  comments(author_id) → (id)
  projects(owner_id) → (id)
```

**`/erd-indexes`** — colored index list:

```
Indexes sqlite

  idx_users_email on users(email) INDEX
  idx_projects_owner on projects(owner_id) INDEX
  idx_tasks_project on tasks(project_id) INDEX
  idx_tasks_assigned on tasks(assigned_to) INDEX
  idx_tasks_status on tasks(status) INDEX
  idx_comments_task on comments(task_id) INDEX
```

**`/erd-fk`** — FK graph grouped by referenced table:

```
Foreign Key Map sqlite

  projects ← 1 reference
    tasks(project_id) → projects(id) [ON DELETE CASCADE]
  users ← 3 references
    tasks(assigned_to) → users(id) [ON DELETE SET NULL]
    comments(author_id) → users(id) [ON DELETE CASCADE]
    projects(owner_id) → users(id)
  tasks ← 1 reference
    comments(task_id) → tasks(id) [ON DELETE CASCADE]
```

**`/erd-find id`** — matching columns with badges:

```
Found 2 columns matching "id"

  users.id INTEGER PK AUTO
  tasks.project_id INTEGER FK→ projects.id
```

**`/erd-about`** — aligned summary stats:

```
Schema Summary

  Database type        sqlite
  Tables               4
  Indexes              6
  Foreign Keys         5
  Total columns        28
  Primary keys         4
  FK columns           1
```

## ANSI Helper (`ansi.ts`)

A zero-dependency picocolors-style helper for styling feed lines by name:

```ts
import {c} from './ansi.ts';

c.bold('Title');            // bold
c.dim('muted');             // dim
c.cyan('table');            // named color
c.green('name');            // ...
c.brightYellow('warn');     // bright variants
c.bgRed('alert');           // background

c.ansi(196)('hot pink');    // 256-color palette (0–255)
c.rgb(255, 87, 51)('orange');   // 24-bit true color
c.hex('#ff5733')('orange');     // hex shorthand (#rgb / #rrggbb)

c.bg.ansi(52)('bg');            // 256-color background
c.bg.rgb(0, 0, 255)('blue bg'); // true-color background
c.bg.hex('#0000ff')('blue bg'); // hex background
```

Supported: styles `bold`, `dim`, `italic`, `underline`, `hidden`, `strikethrough`; colors `black`, `red`, `green`, `yellow`, `blue`, `magenta`, `cyan`, `white`, `gray`, `bright*` variants; and `bg*` backgrounds. Beyond the base 16, `c.ansi(code)` indexes the full 256-color palette and `c.rgb(r, g, b)` / `c.hex('#hex')` emit 24-bit true color (with matching `c.bg.ansi` / `c.bg.rgb` / `c.bg.hex` for backgrounds). `hexToRgb('#hex')` is exported for converting hex to an RGB triple. Values are clamped to 0–255. Colors auto-disable when `NO_COLOR` is set or the stream isn't a TTY, so generated files never contain escape codes.

## Themes

All renderer colors are semantic roles resolved through the active theme:

| Role | Used for |
|---|---|
| `accent` | Diagram format header |
| `table` | Table names / entities |
| `column` | Column names |
| `key` | Primary key / UNIQUE badges |
| `fk` | Foreign key references |
| `unique` | Unique badges |
| `muted` | Metadata, counts, dialect |
| `code` | Inline code |
| `heading` | Section headings |
| `title` | Bold titles / values |
| `separator` | `·` / `|` separators |
| `dim` | Secondary text |
| `text` | Plain text |

Built-in themes:

| Theme | Palette |
|---|---|
| `shades-of-purple` (default) | Violet/lavender on dark navy |
| `shades-of-purple-dark` | Deep saturated purples on near-black |
| `dark` | Near-black with bright blue accent |
| `light` | White base with near-black accent |
| `default` | Bright cyan/green/yellow |
| `ocean` | Cool blues and teals |
| `forest` | Earthy greens and warm browns |
| `sunset` | Warm oranges and pinks |
| `mono` | Monochrome grayscale |

A role color can be a named ANSI color (`'cyan'`), a style (`'dim'`, `'bold'`), a 256-color palette index, an RGB triple, or a hex string (`'#B388FF'`). Themes live in `themes/`; add a new one by creating a file that exports `defineTheme(name, description, colors)` and registering it in `themes/index.ts`.

## Markdown Renderer (`markdown.ts`)

`renderMarkdown(md)` converts a markdown string into styled terminal lines. It handles the constructs the query functions emit: `**bold**` headings, `- ` bullet lists, `` `inline code` `` (cyan), markdown pipe tables (separator row dropped), and `> ` blockquotes (dim). Unknown lines pass through verbatim. Registered as the `erd-markdown` feed entry and used by `/erd-tables` and the `/erd-generate` status row.

## Configuration

Set default format, dialect, and theme via mod flags:

```bash
cmd --mod-option erd-format=ascii
cmd --mod-option erd-dialect=postgres
cmd --mod-option erd-theme=ocean
```

## Example Workflow

```
/erd-generate schema/schema.sql --format=mermaid
/erd-tables                          # quick table overview
/erd-table users                     # inspect the users table in detail
/erd-fk                              # spot relationship issues
/erd-find email                      # find every column with "email" in its name
/erd-about                           # high-level stats
```
