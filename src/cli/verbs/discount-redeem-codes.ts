import { CliError } from '../errors'
import { coerceGid } from '../gid'
import { printJson } from '../output'
import { parseStandardArgs, runMutation, runQuery, type CommandContext } from '../router'
import { maybeFailOnUserErrors } from '../userErrors'

import { parseIds, requireId } from './_shared'

const discountRedeemCodeBulkCreationSummarySelection = {
  id: true,
  done: true,
  codesCount: true,
  importedCount: true,
  failedCount: true,
  createdAt: true,
} as const

const requireDiscountId = (value: unknown) => {
  if (typeof value !== 'string' || !value) throw new CliError('Missing --discount-id', 2)
  return coerceGid(value, 'DiscountCodeNode')
}

export const runDiscountRedeemCodes = async ({
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
        '  shop discount-redeem-codes <verb> [flags]',
        '',
        'Verbs:',
        '  get-bulk-creation|bulk-delete',
        '',
        'Notes:',
        '  bulk-delete requires --discount-id and either --ids or --query, plus --yes.',
      ].join('\n'),
    )
    return
  }

  if (verb === 'get-bulk-creation') {
    const args = parseStandardArgs({ argv, extraOptions: {} })
    const id = requireId(args.id, 'DiscountRedeemCodeBulkCreation')

    const result = await runQuery(ctx, {
      discountRedeemCodeBulkCreation: { __args: { id }, ...discountRedeemCodeBulkCreationSummarySelection },
    })
    if (result === undefined) return
    if (ctx.quiet) return console.log(result.discountRedeemCodeBulkCreation?.id ?? '')
    printJson(result.discountRedeemCodeBulkCreation, ctx.format !== 'raw')
    return
  }

  if (verb === 'bulk-delete') {
    const args = parseStandardArgs({ argv, extraOptions: { 'discount-id': { type: 'string' }, ids: { type: 'string', multiple: true } } })
    const discountId = requireDiscountId((args as any)['discount-id'])
    if (!args.yes) throw new CliError('Refusing to delete without --yes', 2)

    const rawIds = (args as any).ids
    const ids = rawIds ? parseIds(rawIds, 'DiscountRedeemCode') : undefined
    const search = (args as any).query as string | undefined

    if ((!ids || ids.length === 0) && !search) {
      throw new CliError('Missing --ids or --query', 2)
    }

    const result = await runMutation(ctx, {
      discountCodeRedeemCodeBulkDelete: {
        __args: { discountId, ...(ids ? { ids } : {}), ...(search ? { search } : {}) },
        job: { id: true, done: true },
        userErrors: { field: true, message: true },
      },
    })
    if (result === undefined) return
    maybeFailOnUserErrors({ payload: result.discountCodeRedeemCodeBulkDelete, failOnUserErrors: ctx.failOnUserErrors })
    if (ctx.quiet) return console.log(result.discountCodeRedeemCodeBulkDelete?.job?.id ?? '')
    printJson(result.discountCodeRedeemCodeBulkDelete, ctx.format !== 'raw')
    return
  }

  throw new CliError(`Unknown verb for discount-redeem-codes: ${verb}`, 2)
}
