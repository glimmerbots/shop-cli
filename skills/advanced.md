# Advanced Features

## Dry-Run Mode (`--dry-run`)

Preview the GraphQL operation without executing it:

```bash
shop products create --set title="Test Product" --dry-run
```

Output:
```graphql
mutation productCreate($input: ProductInput!) {
  productCreate(input: $input) {
    product {
      id
      title
    }
    userErrors {
      field
      message
    }
  }
}
```

```json
{
  "input": {
    "title": "Test Product"
  }
}
```

This is invaluable for:
- Verifying your command structure before execution
- Debugging input formatting
- Understanding the underlying GraphQL

## GID Coercion

The CLI automatically converts numeric IDs to Shopify Global IDs (GIDs):

```bash
# These are equivalent:
shop products get 12345
shop products get gid://shopify/Product/12345
```

The CLI detects the resource type from context and constructs the appropriate GID.

## Raw GraphQL Execution

Execute arbitrary GraphQL queries and mutations:

```bash
# Query
shop graphql query '{ shop { name } }'

# Mutation
shop graphql mutation 'mutation { ... }'

# Auto-detect (query or mutation)
shop graphql '{ shop { name } }'

# From file
shop graphql @my-query.graphql
```

### Variables

Pass variables to GraphQL operations:

```bash
# Individual variables
shop graphql @query.graphql --var id=12345 --var title="New Title"

# JSON variables
shop graphql @query.graphql --var-json input='{"title":"Test"}'

# Variables from file
shop graphql @query.graphql --variables @vars.json
```

### Multiple Operations

If your GraphQL document has multiple operations, specify which to execute:

```bash
shop graphql @multi-operation.graphql --operation GetProducts
```

### Schema Validation

By default, queries are validated against the bundled schema. Skip validation if needed:

```bash
shop graphql @custom-query.graphql --no-validate
```

## Field Introspection

Explore available fields for any resource without authentication:

```bash
shop products fields
```

Output:
```json
{
  "resource": "products",
  "typeName": "Product",
  "fields": [
    { "name": "id", "type": "ID!", "description": "..." },
    { "name": "title", "type": "String!", "description": "..." },
    ...
  ]
}
```

This uses the bundled schema and works offline.

## Verbose Mode (`--verbose`)

See full request and response details:

```bash
shop products list --first 1 --verbose
```

Prints to stderr:
- Request URL
- Request headers
- Request body
- Response headers
- Response body

Useful for debugging API issues or understanding exact API interactions.

## Error Handling

### userErrors

Shopify mutations return `userErrors` for validation failures. By default, these cause a non-zero exit:

```bash
shop products create --set title=""
# Exit code: 1
# stderr: { "userErrors": [{ "field": ["title"], "message": "Title can't be blank" }] }
```

Use `--no-fail-on-user-errors` to suppress the non-zero exit (errors still appear in stderr):

```bash
shop products create --set title="" --no-fail-on-user-errors
# Exit code: 0
# stderr still shows userErrors
```

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Runtime error, GraphQL error, or userErrors |
| 2 | Argument/validation error (bad flags, missing required fields) |

## Repeatable Flags

Many flags can be specified multiple times:

```bash
# Multiple --set flags
shop products create \
  --set title="Product" \
  --set vendor="My Store" \
  --set status=ACTIVE

# Multiple --select flags
shop products list \
  --select seo.title \
  --select seo.description \
  --select vendor

# Multiple --header flags
shop products list \
  --header X-Custom=value1 \
  --header "X-Another: value2"

# Multiple --include flags (with --view all)
shop products list --view all \
  --include variants \
  --include images \
  --include metafields
```

## Inline Value Syntax

Flags support both space-separated and equals syntax:

```bash
# These are equivalent:
--first 10
--first=10

--format json
--format=json

--set title="Hello"
--set=title="Hello"
```

## Publication Workflows

Special verbs for managing publications:

```bash
# Publish to Online Store
shop products publish 12345 --publication "Online Store"

# Unpublish
shop products unpublish 12345 --publication "Online Store"

# Scheduled publishing
shop products publish 12345 --publication "Online Store" --publish-date "2024-12-01T00:00:00Z"
```

Publication names are resolved to their IDs automatically.

## Metafield Operations

Upsert metafields on resources:

```bash
shop products metafields-upsert 12345 \
  --set-json metafields='[
    {"namespace":"custom","key":"color","value":"red","type":"single_line_text_field"}
  ]'
```

## Connection Depth with `--view all`

The `--view all` option recursively fetches nested data. Control which connections to include:

```bash
# Fetch everything (can be slow)
shop products list --view all --first 1

# Fetch specific connections only
shop products list --view all --include variants --include images --first 1
```

Without `--include`, all scalar fields are fetched but connections may be limited.

## Tips for AI Agents

1. **Always use `--dry-run` first** when constructing complex mutations to verify structure
2. **Parse exit codes** - exit code 2 means your arguments are wrong
3. **Check stderr** for pagination commands and errors
4. **Use `shop <resource> fields`** to discover available fields offline
5. **Prefer `--format json`** for reliable parsing
6. **Use `--verbose`** when debugging unexpected API responses
7. **Combine `--set` flags** for complex nested structures
8. **Use `--help-full`** to see all available input fields (not just first 15)
