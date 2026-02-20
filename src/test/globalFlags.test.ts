import { describe, expect, it } from 'vitest'
import { parseGlobalFlags } from '../cli/globalFlags'

describe('parseGlobalFlags', () => {
  it('keeps inline values that contain "="', () => {
    const parsed = parseGlobalFlags(['--header=X-Foo=bar', 'products', 'list'])
    expect(parsed.headers).toEqual(['X-Foo=bar'])
    expect(parsed.passthrough).toEqual(['products', 'list'])
  })

  it('parses --strict-ids', () => {
    const parsed = parseGlobalFlags(['--strict-ids', 'products', 'get', '--id', 'gid://shopify/Product/1'])
    expect(parsed.strictIds).toBe(true)
    expect(parsed.passthrough).toEqual(['products', 'get', '--id', 'gid://shopify/Product/1'])
  })
})
