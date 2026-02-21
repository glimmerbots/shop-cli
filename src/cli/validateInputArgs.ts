import { CliError } from './errors'
import { resolveCliCommand } from './command'
import { inputTypeHelp } from '../generated/help/schema-help'
import { getType } from './introspection'

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const formatCliPlaceholder = (field: { typeName: string; isList: boolean }) => {
  const base = `${field.typeName}${field.isList ? '[]' : ''}`
  return `<${base}>`
}

const splitTokens = (value: string): string[] =>
  value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[^A-Za-z0-9]+/)
    .map((t) => t.trim())
    .filter(Boolean)

/** Simple fuzzy matching: check if all chars of needle appear in haystack in order */
const fuzzyMatch = (needle: string, haystack: string): boolean => {
  const lowerNeedle = needle.toLowerCase()
  const lowerHaystack = haystack.toLowerCase()
  let ni = 0
  for (let hi = 0; hi < lowerHaystack.length && ni < lowerNeedle.length; hi++) {
    if (lowerHaystack[hi] === lowerNeedle[ni]) ni++
  }
  return ni === lowerNeedle.length
}

/** Score a match - lower is better. Prefers exact prefix matches, then substring, then fuzzy */
const scoreMatch = (query: string, fieldName: string): number => {
  const lowerField = fieldName.toLowerCase()

  const lowerQuery = query.toLowerCase()
  const queryVariants = [query]
  if (lowerQuery.endsWith('html') && query.length > 4) queryVariants.push(query.slice(0, -4))

  let best = Infinity
  for (const qRaw of queryVariants) {
    const q = qRaw.toLowerCase()
    if (lowerField === q) best = Math.min(best, 0)
    else if (lowerField.startsWith(q)) best = Math.min(best, 1)
    else if (lowerField.includes(q)) best = Math.min(best, 2)
    else {
      const qTokens = splitTokens(qRaw).map((t) => t.toLowerCase())
      const fTokens = splitTokens(fieldName).map((t) => t.toLowerCase())
      const qLast = qTokens[qTokens.length - 1]
      const fLast = fTokens[fTokens.length - 1]
      if (qLast && fLast && qLast === fLast) best = Math.min(best, 3)
      else if (fuzzyMatch(qRaw, fieldName)) best = Math.min(best, 4)
    }
  }

  return best
}

const suggestFieldNames = (query: string, candidates: string[], limit = 5): string[] => {
  const scored = candidates
    .map((name) => ({ name, score: scoreMatch(query, name) }))
    .filter(({ score }) => score < Infinity)
    .sort((a, b) => a.score - b.score || a.name.localeCompare(b.name))
    .slice(0, limit)

  return scored.map(({ name }) => name)
}

const validateInputObject = ({
  inputTypeName,
  value,
  at,
  setPath,
}: {
  inputTypeName: string
  value: unknown
  at: string
  setPath: string
}) => {
  if (value === null || value === undefined) return

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const nextSetPath = setPath ? `${setPath}.${i}` : String(i)
      validateInputObject({ inputTypeName, value: value[i], at: `${at}[${i}]`, setPath: nextSetPath })
    }
    return
  }

  if (!isPlainObject(value)) return

  const fields = inputTypeHelp[inputTypeName]
  if (!fields) return

  const allowed = new Map(fields.map((f) => [f.name, f]))

  for (const [key, child] of Object.entries(value)) {
    const field = allowed.get(key)
    if (!field) {
      const fullSetPath = setPath ? `${setPath}.${key}` : key
      const suggestions = suggestFieldNames(key, Array.from(allowed.keys()))

      const lines = [
        `Unknown input field "${key}" on ${inputTypeName}${setPath ? ` (in --set ${fullSetPath})` : ''}`,
      ]

      if (suggestions.length > 0) {
        lines.push('')
        lines.push('Did you mean:')
        for (const s of suggestions) {
          const suggestionField = allowed.get(s)
          if (!suggestionField) continue
          const suggestionPath = setPath ? `${setPath}.${s}` : s
          lines.push(`  --set ${suggestionPath}=${formatCliPlaceholder(suggestionField)}`)
        }
      }

      lines.push('')
      lines.push('For valid fields see:')
      lines.push(`  ${resolveCliCommand()} types ${inputTypeName}`)
      throw new CliError(lines.join('\n'), 2)
    }

    const nestedTypeName = field.typeName
    if (nestedTypeName && inputTypeHelp[nestedTypeName]) {
      const nextSetPath = setPath ? `${setPath}.${key}` : key
      validateInputObject({ inputTypeName: nestedTypeName, value: child, at: `${at}.${key}`, setPath: nextSetPath })
    }
  }
}

export const validateRequestInputArgs = (rootTypeName: 'Query' | 'Mutation', request: any) => {
  if (!isPlainObject(request)) return

  const root = getType(rootTypeName)
  if (!root?.fields) return

  for (const [opName, selection] of Object.entries(request)) {
    if (!isPlainObject(selection)) continue
    const field: any = root.fields[opName]
    if (!field) continue

    const args = (selection as any).__args
    if (!isPlainObject(args)) continue

    const argDefs: any = field.args ?? {}
    for (const [argName, argValue] of Object.entries(args)) {
      if (argValue === undefined) continue

      const argDef: any = argDefs[argName]
      if (!argDef) {
        const candidates = Object.keys(argDefs)
        const suggestions = suggestFieldNames(argName, candidates)
        const lines = [`Unknown argument "${argName}" for ${rootTypeName}.${opName}.`]
        if (suggestions.length > 0) {
          lines.push('')
          lines.push('Did you mean?')
          for (const s of suggestions) lines.push(`  ${s}`)
        }
        throw new CliError(lines.join('\n'), 2)
      }

      const typeName = argDef[0]?.name
      if (!typeName) continue
      if (!inputTypeHelp[typeName]) continue

      validateInputObject({ inputTypeName: typeName, value: argValue, at: `${opName}.__args.${argName}`, setPath: '' })
    }
  }
}
