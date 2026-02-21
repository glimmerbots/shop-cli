import { afterEach, beforeEach, describe, expect, it } from 'vitest'

describe('pages input field validation', () => {
  let originalWrite: typeof process.stdout.write

  beforeEach(() => {
    originalWrite = process.stdout.write.bind(process.stdout)
    ;(process.stdout as any).write = () => true
  })

  afterEach(() => {
    ;(process.stdout as any).write = originalWrite
  })

  it('suggests --set body=<String> for bodyHtml', async () => {
    const { runPages } = await import('../cli/verbs/pages')

    let called = false
    const ctx: any = {
      client: {
        mutation: async () => {
          called = true
          return {}
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
      await runPages({
        ctx,
        verb: 'create',
        argv: ['--set', 'title=Test', '--set', 'bodyHtml=Test body', '--set', 'handle=test-0938'],
      })
      throw new Error('expected rejection')
    } catch (err: any) {
      const msg = String(err?.message ?? err)
      expect(msg).toContain('Unknown input field "bodyHtml" on PageCreateInput')
      expect(msg).toContain('--set body=<String>')
      expect(msg).toContain('types PageCreateInput')
    }

    expect(called).toBe(false)
  })
})

