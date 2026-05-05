'use client'

import { useEffect, useRef, useState } from 'react'

import type { ArticleSuggestion } from '@/lib/article-suggestions'

import { BLOCK_LABEL, STICKY_TOP, type ArticleBlock, type ArticleBlockKind } from './types'
import { HeaderCopyButton, useCardCopy } from './ui-primitives'

export function SectionGroupCard({
  heading,
  body,
  isEditing,
  onEditHeading,
  onEditBody,
  mode,
}: {
  heading: ArticleBlock
  body: ArticleBlock | null
  isEditing?: boolean
  onEditHeading?: (oldText: string, newText: string) => void
  onEditBody?: (oldText: string, newText: string) => void
  mode?: 'text' | 'markdown'
}) {
  return (
    <div className={`rounded-[14px] border border-[var(--border)] bg-[var(--surface)] ${isEditing ? 'ring-1 ring-[var(--accent)]/20' : ''}`}>
      <BlockCopyCardInner kind="heading" text={heading.text} markdownCopyText={heading.rawText} isEditing={isEditing} onEditDone={onEditHeading} mode={mode} position="top" />
      {body && (
        <>
          <div className="border-t border-[var(--border)]" />
          <BlockCopyCardInner kind="body" text={body.text} markdownCopyText={body.rawText} isEditing={isEditing} onEditDone={onEditBody} mode={mode} position="bottom" />
        </>
      )}
    </div>
  )
}

function BlockCopyCardInner({ kind, text, markdownCopyText, label, isEditing, onEditDone, mode, position }: {
  kind: ArticleBlockKind
  text: string
  markdownCopyText?: string
  label?: string
  isEditing?: boolean
  onEditDone?: (oldText: string, newText: string) => void
  mode?: 'text' | 'markdown'
  position?: 'top' | 'bottom' | 'standalone'
}) {
  const { copied, copy } = useCardCopy()
  const [localText, setLocalText] = useState(text)
  const origRef = useRef(text)

  useEffect(() => {
    setLocalText(text)
    origRef.current = text
  }, [text])

  async function handleCopy() {
    if (isEditing) return
    const copyContent = mode === 'markdown' && markdownCopyText ? markdownCopyText : text
    await copy(copyContent)
  }

  const headerRounded = position === 'bottom' ? '' : 'rounded-t-[14px]'

  return (
    <div
      role={isEditing ? undefined : 'button'}
      tabIndex={isEditing ? undefined : 0}
      onClick={isEditing ? undefined : handleCopy}
      onKeyDown={isEditing ? undefined : e => { if (e.key === 'Enter') handleCopy() }}
      className={`group relative ${isEditing ? '' : 'cursor-pointer transition-colors hover:bg-[var(--bg2)] select-none'}`}
    >
      <div className={`sticky ${STICKY_TOP} z-[20] flex items-center justify-between gap-3 ${headerRounded} bg-[var(--surface)] group-hover:bg-[var(--bg2)] px-4 sm:px-5 pt-4 sm:pt-5 pb-2 transition-colors`}>
        <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--text3)]">
          {label ?? BLOCK_LABEL[kind]}
        </div>
        {!isEditing && (
          <span onClick={e => e.stopPropagation()} className="shrink-0">
            <HeaderCopyButton copied={copied} onClick={(e) => { e.stopPropagation(); handleCopy() }} />
          </span>
        )}
      </div>
      <div className="px-4 sm:px-5 pb-4 sm:pb-5">
        {isEditing ? (
          <textarea
            value={localText}
            onChange={e => setLocalText(e.target.value)}
            onBlur={() => onEditDone?.(origRef.current, localText)}
            className={`w-full resize-none bg-transparent focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]/40 rounded leading-relaxed text-[var(--text)] ${kind === 'heading' ? 'text-sm font-semibold' : 'text-sm'}`}
            style={{ fieldSizing: 'content' } as React.CSSProperties}
            rows={2}
          />
        ) : mode === 'markdown' && markdownCopyText ? (
          <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-[var(--text2)]">{markdownCopyText}</pre>
        ) : (
          <p className={`whitespace-pre-wrap leading-relaxed text-[var(--text)] ${kind === 'heading' ? 'text-sm font-semibold' : 'text-sm'}`}>
            {text}
          </p>
        )}
      </div>
    </div>
  )
}

export function SuggestionCard({ item }: { item: ArticleSuggestion }) {
  return (
    <div className="my-3 flex gap-3 rounded-[var(--r-sm)] border border-dashed border-[var(--accent)]/40 bg-[var(--warn-l)] px-4 py-3">
      <span aria-hidden="true" className="shrink-0 text-base">
        {item.type === 'image' ? '📷' : '✏️'}
      </span>
      <div>
        <p className="text-xs font-semibold text-[var(--accent)] mb-0.5">
          {item.type === 'image' ? '写真・画像の提案' : '内容追加の提案'}
        </p>
        <p className="text-sm text-[var(--text2)] leading-relaxed">{item.text}</p>
      </div>
    </div>
  )
}

export function BlockCopyCard({ kind, text, rawText, isEditing, onEditDone, mode }: {
  kind: ArticleBlockKind
  text: string
  rawText?: string
  isEditing?: boolean
  onEditDone?: (oldText: string, newText: string) => void
  mode?: 'text' | 'markdown'
}) {
  const { copied, copy } = useCardCopy()
  const [localText, setLocalText] = useState(text)
  const origRef = useRef(text)

  useEffect(() => {
    setLocalText(text)
    origRef.current = text
  }, [text])

  async function handleClick() {
    if (isEditing) return
    const copyContent = mode === 'markdown' && rawText ? rawText : text
    await copy(copyContent)
  }

  return (
    <div
      role={isEditing ? undefined : 'button'}
      tabIndex={isEditing ? undefined : 0}
      onClick={isEditing ? undefined : handleClick}
      onKeyDown={isEditing ? undefined : e => { if (e.key === 'Enter') handleClick() }}
      className={`group relative rounded-[14px] border border-[var(--border)] bg-[var(--surface)] ${isEditing ? 'ring-1 ring-[var(--accent)]/30' : 'cursor-pointer transition-colors hover:bg-[var(--bg2)] select-none'}`}
    >
      <div className={`sticky ${STICKY_TOP} z-[20] flex items-center justify-between gap-3 rounded-t-[14px] bg-[var(--surface)] group-hover:bg-[var(--bg2)] px-4 sm:px-5 pt-4 sm:pt-5 pb-2 transition-colors`}>
        <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--text3)]">
          {BLOCK_LABEL[kind]}
        </div>
        {!isEditing && (
          <span onClick={e => e.stopPropagation()} className="shrink-0">
            <HeaderCopyButton copied={copied} onClick={(e) => { e.stopPropagation(); handleClick() }} />
          </span>
        )}
      </div>
      <div className="px-4 sm:px-5 pb-4 sm:pb-5">
        {isEditing ? (
          <textarea
            value={localText}
            onChange={e => setLocalText(e.target.value)}
            onBlur={() => onEditDone?.(origRef.current, localText)}
            className={`w-full resize-none bg-transparent focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]/40 rounded leading-relaxed text-[var(--text)] ${kind === 'title' ? 'text-base font-bold' : kind === 'heading' ? 'text-sm font-semibold' : 'text-sm'}`}
            style={{ fieldSizing: 'content' } as React.CSSProperties}
            rows={2}
          />
        ) : mode === 'markdown' && rawText ? (
          <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-[var(--text2)]">{rawText}</pre>
        ) : (
          <p className={`whitespace-pre-wrap leading-relaxed text-[var(--text)] ${kind === 'title' ? 'text-base font-bold' : kind === 'heading' ? 'text-sm font-semibold' : 'text-sm'}`}>
            {text}
          </p>
        )}
      </div>
    </div>
  )
}
