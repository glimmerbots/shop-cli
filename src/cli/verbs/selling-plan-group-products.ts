import { CliError } from '../errors'
import { coerceGid } from '../gid'
import { printJson } from '../output'
import { parseStandardArgs, runMutation, type CommandContext } from '../router'
import { maybeFailOnUserErrors } from '../userErrors'

import { parseStringList, requireId } from './_shared'

const sellingPlanGroupSummarySelection = {
  id: true,
  name: true,
  merchantCode: true,
  createdAt: true,
} as const

const parseProductIds = (value: unknown) => {
  const ids = parseStringList(value, '--product-ids')
  return ids.map((id) => coerceGid(id, 'Product'))
}

const parseVariantIds = (value: unknown) => {
  const ids = parseStringList(value, '--variant-ids')
  return ids.map((id) => coerceGid(id, 'ProductVariant'))
}

export const runSellingPlanGroupProducts = async ({
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
        '  shop selling-plan-group-products <verb> [flags]',
        '',
        'Verbs:',
        '  add-products|remove-products|add-product-variants|remove-product-variants',
        '',
        'Notes:',
        '  Use --id for the SellingPlanGroup ID.',
        '  Use --product-ids / --variant-ids as a comma-separated list or repeatable flag.',
      ].join('\n'),
    )
    return
  }

  if (verb === 'add-products' || verb === 'remove-products') {
    const args = parseStandardArgs({ argv, extraOptions: { 'product-ids': { type: 'string', multiple: true } } })
    const id = requireId(args.id, 'SellingPlanGroup')
    const productIds = parseProductIds((args as any)['product-ids'])

    const mutationField = verb === 'add-products' ? 'sellingPlanGroupAddProducts' : 'sellingPlanGroupRemoveProducts'

    const selection =
      verb === 'add-products'
        ? { sellingPlanGroup: sellingPlanGroupSummarySelection, userErrors: { field: true, message: true } }
        : { removedProductIds: true, userErrors: { field: true, message: true } }

    const result = await runMutation(ctx, {
      [mutationField]: {
        __args: { id, productIds },
        ...(selection as any),
      },
    } as any)
    if (result === undefined) return

    const payload = (result as any)[mutationField]
    maybeFailOnUserErrors({ payload, failOnUserErrors: ctx.failOnUserErrors })
    if (ctx.quiet) {
      if (verb === 'add-products') return console.log(payload?.sellingPlanGroup?.id ?? '')
      return
    }
    printJson(payload, ctx.format !== 'raw')
    return
  }

  if (verb === 'add-product-variants' || verb === 'remove-product-variants') {
    const args = parseStandardArgs({ argv, extraOptions: { 'variant-ids': { type: 'string', multiple: true } } })
    const id = requireId(args.id, 'SellingPlanGroup')
    const productVariantIds = parseVariantIds((args as any)['variant-ids'])

    const mutationField =
      verb === 'add-product-variants'
        ? 'sellingPlanGroupAddProductVariants'
        : 'sellingPlanGroupRemoveProductVariants'

    const selection =
      verb === 'add-product-variants'
        ? { sellingPlanGroup: sellingPlanGroupSummarySelection, userErrors: { field: true, message: true } }
        : { removedProductVariantIds: true, userErrors: { field: true, message: true } }

    const result = await runMutation(ctx, {
      [mutationField]: {
        __args: { id, productVariantIds },
        ...(selection as any),
      },
    } as any)
    if (result === undefined) return

    const payload = (result as any)[mutationField]
    maybeFailOnUserErrors({ payload, failOnUserErrors: ctx.failOnUserErrors })
    if (ctx.quiet) {
      if (verb === 'add-product-variants') return console.log(payload?.sellingPlanGroup?.id ?? '')
      return
    }
    printJson(payload, ctx.format !== 'raw')
    return
  }

  throw new CliError(`Unknown verb for selling-plan-group-products: ${verb}`, 2)
}
