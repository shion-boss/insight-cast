'use client'

export type AppToastDetail = {
  id?: string
  title: string
  description?: string
  tone?: 'default' | 'success' | 'warning'
  href?: string
  hrefLabel?: string
  characterId?: string
  undoLabel?: string
  onUndo?: () => void | Promise<void>
}

export function showToast(detail: AppToastDetail) {
  window.dispatchEvent(new CustomEvent<AppToastDetail>('app-toast', { detail }))
}
