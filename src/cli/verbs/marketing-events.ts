import { CliError } from '../errors'
import { printConnection, printNode } from '../output'
import { parseStandardArgs, runQuery, type CommandContext } from '../router'
import { resolveSelection } from '../selection/select'

import { buildListNextPageArgs, parseFirst, requireId } from './_shared'

const marketingEventSummarySelection = {
  id: true,
  type: true,
  sourceAndMedium: true,
  description: true,
  startedAt: true,
  endedAt: true,
  manageUrl: true,
  previewUrl: true,
  utmSource: true,
  utmMedium: true,
  utmCampaign: true,
} as const

const marketingEventFullSelection = {
  ...marketingEventSummarySelection,
  remoteId: true,
  scheduledToEndAt: true,
  channelHandle: true,
  app: { id: true, title: true, handle: true },
} as const

const getMarketingEventSelection = (view: CommandContext['view']) => {
  if (view === 'ids') return { id: true } as const
  if (view === 'full') return marketingEventFullSelection
  if (view === 'raw') return {} as const
  return marketingEventSummarySelection
}

export const runMarketingEvents = async ({
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
        '  shop marketing-events <verb> [flags]',
        '',
        'Verbs:',
        '  get|list',
        '',
        'Common output flags:',
        '  --view summary|ids|full|raw|all',
        '  --select <path>        (repeatable; dot paths; adds to base view selection)',
        '  --selection <graphql>  (selection override; can be @file.gql)',
      ].join('\n'),
    )
    return
  }

  if (verb === 'get') {
    const args = parseStandardArgs({ argv, extraOptions: {} })
    const id = requireId(args.id, 'MarketingEvent')
    const selection = resolveSelection({
      resource: 'marketing-events',
      view: ctx.view,
      baseSelection: getMarketingEventSelection(ctx.view) as any,
      select: args.select,
      selection: (args as any).selection,
      include: args.include,
      ensureId: ctx.quiet,
    })

    const result = await runQuery(ctx, { marketingEvent: { __args: { id }, ...selection } })
    if (result === undefined) return
    printNode({ node: result.marketingEvent, format: ctx.format, quiet: ctx.quiet })
    return
  }

  if (verb === 'list') {
    const args = parseStandardArgs({ argv, extraOptions: {} })
    const first = parseFirst(args.first)
    const after = args.after as any
    const query = args.query as any
    const reverse = args.reverse as any
    const sortKey = args.sort as any

    const nodeSelection = resolveSelection({
      resource: 'marketing-events',
      view: ctx.view,
      baseSelection: getMarketingEventSelection(ctx.view) as any,
      select: args.select,
      selection: (args as any).selection,
      include: args.include,
      ensureId: ctx.quiet,
    })

    const result = await runQuery(ctx, {
      marketingEvents: {
        __args: { first, after, query, reverse, sortKey },
        pageInfo: { hasNextPage: true, endCursor: true },
        nodes: nodeSelection,
      },
    })
    if (result === undefined) return
    printConnection({
      connection: result.marketingEvents,
      format: ctx.format,
      quiet: ctx.quiet,
      nextPageArgs: buildListNextPageArgs('marketing-events', { first, query, sort: sortKey, reverse }),
    })
    return
  }

  throw new CliError(`Unknown verb for marketing-events: ${verb}`, 2)
}

