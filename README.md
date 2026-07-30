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
    ├── commands.ts                 # All slash command registrations
    ├── tools.ts                    # All model-callable tool registrations
    └── renderer.ts                 # Custom feed renderer for /erd-table output
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

## Configuration

Set default format and dialect via mod flags:

```bash
cmd --mod-option erd-format=ascii
cmd --mod-option erd-dialect=postgres
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
