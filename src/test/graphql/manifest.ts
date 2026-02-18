import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export type ManifestEntry = {
  resource: string
  verb: string
  argv: string[]
  skipReason?: string
}

export type CommandManifest = {
  generatedAt: string
  schemaVersion: string
  entries: ManifestEntry[]
}

export const readCommandManifest = (): CommandManifest => {
  const here = dirname(fileURLToPath(import.meta.url))
  const path = join(here, 'command-manifest.json')
  const raw = readFileSync(path, 'utf8')
  return JSON.parse(raw) as CommandManifest
}

