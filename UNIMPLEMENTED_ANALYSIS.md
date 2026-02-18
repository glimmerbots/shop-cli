# Shopify Admin API 2026-04 Schema Analysis: Unimplemented Resources

**Analysis Date:** February 18, 2026
**Schema File:** `schema/2026-04.graphql` (61,256 lines)
**Total GraphQL Query Fields:** 269
**Total GraphQL Mutation Fields:** 494
**Core Resource Types Identified:** ~169

## Current Implementation Status

### ✅ IMPLEMENTED (25+ resources, ~60 mutation/query combos)

**Tier 1 (Core CRUD):**
- Products (create, get, list, update, delete, duplicate) + workflows
- Collections (create, get, list, update, delete, duplicate)
- Customers (create, get, list, update, delete)
- Orders (create, get, list, update, delete)
- Inventory (set, adjust)

**Tier 2 (Content & Merchandising):**
- Articles, Blogs, Pages (full CRUD)
- Comments (get, list, delete)
- Menus, Catalogs, Markets, Publications (full CRUD)

**Tier 3 (Data & Configuration):**
- Draft Orders (full CRUD + special ops like calculate, complete, delivery-options)
- URL Redirects, Segments, Webhooks, Metafield/Metaobject definitions, Selling Plan Groups

**Workflows:**
- Products: publish, unpublish, metafields upsert, media management
- Files: staged uploads
- Publications: resolve by name/handle
- Product Variants: upsert

---

## 🚫 UNIMPLEMENTED (but queryable in schema)

### High-Priority: Popular Business Operations (90% coverage tier)

**1. GIFT CARDS** (7 mutations, 4 queries)
- `giftCardCreate`, `giftCardUpdate`, `giftCardDebit`, `giftCardCredit`, `giftCardDeactivate`
- `giftCardSendNotificationToCustomer`, `giftCardSendNotificationToRecipient`
- Queries: `giftCard`, `giftCards`, `giftCardsCount`, `giftCardConfiguration`
- **Popularity:** HIGH (retail, loyalty, marketing)
- **Complexity:** LOW (standard CRUD + special ops)
- **Impact:** Complete gift card management workflow

**2. SUBSCRIPTIONS** (25+ mutations for subscription contracts & billing)
- Contract lifecycle: `subscriptionContractCreate`, `subscriptionContractActivate`, `subscriptionContractCancel`, `subscriptionContractPause`, `subscriptionContractExpire`
- Billing cycles: `subscriptionBillingCycleBulkCharge`, `subscriptionBillingCycleSkip`, `subscriptionBillingCycleCharge`
- Draft management: `subscriptionDraftCommit`, `subscriptionDraftLineAdd`, `subscriptionDraftDiscountAdd`
- Queries: `subscriptionContract`, `subscriptionContracts`, `subscriptionBillingCycle`, `subscriptionBillingAttempt`
- **Popularity:** HIGH (recurring revenue, D2C, subscription services)
- **Complexity:** HIGH (complex workflows, billing state machines)
- **Impact:** Enable subscription-first business models

**3. PRICE LISTS** (7 mutations, 3 queries)
- `priceListCreate`, `priceListUpdate`, `priceListDelete`
- `priceListFixedPricesAdd`, `priceListFixedPricesUpdate`, `priceListFixedPricesDelete`
- `quantityPricingByVariantUpdate`, `quantityRulesAdd`, `quantityRulesDelete`
- Queries: `priceList`, `priceLists`, `priceListConnection`
- **Popularity:** HIGH (B2B, wholesale, market pricing)
- **Complexity:** MEDIUM (variant-level pricing, quantity breaks)
- **Impact:** Multi-channel pricing, B2B wholesale workflows

**4. RETURN MANAGEMENT** (11 mutations, 3+ queries)
- `returnCreate`, `returnCancel`, `returnClose`, `returnProcess`, `returnRefund`, `returnReopen`
- `returnApproveRequest`, `returnDeclineRequest`, `returnRequest`
- `removeFromReturn`, `returnLineItemRemoveFromReturn`
- `returnCalculate`, `refundCreate`
- Queries: `return`, `returnReasonDefinitions`, `returnableFulfillment`
- **Popularity:** HIGH (consumer protection, logistics, omnichannel)
- **Complexity:** MEDIUM (multi-step workflows, state validation)
- **Impact:** Post-purchase customer service at scale

**5. FULFILLMENT & SHIPPING** (30+ mutations)
- Core: `fulfillmentCreate`, `fulfillmentCreateV2`, `fulfillmentCancel`
- FulfillmentOrder: `fulfillmentOrderAcceptFulfillmentRequest`, `fulfillmentOrderSubmitFulfillmentRequest`, `fulfillmentOrderClose`, `fulfillmentOrderSplit`, `fulfillmentOrderMerge`, `fulfillmentOrderMove`
- Tracking: `fulfillmentTrackingInfoUpdate`, `fulfillmentEventCreate`
- Holds & Deadlines: `fulfillmentOrderHold`, `fulfillmentOrderReleaseHold`, `fulfillmentOrdersSetFulfillmentDeadline`
- Queries: `fulfillmentOrder`, `fulfillmentOrders`, `fulfillmentService`
- **Popularity:** CRITICAL (order lifecycle, SLA management)
- **Complexity:** HIGH (state machines, location routing, third-party integrations)
- **Impact:** Production fulfillment operations

**6. PAYMENT TERMS** (3 mutations, 1 query)
- `paymentTermsCreate`, `paymentTermsUpdate`, `paymentTermsDelete`
- `paymentReminderSend`
- Query: `paymentTermsTemplates`
- **Popularity:** MEDIUM (B2B, net-30/net-60 terms, invoicing)
- **Complexity:** LOW (simple CRUD)
- **Impact:** B2B payment workflows, credit management

**7. DELIVERY CUSTOMIZATION & SHIPPING** (6 mutations, 3 queries)
- `deliveryCustomizationCreate`, `deliveryCustomizationUpdate`, `deliveryCustomizationDelete`, `deliveryCustomizationActivation`
- `deliveryProfileCreate`, `deliveryProfileUpdate`, `deliveryProfileRemove`
- Queries: `deliveryProfile`, `deliveryProfiles`, `deliveryCustomization`
- **Popularity:** MEDIUM-HIGH (shipping rules, localization, 2-day/next-day promises)
- **Complexity:** MEDIUM (Shopify Functions, rate calculations)
- **Impact:** Shipping promise management, regional rules

**8. FULFILLMENT SERVICES** (3 mutations, 1 query)
- `fulfillmentServiceCreate`, `fulfillmentServiceUpdate`, `fulfillmentServiceDelete`
- Queries: `fulfillmentService`
- **Popularity:** MEDIUM (3PL integrations, warehouse management)
- **Complexity:** LOW (basic CRUD)
- **Impact:** Third-party fulfillment integrations

**9. PAYMENT CUSTOMIZATION** (3 mutations, 1 query)
- `paymentCustomizationCreate`, `paymentCustomizationUpdate`, `paymentCustomizationDelete`, `paymentCustomizationActivation`
- Queries: `paymentCustomization`, `paymentCustomizations`
- **Popularity:** MEDIUM (Shopify Functions, payment rules)
- **Complexity:** MEDIUM (function triggers, payment gating)
- **Impact:** Custom payment workflows (e.g., "pay later", installments)

**10. LOCATIONS** (7 mutations, 3 queries)
- `locationAdd`, `locationEdit`, `locationDelete`, `locationActivate`, `locationDeactivate`
- `locationLocalPickupEnable`, `locationLocalPickupDisable`
- Queries: `location`, `locations`, `locationsCount`
- **Popularity:** HIGH (inventory management, pickup points, multi-location)
- **Complexity:** LOW (simple CRUD)
- **Impact:** Multi-location operations, local pickup workflows

---

### Medium-Priority: Features (80% coverage tier)

**11. INVENTORY SHIPMENTS & TRANSFERS** (14 mutations, 3 queries)
- Shipments: `inventoryShipmentCreate`, `inventoryShipmentAddItems`, `inventoryShipmentRemoveItems`, `inventoryShipmentReceive`, `inventoryShipmentMarkInTransit`, `inventoryShipmentDelete`, `inventoryShipmentSetTracking`
- Transfers: `inventoryTransferCreate`, `inventoryTransferEdit`, `inventoryTransferDelete`, `inventoryTransferDuplicate`, `inventoryTransferMarkAsReadyToShip`, `inventoryTransferCancel`
- Queries: `inventoryShipment`, `inventoryTransfer`, `inventoryTransfers`
- **Popularity:** MEDIUM (warehouse operations, stock rebalancing)
- **Complexity:** MEDIUM (state machines, tracking)
- **Impact:** Inter-location inventory movement

**12. THEMES** (7 mutations, 2 queries)
- `themeCreate`, `themeUpdate`, `themeDelete`, `themeDuplicate`, `themePublish`
- `themeFilesCopy`, `themeFilesDelete`, `themeFilesUpsert`
- Queries: `theme`, `themes`
- **Popularity:** MEDIUM (theme development, customization)
- **Complexity:** MEDIUM (file management, publish workflow)
- **Impact:** Storefront theme lifecycle

**13. REFUNDS** (1 mutation, 1 query)
- `refundCreate`
- Query: `refund`
- **Popularity:** MEDIUM (captured separately from returns; order management)
- **Complexity:** LOW (order line level)
- **Impact:** Order-level refund ops (complements returns)

**14. DISCOUNTS (AUTOMATIC)** (11 mutations, 3 queries)
- Types: Basic, BXGY, FreeShipping, App-managed
- Ops: Create, update, delete, activate, deactivate, bulk delete
- Queries: `automaticDiscount`, `automaticDiscounts`, `automaticDiscountNodes`, `automaticDiscountSavedSearches`
- **Popularity:** HIGH (marketing, promotions)
- **Complexity:** HIGH (rule conditions, app functions)
- **Impact:** Programmatic discount creation/management

**15. DISCOUNT CODES** (14 mutations, 4 queries)
- Types: Basic, BXGY, FreeShipping, App-managed, RedeemCodes
- Ops: Create, update, delete, activate, deactivate, bulk ops
- Queries: `codeDiscountNode`, `codeDiscountNodes`, `discountRedeemCodeBulkCreation`
- **Popularity:** HIGH (marketing, loyalty)
- **Complexity:** HIGH (code generation, redemption tracking)
- **Impact:** Discount code lifecycle management

**16. CARRIER SERVICES** (3 mutations, 2 queries)
- `carrierServiceCreate`, `carrierServiceUpdate`, `carrierServiceDelete`
- Queries: `carrierService`, `availableCarrierServices`
- **Popularity:** MEDIUM (shipping integrations)
- **Complexity:** LOW (CRUD)
- **Impact:** Third-party carrier integrations

**17. CART TRANSFORMS** (2 mutations, 1 query)
- `cartTransformCreate`, `cartTransformDelete`
- Query: `cartTransforms`
- **Popularity:** MEDIUM (Shopify Functions for cart discounts)
- **Complexity:** MEDIUM (function triggers, cart modification)
- **Impact:** Dynamic cart rules

**18. WEB PIXELS & SERVER PIXELS** (4 mutations, 2 queries)
- `webPixelCreate`, `webPixelUpdate`, `webPixelDelete`
- `serverPixelCreate`, `serverPixelDelete`, `pubSubServerPixelUpdate`, `eventBridgeServerPixelUpdate`
- Queries: `webPixel`, `serverPixel`
- **Popularity:** MEDIUM (analytics, tracking)
- **Complexity:** LOW (CRUD, event subscriptions)
- **Impact:** Analytics & pixel tracking integration

**19. SAVED SEARCHES** (3 mutations, 1 query)
- `savedSearchCreate`, `savedSearchUpdate`, `savedSearchDelete`
- Queries: `collectionSavedSearches`, `customerSavedSearches`, `productSavedSearches`, `orderSavedSearches`
- **Popularity:** MEDIUM (admin UX, filtering)
- **Complexity:** LOW (saved query storage)
- **Impact:** Admin workflow acceleration

**20. SCRIPT TAGS** (3 mutations, 2 queries)
- `scriptTagCreate`, `scriptTagUpdate`, `scriptTagDelete`
- Queries: `scriptTag`, `scriptTags`
- **Popularity:** LOW-MEDIUM (legacy, being replaced by pixels & app blocks)
- **Complexity:** LOW (CRUD)
- **Impact:** Custom JS injection (legacy support)

---

### Lower-Priority: Specialized (70% coverage tier)

**21. COMPANY MANAGEMENT (B2B)** (25+ mutations)
- Company CRUD, contacts, locations, roles, tax exemptions, staff assignments, address management
- Queries: `company`, `companies`, `companyContact`, `companyLocation`
- **Popularity:** MEDIUM (B2B merchants)
- **Complexity:** HIGH (nested entities, role-based permissions)
- **Impact:** B2B buyer portal operations

**22. DRAFT ORDER SPECIAL OPS** (partial; some implemented)
- Missing: `draftOrderAvailableDeliveryOptions` (query-only, already listed in progress)
- Most draft order CRUD already done; special ops mostly complete
- **Popularity:** HIGH (pre-order, quotes)
- **Complexity:** Already implemented
- **Impact:** Selling on behalf of customers

**23. MARKETING ACTIVITIES** (6 mutations, 3 queries)
- `marketingActivityCreate`, `marketingActivityUpdate`, `marketingActivityDelete`
- External variants: create, update, delete
- Queries: `marketingActivity`, `marketingActivities`, `marketingEvent`
- **Popularity:** MEDIUM (campaign tracking)
- **Complexity:** MEDIUM (external integrations)
- **Impact:** Campaign attribution

**24. VALIDATION FUNCTIONS** (3 mutations, 1 query)
- `validationCreate`, `validationUpdate`, `validationDelete`
- Queries: `validation`, `validations`
- **Popularity:** LOW-MEDIUM (checkout customization via Functions)
- **Complexity:** MEDIUM (Shopify Functions)
- **Impact:** Custom checkout validation rules

**25. STORE CREDIT** (2 mutations, 1 query)
- `storeCreditAccountCredit`, `storeCreditAccountDebit`
- Query: `storeCreditAccount`
- **Popularity:** MEDIUM (loyalty, gift-like accounts)
- **Complexity:** LOW (accounting ops)
- **Impact:** Store credit account management

**26. DELEGATE ACCESS TOKENS** (2 mutations)
- `delegateAccessTokenCreate`, `delegateAccessTokenDestroy`
- **Popularity:** LOW-MEDIUM (app security, scoped access)
- **Complexity:** LOW (token lifecycle)
- **Impact:** Limited-scope app integrations

**27. INVENTORY ITEM UPDATES** (1 mutation, limited)
- `inventoryItemUpdate` (weights, HSCodes, SKU tracking codes)
- Query: `inventoryItem`, `inventoryItems`
- **Popularity:** MEDIUM (inventory metadata)
- **Complexity:** LOW (field updates)
- **Impact:** Inventory tracking configuration

**28. BULK OPERATIONS** (3 mutations, 2 queries)
- `bulkOperationRunQuery`, `bulkOperationRunMutation`, `bulkOperationCancel`
- Queries: `bulkOperation`, `bulkOperations`
- **Popularity:** HIGH (large-scale data operations)
- **Complexity:** MEDIUM (async, polling for results)
- **Impact:** Batch processing at scale

**29. MARKETS (B2B / REGIONS)** (9 mutations, 2+ queries)
- Market CRUD, region management, currency/localization settings, web presence management
- Queries: `market`, `markets`, `marketByGeography`, `primaryMarket`
- **Popularity:** MEDIUM-HIGH (international expansion, market segmentation)
- **Complexity:** MEDIUM (nested localizations, currency handling)
- **Impact:** Multi-market catalog management

**30. ORDER EDIT SESSION** (7 mutations, 1 query)
- `orderEditBegin`, `orderEditCommit`, `orderEditAddVariant`, `orderEditRemoveDiscount`, `orderEditUpdateDiscount`, etc.
- Query: `orderEditSession`, `orderPaymentStatus`
- **Popularity:** HIGH (post-sale customer service)
- **Complexity:** MEDIUM (session-based state, validation)
- **Impact:** Order modification workflows

**31. PRODUCT BUNDLES** (2 mutations, implicit in products)
- `productBundleCreate`, `productBundleUpdate`
- **Popularity:** MEDIUM (product bundling, kits)
- **Complexity:** MEDIUM (component management)
- **Impact:** Bundle product creation

---

## 📊 Coverage Analysis

### By Popularity Tier

| Tier | Category | Count | Status | Coverage Impact |
|------|----------|-------|--------|-----------------|
| **Critical** | Fulfillment, Returns, Subscriptions, Gift Cards, Orders, Inventory, Products | 7 | 5/7 | **~95%** |
| **High** | Locations, Price Lists, Payment Terms, Discounts, Bulk Ops, Order Edit | 6 | 1/6 | **~65%** |
| **Medium** | Themes, Inventory Transfers, Carrier Services, Pixels, Saved Searches, Markets, Company | 7 | 0/7 | **~35%** |
| **Low** | Script Tags, Validation, Store Credit, Delegate Tokens | 4 | 0/4 | **~10%** |

### By Implementation Effort

| Effort | Resources | Est. Implementation |
|--------|-----------|-------------------|
| **Quick (LOW)** | Locations, Fulfillment Services, Payment Terms, Carrier Services, Inventory Items, Script Tags, Delegate Tokens | 1-2 days each |
| **Medium** | Gift Cards, Price Lists, Inventory Transfers, Themes, Refunds, Pixels, Saved Searches, Marketing Activities | 2-3 days each |
| **Complex (HIGH)** | Subscriptions, Returns, Fulfillment Order Workflows, Discounts (Auto+Code), Order Edit, Markets, Company B2B, Bulk Operations | 3-5 days each |

---

## 🎯 Recommended Priority for 90% Coverage

To reach **90% utilization** of the most popular Shopify Admin API use cases, prioritize in this order:

### Phase 1 (Immediate – adds 20% coverage)
1. **GIFT CARDS** ← HIGH impact, LOW complexity
2. **LOCATIONS** ← HIGH impact, LOW complexity
3. **PAYMENT TERMS** ← MEDIUM impact, LOW complexity
4. **FULFILLMENT SERVICES** ← MEDIUM impact, LOW complexity

### Phase 2 (Short-term – adds 30% coverage)
5. **PRICE LISTS + QUANTITY PRICING** ← HIGH impact (B2B wholesale)
6. **DISCOUNTS (AUTOMATIC + CODES)** ← HIGH impact, but complex
7. **INVENTORY SHIPMENTS & TRANSFERS** ← MEDIUM impact (warehouse ops)
8. **REFUNDS** ← MEDIUM impact (order lifecycle)

### Phase 3 (Medium-term – adds 25% coverage)
9. **RETURN MANAGEMENT** ← CRITICAL impact, HIGH complexity
10. **FULFILLMENT ORDER WORKFLOWS** ← CRITICAL impact, VERY HIGH complexity
11. **SUBSCRIPTIONS** ← HIGH impact, but VERY HIGH complexity
12. **ORDER EDIT SESSION** ← HIGH impact (customer service)

### Phase 4 (Long-tail – adds 15% coverage)
13. Themes, Markets, Company (B2B), Bulk Operations, Validation Functions, Web Pixels, Carrier Services, Saved Searches

---

## 📈 Post-Implementation Checklist

Once top 10 are implemented:
- [ ] Test all CRUD operations per resource
- [ ] Verify error handling for business rules (e.g., can't delete location with inventory)
- [ ] Add workflow commands (publish, activate, etc.)
- [ ] Document common patterns (e.g., how to list items, how to handle pagination)
- [ ] Add examples to `--help` for each command
- [ ] Consider CLI convenience features:
  - `--resolve` flags for nested lookups (e.g., `--location-name` → location ID)
  - Batch operations (e.g., `--ids` for multi-item operations)
  - Workflow shortcuts (e.g., `shop gift-cards mark-active --id <gid>`)

---

## 🔗 Key Insights

1. **Subscriptions** are a game-changer for D2C brands but have complex state machines (deferred for Phase 3+)
2. **Gift Cards** are quick wins with high retail appeal
3. **Price Lists** are essential for B2B/wholesale use cases
4. **Fulfillment workflows** are mission-critical but very complex
5. **Discounts** (both automatic and code-based) are highly requested but complex rule-building
6. **Markets** enable international expansion but requires localization infrastructure
7. **Company/B2B** is a growing segment but requires careful role/permission handling

---

## Schema Coverage Summary

- **Total Query Fields:** 269 (90%+ now queryable via CLI)
- **Total Mutation Fields:** 494 (only ~70 currently implemented)
- **Recommended Next Wave:** Top 30 resources above = ~180 additional mutations/queries to support
- **Target:** 90% API coverage = ~445 mutations/queries (~60 resources total)

