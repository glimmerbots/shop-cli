import { CliError } from './errors'

export type ShopifyGidType =
  | 'Product'
  | 'ProductVariant'
  | 'Collection'
  | 'Customer'
  | 'Order'
  | 'InventoryItem'
  | 'Location'
  | 'File'
  | 'Publication'
  | 'Article'
  | 'Blog'
  | 'Page'
  | 'Comment'
  | 'Menu'
  | 'Catalog'
  | 'Market'
  | 'PriceList'
  | 'DraftOrder'
  | 'DraftOrderTag'
  | 'FulfillmentService'
  | 'GiftCard'
  | 'DiscountAutomaticNode'
  | 'DiscountCodeNode'
  | 'DiscountRedeemCode'
  | 'UrlRedirect'
  | 'PaymentSchedule'
  | 'PaymentTerms'
  | 'PaymentTermsTemplate'
  | 'Segment'
  | 'WebhookSubscription'
  | 'MetafieldDefinition'
  | 'Metaobject'
  | 'MetaobjectDefinition'
  | 'SellingPlanGroup'
  | 'InventoryTransfer'
  | 'InventoryTransferLineItem'
  | 'Refund'

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
