import { describe, expect, it, beforeEach, afterEach } from 'vitest'

describe('products options', () => {
  let captured = ''
  let originalWrite: typeof process.stdout.write

  beforeEach(() => {
    captured = ''
    originalWrite = process.stdout.write.bind(process.stdout)
    ;(process.stdout as any).write = (chunk: unknown) => {
      captured += typeof chunk === 'string' ? chunk : Buffer.from(chunk as any).toString('utf8')
      return true
    }
  })

  afterEach(() => {
    ;(process.stdout as any).write = originalWrite
    captured = ''
  })

  it('options create parses --option specs into productOptionsCreate input', async () => {
    const { runProducts } = await import('../cli/verbs/products')

    const capture: { request?: any } = {}
    const ctx: any = {
      client: {
        mutation: async (request: any) => {
          capture.request = request
          return { productOptionsCreate: { product: { id: 'gid://shopify/Product/1' }, userErrors: [] } }
        },
      },
      format: 'json',
      quiet: true,
      view: 'summary',
      dryRun: false,
      failOnUserErrors: true,
      warnMissingAccessToken: false,
    }

    await runProducts({
      ctx,
      verb: 'options create',
      argv: [
        '--product-id',
        'gid://shopify/Product/1',
        '--option',
        'Size=Small,Medium',
        '--option',
        'Color=Red',
      ],
    })

    expect(capture.request?.productOptionsCreate?.__args?.productId).toBe('gid://shopify/Product/1')
    expect(capture.request?.productOptionsCreate?.__args?.options).toMatchObject([
      { name: 'Size', values: [{ name: 'Small' }, { name: 'Medium' }] },
      { name: 'Color', values: [{ name: 'Red' }] },
    ])
    expect(captured).toBe('gid://shopify/Product/1\n')
  })

  it('options update resolves value names to IDs for delete/rename', async () => {
    const { runProducts } = await import('../cli/verbs/products')

    const capture: { mutation?: any } = {}
    const ctx: any = {
      client: {
        query: async () => {
          return {
            product: {
              options: [
                {
                  id: 'gid://shopify/ProductOption/10',
                  name: 'Size',
                  optionValues: [
                    { id: 'gid://shopify/ProductOptionValue/100', name: 'Small' },
                    { id: 'gid://shopify/ProductOptionValue/101', name: 'Medium' },
                  ],
                },
              ],
            },
          }
        },
        mutation: async (request: any) => {
          capture.mutation = request
          return { productOptionUpdate: { product: { id: 'gid://shopify/Product/1' }, userErrors: [] } }
        },
      },
      format: 'json',
      quiet: true,
      view: 'summary',
      dryRun: false,
      failOnUserErrors: true,
      warnMissingAccessToken: false,
    }

    await runProducts({
      ctx,
      verb: 'options update',
      argv: [
        '--product-id',
        'gid://shopify/Product/1',
        '--option-id',
        'gid://shopify/ProductOption/10',
        '--delete-value',
        'Medium',
        '--rename-value',
        'Small=Smol',
      ],
    })

    const args = capture.mutation?.productOptionUpdate?.__args
    expect(args?.productId).toBe('gid://shopify/Product/1')
    expect(args?.option?.id).toBe('gid://shopify/ProductOption/10')
    expect(args?.optionValuesToDelete).toEqual(['gid://shopify/ProductOptionValue/101'])
    expect(args?.optionValuesToUpdate).toEqual([{ id: 'gid://shopify/ProductOptionValue/100', name: 'Smol' }])
    expect(captured).toBe('gid://shopify/Product/1\n')
  })

  it('options delete resolves --option-name to IDs', async () => {
    const { runProducts } = await import('../cli/verbs/products')

    const capture: { mutation?: any } = {}
    const ctx: any = {
      client: {
        query: async () => {
          return {
            product: {
              options: [
                { id: 'gid://shopify/ProductOption/20', name: 'Color', optionValues: [] },
              ],
            },
          }
        },
        mutation: async (request: any) => {
          capture.mutation = request
          return { productOptionsDelete: { deletedOptionsIds: ['gid://shopify/ProductOption/20'], userErrors: [] } }
        },
      },
      format: 'json',
      quiet: false,
      view: 'summary',
      dryRun: false,
      failOnUserErrors: true,
      warnMissingAccessToken: false,
    }

    await runProducts({
      ctx,
      verb: 'options delete',
      argv: ['--product-id', 'gid://shopify/Product/1', '--option-name', 'Color'],
    })

    expect(capture.mutation?.productOptionsDelete?.__args?.options).toEqual(['gid://shopify/ProductOption/20'])
  })

  it('options reorder requires full value order when specifying values', async () => {
    const { runProducts } = await import('../cli/verbs/products')

    const capture: { mutation?: any } = {}
    const ctx: any = {
      client: {
        query: async () => {
          return {
            product: {
              options: [
                {
                  id: 'gid://shopify/ProductOption/30',
                  name: 'Color',
                  optionValues: [
                    { id: 'gid://shopify/ProductOptionValue/201', name: 'Green' },
                    { id: 'gid://shopify/ProductOptionValue/202', name: 'Red' },
                    { id: 'gid://shopify/ProductOptionValue/203', name: 'Blue' },
                  ],
                },
              ],
            },
          }
        },
        mutation: async (request: any) => {
          capture.mutation = request
          return { productOptionsReorder: { product: { id: 'gid://shopify/Product/1' }, userErrors: [] } }
        },
      },
      format: 'json',
      quiet: true,
      view: 'summary',
      dryRun: false,
      failOnUserErrors: true,
      warnMissingAccessToken: false,
    }

    await runProducts({
      ctx,
      verb: 'options reorder',
      argv: ['--product-id', 'gid://shopify/Product/1', '--order', 'Color=Green,Red,Blue'],
    })

    const args = capture.mutation?.productOptionsReorder?.__args
    expect(args?.productId).toBe('gid://shopify/Product/1')
    expect(args?.options).toEqual([
      {
        id: 'gid://shopify/ProductOption/30',
        values: [
          { id: 'gid://shopify/ProductOptionValue/201' },
          { id: 'gid://shopify/ProductOptionValue/202' },
          { id: 'gid://shopify/ProductOptionValue/203' },
        ],
      },
    ])
    expect(captured).toBe('gid://shopify/Product/1\n')
  })

  it('rejects --id for product-scoped subverbs (use --product-id)', async () => {
    const { runProducts } = await import('../cli/verbs/products')

    const ctx: any = {
      client: {
        query: async () => ({}),
        mutation: async () => ({}),
      },
      format: 'json',
      quiet: false,
      view: 'summary',
      dryRun: false,
      failOnUserErrors: true,
      warnMissingAccessToken: false,
    }

    await expect(
      runProducts({
        ctx,
        verb: 'options list',
        argv: ['--id', 'gid://shopify/Product/1'],
      }),
    ).rejects.toThrow('Unknown flag --id, did you mean --product-id?')
  })
})
