import { CliError } from '../errors'
import { buildInput } from '../input'
import { printJson } from '../output'
import { parseStandardArgs, runMutation, type CommandContext } from '../router'
import { maybeFailOnUserErrors } from '../userErrors'

const delegateTokenSelection = {
  accessToken: true,
  createdAt: true,
  accessScopes: true,
} as const

export const runDelegateTokens = async ({
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
        '  shop delegate-tokens <verb> [flags]',
        '',
        'Verbs:',
        '  create|destroy',
      ].join('\n'),
    )
    return
  }

  if (verb === 'create') {
    const args = parseStandardArgs({ argv, extraOptions: {} })
    const built = buildInput({
      inputArg: args.input as any,
      setArgs: args.set as any,
      setJsonArgs: args['set-json'] as any,
    })
    if (!built.used) throw new CliError('Missing --input or --set/--set-json', 2)

    const result = await runMutation(ctx, {
      delegateAccessTokenCreate: {
        __args: { input: built.input },
        delegateAccessToken: delegateTokenSelection,
        userErrors: { field: true, message: true },
      },
    })
    if (result === undefined) return
    maybeFailOnUserErrors({ payload: result.delegateAccessTokenCreate, failOnUserErrors: ctx.failOnUserErrors })
    if (ctx.quiet) return console.log(result.delegateAccessTokenCreate?.delegateAccessToken?.accessToken ?? '')
    printJson(result.delegateAccessTokenCreate, ctx.format !== 'raw')
    return
  }

  if (verb === 'destroy') {
    const args = parseStandardArgs({ argv, extraOptions: { token: { type: 'string' } } })
    const token = args.token as string | undefined
    if (!token) throw new CliError('Missing --token', 2)

    const result = await runMutation(ctx, {
      delegateAccessTokenDestroy: {
        __args: { accessToken: token },
        status: true,
        userErrors: { field: true, message: true },
      },
    })
    if (result === undefined) return
    maybeFailOnUserErrors({ payload: result.delegateAccessTokenDestroy, failOnUserErrors: ctx.failOnUserErrors })
    if (ctx.quiet) return console.log(result.delegateAccessTokenDestroy?.status ? 'true' : 'false')
    printJson(result.delegateAccessTokenDestroy, ctx.format !== 'raw')
    return
  }

  throw new CliError(`Unknown verb for delegate-tokens: ${verb}`, 2)
}
