import { BLOG_SUMMARY_MAX_LENGTH, BLOG_TITLE_MAX_LENGTH } from './constants'

export function normalizeBlogTitle(value: unknown) {
  if (typeof value !== 'string') return ''
  return value.replace(/\s+/g, ' ').trim().slice(0, BLOG_TITLE_MAX_LENGTH)
}

export function normalizeBlogSummary(value: unknown) {
  if (typeof value !== 'string') return ''
  return value.replace(/\s+/g, ' ').trim().slice(0, BLOG_SUMMARY_MAX_LENGTH)
}

export function normalizeBlogUrl(value: unknown) {
  if (typeof value !== 'string') return ''
  try {
    return new URL(value).toString()
  } catch {
    return ''
  }
}

export function decodeSafe(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}
