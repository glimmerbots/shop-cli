# CLI Return Value Audit

Audit of commands that return weird, unhelpful, or mismatched values — e.g. creating a sub-resource but returning the parent. Prompted by `products media upload` (now fixed) returning the product instead of the uploaded media.

---

## Products (`products.ts`)

### `products options-create`
Returns `product` instead of the created `options`. The user just created options and has no way to see them without a follow-up query.
- Quiet mode: returns `product.id` instead of option IDs
- Should return: the created option objects

### `products options-update`
Returns `product` instead of the updated `option`.
- Quiet mode: returns `product.id` instead of option ID
- Should return: the updated option object

### `products options-delete`
Returns `product` in quiet mode, even though the mutation also returns `deletedOptionsIds`.
- Quiet mode: returns `product.id` — should return `deletedOptionsIds`

### `products options-reorder`
Returns `product` instead of the reordered options.
- Quiet mode: returns `product.id`
- Should return: options in their new order

### `products set-price`
Calls `productVariantsBulkUpdate` on a variant but doesn't return the updated variant — only `userErrors`. Quiet mode returns the variant ID hard-coded from input (not from the API response).
- Should return: the updated variant object

### `products media add` / `products media upload`
Without `--wait`, returns the full `product.media` connection rather than just the newly added/uploaded media. With `--wait`, correctly returns individual media IDs.
- Default behaviour should match `--wait` behaviour

### `products media remove`
Returns `fileUpdate` payload. Quiet mode returns `productId` instead of the removed media IDs.
- Should return: removed media IDs

### `products media reorder`
Returns a `job` ID (async). No visibility into which media was reordered.
- Acceptable as async, but could include the media IDs being reordered in the output

### `products bundle-create` / `products bundle-update`
Returns `productBundleOperation` (an async operation object) instead of the product.
- Quiet mode: returns operation ID, not product ID
- Should return: the product or at least the product ID alongside the operation

---

## Product Variants (`product-variants.ts`)

### `product-variants bulk-create`
Returns a combined payload of `product` + `productVariants`. The wrapping makes it harder to extract just the created variants.
- Should return: just the created variants

### `product-variants bulk-update`
Same as `bulk-create` — returns `product` + `productVariants` together.
- Should return: just the updated variants

### `product-variants bulk-delete`
Returns only `product.id`. There is no confirmation of which variant IDs were deleted.
- Should return: array of deleted variant IDs

### `product-variants bulk-reorder`
Returns only `product.id`. No visibility into the new variant order.
- Should return: variants in their new order, or at least the reordered variant IDs

### `product-variants append-media` / `product-variants detach-media`
Returns `product` + all `productVariants`, not just the variants that were affected.
- Should return: only the variants that had media attached/detached

---

## Collections (`collections.ts`)

### `collections add-products` / `collections remove-products` / `collections reorder-products`
All return an async `job` object with no information about which products were affected.
- Should return: at minimum the product IDs that were targeted, alongside the job

### `collections duplicate`
Returns both `collection` and `job`, which is ambiguous — the collection may not be in its final state yet since the job is still running.
- Should clarify which is authoritative, or return just the job with a note about the collection ID

---

## Orders (`orders.ts`)

### `orders cancel`
Returns a `job` object instead of the updated order or any refund details. User can't see what was cancelled.
- Should return: the cancelled order, or at minimum the order ID + updated status

### `orders capture`
Returns only the `transaction` object, with no reference to the order. No context about the order's resulting financial status.
- Should return: transaction + `orderId` + order financial status

### `orders risk-assessment-create`
Returns only the `orderRiskAssessment` with no order context.
- Should return: assessment + the order ID it was attached to

### `orders create-mandate-payment`
Returns a `job` object instead of the resulting payment transaction.
- Does return `paymentReferenceId` which helps, but no transaction details
- Should return: transaction with kind, status, amount

### `orders fulfill`
Returns a custom-wrapped array of `{ locationId, fulfillment, userErrors }`. The `locationId` is an internal CLI tracking value, not an API field — it leaks internal state to the user.
- Should return: just the fulfillment objects

---

## Customers (`customers.ts`)

### `customers update-default-address`
Returns the `customer` summary instead of the address that was set as default.
- Should return: the address object (with `isDefault: true`)

### `customers email-marketing-consent-update` / `customers sms-marketing-consent-update`
Returns the `customer` summary instead of the updated consent state.
- Should return: the consent object showing the new opt-in level, state, etc.

### `customers add-tax-exemptions` / `customers remove-tax-exemptions` / `customers replace-tax-exemptions`
Returns the `customer` summary instead of the resulting exemptions list.
- Should return: `{ taxExemptions: [...], customer: { id } }`

### `customers merge`
Returns a `job` object. No visibility into the resulting merged customer.
- Should return: the resulting customer ID alongside the job

### `customers send-invite`
Returns the `customer` object. No indication of whether the invite was sent, to which email, or when.
- Should return: invite confirmation details (sent time, email, etc.)

### `customers request-data-erasure` / `customers cancel-data-erasure`
Returns only `customerId` with no erasure request details or status.
- Should return: erasure request ID + status

---

## Inventory (`inventory.ts`)

### `inventory deactivate`
Returns the `inventoryDeactivate` payload but it only contains `userErrors` — the deactivated inventory level is not included.
- Should return: the deactivated inventory level

---

## Fulfillments (`fulfillments.ts`)

### `fulfillments create-event`
Creates a fulfillment event but returns only the event. No reference to the parent fulfillment.
- Should return: event + parent fulfillment ID

---

## Fulfillment Orders (`fulfillment-orders.ts`)

### `fulfillment-orders mark-prepared`
Returns only `userErrors` — no resource info whatsoever. User has no way to confirm what was marked as prepared.
- Should return: the affected fulfillment order IDs or line items

### `fulfillment-orders set-deadline`
Returns `{ success: true/false }` with no resource IDs. User can't tell which fulfillment orders had their deadline updated.
- Should return: the affected fulfillment order IDs

---

## Discounts (`discounts-automatic.ts`, `discounts-code.ts`)

### `discounts-automatic create-app` / `discounts-automatic update-app`
Returns `automaticAppDiscount` instead of `automaticDiscountNode` like every other discount type. Quiet mode returns `discountId` instead of the node ID.
- Inconsistent with all other discount create/update commands

### `discounts-code create-app` / `discounts-code update-app`
Same issue — returns `codeAppDiscount` instead of `codeDiscountNode`.
- Inconsistent with all other discount create/update commands

---

## Draft Orders (`draft-orders.ts`)

### `draft-orders calculate`
Returns a `calculatedDraftOrder` with only `lineItemsSubtotalPrice`. Very limited data for a calculation result.
- Should return: full calculated draft order summary (totals, taxes, line items, etc.)

---

## Selling Plan Groups (`selling-plan-groups.ts`)

### `selling-plan-groups remove-variants`
Returns `removedProductVariantIds` (the removed IDs) instead of the updated selling plan group — inconsistent with `add-variants` which returns the group.
- Quiet mode: returns **nothing at all**
- Should return: the updated selling plan group (consistent with `add-variants`)

---

## Subscription Contracts (`subscription-contracts.ts`)

### `subscription-contracts create` / `subscription-contracts update`
Both return a `draft` object, not the actual subscription contract. This is an API design constraint, but confusing since the user just created/updated a contract and gets a draft back.
- Worth documenting/noting in help text

---

## Markets (`markets.ts`)

### `markets regions-create`
Creates regions but returns the parent `market` object — no visibility into which regions were created or their IDs.
- Should return: the created region objects

### `markets region-delete`
Deletes a region but returns both `deletedId` (the region) AND the parent `market`. The market is unnecessary for a delete operation.
- Should return: just `{ deletedId, userErrors }`

---

## Themes (`themes.ts`)

### `themes files-delete`
No quiet mode output at all — inconsistent with `files-upsert` and `files-copy`.
- Should print: deleted file count or filenames

### `themes files-copy`
No quiet mode output.
- Should print: copied file count or destination filenames

---

## URL Redirects (`url-redirects.ts`)

### `url-redirects bulk-delete-*` (all variants)
All return a `job` object with no indication of how many redirects were deleted or which ones.
- Should return: deletion count alongside job ID (if available from API)

### `url-redirects import-submit`
Returns a `job` object instead of the `urlRedirectImport` object, unlike `import-create` which returns the import. Inconsistent between the two import operations.
- Should return: the `urlRedirectImport` object (consistent with `import-create`)

---

## Metaobjects (`metaobjects.ts`)

### `metaobjects bulk-delete`
Returns only `job: { id, done }` — no indication of what was deleted or how many.
- Should return: deletion count or list of deleted IDs alongside job ID (if available from API)

---

## General Patterns to Fix

1. **Sub-resource operations returning parent**: When creating/updating/deleting a child resource (variant, option, region, address, etc.), return the child — not the parent.

2. **Async job returns with no entity context**: When an operation kicks off a background job, include the IDs of the entities being acted on alongside the job ID so users know what's in flight.

3. **Quiet mode missing or wrong**: Several commands output nothing (or the wrong ID) in `--quiet` mode. Quiet mode should always output the ID of the primary resource that was just created/modified.

4. **Inconsistency within a resource**: When some commands in the same resource return the node wrapper (e.g. `codeDiscountNode`) and others return the inner type (e.g. `codeAppDiscount`), it makes scripting fragile.
