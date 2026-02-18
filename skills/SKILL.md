# shop-cli Skill

A comprehensive command-line interface for managing Shopify Admin API resources. This skill enables AI agents to interact with Shopify stores programmatically.

## Quick Reference

```bash
shop <resource> <verb> [flags]
```

**Getting Help:**
- `shop` or `shop help` - List all resources
- `shop <resource> --help` - List verbs for a resource
- `shop <resource> <verb> --help` - Full help for a verb
- `shop <resource> <verb> --help-full` - Expanded help (shows all fields, not just first 15)

## Command Structure

The CLI follows a consistent `<resource> <verb>` pattern. Resources represent Shopify entities (products, customers, orders, etc.) and verbs are operations on those resources.

**Common verbs:**
- `list` - List resources with pagination
- `get` - Get a single resource by ID
- `create` - Create a new resource
- `update` - Update an existing resource
- `delete` - Delete a resource
- `count` - Count matching resources
- `fields` - Show available fields (offline, no auth required)

**Resource-specific verbs:**
- `publish`, `unpublish` - Publication control
- `add-tags`, `remove-tags` - Tag management
- `archive`, `unarchive` - Archive control
- `bundle-create` - Create product bundles

## Stdout vs Stderr

**Stdout contains:**
- Primary command output (JSON, tables, markdown)
- ID lists when `--quiet` is used
- Dry-run GraphQL operations

**Stderr contains:**
- Pagination commands: `Next page: shop products list --after "cursor..."`
- Verbose request details (when `--verbose` is set)
- Error messages and userErrors from the API
- Warnings (e.g., missing access token)

This separation allows piping stdout to files or other commands while still seeing pagination hints and errors.

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Runtime or GraphQL errors |
| 2 | Argument/validation errors |

Use `--no-fail-on-user-errors` to prevent non-zero exit on Shopify userErrors (errors still output to stderr).

## Core Concepts

### Authentication & Environment
See [authentication.md](./authentication.md) for environment variables and authentication setup.

### Output Formats & Views
See [output.md](./output.md) for controlling output format, field selection, and views.

### Input Handling
See [input.md](./input.md) for creating and updating resources with structured input.

### Pagination
See [pagination.md](./pagination.md) for working with paginated results.

### Advanced Features
See [advanced.md](./advanced.md) for dry-run mode, raw GraphQL, GID coercion, and other advanced topics.

## Quick Examples

**List products as JSON (default):**
```bash
shop products list --first 10
```

**Get a product with specific fields:**
```bash
shop products get 12345 --select seo.title --select seo.description
```

**Create a product:**
```bash
shop products create --set title="New Product" --set status=ACTIVE
```

**List customers as a table:**
```bash
shop customers list --format table --first 20
```

**Count orders matching a query:**
```bash
shop orders count --query "created_at:>2024-01-01"
```

**Dry-run to see GraphQL without executing:**
```bash
shop products create --set title="Test" --dry-run
```

## Key Flags Reference

| Flag | Description |
|------|-------------|
| `--format` | Output format: `json`, `jsonl`, `table`, `raw`, `markdown` |
| `--view` | Field selection: `summary`, `ids`, `full`, `raw`, `all` |
| `--select` | Add fields via dot notation (repeatable) |
| `--quiet` | Output IDs only |
| `--first` | Page size (default: 50) |
| `--after` | Pagination cursor |
| `--query` | Search/filter query |
| `--dry-run` | Print GraphQL without executing |
| `--verbose` | Print request details to stderr |
| `--set` | Set input field (repeatable) |
| `--input` | Full JSON input payload |

## Tips for AI Agents

1. **Use `--help` liberally** - The help system is comprehensive and shows required fields, available flags, and examples.

2. **Prefer `--format json`** - Default format, easiest to parse programmatically.

3. **Use `--dry-run` for validation** - Verify your command structure before execution.

4. **Watch stderr for pagination** - The `Next page: ...` command tells you how to get more results.

5. **Use `--quiet` for ID extraction** - When you just need IDs for further processing.

6. **Offline introspection** - `shop <resource> fields` works without authentication for exploring schemas.

7. **Parse exit codes** - Exit code 2 means argument errors; check your flags and values.

8. **Combine `--set` flags** - Build complex nested objects with multiple `--set` flags using dot notation.
