import { describe, expect, it } from 'vitest'

import { extractAllResourceVerbs } from './extractVerbs'
import { readCommandManifest } from './manifest'

describe('Command coverage', () => {
  it('every extracted resource/verb is in the manifest (or explicitly skipped)', () => {
    const extracted = extractAllResourceVerbs()
    const manifest = readCommandManifest()

    const manifestKeys = new Set(manifest.entries.map((e) => `${e.resource}::${e.verb}`))
    const missing = extracted
      .map((e) => `${e.resource}::${e.verb}`)
      .filter((k) => !manifestKeys.has(k))

    expect(missing, `Missing manifest entries:\n${missing.join('\n')}`).toEqual([])
  })

  it('manifest does not contain unknown resource/verb pairs', () => {
    const extracted = extractAllResourceVerbs()
    const extractedKeys = new Set(extracted.map((e) => `${e.resource}::${e.verb}`))

    const manifest = readCommandManifest()
    const extra = manifest.entries
      .map((e) => `${e.resource}::${e.verb}`)
      .filter((k) => !extractedKeys.has(k))

    expect(extra, `Manifest contains unknown entries:\n${extra.join('\n')}`).toEqual([])
  })
})

