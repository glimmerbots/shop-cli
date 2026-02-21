import { afterEach, beforeEach, describe, expect, it } from 'vitest'

describe('products input field validation', () => {
  let originalWrite: typeof process.stdout.write

  beforeEach(() => {
    originalWrite = process.stdout.write.bind(process.stdout)
    ;(process.stdout as any).write = () => true
  })

  afterEach(() => {
    ;(process.stdout as any).write = originalWrite
  })

  it('rejects unknown input fields (bodyHtml)', async () => {
    const { runProducts } = await import('../cli/verbs/products')

    let called = false
    const ctx: any = {
      client: {
        mutation: async (request: any) => {
          called = true
          return request
        },
      },
      format: 'json',
      quiet: true,
      view: 'summary',
      dryRun: false,
      failOnUserErrors: true,
      warnMissingAccessToken: false,
    }

    try {
      await runProducts({
        ctx,
        verb: 'update',
        argv: ['--id', 'gid://shopify/Product/1', '--set', 'bodyHtml=<p>Hello</p>'],
      })
      throw new Error('expected rejection')
    } catch (err: any) {
      expect(String(err?.message ?? err)).toContain('Unknown input field "bodyHtml" on ProductInput')
      expect(String(err?.message ?? err)).toContain('--set descriptionHtml=<String>')
    }
    expect(called).toBe(false)
  })

  it('validates nested input objects', async () => {
    const { runProducts } = await import('../cli/verbs/products')

    let called = false
    const ctx: any = {
      client: {
        mutation: async () => {
          called = true
          return { productUpdate: { product: { id: 'gid://shopify/Product/1' }, userErrors: [] } }
        },
      },
      format: 'json',
      quiet: true,
      view: 'summary',
      dryRun: false,
      failOnUserErrors: true,
      warnMissingAccessToken: false,
    }

    await expect(
      runProducts({
        ctx,
        verb: 'update',
        argv: [
          '--id',
          'gid://shopify/Product/1',
          '--set',
          'seo.nope=1',
        ],
      }),
    ).rejects.toThrowError('Unknown input field "nope" on SEOInput')
    expect(called).toBe(false)
  })
})
