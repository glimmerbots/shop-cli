import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { coerceGid, isStrictIdsMode, parseEnvBoolean, setStrictIdsMode } from '../cli/gid'

describe('SHOP_CLI_STRICT_IDS / --strict-ids', () => {
  let originalStrict: boolean

  beforeEach(() => {
    originalStrict = isStrictIdsMode()
  })

  afterEach(() => {
    setStrictIdsMode(originalStrict)
  })

  it('parseEnvBoolean treats common falsey values as false', () => {
    expect(parseEnvBoolean(undefined)).toBe(false)
    expect(parseEnvBoolean('0')).toBe(false)
    expect(parseEnvBoolean('false')).toBe(false)
    expect(parseEnvBoolean('off')).toBe(false)
    expect(parseEnvBoolean('no')).toBe(false)
  })

  it('parseEnvBoolean treats common truthy values (and empty string) as true', () => {
    expect(parseEnvBoolean('')).toBe(true)
    expect(parseEnvBoolean('1')).toBe(true)
    expect(parseEnvBoolean('true')).toBe(true)
    expect(parseEnvBoolean('on')).toBe(true)
    expect(parseEnvBoolean('yes')).toBe(true)
  })

  it('coerceGid rejects numeric IDs when strict IDs mode is enabled', () => {
    setStrictIdsMode(true)
    expect(() => coerceGid('123', 'Product', '--id')).toThrow(/Strict IDs mode is enabled/i)
  })

  it('files get rejects numeric IDs when strict IDs mode is enabled', async () => {
    setStrictIdsMode(true)
    const { runFiles } = await import('../cli/verbs/files')

    let called = false
    const ctx: any = {
      client: {
        query: async () => {
          called = true
          return {}
        },
      },
      format: 'json',
      quiet: false,
      view: 'summary',
      dryRun: false,
      failOnUserErrors: true,
      warnMissingAccessToken: false,
    }

    await expect(
      runFiles({
        ctx,
        verb: 'get',
        argv: ['--id', '123'],
      }),
    ).rejects.toThrow(/Strict IDs mode is enabled/i)

    expect(called).toBe(false)
  })
})

