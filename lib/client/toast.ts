'use client'

export type AppToastDetail = {
  id?: string
  title: string
  description?: string
  tone?: 'default' | 'success' | 'warning'
  href?: string
  hrefLabel?: string
  characterId?: string
}

export function showToast(detail: AppToastDetail) {
  window.dispatchEvent(new CustomEvent<AppToastDetail>('app-toast', { detail }))
}
