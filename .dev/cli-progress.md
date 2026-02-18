# shopcli CLI progress

This repo is building a CLI that follows the conventions in `.dev/operations.md` and `.dev/workflows.md`.

## How to run

- Install deps: `npm ci`
- Run (dev): `npm run dev:shop -- <resource> <verb> [flags]`
- Or run via bin: `node bin/shop.js <resource> <verb> [flags]`

Auth defaults to env vars:

- `SHOP_DOMAIN` (or `SHOPIFY_SHOP`)
- `SHOPIFY_ACCESS_TOKEN`

Overrides:

- `--shop-domain`
- `--access-token`
- `--api-version` (default: `2026-04`)

## Implemented (first ~25%)

Tier 1 (Core) CRUD-ish commands:

- `shop products create|get|list|update|delete|duplicate`
- `shop collections create|get|list|update|delete|duplicate`
- `shop customers create|get|list|update|delete`
- `shop orders create|get|list|update|delete`

Tier 1 workflows (partial):

- `shop products set-status --id <gid|num> --status ACTIVE|DRAFT|ARCHIVED`
- `shop products add-tags --id <gid|num> --tags tag,tag`
- `shop products remove-tags --id <gid|num> --tags tag,tag`

Common flags (implemented subset):

- `--input <json>` / `--input @file.json`
- `--set path=value` (repeatable)
- `--set-json path=<json|@file.json>` (repeatable)
- `--id <gid|num>` (numeric IDs are coerced to `gid://shopify/<Type>/<id>` when type is implied)
- `--query`, `--first`, `--after`, `--sort`, `--reverse` (list)
- `--format json|table|raw`, `--quiet`
- `--dry-run` (prints GraphQL operation + variables)
- `--dry-run` does not require valid auth (no request is sent)
- `--no-fail-on-user-errors`

Known gaps vs notes (next to implement):

- `--selection <graphql>` support
- `--select <path>` dot-path support (currently top-level fields only)
- More workflows: publish/unpublish, inventory set/adjust, metafields upsert, media add/upload, etc.
- Remaining operations/resources from `.dev/operations.md`

## Next tranche proposal

High-leverage workflows from `.dev/workflows.md` (Score 5/4):

1. `shop publications resolve`
2. `shop products publish` / `unpublish` / `publish-all`
3. `shop inventory set` / `adjust`
4. `shop products metafields upsert`
5. `shop products media add` (URL)

## Tranche 4 plan (CRUD resources)

Goal: implement tranche 4 from `.dev/remaining-tranches.md` by expanding CRUD-ish resources from `.dev/operations.md`.

- Add verbs + router wiring for:
  - Content: `articles`, `blogs`, `pages`, `comments`
  - Merch/structure: `menus`, `publications`, `catalogs`, `markets`
  - Draft orders: `draft-orders` (CRUD + bulk tags + invoice preview/send + calculate/complete)
  - Redirects + segments: `url-redirects`, `segments`
  - Webhooks: `webhooks`
  - Meta: `metafield-definitions`, `metaobjects`, `metaobject-definitions`
  - Selling plans: `selling-plan-groups` (full CRUD + add/remove variants)
- Run `npm test` (typecheck) to validate.

### Tranche 4 implemented (2026-02-18)

Content:

- `shop articles create|get|list|update|delete`
- `shop blogs create|get|list|update|delete`
- `shop pages create|get|list|update|delete`
- `shop comments get|list|delete`

Merch/structure:

- `shop menus create|get|list|update|delete`
- `shop publications create|get|list|update|delete`
- `shop catalogs create|get|list|update|delete`
- `shop markets create|get|list|update|delete`

Draft orders:

- `shop draft-orders create|get|list|update|delete|duplicate|count`
- `shop draft-orders calculate|complete`
- `shop draft-orders create-from-order --order-id <gid|num>`
- `shop draft-orders preview-invoice|send-invoice --id <gid|num> [--input <EmailInput>]`
- `shop draft-orders bulk-add-tags|bulk-remove-tags --ids <gid|num,...> --tags a,b`
- `shop draft-orders bulk-delete --ids <gid|num,...> --yes`
- `shop draft-orders saved-searches`
- `shop draft-orders tags --id <gid>` (DraftOrderTag ID)
- `shop draft-orders delivery-options --input <DraftOrderAvailableDeliveryOptionsInput>`

Redirects + segments:

- `shop url-redirects create|get|list|update|delete`
- `shop segments create|get|list|update|delete`

Webhooks:

- `shop webhooks create --topic <WebhookSubscriptionTopic> --input <WebhookSubscriptionInput>`
- `shop webhooks get|list|update|delete`

Meta:

- `shop metafield-definitions create|get|list|update|delete`
  - Note: `list` requires `--owner-type` (e.g. `PRODUCT`).
  - Note: `update` is identifier-based (key/namespace/ownerType); `--id` works by resolving identifier first.
- `shop metaobjects create|get|list|update|delete` (list requires `--type`)
- `shop metaobject-definitions create|get|list|update|delete`

Selling plans:

- `shop selling-plan-groups create|get|list|update|delete`
- `shop selling-plan-groups add-variants|remove-variants --id <gid|num> --variant-ids <gid|num,...>`
