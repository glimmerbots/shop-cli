# Pagination

The CLI uses cursor-based pagination, matching the Shopify GraphQL API pattern.

## Basic Pagination

### Page Size (`--first`)

Control how many items per page (default: 50):

```bash
shop products list --first 10
```

### Pagination Cursor (`--after`)

Continue from a specific cursor:

```bash
shop products list --after "eyJsYXN0X2lkIjo..."
```

## The Pagination Workflow

### Step 1: Initial Request

```bash
shop products list --first 10
```

Output (JSON format):
```json
{
  "nodes": [...],
  "pageInfo": {
    "hasNextPage": true,
    "endCursor": "eyJsYXN0X2lkIjo...",
    "nextPageCommand": "shop products list --first 10 --after \"eyJsYXN0X2lkIjo...\""
  }
}
```

### Step 2: Check for More Pages

Look at `pageInfo.hasNextPage`. If `true`, more data is available.

### Step 3: Get Next Page

Use the `nextPageCommand` from the response, or construct it yourself:

```bash
shop products list --first 10 --after "eyJsYXN0X2lkIjo..."
```

### Non-JSON Formats

For `table`, `jsonl`, `markdown`, and `raw` formats, the pagination command is printed to **stderr**:

```
Next page: shop products list --first 10 --after "eyJsYXN0X2lkIjo..."
```

This keeps stdout clean for piping while still providing the next page command.

## Filtering and Sorting with Pagination

Pagination works alongside filtering and sorting. The `nextPageCommand` preserves your original flags:

```bash
shop orders list --first 20 --query "created_at:>2024-01-01" --sort CREATED_AT --reverse
```

The generated `nextPageCommand` will include all these flags:
```
shop orders list --first 20 --query "created_at:>2024-01-01" --sort CREATED_AT --reverse --after "cursor..."
```

## Pagination Flags Reference

| Flag | Description | Default |
|------|-------------|---------|
| `--first` | Number of items per page | 50 |
| `--after` | Cursor from previous page's `endCursor` | (none) |
| `--query` | Search/filter query | (none) |
| `--sort` | Sort key (resource-specific) | (varies) |
| `--reverse` | Reverse sort order | false |

## Practical Examples

### Iterating Through All Products

```bash
# First page
shop products list --first 100 --format jsonl > products.jsonl

# Check stderr for next page command, then:
shop products list --first 100 --after "cursor1" --format jsonl >> products.jsonl

# Continue until hasNextPage is false
```

### Scripted Pagination (Bash)

```bash
#!/bin/bash
cursor=""
while true; do
  if [ -z "$cursor" ]; then
    result=$(shop products list --first 100 --format json)
  else
    result=$(shop products list --first 100 --after "$cursor" --format json)
  fi

  # Process nodes
  echo "$result" | jq -c '.nodes[]'

  # Check for next page
  has_next=$(echo "$result" | jq -r '.pageInfo.hasNextPage')
  if [ "$has_next" != "true" ]; then
    break
  fi

  cursor=$(echo "$result" | jq -r '.pageInfo.endCursor')
done
```

### Getting Just IDs

Use `--quiet` for efficient ID-only pagination:

```bash
shop products list --first 250 --quiet
# Output: one GID per line
# gid://shopify/Product/123
# gid://shopify/Product/456
# ...
```

## Performance Tips

1. **Use larger page sizes** when possible (`--first 250`) to reduce API calls
2. **Use `--quiet`** when you only need IDs
3. **Use `--view ids`** for minimal data transfer
4. **Use JSONL format** for streaming processing
5. **Filter server-side** with `--query` instead of fetching everything

## Count Before Paginating

Use `count` to know how many items you're dealing with:

```bash
shop products count --query "status:active"
# Output: { "count": 1234 }
```

This helps estimate how many pages you'll need to fetch.
