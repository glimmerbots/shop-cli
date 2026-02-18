import { CliError } from './errors'

export type ShopifyGidType =
  | 'Product'
  | 'ProductVariant'
  | 'Collection'
  | 'Customer'
  | 'Order'
  | 'CalculatedOrder'
  | 'CalculatedLineItem'
  | 'CalculatedDiscountApplication'
  | 'CalculatedShippingLine'
  | 'InventoryItem'
  | 'Location'
  | 'FulfillmentOrder'
  | 'Fulfillment'
  | 'FulfillmentHold'
  | 'Return'
  | 'ReturnLineItem'
  | 'ReturnReasonDefinition'
  | 'ReturnableFulfillment'
  | 'File'
  | 'Publication'
  | 'Article'
  | 'Blog'
  | 'Page'
  | 'Comment'
  | 'Menu'
  | 'Catalog'
  | 'Market'
  | 'DraftOrder'
  | 'DraftOrderTag'
  | 'UrlRedirect'
  | 'Segment'
  | 'WebhookSubscription'
  | 'MetafieldDefinition'
  | 'Metaobject'
  | 'MetaobjectDefinition'
  | 'SellingPlanGroup'
  | 'SubscriptionContract'
  | 'SubscriptionDraft'
  | 'SubscriptionLine'
  | 'SubscriptionManualDiscount'
  | 'SubscriptionBillingAttempt'

export const isGid = (value: string) => value.startsWith('gid://')

export const coerceGid = (value: string, type: ShopifyGidType) => {
  if (isGid(value)) return value
  if (!/^\d+$/.test(value)) {
    throw new CliError(
      `Expected a numeric ID or full GID for ${type}. Got: ${value}`,
      2,
    )
  }
  return `gid://shopify/${type}/${value}`
}
