import { CliError } from './errors'

export type GlobalParsed = {
  passthrough: string[]
  shopDomain?: string
  graphqlEndpoint?: string
  accessToken?: string
  apiVersion?: string
  format?: string
  quiet?: boolean
  dryRun?: boolean
  strictIds?: boolean
  noFailOnUserErrors?: boolean
  view?: string
  headers: string[]
  verbose?: boolean
}

export const parseGlobalFlags = (args: string[]): GlobalParsed => {
  const parsed: GlobalParsed = { passthrough: [], headers: [] }

  const takeValue = (i: number, flag: string) => {
    const next = args[i + 1]
    if (!next) throw new CliError(`Missing value for ${flag}`, 2)
    return next
  }

  for (let i = 0; i < args.length; i++) {
    const token = args[i]!

    if (!token.startsWith('-')) {
      parsed.passthrough.push(token)
      continue
    }

    const eqIndex = token.indexOf('=')
    const flag = eqIndex === -1 ? token : token.slice(0, eqIndex)
    const inlineValue = eqIndex === -1 ? undefined : token.slice(eqIndex + 1)

    if (flag === '--shop') {
      parsed.shopDomain = inlineValue ?? takeValue(i, flag)
      if (!inlineValue) i++
      continue
    }
    if (flag === '--graphql-endpoint') {
      parsed.graphqlEndpoint = inlineValue ?? takeValue(i, flag)
      if (!inlineValue) i++
      continue
    }
    if (flag === '--access-token') {
      parsed.accessToken = inlineValue ?? takeValue(i, flag)
      if (!inlineValue) i++
      continue
    }
    if (flag === '--api-version') {
      parsed.apiVersion = inlineValue ?? takeValue(i, flag)
      if (!inlineValue) i++
      continue
    }
    if (flag === '--format') {
      parsed.format = inlineValue ?? takeValue(i, flag)
      if (!inlineValue) i++
      continue
    }
    if (flag === '--view') {
      parsed.view = inlineValue ?? takeValue(i, flag)
      if (!inlineValue) i++
      continue
    }
    if (flag === '--quiet') {
      parsed.quiet = true
      continue
    }
    if (flag === '--dry-run') {
      parsed.dryRun = true
      continue
    }
    if (flag === '--strict-ids') {
      parsed.strictIds = true
      continue
    }
    if (flag === '--no-fail-on-user-errors') {
      parsed.noFailOnUserErrors = true
      continue
    }
    if (flag === '--header') {
      parsed.headers.push(inlineValue ?? takeValue(i, flag))
      if (!inlineValue) i++
      continue
    }
    if (flag === '--verbose') {
      parsed.verbose = true
      continue
    }

    // Unknown option: leave it for the verb parser (and don't consume a value).
    parsed.passthrough.push(token)
  }

  return parsed
}
