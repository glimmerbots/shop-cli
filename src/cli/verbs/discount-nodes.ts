import { CliError } from '../errors'
import { printConnection, printJson, printNode } from '../output'
import { parseStandardArgs, runQuery, type CommandContext } from '../router'
import { resolveSelection } from '../selection/select'

import { buildListNextPageArgs, parseFirst, requireId } from './_shared'

const discountSummarySelection = {
  __typename: true,
  on_DiscountAutomaticBasic: { title: true, status: true, startsAt: true, endsAt: true },
  on_DiscountAutomaticBxgy: { title: true, status: true, startsAt: true, endsAt: true },
  on_DiscountAutomaticFreeShipping: { title: true, status: true, startsAt: true, endsAt: true },
  on_DiscountAutomaticApp: { title: true, status: true, startsAt: true, endsAt: true },
  on_DiscountCodeBasic: {
    title: true,
    status: true,
    startsAt: true,
    endsAt: true,
    codes: { __args: { first: 5 }, nodes: { id: true, code: true } },
  },
  on_DiscountCodeBxgy: {
    title: true,
    status: true,
    startsAt: true,
    endsAt: true,
    codes: { __args: { first: 5 }, nodes: { id: true, code: true } },
  },
  on_DiscountCodeFreeShipping: {
    title: true,
    status: true,
    startsAt: true,
    endsAt: true,
    codes: { __args: { first: 5 }, nodes: { id: true, code: true } },
  },
  on_DiscountCodeApp: {
    title: true,
    status: true,
    startsAt: true,
    endsAt: true,
    codes: { __args: { first: 5 }, nodes: { id: true, code: true } },
    appDiscountType: { title: true, functionId: true },
  },
} as const

const discountNodeSummarySelection = {
  id: true,
  discount: discountSummarySelection,
} as const

const getDiscountNodeSelection = (view: CommandContext['view']) => {
  if (view === 'ids') return { id: true } as const
  if (view === 'raw') return {} as const
  return discountNodeSummarySelection
}

const parseLimit = (value: unknown) => {
  if (value === undefined) return undefined
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) throw new CliError('--limit must be a positive integer', 2)
  return Math.floor(n)
}

export const runDiscountNodes = async ({
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
        '  shop discount-nodes <verb> [flags]',
        '',
        'Verbs:',
        '  get|list|count',
        '',
        'Common output flags:',
        '  --view summary|ids|raw|all',
        '  --select <path>        (repeatable; dot paths; adds to base view selection)',
        '  --selection <graphql>  (selection override; can be @file.gql)',
      ].join('\n'),
    )
    return
  }

  if (verb === 'get') {
    const args = parseStandardArgs({ argv, extraOptions: {} })
    const id = requireId(args.id, 'DiscountNode')

    const selection = resolveSelection({
      resource: 'discount-nodes',
      view: ctx.view,
      baseSelection: getDiscountNodeSelection(ctx.view) as any,
      select: args.select,
      selection: (args as any).selection,
      include: args.include,
      ensureId: ctx.quiet,
    })

    const result = await runQuery(ctx, { discountNode: { __args: { id }, ...selection } })
    if (result === undefined) return
    printNode({ node: result.discountNode, format: ctx.format, quiet: ctx.quiet })
    return
  }

  if (verb === 'list') {
    const args = parseStandardArgs({ argv, extraOptions: { 'saved-search-id': { type: 'string' } } })
    const first = parseFirst(args.first)
    const after = args.after as any
    const query = args.query as any
    const reverse = args.reverse as any
    const savedSearchId = (args as any)['saved-search-id'] as any

    const nodeSelection = resolveSelection({
      resource: 'discount-nodes',
      view: ctx.view,
      baseSelection: getDiscountNodeSelection(ctx.view) as any,
      select: args.select,
      selection: (args as any).selection,
      include: args.include,
      ensureId: ctx.quiet,
    })

    const result = await runQuery(ctx, {
      discountNodes: {
        __args: { first, after, query, reverse, ...(savedSearchId ? { savedSearchId } : {}) },
        pageInfo: { hasNextPage: true, endCursor: true },
        nodes: nodeSelection,
      },
    })
    if (result === undefined) return
    printConnection({
      connection: result.discountNodes,
      format: ctx.format,
      quiet: ctx.quiet,
      nextPageArgs: buildListNextPageArgs('discount-nodes', { first, query, reverse }, savedSearchId ? [{ flag: '--saved-search-id', value: savedSearchId }] : undefined),
    })
    return
  }

  if (verb === 'count') {
    const args = parseStandardArgs({ argv, extraOptions: { limit: { type: 'string' } } })
    const query = args.query as any
    const limit = parseLimit((args as any).limit)

    const result = await runQuery(ctx, {
      discountNodesCount: { __args: { ...(limit !== undefined ? { limit } : {}), ...(query ? { query } : {}) }, count: true, precision: true },
    })
    if (result === undefined) return
    if (ctx.quiet) return console.log(result.discountNodesCount?.count ?? '')
    printJson(result.discountNodesCount, ctx.format !== 'raw')
    return
  }

  throw new CliError(`Unknown verb for discount-nodes: ${verb}`, 2)
}

