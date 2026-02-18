import { CliError } from '../errors'
import { printConnection } from '../output'
import { parseStandardArgs, runQuery, type CommandContext } from '../router'
import { resolveSelection } from '../selection/select'

import { parseFirst } from './_shared'

const savedSearchSummarySelection = {
  id: true,
  name: true,
  query: true,
} as const

const getSavedSearchSelection = (view: CommandContext['view']) => {
  if (view === 'ids') return { id: true } as const
  if (view === 'raw') return {} as const
  return savedSearchSummarySelection
}

export const runDiscountSavedSearches = async ({
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
        '  shop discount-saved-searches <verb> [flags]',
        '',
        'Verbs:',
        '  automatic|code|redeem-code',
        '',
        'Common output flags:',
        '  --view summary|ids|raw|all',
        '  --select <path>        (repeatable; dot paths; adds to base view selection)',
        '  --selection <graphql>  (selection override; can be @file.gql)',
      ].join('\n'),
    )
    return
  }

  const run = async (field: string) => {
    const args = parseStandardArgs({ argv, extraOptions: {} })
    const first = parseFirst(args.first)
    const after = args.after as any
    const reverse = args.reverse as any
    const query = args.query as any
    const sortKey = args.sort as any

    const nodeSelection = resolveSelection({
      resource: 'discount-saved-searches',
      typeName: 'SavedSearch',
      view: ctx.view,
      baseSelection: getSavedSearchSelection(ctx.view) as any,
      select: args.select,
      selection: (args as any).selection,
      include: args.include,
      ensureId: true,
    })

    const supportsQuery = field === 'discountRedeemCodeSavedSearches'
    const supportsSortKey = field === 'discountRedeemCodeSavedSearches'

    const fieldArgs: Record<string, any> = { first, after, reverse }
    if (supportsSortKey) fieldArgs.sortKey = sortKey
    if (supportsQuery) fieldArgs.query = query

    const result = await runQuery(ctx, {
      [field]: {
        __args: fieldArgs,
        pageInfo: { hasNextPage: true, endCursor: true },
        nodes: nodeSelection,
      },
    } as any)
    if (result === undefined) return

    printConnection({
      connection: (result as any)[field],
      format: ctx.format,
      quiet: ctx.quiet,
      nextPageArgs: {
        base: `shop discount-saved-searches ${verb}`,
        first,
        ...(supportsQuery ? { query } : {}),
        ...(supportsSortKey ? { sort: sortKey } : {}),
        reverse: reverse === true,
      },
    })
  }

  if (verb === 'automatic') return run('automaticDiscountSavedSearches')
  if (verb === 'code') return run('codeDiscountSavedSearches')
  if (verb === 'redeem-code') return run('discountRedeemCodeSavedSearches')

  throw new CliError(`Unknown verb for discount-saved-searches: ${verb}`, 2)
}
