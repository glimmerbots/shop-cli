import { describe, expect, it } from 'vitest'
import { CliError } from '../cli/errors'
import { parseHeadersFromEnv, parseHeaderValues } from '../cli/headers'

describe('headers', () => {
  it('parses --header values with ":" and "="', () => {
    expect(parseHeaderValues(['X-Foo=bar', 'X-Bar: baz'])).toEqual({
      'X-Foo': 'bar',
      'X-Bar': 'baz',
    })
  })

  it('chooses the first separator when values contain ":" or "="', () => {
    expect(parseHeaderValues(['X-Foo=bar:baz'])).toEqual({ 'X-Foo': 'bar:baz' })
    expect(parseHeaderValues(['X-Foo: bar=baz'])).toEqual({ 'X-Foo': 'bar=baz' })
  })

  it('rejects invalid --header values', () => {
    expect(() => parseHeaderValues(['nope'])).toThrow(CliError)
    expect(() => parseHeaderValues(['nope'])).toThrow(/expected/i)
  })

  it('parses SHOPIFY_HEADERS JSON object', () => {
    expect(parseHeadersFromEnv('{"X-Foo":"bar","X-Bar":"baz"}')).toEqual({
      'X-Foo': 'bar',
      'X-Bar': 'baz',
    })
  })

  it('rejects invalid SHOPIFY_HEADERS', () => {
    expect(() => parseHeadersFromEnv('not-json')).toThrow(CliError)
    expect(() => parseHeadersFromEnv('[]')).toThrow(CliError)
    expect(() => parseHeadersFromEnv('{"X-Foo":123}')).toThrow(CliError)
  })
})
