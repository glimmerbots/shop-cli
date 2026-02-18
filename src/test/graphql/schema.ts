import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { buildSchema, type GraphQLSchema } from 'graphql'

let cachedAdminSchema: GraphQLSchema | undefined

export const getAdminSchema = (): GraphQLSchema => {
  if (cachedAdminSchema) return cachedAdminSchema

  const here = dirname(fileURLToPath(import.meta.url))
  const schemaPath = join(here, '../../../schema/2026-04.graphql')
  const schemaSource = readFileSync(schemaPath, 'utf8')
  cachedAdminSchema = buildSchema(schemaSource)
  return cachedAdminSchema
}

