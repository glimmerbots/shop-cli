import { CliError } from '../errors'
import { printConnection } from '../output'
import { parseStandardArgs, runQuery, type CommandContext } from '../router'
import { resolveSelection } from '../selection/select'

import { buildListNextPageArgs, parseFirst } from './_shared'

const tenderTransactionSummarySelection = {
  id: true,
  processedAt: true,
  test: true,
  paymentMethod: true,
  remoteReference: true,
  amount: { amount: true, currencyCode: true },
  order: { id: true, name: true },
} as const

const tenderTransactionFullSelection = {
  ...tenderTransactionSummarySelection,
  user: { id: true, name: true, email: true },
  transactionDetails: { __typename: true, on_TenderTransactionCreditCardDetails: { creditCardCompany: true, creditCardNumber: true } },
} as const

const getTenderTransactionSelection = (view: CommandContext['view']) => {
  if (view === 'ids') return { id: true } as const
  if (view === 'full') return tenderTransactionFullSelection
  if (view === 'raw') return {} as const
  return tenderTransactionSummarySelection
}

export const runTenderTransactions = async ({
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
        '  shop tender-transactions <verb> [flags]',
        '',
        'Verbs:',
        '  list',
        '',
        'Common output flags:',
        '  --view summary|ids|full|raw|all',
        '  --select <path>        (repeatable; dot paths; adds to base view selection)',
        '  --selection <graphql>  (selection override; can be @file.gql)',
      ].join('\n'),
    )
    return
  }

  if (verb !== 'list') throw new CliError(`Unknown verb for tender-transactions: ${verb}`, 2)

  const args = parseStandardArgs({ argv, extraOptions: {} })
  const first = parseFirst(args.first)
  const after = args.after as any
  const query = args.query as any
  const reverse = args.reverse as any

  const nodeSelection = resolveSelection({
    resource: 'tender-transactions',
    view: ctx.view,
    baseSelection: getTenderTransactionSelection(ctx.view) as any,
    select: args.select,
    selection: (args as any).selection,
    include: args.include,
    ensureId: ctx.quiet,
  })

  const result = await runQuery(ctx, {
    tenderTransactions: {
      __args: { first, after, query, reverse },
      pageInfo: { hasNextPage: true, endCursor: true },
      nodes: nodeSelection,
    },
  })
  if (result === undefined) return

  printConnection({
    connection: result.tenderTransactions,
    format: ctx.format,
    quiet: ctx.quiet,
    nextPageArgs: buildListNextPageArgs('tender-transactions', { first, query, reverse }),
  })
}

