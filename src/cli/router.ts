import { parseArgs } from 'node:util'

import type { Client } from '../generated/admin-2026-04'
import { generateMutationOp, generateQueryOp } from '../generated/admin-2026-04'

import { CliError } from './errors'
import { printJson } from './output'
import { runArticles } from './verbs/articles'
import { runBlogs } from './verbs/blogs'
import { runCatalogs } from './verbs/catalogs'
import { runCollections } from './verbs/collections'
import { runComments } from './verbs/comments'
import { runCustomers } from './verbs/customers'
import { runDraftOrders } from './verbs/draftOrders'
import { runMarkets } from './verbs/markets'
import { runMenus } from './verbs/menus'
import { runMetafieldDefinitions } from './verbs/metafieldDefinitions'
import { runMetaobjectDefinitions } from './verbs/metaobjectDefinitions'
import { runMetaobjects } from './verbs/metaobjects'
import { runOrders } from './verbs/orders'
import { runPages } from './verbs/pages'
import { runProducts } from './verbs/products'
import { runPublications } from './verbs/publications'
import { runSegments } from './verbs/segments'
import { runSellingPlanGroups } from './verbs/sellingPlanGroups'
import { runUrlRedirects } from './verbs/urlRedirects'
import { runWebhooks } from './verbs/webhooks'

export type CliView = 'summary' | 'ids' | 'full' | 'raw'

export type CommandContext = {
  client: Client
  format: 'json' | 'table' | 'raw'
  quiet: boolean
  view: CliView
  dryRun: boolean
  failOnUserErrors: boolean
}

export type RunCommandArgs = CommandContext & {
  resource: string
  verb: string
  argv: string[]
}

export const runCommand = async ({
  client,
  resource,
  verb,
  argv,
  format,
  quiet,
  view,
  dryRun,
  failOnUserErrors,
}: RunCommandArgs) => {
  const ctx: CommandContext = { client, format, quiet, view, dryRun, failOnUserErrors }

  if (resource === 'products') return runProducts({ ctx, verb, argv })
  if (resource === 'collections') return runCollections({ ctx, verb, argv })
  if (resource === 'customers') return runCustomers({ ctx, verb, argv })
  if (resource === 'orders') return runOrders({ ctx, verb, argv })
  if (resource === 'articles') return runArticles({ ctx, verb, argv })
  if (resource === 'blogs') return runBlogs({ ctx, verb, argv })
  if (resource === 'pages') return runPages({ ctx, verb, argv })
  if (resource === 'comments') return runComments({ ctx, verb, argv })
  if (resource === 'menus') return runMenus({ ctx, verb, argv })
  if (resource === 'publications') return runPublications({ ctx, verb, argv })
  if (resource === 'catalogs') return runCatalogs({ ctx, verb, argv })
  if (resource === 'markets') return runMarkets({ ctx, verb, argv })
  if (resource === 'draft-orders') return runDraftOrders({ ctx, verb, argv })
  if (resource === 'url-redirects') return runUrlRedirects({ ctx, verb, argv })
  if (resource === 'segments') return runSegments({ ctx, verb, argv })
  if (resource === 'webhooks') return runWebhooks({ ctx, verb, argv })
  if (resource === 'metafield-definitions') return runMetafieldDefinitions({ ctx, verb, argv })
  if (resource === 'metaobjects') return runMetaobjects({ ctx, verb, argv })
  if (resource === 'metaobject-definitions') return runMetaobjectDefinitions({ ctx, verb, argv })
  if (resource === 'selling-plan-groups') return runSellingPlanGroups({ ctx, verb, argv })

  throw new CliError(`Unknown resource: ${resource}`, 2)
}

export const parseStandardArgs = ({
  argv,
  extraOptions,
}: {
  argv: string[]
  extraOptions: Record<string, any>
}): any => {
  const parsed = parseArgs({
    args: argv,
    allowPositionals: false,
    options: {
      ...extraOptions,
      input: { type: 'string' },
      set: { type: 'string', multiple: true },
      'set-json': { type: 'string', multiple: true },
      select: { type: 'string', multiple: true },
      id: { type: 'string' },
      ids: { type: 'string', multiple: true },
      yes: { type: 'boolean' },
      query: { type: 'string' },
      first: { type: 'string' },
      after: { type: 'string' },
      sort: { type: 'string' },
      reverse: { type: 'boolean' },
      type: { type: 'string' },
      key: { type: 'string' },
      namespace: { type: 'string' },
      topic: { type: 'string' },
      'owner-type': { type: 'string' },
      'order-id': { type: 'string' },
      'variant-ids': { type: 'string', multiple: true },
      tags: { type: 'string' },
      status: { type: 'string' },
      'new-title': { type: 'string' },
    },
  })
  return parsed.values
}

export const runQuery = async (ctx: CommandContext, request: any): Promise<any> => {
  if (ctx.dryRun) {
    printJson(generateQueryOp(request))
    return undefined
  }
  return await ctx.client.query(request)
}

export const runMutation = async (ctx: CommandContext, request: any): Promise<any> => {
  if (ctx.dryRun) {
    printJson(generateMutationOp(request))
    return undefined
  }
  return await ctx.client.mutation(request)
}
