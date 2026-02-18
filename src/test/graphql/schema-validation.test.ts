import { describe, expect, it } from 'vitest'

import { readCommandManifest } from './manifest'
import { runCommandDryRun } from './runDryRun'
import { validateGraphQLOperation } from './validateGraphQL'

const manifest = readCommandManifest()

describe('GraphQL schema validation (dry-run)', () => {
  const byResource = new Map<string, typeof manifest.entries>()
  for (const entry of manifest.entries) {
    if (!byResource.has(entry.resource)) byResource.set(entry.resource, [])
    byResource.get(entry.resource)!.push(entry)
  }

  for (const [resource, entries] of byResource.entries()) {
    describe(resource, () => {
      for (const entry of entries) {
        const label = entry.skipReason ? `${entry.verb} (skipped)` : entry.verb
        it(label, async () => {
          if (entry.skipReason) return

          const printed = await runCommandDryRun({
            resource: entry.resource,
            verb: entry.verb,
            argv: entry.argv,
          })

          expect(
            printed.length,
            `Expected at least one dry-run GraphQL payload, got none.\nargv: ${JSON.stringify(entry.argv)}`,
          ).toBeGreaterThan(0)

          for (const op of printed) {
            const validation = validateGraphQLOperation(op.query, op.variables, op.operationName)
            expect(
              validation.valid,
              `GraphQL validation failed:\n${validation.errors.join('\n')}\n\nquery:\n${op.query}\n\nvariables:\n${JSON.stringify(op.variables ?? {}, null, 2)}`,
            ).toBe(true)
          }
        })
      }
    })
  }
})

