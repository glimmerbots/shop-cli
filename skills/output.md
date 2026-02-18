# Output Formats and Views

The CLI provides fine-grained control over what data is returned and how it's formatted.

## Output Formats (`--format`)

### `json` (default)

Pretty-printed JSON. For list operations, includes pagination info:

```json
{
  "nodes": [
    { "id": "gid://shopify/Product/123", "title": "Hat" },
    { "id": "gid://shopify/Product/456", "title": "Shirt" }
  ],
  "pageInfo": {
    "hasNextPage": true,
    "endCursor": "eyJsYXN0X2...",
    "nextPageCommand": "shop products list --first 50 --after \"eyJsYXN0X2...\""
  }
}
```

For single-item operations:
```json
{
  "id": "gid://shopify/Product/123",
  "title": "Hat",
  "status": "ACTIVE"
}
```

### `jsonl`

One JSON object per line, ideal for streaming or line-by-line processing:

```
{"id":"gid://shopify/Product/123","title":"Hat"}
{"id":"gid://shopify/Product/456","title":"Shirt"}
```

Pagination command still goes to stderr.

### `table`

Markdown table format, suitable for human reading or rendering:

```
| id | title | status |
| --- | --- | --- |
| gid://shopify/Product/123 | Hat | ACTIVE |
| gid://shopify/Product/456 | Shirt | DRAFT |
```

**Table flattening:** Single-key nested objects are automatically flattened. For example:
- `{ "seo": { "title": "My SEO Title" } }` becomes a `seo.title` column
- `{ "image": { "url": "https://..." } }` becomes an `image.url` column

This keeps tables readable without losing nested data.

### `raw`

Compact, minified JSON (no whitespace):

```
{"id":"gid://shopify/Product/123","title":"Hat"}
```

### `markdown`

Markdown headings with formatted content. For lists, each item gets a heading:

```markdown
## Hat

- **id**: gid://shopify/Product/123
- **status**: ACTIVE

## Shirt

- **id**: gid://shopify/Product/456
- **status**: DRAFT
```

The heading text is derived from `title`, `name`, or `id` fields in order of preference.

## Views (`--view`)

Views control which fields are selected from the API. They affect what data comes back, not how it's formatted.

### `summary` (default)

Pre-selected key fields appropriate for the resource. Typically includes:
- `id`
- `title` or `name`
- `handle` (where applicable)
- `status`
- `updatedAt`

### `ids`

Only the `id` field. Minimal data transfer for when you just need identifiers.

### `full`

Extended fields beyond summary. Adds fields like:
- `createdAt`
- `tags`
- Additional resource-specific fields

### `raw`

Empty selection - **requires `--select` or `--selection` to specify fields**. Use when you want complete control over field selection.

```bash
shop products list --view raw --select id --select title --select vendor
```

### `all`

Automatic deep selection of all available fields. Recursively selects scalar fields and connections up to a configurable depth.

**Warning:** Can be slow and return large payloads. Use `--include` to limit which connections are fetched:

```bash
shop products list --view all --include variants --include images
```

## Field Selection (`--select`)

Add fields to the current view using dot notation. Can be repeated.

```bash
shop products list --select seo.title --select seo.description
```

Works with any view as a base:
```bash
shop products list --view summary --select vendor --select productType
```

### Dot Notation Paths

- `title` - top-level field
- `seo.title` - nested object field
- `variants.edges.node.price` - deeply nested via connection

## Custom Selection (`--selection`)

Override the entire GraphQL selection. Pass raw GraphQL or load from file:

```bash
# Inline selection
shop products list --selection "id title variants(first: 5) { edges { node { id title } } }"

# From file
shop products list --selection @my-selection.gql
```

## Quiet Mode (`--quiet`)

Output only IDs, one per line:

```bash
shop products list --quiet
# Output:
# gid://shopify/Product/123
# gid://shopify/Product/456
```

Useful for piping to other commands or scripts.

## Combining Options

Formats and views are independent:

```bash
# JSON format with full view
shop products list --format json --view full

# Table format with specific extra fields
shop customers list --format table --select defaultAddress.city

# JSONL with quiet mode (IDs only, one per line)
shop products list --format jsonl --quiet
```

## Output Locations Summary

| Content | Destination |
|---------|-------------|
| Data (JSON, tables, etc.) | stdout |
| Pagination commands | stderr |
| Verbose request logs | stderr |
| Errors and warnings | stderr |
| `--quiet` IDs | stdout |
| `--dry-run` GraphQL | stdout |
