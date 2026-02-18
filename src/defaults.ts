export const DEFAULT_ADMIN_API_VERSION = '2026-04' as const

export const resolveAdminApiVersion = (apiVersion: unknown): string => {
  if (typeof apiVersion === 'string') {
    const trimmed = apiVersion.trim()
    if (trimmed.length > 0) return trimmed
  }
  return DEFAULT_ADMIN_API_VERSION
}

