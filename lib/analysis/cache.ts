import { createHash } from 'crypto'

function ensureUrlProtocol(raw: string) {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

export function normalizeAnalysisUrl(raw: string) {
  const withProtocol = ensureUrlProtocol(raw)
  if (!withProtocol) return ''

  try {
    const url = new URL(withProtocol)
    url.hash = ''
    url.hostname = url.hostname.toLowerCase()

    if (url.pathname !== '/') {
      url.pathname = url.pathname.replace(/\/+$/, '')
    }

    return url.toString()
  } catch {
    return withProtocol
  }
}

function hashPayload(payload: unknown) {
  return createHash('sha256')
    .update(JSON.stringify(payload))
    .digest('hex')
}

export function buildCompetitorSuggestionSignature(input: {
  url: string
  industry: string
  location: string
}) {
  return hashPayload({
    url: normalizeAnalysisUrl(input.url),
    industry: input.industry.trim().toLowerCase(),
    location: input.location.trim().toLowerCase(),
  })
}

export function buildProjectAnalysisSignature(input: {
  hpUrl: string
  competitorUrls: string[]
}) {
  return hashPayload({
    hpUrl: normalizeAnalysisUrl(input.hpUrl),
    competitorUrls: input.competitorUrls
      .map(normalizeAnalysisUrl)
      .filter(Boolean)
      .sort(),
  })
}
