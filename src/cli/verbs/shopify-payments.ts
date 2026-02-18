import { CliError } from '../errors'
import { printJson } from '../output'
import { printNode } from '../output'
import { parseStandardArgs, runMutation, runQuery, type CommandContext } from '../router'
import { resolveSelection } from '../selection/select'
import { maybeFailOnUserErrors } from '../userErrors'

const shopifyPaymentsAccountSummarySelection = {
  id: true,
  activated: true,
  balance: { amount: true, currencyCode: true },
  accountOpenerName: true,
} as const

const shopifyPaymentsAccountFullSelection = {
  ...shopifyPaymentsAccountSummarySelection,
  bankAccounts: {
    __args: { first: 10 },
    nodes: {
      id: true,
      bankName: true,
      country: true,
      currency: true,
      accountNumberLastDigits: true,
      createdAt: true,
    },
    pageInfo: { hasNextPage: true, endCursor: true },
  },
} as const

const getAccountSelection = (view: CommandContext['view']) => {
  if (view === 'ids') return { id: true } as const
  if (view === 'full') return shopifyPaymentsAccountFullSelection
  if (view === 'raw') return {} as const
  return shopifyPaymentsAccountSummarySelection
}

export const runShopifyPayments = async ({
  ctx,
  verb,
  argv,
}: {
  ctx: CommandContext
  verb: string
  argv: string[]
}) => {
  if (verb !== 'account' && verb !== 'get' && verb !== 'payout-alternate-currency-create') {
    throw new CliError(`Unknown verb for shopify-payments: ${verb}`, 2)
  }

  if (verb === 'payout-alternate-currency-create') {
    const args = parseStandardArgs({ argv, extraOptions: { currency: { type: 'string' }, 'account-id': { type: 'string' } } })
    const currency = (args as any).currency as string | undefined
    if (!currency) throw new CliError('Missing --currency', 2)
    const accountId = (args as any)['account-id'] as string | undefined

    const result = await runMutation(ctx, {
      shopifyPaymentsPayoutAlternateCurrencyCreate: {
        __args: { currency: currency.toUpperCase() as any, ...(accountId ? { accountId } : {}) },
        success: true,
        payout: {
          currency: true,
          remoteId: true,
          amount: { amount: true, currencyCode: true },
          createdAt: true,
          arrivalDate: true,
        },
        userErrors: { field: true, message: true, code: true },
      },
    })
    if (result === undefined) return
    maybeFailOnUserErrors({ payload: result.shopifyPaymentsPayoutAlternateCurrencyCreate, failOnUserErrors: ctx.failOnUserErrors })
    if (ctx.quiet) return
    printJson(result.shopifyPaymentsPayoutAlternateCurrencyCreate, ctx.format !== 'raw')
    return
  }

  {
    const args = parseStandardArgs({ argv, extraOptions: {} })
    const selection = resolveSelection({
      resource: 'shopify-payments',
      view: ctx.view,
      baseSelection: getAccountSelection(ctx.view) as any,
      select: args.select,
      selection: (args as any).selection,
      include: args.include,
      ensureId: ctx.quiet,
    })

    const result = await runQuery(ctx, { shopifyPaymentsAccount: selection })
    if (result === undefined) return
    printNode({ node: result.shopifyPaymentsAccount, format: ctx.format, quiet: ctx.quiet })
    return
  }
}
