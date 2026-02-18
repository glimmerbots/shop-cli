# Authentication and Environment

## Environment Variables

The CLI uses environment variables for default configuration. All can be overridden with command-line flags.

| Environment Variable | Flag Override | Description |
|---------------------|---------------|-------------|
| `SHOPIFY_SHOP` | `--shop` | Shop domain (e.g., `my-store.myshopify.com`) |
| `SHOPIFY_ACCESS_TOKEN` | `--access-token` | Admin API access token |
| `SHOPIFY_API_VERSION` | `--api-version` | API version (e.g., `2026-04`) |
| `GRAPHQL_ENDPOINT` | `--graphql-endpoint` | Custom GraphQL endpoint URL |

## Setting Up Authentication

### Option 1: Environment Variables

Set in your shell profile or current session:

```bash
export SHOPIFY_SHOP="my-store.myshopify.com"
export SHOPIFY_ACCESS_TOKEN="shpat_xxxxx"
```

### Option 2: `.env` File

Create a `.env` file in your working directory:

```
SHOPIFY_SHOP=my-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_xxxxx
```

The CLI automatically loads `.env` from the current working directory.

### Option 3: Command-Line Flags

Pass credentials directly (useful for one-off commands or scripts):

```bash
shop products list --shop my-store.myshopify.com --access-token shpat_xxxxx
```

## Flag Precedence

Command-line flags always take precedence over environment variables:

1. `--shop` flag (highest priority)
2. `SHOPIFY_SHOP` environment variable
3. `.env` file values (lowest priority)

## Custom GraphQL Endpoint

For testing or custom deployments, use a custom GraphQL endpoint:

```bash
# Via environment
export GRAPHQL_ENDPOINT="https://custom-api.example.com/graphql"

# Via flag (takes precedence over --shop)
shop products list --graphql-endpoint "https://custom-api.example.com/graphql"
```

When `--graphql-endpoint` is set, it takes precedence over the shop domain for constructing the API URL.

## API Version

The default API version is `2026-04`. Override when needed:

```bash
# Use a different API version
shop products list --api-version 2025-10
```

## Custom Headers

Add custom HTTP headers to requests:

```bash
shop products list --header "X-Custom-Header: value" --header "X-Another: value2"
```

The `--header` flag can be repeated for multiple headers.

## Authentication Errors

If authentication fails, you'll see an error like:

```
Error: SHOPIFY_ACCESS_TOKEN not set
```

Or from the API:

```json
{
  "errors": [
    {
      "message": "Access denied for this resource"
    }
  ]
}
```

## Working with Multiple Shops

Use different environment files or explicit flags:

```bash
# Shop A (using environment)
SHOPIFY_SHOP=shop-a.myshopify.com SHOPIFY_ACCESS_TOKEN=token_a shop products list

# Shop B (using flags)
shop products list --shop shop-b.myshopify.com --access-token token_b
```

## Offline Commands

Some commands work without authentication:

```bash
# List available fields for a resource (uses bundled schema)
shop products fields

# Get help
shop products --help
shop products create --help
```

These introspection and help commands don't require a shop or access token.

## Security Notes

- Never commit access tokens to version control
- Use `.env` files with appropriate permissions
- Consider using environment-specific `.env` files (`.env.production`, `.env.staging`)
- The `--verbose` flag will print request details including headers to stderr - be careful with sensitive output
