import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export type ResourceVerb = {
  resource: string
  verb: string
  verbFile: string
}

const uniq = <T>(items: T[]) => Array.from(new Set(items))

const resolveRepoRoot = () => join(dirname(fileURLToPath(import.meta.url)), '../../..')

const readUtf8 = (path: string) => readFileSync(path, 'utf8')

const extractImportMap = (routerSource: string) => {
  const runFnToImport = new Map<string, string>()
  const importRegex =
    /import\s+\{\s*(run[A-Za-z0-9_]+)\s*\}\s+from\s+'(\.\/verbs\/[^']+)'/g
  for (const match of routerSource.matchAll(importRegex)) {
    const runFn = match[1]!
    const rel = match[2]!
    runFnToImport.set(runFn, rel)
  }
  return runFnToImport
}

const extractResourceToRunFn = (routerSource: string) => {
  const out = new Map<string, string>()
  const ifRegex =
    /if\s*\(\s*resource\s*===\s*'([^']+)'\s*\)\s*return\s*(run[A-Za-z0-9_]+)\s*\(/g
  for (const match of routerSource.matchAll(ifRegex)) {
    out.set(match[1]!, match[2]!)
  }
  return out
}

const extractVerbsFromVerbFile = (source: string, resource: string) => {
  const verbs: string[] = []

  const eqRegex = /\bverb\s*===\s*['"]([^'"]+)['"]/g
  for (const match of source.matchAll(eqRegex)) verbs.push(match[1]!)

  const neqRegex = /\bverb\s*!==\s*['"]([^'"]+)['"]/g
  for (const match of source.matchAll(neqRegex)) verbs.push(match[1]!)

  if (resource === 'graphql') {
    if (source.includes("verb.startsWith('query ')")) verbs.push('query')
    if (source.includes("verb.startsWith('mutation ')")) verbs.push('mutation')
  }

  return uniq(verbs).filter((v) => v !== 'help')
}

export const extractAllResourceVerbs = (): ResourceVerb[] => {
  const root = resolveRepoRoot()
  const routerPath = join(root, 'src/cli/router.ts')
  const routerSource = readUtf8(routerPath)

  const runFnToImport = extractImportMap(routerSource)
  const resourceToRunFn = extractResourceToRunFn(routerSource)

  const all: ResourceVerb[] = []

  for (const [resource, runFn] of resourceToRunFn.entries()) {
    const relImport = runFnToImport.get(runFn)
    if (!relImport) {
      throw new Error(`Could not find import for ${runFn} (resource: ${resource})`)
    }

    const verbFile = join(root, 'src/cli', `${relImport.replace('./', '')}.ts`)
    const verbSource = readUtf8(verbFile)
    const verbs = extractVerbsFromVerbFile(verbSource, resource)

    for (const verb of verbs) {
      all.push({ resource, verb, verbFile })
    }
  }

  all.sort((a, b) => {
    if (a.resource !== b.resource) return a.resource.localeCompare(b.resource)
    return a.verb.localeCompare(b.verb)
  })
  return all
}

