import { CliError } from '../errors'
import { printNode } from '../output'
import { parseStandardArgs, runQuery, type CommandContext } from '../router'
import { resolveSelection } from '../selection/select'

const financeAppAccessPolicySummarySelection = {
  access: true,
} as const

const getFinanceAppAccessPolicySelection = (view: CommandContext['view']) => {
  if (view === 'raw') return {} as const
  return financeAppAccessPolicySummarySelection
}

const financeKycInformationSummarySelection = {
  legalName: true,
  businessType: true,
  industry: { code: true, categoryLabel: true, subcategoryLabel: true },
  businessAddress: {
    addressLine1: true,
    city: true,
    country: true,
    zone: true,
    postalCode: true,
  },
  shopOwner: { id: true, email: true, firstName: true, lastName: true, phone: true },
  taxIdentification: { __typename: true },
} as const

const getFinanceKycInformationSelection = (view: CommandContext['view']) => {
  if (view === 'raw') return {} as const
  return financeKycInformationSummarySelection
}

export const runFinance = async ({
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
        '  shop finance <verb> [flags]',
        '',
        'Verbs:',
        '  app-access-policy|kyc-information',
        '',
        'Common output flags:',
        '  --view summary|raw|all',
        '  --select <path>        (repeatable; dot paths; adds to base view selection)',
        '  --selection <graphql>  (selection override; can be @file.gql)',
      ].join('\n'),
    )
    return
  }

  if (verb === 'app-access-policy') {
    const args = parseStandardArgs({ argv, extraOptions: {} })
    const selection = resolveSelection({
      typeName: 'FinanceAppAccessPolicy',
      view: ctx.view,
      baseSelection: getFinanceAppAccessPolicySelection(ctx.view) as any,
      select: args.select,
      selection: (args as any).selection,
      include: args.include,
      ensureId: false,
    })

    const result = await runQuery(ctx, { financeAppAccessPolicy: selection })
    if (result === undefined) return
    if (ctx.quiet) return
    printNode({ node: result.financeAppAccessPolicy, format: ctx.format, quiet: false })
    return
  }

  if (verb === 'kyc-information') {
    const args = parseStandardArgs({ argv, extraOptions: {} })
    const selection = resolveSelection({
      typeName: 'FinanceKycInformation',
      view: ctx.view,
      baseSelection: getFinanceKycInformationSelection(ctx.view) as any,
      select: args.select,
      selection: (args as any).selection,
      include: args.include,
      ensureId: false,
    })

    const result = await runQuery(ctx, { financeKycInformation: selection })
    if (result === undefined) return
    if (ctx.quiet) return
    printNode({ node: result.financeKycInformation, format: ctx.format, quiet: false })
    return
  }

  throw new CliError(`Unknown verb for finance: ${verb}`, 2)
}
