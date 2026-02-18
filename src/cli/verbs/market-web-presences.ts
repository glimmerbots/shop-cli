import { CliError } from '../errors'
import { coerceGid } from '../gid'
import { buildInput } from '../input'
import { printJson } from '../output'
import { parseStandardArgs, runMutation, type CommandContext } from '../router'
import { maybeFailOnUserErrors } from '../userErrors'

import { requireId } from './_shared'

const marketSummarySelection = {
  id: true,
  name: true,
  handle: true,
  status: true,
  type: true,
} as const

const requireMarketId = (value: unknown) => {
  if (typeof value !== 'string' || !value) throw new CliError('Missing --market-id', 2)
  return coerceGid(value, 'Market')
}

export const runMarketWebPresences = async ({
  ctx,
  verb,
  argv,
}: {
  ctx: CommandContext
  verb: string
  argv: string[]
}) => {
  if (argv.includes('--help') || argv.includes('-h')) {
    console.log(
      [
        'Usage:',
        '  shop market-web-presences <verb> [flags]',
        '',
        'Verbs:',
        '  create|update|delete',
        '',
        'Notes:',
        '  create requires --market-id and webPresence input.',
        '  update/delete operate on a MarketWebPresence ID (--id).',
        '',
        'Common output flags:',
        '  --format json|jsonl|table|markdown|raw',
        '  --quiet',
      ].join('\n'),
    )
    return
  }

  if (verb === 'create') {
    const args = parseStandardArgs({ argv, extraOptions: { 'market-id': { type: 'string' } } })
    const marketId = requireMarketId((args as any)['market-id'])

    const built = buildInput({
      inputArg: args.input as any,
      setArgs: args.set as any,
      setJsonArgs: args['set-json'] as any,
    })
    if (!built.used) throw new CliError('Missing --input or --set/--set-json', 2)

    const webPresence = built.input ?? {}
    if (webPresence.defaultLocale === undefined) {
      throw new CliError('Missing defaultLocale (use --set defaultLocale=en)', 2)
    }

    const result = await runMutation(ctx, {
      marketWebPresenceCreate: {
        __args: { marketId, webPresence },
        market: marketSummarySelection,
        userErrors: { field: true, message: true, code: true },
      },
    })
    if (result === undefined) return
    maybeFailOnUserErrors({ payload: result.marketWebPresenceCreate, failOnUserErrors: ctx.failOnUserErrors })
    if (ctx.quiet) return
    printJson(result.marketWebPresenceCreate, ctx.format !== 'raw')
    return
  }

  if (verb === 'update') {
    const args = parseStandardArgs({ argv, extraOptions: {} })
    const webPresenceId = requireId(args.id, 'MarketWebPresence')

    const built = buildInput({
      inputArg: args.input as any,
      setArgs: args.set as any,
      setJsonArgs: args['set-json'] as any,
    })
    if (!built.used) throw new CliError('Missing --input or --set/--set-json', 2)

    const result = await runMutation(ctx, {
      marketWebPresenceUpdate: {
        __args: { webPresenceId, webPresence: built.input },
        market: marketSummarySelection,
        userErrors: { field: true, message: true, code: true },
      },
    })
    if (result === undefined) return
    maybeFailOnUserErrors({ payload: result.marketWebPresenceUpdate, failOnUserErrors: ctx.failOnUserErrors })
    if (ctx.quiet) return
    printJson(result.marketWebPresenceUpdate, ctx.format !== 'raw')
    return
  }

  if (verb === 'delete') {
    const args = parseStandardArgs({ argv, extraOptions: {} })
    const webPresenceId = requireId(args.id, 'MarketWebPresence')
    if (!args.yes) throw new CliError('Refusing to delete without --yes', 2)

    const result = await runMutation(ctx, {
      marketWebPresenceDelete: {
        __args: { webPresenceId },
        deletedId: true,
        market: marketSummarySelection,
        userErrors: { field: true, message: true, code: true },
      },
    })
    if (result === undefined) return
    maybeFailOnUserErrors({ payload: result.marketWebPresenceDelete, failOnUserErrors: ctx.failOnUserErrors })
    if (ctx.quiet) return console.log(result.marketWebPresenceDelete?.deletedId ?? '')
    printJson(result.marketWebPresenceDelete, ctx.format !== 'raw')
    return
  }

  throw new CliError(`Unknown verb for market-web-presences: ${verb}`, 2)
}
