'use client'

import { useRef, useState } from 'react'

import { ConfirmDialog } from '@/components/confirm-dialog'

import { applyConvEdit, lighten } from './helpers'

export function ConversationBubbleEditor({
  initialExchanges,
  interviewerName,
  clientName,
  fullMarkdown,
  onMarkdownChange,
  onExchangesChange,
  themeColor,
}: {
  initialExchanges: { speaker: string; content: string }[]
  interviewerName: string
  clientName: string
  fullMarkdown?: string
  onMarkdownChange?: (newMd: string) => void
  onExchangesChange?: (exchanges: { speaker: string; content: string }[]) => void
  themeColor: string
}) {
  const [exchanges, setExchanges] = useState(initialExchanges)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [insertAt, setInsertAt] = useState<number | null>(null)
  const [pendingDeleteIdx, setPendingDeleteIdx] = useState<number | null>(null)
  const dragFromHandle = useRef(false)
  const mdRef = useRef(fullMarkdown ?? '')
  mdRef.current = fullMarkdown ?? ''

  const questionBg = lighten(themeColor, 0.78)
  const answerBg   = lighten(themeColor, 0.88)

  function handleChange(next: { speaker: string; content: string }[]) {
    setExchanges(next)
    const writeable = next.filter(e => e.content !== '')
    if (onMarkdownChange) onMarkdownChange(applyConvEdit(mdRef.current, interviewerName, clientName, writeable))
    // writeableが変わったときだけ親に通知（空バブル追加だけの場合は通知しない）
    const prevWriteable = exchanges.filter(e => e.content !== '')
    const changed = writeable.length !== prevWriteable.length ||
      writeable.some((e, i) => e.speaker !== prevWriteable[i]?.speaker || e.content !== prevWriteable[i]?.content)
    if (changed) onExchangesChange?.(writeable)
  }

  function reorder(from: number, before: number) {
    if (before === from || before === from + 1) return
    const next = [...exchanges]
    const [item] = next.splice(from, 1)
    next.splice(before > from ? before - 1 : before, 0, item)
    handleChange(next)
  }

  function calcInsertAt(ev: React.DragEvent, i: number) {
    const rect = (ev.currentTarget as HTMLElement).getBoundingClientRect()
    return ev.clientY < rect.top + rect.height / 2 ? i : i + 1
  }

  return (
    <div
      className="flex flex-col gap-3 p-5"
      onDragOver={ev => ev.preventDefault()}
      onDrop={ev => { ev.preventDefault(); if (dragIdx !== null && insertAt !== null) reorder(dragIdx, insertAt); setDragIdx(null); setInsertAt(null) }}
      onDragLeave={ev => { if (!ev.currentTarget.contains(ev.relatedTarget as Node)) setInsertAt(null) }}
    >
      {exchanges.map((e, i) => {
        const isInterviewer = e.speaker === interviewerName
        return (
          <div
            key={i}
            onDragOver={ev => { ev.stopPropagation(); ev.preventDefault(); setInsertAt(calcInsertAt(ev, i)) }}
          >
            <div className={`h-2 rounded-full transition-colors duration-100 mb-1 ${insertAt === i && dragIdx !== null ? 'bg-[var(--accent)]/40' : 'bg-transparent'}`} />
            <div
              draggable
              onDragStart={ev => { if (!dragFromHandle.current) { ev.preventDefault(); return }; setDragIdx(i); ev.dataTransfer.effectAllowed = 'move' }}
              onDragEnd={() => { dragFromHandle.current = false; setDragIdx(null); setInsertAt(null) }}
              className={`flex items-start gap-2 ${dragIdx === i ? 'opacity-40' : ''}`}
            >
              {/* 並べ替えコントロール */}
              <div className="flex flex-col items-center shrink-0 pt-1.5 gap-0">
                <button type="button" onClick={() => { if (i === 0) return; const n = [...exchanges]; [n[i-1], n[i]] = [n[i], n[i-1]]; handleChange(n) }} disabled={i === 0} aria-label="上に移動" className="px-1 py-0.5 text-[13px] text-[var(--text2)] hover:text-[var(--text)] disabled:opacity-20 transition-colors">▲</button>
                <span aria-label="ドラッグして並べ替え" className="cursor-grab active:cursor-grabbing px-1 py-1 text-[var(--text2)] hover:text-[var(--text2)] select-none" onMouseDown={() => { dragFromHandle.current = true }} onMouseUp={() => { dragFromHandle.current = false }}>
                  <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor"><circle cx="2" cy="2" r="1.3"/><circle cx="6" cy="2" r="1.3"/><circle cx="2" cy="6" r="1.3"/><circle cx="6" cy="6" r="1.3"/><circle cx="2" cy="10" r="1.3"/><circle cx="6" cy="10" r="1.3"/></svg>
                </span>
                <button type="button" onClick={() => { if (i === exchanges.length - 1) return; const n = [...exchanges]; [n[i], n[i+1]] = [n[i+1], n[i]]; handleChange(n) }} disabled={i === exchanges.length - 1} aria-label="下に移動" className="px-1 py-0.5 text-[13px] text-[var(--text2)] hover:text-[var(--text)] disabled:opacity-20 transition-colors">▼</button>
              </div>
              {/* バブル */}
              <div className={`flex flex-col flex-1 min-w-0 ${isInterviewer ? 'items-end' : 'items-start'}`}>
                <textarea
                  value={e.content}
                  onChange={ev => handleChange(exchanges.map((ex, j) => j === i ? { ...ex, content: ev.target.value } : ex))}
                  aria-label={`${e.speaker || (isInterviewer ? interviewerName : clientName)}の発言を編集`}
                  className="w-full max-w-[80%] resize-none px-3.5 py-2.5 text-base leading-relaxed focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
                  style={{
                    background: isInterviewer ? questionBg : answerBg,
                    borderRadius: isInterviewer ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                    color: isInterviewer ? '#3d2b1f' : '#2a2a3d',
                    fieldSizing: 'content',
                  } as React.CSSProperties}
                  rows={2}
                />
              </div>
              {/* 削除 */}
              <button type="button" onClick={() => setPendingDeleteIdx(i)} aria-label="この発言を削除" className={`mt-2 shrink-0 px-1 text-base transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]/40 rounded ${pendingDeleteIdx === i ? 'text-[var(--err)]' : 'text-[var(--text2)] hover:text-[var(--err)]'}`}>×</button>
            </div>
          </div>
        )
      })}
      <div
        className={`h-2 rounded-full transition-colors duration-100 ${insertAt === exchanges.length && dragIdx !== null ? 'bg-[var(--accent)]/40' : 'bg-transparent'}`}
        onDragOver={ev => { ev.stopPropagation(); ev.preventDefault(); setInsertAt(exchanges.length) }}
      />
      <div className="flex gap-2 mt-1 flex-wrap">
        <button type="button" onClick={() => handleChange([...exchanges, { speaker: clientName, content: '' }])} className="text-[11px] border border-[var(--border)] rounded-full px-3 py-1 text-[var(--text2)] hover:bg-[var(--bg2)] transition-colors">+ {clientName}</button>
        <button type="button" onClick={() => handleChange([...exchanges, { speaker: interviewerName, content: '' }])} className="text-[11px] border border-[var(--border)] rounded-full px-3 py-1 text-[var(--text2)] hover:bg-[var(--bg2)] transition-colors">+ {interviewerName}</button>
      </div>
      {pendingDeleteIdx !== null && (
        <ConfirmDialog
          dialogId="bubble-delete"
          title="この発言を削除しますか？"
          description="削除すると元に戻せません。"
          confirmLabel="削除する"
          onCancel={() => setPendingDeleteIdx(null)}
          onConfirm={() => {
            handleChange(exchanges.filter((_, j) => j !== pendingDeleteIdx))
            setPendingDeleteIdx(null)
          }}
        />
      )}
    </div>
  )
}
