import { getFields } from '../introspection'
import { isDeprecatedField } from '../introspection/deprecations'

import type { GenqlSelection } from './graphqlSelection'

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const stripDeprecatedInner = (typeName: string, selection: GenqlSelection) => {
  const fields = getFields(typeName)
  const fieldMap = new Map(fields.map((f) => [f.name, f]))

  for (const key of Object.keys(selection)) {
    if (key === '__args') continue

    if (isDeprecatedField(typeName, key)) {
      delete selection[key]
      continue
    }

    const value = selection[key]
    if (!isPlainObject(value)) continue

    const info = fieldMap.get(key)
    if (!info) continue

    if (info.isConnection) {
      const nodeType = info.connectionNodeTypeName
      if (!nodeType) continue

      const nodes = (value as any).nodes
      if (isPlainObject(nodes)) stripDeprecatedInner(nodeType, nodes as any)

      const edges = (value as any).edges
      const node = isPlainObject(edges) ? (edges as any).node : undefined
      if (isPlainObject(node)) stripDeprecatedInner(nodeType, node as any)

      continue
    }

    if (!info.isScalar) {
      stripDeprecatedInner(info.typeName, value as any)
    }
  }
}

export const stripDeprecatedFromSelection = (typeName: string, selection: GenqlSelection): GenqlSelection => {
  stripDeprecatedInner(typeName, selection)
  return selection
}

