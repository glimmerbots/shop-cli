import { CliError } from '../errors'
import { coerceGid } from '../gid'
import { buildInput } from '../input'
import { printConnection, printJson, printNode } from '../output'
import { parseStandardArgs, runMutation, runQuery, type CommandContext } from '../router'
import { resolveSelection } from '../selection/select'
import { maybeFailOnUserErrors } from '../userErrors'

import { buildListNextPageArgs, parseFirst, requireId } from './_shared'

const subscriptionBillingAttemptSummarySelection = {
  id: true,
  createdAt: true,
  ready: true,
  errorCode: true,
  errorMessage: true,
  originTime: true,
  nextActionUrl: true,
} as const

const subscriptionBillingCycleSummarySelection = {
  cycleIndex: true,
  status: true,
  billingAttemptExpectedDate: true,
  cycleStartAt: true,
  cycleEndAt: true,
  skipped: true,
  edited: true,
  sourceContract: { id: true, status: true },
} as const

const subscriptionBillingCycleFullSelection = {
  ...subscriptionBillingCycleSummarySelection,
  editedContract: { updatedAt: true, createdAt: true },
  billingAttempts: {
    __args: { first: 10 },
    nodes: subscriptionBillingAttemptSummarySelection,
    pageInfo: { hasNextPage: true, endCursor: true },
  },
} as const

const getSubscriptionBillingCycleSelection = (view: CommandContext['view']) => {
  if (view === 'full') return subscriptionBillingCycleFullSelection
  if (view === 'raw') return {} as const
  return subscriptionBillingCycleSummarySelection
}

const requireContractId = (value: unknown) => {
  if (typeof value !== 'string' || !value) throw new CliError('Missing --contract-id', 2)
  return coerceGid(value, 'SubscriptionContract')
}

const requireDraftId = (value: unknown) => {
  if (typeof value !== 'string' || !value) throw new CliError('Missing --draft-id', 2)
  return coerceGid(value, 'SubscriptionDraft')
}

const requireJobId = (value: unknown) => {
  if (typeof value !== 'string' || !value) throw new CliError('Missing --job-id', 2)
  return coerceGid(value, 'Job')
}

const parseCycleIndex = (value: unknown) => {
  if (value === undefined || value === null || value === '') throw new CliError('Missing --cycle-index', 2)
  const n = Number(value)
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) throw new CliError('--cycle-index must be a positive integer', 2)
  return n
}

const parseDateTime = (value: unknown) => {
  if (typeof value !== 'string' || !value.trim()) throw new CliError('Missing --date', 2)
  return value.trim()
}

const extractArrayField = (input: any, field: string) => {
  if (Array.isArray(input)) return input
  if (input && Array.isArray(input[field])) return input[field]
  return undefined
}

export const runSubscriptionBillingCycles = async ({
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
        '  shop subscription-billing-cycles <verb> [flags]',
        '',
        'Verbs:',
        '  get|bulk-results|attempts',
        '  charge|skip|unskip|schedule-edit',
        '  contract-edit|edit-delete|edits-delete',
        '  contract-draft-commit|contract-draft-concatenate',
        '',
        'Common output flags:',
        '  --view summary|full|raw|all',
        '  --select <path>        (repeatable; dot paths; adds to base view selection)',
        '  --selection <graphql>  (selection override; can be @file.gql)',
      ].join('\n'),
    )
    return
  }

  if (verb === 'get') {
    const args = parseStandardArgs({
      argv,
      extraOptions: { 'contract-id': { type: 'string' }, 'cycle-index': { type: 'string' }, date: { type: 'string' } },
    })
    const contractId = requireContractId((args as any)['contract-id'])
    const cycleIndexRaw = (args as any)['cycle-index']
    const dateRaw = (args as any).date

    const selector =
      cycleIndexRaw !== undefined ? { index: parseCycleIndex(cycleIndexRaw) } : dateRaw ? { date: parseDateTime(dateRaw) } : undefined

    if (!selector) throw new CliError('Missing --cycle-index or --date', 2)

    const selection = resolveSelection({
      typeName: 'SubscriptionBillingCycle',
      view: ctx.view,
      baseSelection: getSubscriptionBillingCycleSelection(ctx.view) as any,
      select: args.select,
      selection: (args as any).selection,
      include: args.include,
      ensureId: false,
    })

    const result = await runQuery(ctx, {
      subscriptionBillingCycle: {
        __args: { billingCycleInput: { contractId, selector } },
        ...selection,
      },
    })
    if (result === undefined) return
    if (ctx.quiet) return console.log(result.subscriptionBillingCycle?.cycleIndex ?? '')
    printNode({ node: result.subscriptionBillingCycle, format: ctx.format, quiet: false })
    return
  }

  if (verb === 'bulk-results') {
    const args = parseStandardArgs({ argv, extraOptions: { 'job-id': { type: 'string' } } })
    const jobId = requireJobId((args as any)['job-id'])
    const first = parseFirst(args.first)
    const after = args.after as any
    const reverse = args.reverse as any

    const nodeSelection = resolveSelection({
      typeName: 'SubscriptionBillingCycle',
      view: ctx.view,
      baseSelection: getSubscriptionBillingCycleSelection(ctx.view) as any,
      select: args.select,
      selection: (args as any).selection,
      include: args.include,
      ensureId: false,
    })

    const result = await runQuery(ctx, {
      subscriptionBillingCycleBulkResults: {
        __args: { jobId, first, after, reverse },
        pageInfo: { hasNextPage: true, endCursor: true },
        nodes: nodeSelection,
      },
    })
    if (result === undefined) return
    printConnection({
      connection: result.subscriptionBillingCycleBulkResults,
      format: ctx.format,
      quiet: ctx.quiet,
      nextPageArgs: {
        base: 'shop subscription-billing-cycles bulk-results',
        first,
        reverse: reverse === true,
        extraFlags: [{ flag: '--job-id', value: jobId }],
      },
    })
    return
  }

  if (verb === 'attempts') {
    const args = parseStandardArgs({ argv, extraOptions: {} })
    const first = parseFirst(args.first)
    const after = args.after as any
    const query = args.query as any
    const reverse = args.reverse as any
    const sortKey = args.sort as any

    const selection = resolveSelection({
      typeName: 'SubscriptionBillingAttempt',
      view: ctx.view,
      baseSelection: subscriptionBillingAttemptSummarySelection as any,
      select: args.select,
      selection: (args as any).selection,
      include: args.include,
      ensureId: true,
    })

    const result = await runQuery(ctx, {
      subscriptionBillingAttempts: {
        __args: { first, after, query, reverse, sortKey },
        pageInfo: { hasNextPage: true, endCursor: true },
        nodes: selection,
      },
    })
    if (result === undefined) return
    printConnection({
      connection: result.subscriptionBillingAttempts,
      format: ctx.format,
      quiet: ctx.quiet,
      nextPageArgs: buildListNextPageArgs('subscription-billing-cycles', { first, query, sort: sortKey, reverse }),
    })
    return
  }

  if (verb === 'charge') {
    const args = parseStandardArgs({ argv, extraOptions: { 'contract-id': { type: 'string' }, 'cycle-index': { type: 'string' } } })
    const subscriptionContractId = requireContractId((args as any)['contract-id'])
    const cycleIndex = parseCycleIndex((args as any)['cycle-index'])

    const result = await runMutation(ctx, {
      subscriptionBillingCycleCharge: {
        __args: { subscriptionContractId, billingCycleSelector: { index: cycleIndex } },
        subscriptionBillingAttempt: subscriptionBillingAttemptSummarySelection,
        userErrors: { field: true, message: true },
      },
    })
    if (result === undefined) return
    maybeFailOnUserErrors({ payload: result.subscriptionBillingCycleCharge, failOnUserErrors: ctx.failOnUserErrors })
    if (ctx.quiet) return console.log(result.subscriptionBillingCycleCharge?.subscriptionBillingAttempt?.id ?? '')
    printJson(result.subscriptionBillingCycleCharge, ctx.format !== 'raw')
    return
  }

  if (verb === 'skip' || verb === 'unskip' || verb === 'schedule-edit' || verb === 'contract-edit' || verb === 'edit-delete') {
    const args = parseStandardArgs({
      argv,
      extraOptions: { 'contract-id': { type: 'string' }, 'cycle-index': { type: 'string' } },
    })
    const contractId = requireContractId((args as any)['contract-id'])
    const cycleIndex = parseCycleIndex((args as any)['cycle-index'])
    const billingCycleInput = { contractId, selector: { index: cycleIndex } }

    if (verb === 'skip' || verb === 'unskip') {
      const mutationField = verb === 'skip' ? 'subscriptionBillingCycleSkip' : 'subscriptionBillingCycleUnskip'
      const result = await runMutation(ctx, {
        [mutationField]: {
          __args: { billingCycleInput },
          billingCycle: subscriptionBillingCycleSummarySelection,
          userErrors: { field: true, message: true },
        },
      } as any)
      if (result === undefined) return
      const payload = (result as any)[mutationField]
      maybeFailOnUserErrors({ payload, failOnUserErrors: ctx.failOnUserErrors })
      if (ctx.quiet) return
      printJson(payload, ctx.format !== 'raw')
      return
    }

    if (verb === 'schedule-edit') {
      const built = buildInput({
        inputArg: args.input as any,
        setArgs: args.set as any,
        setJsonArgs: args['set-json'] as any,
      })
      if (!built.used) throw new CliError('Missing --input or --set/--set-json', 2)

      const result = await runMutation(ctx, {
        subscriptionBillingCycleScheduleEdit: {
          __args: { billingCycleInput, input: built.input },
          billingCycle: subscriptionBillingCycleSummarySelection,
          userErrors: { field: true, message: true },
        },
      })
      if (result === undefined) return
      maybeFailOnUserErrors({ payload: result.subscriptionBillingCycleScheduleEdit, failOnUserErrors: ctx.failOnUserErrors })
      if (ctx.quiet) return
      printJson(result.subscriptionBillingCycleScheduleEdit, ctx.format !== 'raw')
      return
    }

    if (verb === 'contract-edit') {
      const built = buildInput({
        inputArg: args.input as any,
        setArgs: args.set as any,
        setJsonArgs: args['set-json'] as any,
      })

      const editResult = await runMutation(ctx, {
        subscriptionBillingCycleContractEdit: {
          __args: { billingCycleInput },
          draft: { id: true },
          userErrors: { field: true, message: true },
        },
      })
      if (editResult === undefined) return
      maybeFailOnUserErrors({ payload: editResult.subscriptionBillingCycleContractEdit, failOnUserErrors: ctx.failOnUserErrors })

      const draftId = editResult.subscriptionBillingCycleContractEdit?.draft?.id
      if (!draftId || !built.used) {
        if (ctx.quiet) return console.log(draftId ?? '')
        printJson(editResult.subscriptionBillingCycleContractEdit, ctx.format !== 'raw')
        return
      }

      const updateResult = await runMutation(ctx, {
        subscriptionDraftUpdate: {
          __args: { draftId, input: built.input },
          draft: { id: true },
          userErrors: { field: true, message: true },
        },
      })
      if (updateResult === undefined) return
      maybeFailOnUserErrors({ payload: updateResult.subscriptionDraftUpdate, failOnUserErrors: ctx.failOnUserErrors })
      if (ctx.quiet) return console.log(updateResult.subscriptionDraftUpdate?.draft?.id ?? '')
      printJson(updateResult.subscriptionDraftUpdate, ctx.format !== 'raw')
      return
    }

    if (verb === 'edit-delete') {
      if (!args.yes) throw new CliError('Refusing to delete without --yes', 2)
      const result = await runMutation(ctx, {
        subscriptionBillingCycleEditDelete: {
          __args: { billingCycleInput },
          billingCycles: subscriptionBillingCycleSummarySelection,
          userErrors: { field: true, message: true },
        },
      })
      if (result === undefined) return
      maybeFailOnUserErrors({ payload: result.subscriptionBillingCycleEditDelete, failOnUserErrors: ctx.failOnUserErrors })
      if (ctx.quiet) return
      printJson(result.subscriptionBillingCycleEditDelete, ctx.format !== 'raw')
      return
    }
  }

  if (verb === 'edits-delete') {
    const args = parseStandardArgs({ argv, extraOptions: { 'contract-id': { type: 'string' } } })
    const contractId = requireContractId((args as any)['contract-id'])
    if (!args.yes) throw new CliError('Refusing to delete without --yes', 2)

    const result = await runMutation(ctx, {
      subscriptionBillingCycleEditsDelete: {
        __args: { contractId, targetSelection: 'ALL' as any },
        billingCycles: subscriptionBillingCycleSummarySelection,
        userErrors: { field: true, message: true },
      },
    })
    if (result === undefined) return
    maybeFailOnUserErrors({ payload: result.subscriptionBillingCycleEditsDelete, failOnUserErrors: ctx.failOnUserErrors })
    if (ctx.quiet) return
    printJson(result.subscriptionBillingCycleEditsDelete, ctx.format !== 'raw')
    return
  }

  if (verb === 'contract-draft-commit') {
    const args = parseStandardArgs({ argv, extraOptions: { 'draft-id': { type: 'string' } } })
    const draftId = requireDraftId((args as any)['draft-id'])

    const result = await runMutation(ctx, {
      subscriptionBillingCycleContractDraftCommit: {
        __args: { draftId },
        contract: { createdAt: true, updatedAt: true },
        userErrors: { field: true, message: true, code: true },
      },
    })
    if (result === undefined) return
    maybeFailOnUserErrors({ payload: result.subscriptionBillingCycleContractDraftCommit, failOnUserErrors: ctx.failOnUserErrors })
    if (ctx.quiet) return
    printJson(result.subscriptionBillingCycleContractDraftCommit, ctx.format !== 'raw')
    return
  }

  if (verb === 'contract-draft-concatenate') {
    const args = parseStandardArgs({ argv, extraOptions: { 'draft-id': { type: 'string' } } })
    const draftId = requireDraftId((args as any)['draft-id'])
    const built = buildInput({
      inputArg: args.input as any,
      setArgs: args.set as any,
      setJsonArgs: args['set-json'] as any,
    })
    if (!built.used) throw new CliError('Missing --input or --set/--set-json', 2)

    const concatenatedBillingCycleContracts = extractArrayField(built.input, 'concatenatedBillingCycleContracts')
    if (!concatenatedBillingCycleContracts || concatenatedBillingCycleContracts.length === 0) {
      throw new CliError('Missing concatenatedBillingCycleContracts array', 2)
    }

    const result = await runMutation(ctx, {
      subscriptionBillingCycleContractDraftConcatenate: {
        __args: { draftId, concatenatedBillingCycleContracts },
        draft: { id: true },
        userErrors: { field: true, message: true, code: true },
      },
    })
    if (result === undefined) return
    maybeFailOnUserErrors({ payload: result.subscriptionBillingCycleContractDraftConcatenate, failOnUserErrors: ctx.failOnUserErrors })
    if (ctx.quiet) return console.log(result.subscriptionBillingCycleContractDraftConcatenate?.draft?.id ?? '')
    printJson(result.subscriptionBillingCycleContractDraftConcatenate, ctx.format !== 'raw')
    return
  }

  throw new CliError(`Unknown verb for subscription-billing-cycles: ${verb}`, 2)
}
