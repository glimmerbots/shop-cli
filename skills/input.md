# Input Handling

The CLI provides flexible ways to supply input data for create and update operations.

## Input Methods

### `--set` (Recommended for Simple Cases)

Set individual fields using dot notation. Can be repeated multiple times.

```bash
shop products create \
  --set title="New Product" \
  --set status=ACTIVE \
  --set vendor="My Store"
```

### `--input` (Full JSON Payload)

Provide the entire input as JSON:

```bash
shop products create --input '{"title": "New Product", "status": "ACTIVE"}'
```

Or load from a file:

```bash
shop products create --input @product-data.json
```

### `--set-json` (Explicit JSON Values)

When you need to set a field to an explicit JSON value:

```bash
shop products create --set-json metafields='[{"namespace":"custom","key":"color","value":"red","type":"single_line_text_field"}]'
```

## Combining Input Methods

`--input` and `--set`/`--set-json` can be combined. The `--set` values are merged into (and override) the `--input`:

```bash
# Load base from file, override title
shop products create --input @base-product.json --set title="Override Title"
```

## Dot Notation for Nested Objects

Build complex nested structures with dot paths:

```bash
shop products create \
  --set title="Hat" \
  --set seo.title="Buy Our Hat" \
  --set seo.description="The best hat ever"
```

This creates:
```json
{
  "title": "Hat",
  "seo": {
    "title": "Buy Our Hat",
    "description": "The best hat ever"
  }
}
```

### Arrays with Numeric Indices

Use numeric indices for array elements:

```bash
shop products create \
  --set title="Bundle" \
  --set variants.0.title="Small" \
  --set variants.0.price="9.99" \
  --set variants.1.title="Large" \
  --set variants.1.price="14.99"
```

This creates:
```json
{
  "title": "Bundle",
  "variants": [
    { "title": "Small", "price": "9.99" },
    { "title": "Large", "price": "14.99" }
  ]
}
```

## Automatic Value Type Detection

With `--set`, the CLI automatically detects JSON types:

| Input | Detected Type |
|-------|---------------|
| `--set count=42` | Number `42` |
| `--set active=true` | Boolean `true` |
| `--set active=false` | Boolean `false` |
| `--set data=null` | Null |
| `--set tags='["a","b"]'` | Array `["a","b"]` |
| `--set meta='{"key":"val"}'` | Object `{"key":"val"}` |
| `--set title="Hello"` | String `"Hello"` |
| `--set title=Hello` | String `"Hello"` |

**Strings starting with `{`, `[`, or `"` are parsed as JSON.** To force a string, use quotes differently:

```bash
# This is parsed as JSON array:
--set tags='["red","blue"]'

# This is a plain string:
--set title='My Product'
```

Use `--set-json` when you want explicit control:

```bash
# Explicit JSON object
--set-json customData='{"nested": {"value": 123}}'
```

## File Loading

Both `--set` and `--input` support loading from files:

```bash
# Full input from file
--input @data.json

# Field value from file (auto-detected)
--set description=@description.txt

# Explicit JSON file for a field
--set-json metafields=@json:metafields.json
```

File prefixes:
- `@path` or `@file:path` - Load file contents (text or auto-detected JSON)
- `@json:path` - Explicitly parse as JSON

## Required Fields

Use `--help` to see which fields are required:

```bash
shop products create --help
```

Required fields are marked with "Required." in the help output. The command will fail with exit code 2 if required fields are missing.

## Examples

**Create a customer:**
```bash
shop customers create \
  --set email="customer@example.com" \
  --set firstName="Jane" \
  --set lastName="Doe"
```

**Update a product:**
```bash
shop products update 12345 \
  --set title="Updated Title" \
  --set status=DRAFT
```

**Create with metafields:**
```bash
shop products create \
  --set title="Custom Product" \
  --set-json metafields='[
    {"namespace":"custom","key":"material","value":"cotton","type":"single_line_text_field"},
    {"namespace":"custom","key":"weight","value":"200","type":"number_integer"}
  ]'
```

**Complex nested input from file:**
```bash
shop products create --input @complex-product.json
```

Where `complex-product.json` contains:
```json
{
  "title": "Bundle Product",
  "status": "ACTIVE",
  "variants": [
    { "title": "Small", "price": "19.99" },
    { "title": "Medium", "price": "24.99" },
    { "title": "Large", "price": "29.99" }
  ],
  "seo": {
    "title": "Bundle Product | My Store",
    "description": "Great value bundle"
  }
}
```
