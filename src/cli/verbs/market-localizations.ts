import { CliError } from '../errors'
import { coerceGid } from '../gid'
import { buildInput } from '../input'
import { printConnection, printIds, printJson, printNode } from '../output'
import { parseStandardArgs, runMutation, runQuery, type CommandContext } from '../router'
import { resolveSelection } from '../selection/select'
import { maybeFailOnUserErrors } from '../userErrors'

import { parseFirst, parseCsv, parseStringList } from './_shared'

const marketLocalizationsSelection = (marketId: string) =>
  ({
    __args: { marketId },
    key: true,
    value: true,
    outdated: true,
    updatedAt: true,
    market: { id: true, name: true, handle: true },
  }) as const

const marketLocalizableResourceSummarySelection = (marketId: string) =>
  ({
    resourceId: true,
    marketLocalizableContent: { key: true, digest: true },
    marketLocalizations: marketLocalizationsSelection(marketId),
  }) as const

const marketLocalizableResourceFullSelection = (marketId: string) =>
  ({
    ...marketLocalizableResourceSummarySelection(marketId),
    marketLocalizableContent: { key: true, digest: true, value: true },
  }) as const

const getMarketLocalizableResourceSelection = (view: CommandContext['view'], marketId: string) => {
  if (view === 'ids') return { resourceId: true } as const
  if (view === 'full') return marketLocalizableResourceFullSelection(marketId)
  if (view === 'raw') return {} as const
  return marketLocalizableResourceSummarySelection(marketId)
}

const ensureResourceIdSelected = (selection: Record<string, any>) => {
  if (!('resourceId' in selection)) selection.resourceId = true
  return selection
}

const withSyntheticId = (node: any) => {
  if (!node || typeof node !== 'object') return node
  const resourceId = (node as any).resourceId
  if (typeof resourceId === 'string' && !('id' in node)) return { id: resourceId, ...node }
  return node
}

const extractArrayField = (input: any, field: string) => {
  if (Array.isArray(input)) return input
  if (input && Array.isArray(input[field])) return input[field]
  return undefined
}

const parseMarketIds = (value: unknown) => {
  const ids = parseStringList(value, '--market-ids')
  return ids.map((id) => coerceGid(id, 'Market'))
}

export const runMarketLocalizations = async ({
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
        '  shop market-localizations <verb> [flags]',
        '',
        'Verbs:',
        '  localizable-resource|localizable-resources|localizable-resources-by-ids',
        '  register|remove',
        '',
        'Notes:',
        '  Market localizable resources are limited to resource types: METAOBJECT, METAFIELD.',
        '  The marketLocalizations field requires --market-id.',
        '',
        'Common output flags:',
        '  --view summary|ids|full|raw|all',
        '  --format json|jsonl|table|markdown|raw',
        '  --quiet',
        '  --select <path>        (repeatable; dot paths; adds to base view selection)',
        '  --selection <graphql>  (selection override; can be @file.gql)',
      ].join('\n'),
    )
    return
  }

  if (verb === 'localizable-resource') {
    const args = parseStandardArgs({
      argv,
      extraOptions: { 'resource-id': { type: 'string' }, 'market-id': { type: 'string' } },
    })
    const resourceId = (args as any)['resource-id'] as string | undefined
    if (!resourceId) throw new CliError('Missing --resource-id', 2)
    const marketIdRaw = (args as any)['market-id'] as string | undefined
    if (!marketIdRaw) throw new CliError('Missing --market-id', 2)
    const marketId = coerceGid(marketIdRaw, 'Market')

    const selection = ensureResourceIdSelected(
      resolveSelection({
        typeName: 'MarketLocalizableResource',
        view: ctx.view,
        baseSelection: getMarketLocalizableResourceSelection(ctx.view, marketId) as any,
        select: args.select,
        selection: (args as any).selection,
        include: args.include,
        ensureId: false,
      }) as any,
    )

    const result = await runQuery(ctx, {
      marketLocalizableResource: { __args: { resourceId }, ...selection },
    })
    if (result === undefined) return
    const node = result.marketLocalizableResource
    if (ctx.quiet) return printIds([node?.resourceId])
    printNode({ node: withSyntheticId(node), format: ctx.format, quiet: false })
    return
  }

  if (verb === 'localizable-resources') {
    const args = parseStandardArgs({
      argv,
      extraOptions: { 'resource-type': { type: 'string' }, 'market-id': { type: 'string' } },
    })
    const first = parseFirst(args.first)
    const after = args.after as any
    const reverse = args.reverse as any

    const resourceTypeRaw = (args as any)['resource-type'] as string | undefined
    if (!resourceTypeRaw) throw new CliError('Missing --resource-type', 2)
    const resourceType = resourceTypeRaw.trim().toUpperCase()
    const marketIdRaw = (args as any)['market-id'] as string | undefined
    if (!marketIdRaw) throw new CliError('Missing --market-id', 2)
    const marketId = coerceGid(marketIdRaw, 'Market')

    const nodeSelection = ensureResourceIdSelected(
      resolveSelection({
        typeName: 'MarketLocalizableResource',
        view: ctx.view,
        baseSelection: getMarketLocalizableResourceSelection(ctx.view, marketId) as any,
        select: args.select,
        selection: (args as any).selection,
        include: args.include,
        ensureId: false,
      }) as any,
    )

    const result = await runQuery(ctx, {
      marketLocalizableResources: {
        __args: { first, after, reverse, resourceType: resourceType as any },
        pageInfo: { hasNextPage: true, endCursor: true },
        nodes: nodeSelection,
      },
    })
    if (result === undefined) return

    const nodes = (result.marketLocalizableResources?.nodes ?? []).map(withSyntheticId)
    const connection = { ...result.marketLocalizableResources, nodes }

    if (ctx.quiet) return printIds(nodes.map((n: any) => n?.id))
    printConnection({
      connection,
      format: ctx.format,
      quiet: false,
      nextPageArgs: {
        base: 'shop market-localizations localizable-resources',
        first,
        reverse: reverse === true,
        extraFlags: [{ flag: '--resource-type', value: resourceType }],
      },
    })
    return
  }

  if (verb === 'localizable-resources-by-ids') {
    const args = parseStandardArgs({
      argv,
      extraOptions: { 'resource-ids': { type: 'string', multiple: true }, 'market-id': { type: 'string' } },
    })
    const first = parseFirst(args.first)
    const after = args.after as any
    const reverse = args.reverse as any

    const resourceIds = parseStringList((args as any)['resource-ids'], '--resource-ids')
    const marketIdRaw = (args as any)['market-id'] as string | undefined
    if (!marketIdRaw) throw new CliError('Missing --market-id', 2)
    const marketId = coerceGid(marketIdRaw, 'Market')

    const nodeSelection = ensureResourceIdSelected(
      resolveSelection({
        typeName: 'MarketLocalizableResource',
        view: ctx.view,
        baseSelection: getMarketLocalizableResourceSelection(ctx.view, marketId) as any,
        select: args.select,
        selection: (args as any).selection,
        include: args.include,
        ensureId: false,
      }) as any,
    )

    const result = await runQuery(ctx, {
      marketLocalizableResourcesByIds: {
        __args: { first, after, reverse, resourceIds },
        pageInfo: { hasNextPage: true, endCursor: true },
        nodes: nodeSelection,
      },
    })
    if (result === undefined) return

    const nodes = (result.marketLocalizableResourcesByIds?.nodes ?? []).map(withSyntheticId)
    const connection = { ...result.marketLocalizableResourcesByIds, nodes }

    if (ctx.quiet) return printIds(nodes.map((n: any) => n?.id))
    printConnection({
      connection,
      format: ctx.format,
      quiet: false,
      nextPageArgs: {
        base: 'shop market-localizations localizable-resources-by-ids',
        first,
        reverse: reverse === true,
        extraFlags: resourceIds.map((id) => ({ flag: '--resource-ids', value: id })),
      },
    })
    return
  }

  if (verb === 'register') {
    const args = parseStandardArgs({ argv, extraOptions: { 'resource-id': { type: 'string' } } })
    const resourceId = (args as any)['resource-id'] as string | undefined
    if (!resourceId) throw new CliError('Missing --resource-id', 2)

    const built = buildInput({
      inputArg: args.input as any,
      setArgs: args.set as any,
      setJsonArgs: args['set-json'] as any,
    })
    if (!built.used) throw new CliError('Missing --input or --set/--set-json', 2)

    let marketLocalizations = extractArrayField(built.input, 'marketLocalizations') as any[] | undefined
    if (!marketLocalizations || marketLocalizations.length === 0) {
      throw new CliError('Missing marketLocalizations array (use --input [...] or --set marketLocalizations[0].*)', 2)
    }

    const result = await runMutation(ctx, {
      marketLocalizationsRegister: {
        __args: { resourceId, marketLocalizations },
        marketLocalizations: { key: true, value: true, market: { id: true, name: true } },
        userErrors: { field: true, message: true },
      },
    })
    if (result === undefined) return
    maybeFailOnUserErrors({
      payload: result.marketLocalizationsRegister,
      failOnUserErrors: ctx.failOnUserErrors,
    })
    if (ctx.quiet) return
    printJson(result.marketLocalizationsRegister, ctx.format !== 'raw')
    return
  }

  if (verb === 'remove') {
    const args = parseStandardArgs({
      argv,
      extraOptions: {
        'resource-id': { type: 'string' },
        'market-ids': { type: 'string', multiple: true },
        keys: { type: 'string' },
      },
    })
    const resourceId = (args as any)['resource-id'] as string | undefined
    if (!resourceId) throw new CliError('Missing --resource-id', 2)

    const marketIds = parseMarketIds((args as any)['market-ids'])
    const marketLocalizationKeys = parseCsv((args as any).keys, '--keys')

    const result = await runMutation(ctx, {
      marketLocalizationsRemove: {
        __args: { resourceId, marketIds, marketLocalizationKeys },
        marketLocalizations: { key: true, value: true, market: { id: true, name: true } },
        userErrors: { field: true, message: true },
      },
    })
    if (result === undefined) return
    maybeFailOnUserErrors({ payload: result.marketLocalizationsRemove, failOnUserErrors: ctx.failOnUserErrors })
    if (ctx.quiet) return
    printJson(result.marketLocalizationsRemove, ctx.format !== 'raw')
    return
  }

  throw new CliError(`Unknown verb for market-localizations: ${verb}`, 2)
}
