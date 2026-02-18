import { describe, expect, it } from 'vitest'

import { resolveSelection } from '../cli/selection/select'

describe('deprecated fields', () => {
  it('excludes deprecated fields from --view all by default', () => {
    const selection = resolveSelection({
      resource: 'products',
      view: 'all',
      baseSelection: { id: true },
      select: undefined,
      selection: undefined,
      include: undefined,
      ensureId: false,
    })

    expect((selection as any).publishedOnCurrentChannel).toBeUndefined()
    expect((selection as any).resourcePublicationOnCurrentPublication).toBeUndefined()
  })

  it('allows explicitly selecting deprecated fields with --select', () => {
    const selection = resolveSelection({
      resource: 'products',
      view: 'all',
      baseSelection: { id: true },
      select: ['publishedOnCurrentChannel', 'resourcePublicationOnCurrentPublication.isPublished'],
      selection: undefined,
      include: undefined,
      ensureId: false,
    })

    expect((selection as any).publishedOnCurrentChannel).toBe(true)
    expect((selection as any).resourcePublicationOnCurrentPublication).toEqual({ isPublished: true })
  })

  it('excludes deprecated fields from base selections unless explicitly selected', () => {
    const base = { title: true, bodyHtml: true } as any

    const stripped = resolveSelection({
      typeName: 'Product',
      view: 'summary',
      baseSelection: base,
      select: undefined,
      selection: undefined,
      include: undefined,
      ensureId: false,
    })

    expect((stripped as any).title).toBe(true)
    expect((stripped as any).bodyHtml).toBeUndefined()

    const explicit = resolveSelection({
      typeName: 'Product',
      view: 'summary',
      baseSelection: base,
      select: ['bodyHtml'],
      selection: undefined,
      include: undefined,
      ensureId: false,
    })

    expect((explicit as any).bodyHtml).toBe(true)
  })
})

