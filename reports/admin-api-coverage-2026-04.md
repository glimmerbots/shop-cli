# Admin API coverage report (2026-04)

Root field coverage (Query + Mutation) based on CLI --dry-run GraphQL payloads.

## Totals

- Query fields: 269
- Mutation fields: 496
- Used Query fields: 228
- Used Mutation fields: 423
- Missing Query fields: 41
- Missing Mutation fields: 73

## Missing (grouped by prefix)

### Queries

- `product` (11)
- `checkout` (3)
- `collection` (3)
- `order` (3)
- `url` (3)
- `inventory` (2)
- `locations` (2)
- `reverse` (2)
- `assigned` (1)
- `catalog` (1)
- `catalogs` (1)
- `deletion` (1)
- `delivery` (1)
- `job` (1)
- `location` (1)
- `manual` (1)
- `pending` (1)
- `publications` (1)
- `published` (1)
- `returnable` (1)

### Mutations

- `product` (25)
- `order` (8)
- `inventory` (6)
- `url` (6)
- `fulfillment` (5)
- `delivery` (4)
- `reverse` (3)
- `collection` (2)
- `event` (2)
- `menu` (2)
- `publishable` (2)
- `app` (1)
- `bulk` (1)
- `catalog` (1)
- `checkout` (1)
- `combined` (1)
- `location` (1)
- `return` (1)
- `shop` (1)

## Notes

- Full missing field lists are in the JSON report.
- Grouping is heuristic: the prefix is the leading camelCase word of the root field name.

## Dry-run errors

Commands that threw during --dry-run (still captured any printed GraphQL payloads): 0

