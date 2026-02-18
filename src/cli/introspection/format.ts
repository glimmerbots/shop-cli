import type { FieldInfo } from './index'

const formatConnectionNodeType = (field: FieldInfo) => {
  const nodeType = field.connectionNodeTypeName
  if (nodeType) return nodeType
  return field.typeName.replace(/Connection$/, '')
}

export const printFieldsTable = ({
  resource,
  typeName,
  fields,
}: {
  resource: string
  typeName: string
  fields: FieldInfo[]
}) => {
  const selectable = fields.filter((f) => !f.hasRequiredArgs)

  const scalars = selectable.filter((f) => f.isScalar && !f.isConnection)
  const objects = selectable.filter((f) => !f.isScalar && !f.isConnection)
  const connections = selectable.filter((f) => f.isConnection)

  console.log(`Selectable fields for "${resource}" (GraphQL type: ${typeName})`)
  console.log('Use with --select (repeatable; dot paths).')
  console.log('')

  if (scalars.length) {
    console.log('Scalar fields:')
    for (const f of scalars) console.log(`  ${f.name}`)
    console.log('')
  }

  if (objects.length) {
    console.log('Object fields (use dot notation, e.g. --select seo.title):')
    for (const f of objects) console.log(`  ${f.name}  ->  ${f.typeName}`)
    console.log('')
  }

  if (connections.length) {
    console.log('Connection fields (use .nodes, e.g. --select variants.nodes.sku):')
    for (const f of connections) {
      console.log(`  ${f.name}.nodes  ->  ${formatConnectionNodeType(f)}`)
    }
    console.log('')
  }
}

