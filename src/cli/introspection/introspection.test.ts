import { describe, it, expect } from 'vitest'

import { getFields } from './index'
import { resourceToType } from './resources'
import { commandRegistry } from '../help/registry'

describe('fields introspection', () => {
  it('returns expected Product fields', () => {
    const fields = getFields('Product')

    const id = fields.find((f) => f.name === 'id')
    expect(id).toBeTruthy()
    expect(id?.isScalar).toBe(true)

    const seo = fields.find((f) => f.name === 'seo')
    expect(seo).toBeTruthy()
    expect(seo?.isScalar).toBe(false)
    expect(seo?.isConnection).toBe(false)

    const variants = fields.find((f) => f.name === 'variants')
    expect(variants).toBeTruthy()
    expect(variants?.isConnection).toBe(true)
    expect(variants?.connectionNodeTypeName).toBe('ProductVariant')
  })

  it('maps products -> Product', () => {
    expect(resourceToType.products).toBe('Product')
  })

  it('adds fields verb in help for supported resources', () => {
    const products = commandRegistry.find((r) => r.resource === 'products')
    expect(products).toBeTruthy()
    expect(products?.verbs.some((v) => v.verb === 'fields')).toBe(true)

    const graphql = commandRegistry.find((r) => r.resource === 'graphql')
    expect(graphql).toBeTruthy()
    expect(graphql?.verbs.some((v) => v.verb === 'fields')).toBe(false)
  })
})

