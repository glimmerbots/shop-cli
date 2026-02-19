import { describe, expect, it } from 'vitest'
import { parseGlobalFlags } from '../cli/globalFlags'

describe('parseGlobalFlags', () => {
  it('keeps inline values that contain "="', () => {
    const parsed = parseGlobalFlags(['--header=X-Foo=bar', 'products', 'list'])
    expect(parsed.headers).toEqual(['X-Foo=bar'])
    expect(parsed.passthrough).toEqual(['products', 'list'])
  })
})

