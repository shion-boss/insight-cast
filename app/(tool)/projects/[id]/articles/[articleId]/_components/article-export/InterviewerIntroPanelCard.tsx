'use client'

import { useMemo, useState } from 'react'
import DOMPurify from 'dompurify'

import { ConversationBubbleEditor } from './ConversationBubbleEditor'
import { DEFAULT_THEME_COLOR, PURIFY_OPTS, STICKY_TOP } from './types'
import { HeaderCopyButton, useCardCopy } from './ui-primitives'

export function InterviewerIntroPanelCard({
  interviewerDisplayName,
  interviewerLabel,
  text,
  interviewerName,
  clientName,
  getIntroHtml,
  getConvHtml,
  isEditing,
  onEditConv,
  themeColor,
  showIntro,
  mode,
}: {
  interviewerDisplayName: string
  interviewerLabel: string | null
  text: string
  interviewerName: string
  clientName: string
  getIntroHtml: () => string
  getConvHtml: () => string
  isEditing?: boolean
  onEditConv?: (exchanges: { speaker: string; content: string }[]) => void
  themeColor?: string
  showIntro?: boolean
  mode?: 'text' | 'markdown'
}) {
  const [embedIntro, setEmbedIntro] = useState(false)
  const [embedConv, setEmbedConv] = useState(false)
  const intro = useCardCopy()
  const conv = useCardCopy()
  const labelText = interviewerLabel ? `AIインタビュアー · ${interviewerLabel}` : 'AIインタビュアー'
  const introText = `${interviewerDisplayName} / ${labelText}`
  const introMarkdown = `**${interviewerDisplayName}** / ${labelText}\n\nこの記事は [Insight Cast](https://insight-cast.jp) のAIインタビュアーが取材・構成しました。`

  const exchanges = useMemo(() =>
    text.split('\n').flatMap(line => {
      const match = line.match(/^\*\*(.+?)\*\*[:：]\s*(.+)$/)
      if (!match) return []
      const [, speaker, content] = match
      if (speaker !== interviewerName && speaker !== clientName) return []
      return [{ speaker, content }]
    }),
    [text, interviewerName, clientName]
  )

  const convPlainText = exchanges.map(e => `${e.speaker}:\n${e.content}`).join('\n\n')
  const convMarkdown = text.replace(/^(\*\*.+?\*\*[:：])\s+/gm, '$1\n')

  async function doIntroCopy() {
    const content = embedIntro ? getIntroHtml() : mode === 'markdown' ? introMarkdown : introText
    await intro.copy(content)
  }
  async function doConvCopy() {
    const content = embedConv ? getConvHtml() : mode === 'markdown' ? convMarkdown : convPlainText
    await conv.copy(content)
  }

  return (
    <>
      {/* インタビュアー紹介 */}
      {showIntro !== false && <div
        role={isEditing ? undefined : 'button'}
        tabIndex={isEditing ? undefined : 0}
        onClick={isEditing ? undefined : doIntroCopy}
        onKeyDown={isEditing ? undefined : e => { if (e.key === 'Enter') doIntroCopy() }}
        className={`group relative rounded-[14px] border border-[var(--border)] bg-[var(--surface)] ${isEditing ? 'ring-1 ring-[var(--accent)]/20' : 'cursor-pointer transition-colors hover:bg-[var(--bg2)] select-none'}`}
      >
        <div className={`sticky ${STICKY_TOP} z-[20] flex items-center justify-between gap-3 rounded-t-[14px] bg-[var(--surface)] group-hover:bg-[var(--bg2)] px-4 sm:px-5 pt-4 sm:pt-5 pb-2 transition-colors`}>
          <div className="flex items-center gap-2 min-w-0">
            <div className="text-xs font-bold tracking-[0.1em] uppercase text-[var(--text2)] whitespace-nowrap">インタビュアー紹介</div>
            {!isEditing && (
              <button type="button" onClick={e => { e.stopPropagation(); setEmbedIntro(v => !v) }}
                className={`text-xs px-2 py-1 rounded border transition-colors whitespace-nowrap ${embedIntro ? 'border-[var(--accent)] bg-[var(--accent)] text-white' : 'border-[var(--border)] text-[var(--text2)] hover:text-[var(--text2)]'}`}>
                埋め込みHTML
              </button>
            )}
          </div>
          {!isEditing && (
            <span onClick={e => e.stopPropagation()} className="shrink-0">
              <HeaderCopyButton copied={intro.copied} onClick={(e) => { e.stopPropagation(); doIntroCopy() }} />
            </span>
          )}
        </div>
        <div className="px-4 sm:px-5 pb-4 sm:pb-5">
          {embedIntro ? (
            <div
              className="overflow-auto rounded border border-[var(--border)] bg-white px-3 py-2 text-sm max-h-48"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(getIntroHtml(), PURIFY_OPTS) }}
            />
          ) : mode === 'markdown' ? (
            <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-[var(--text2)]">{introMarkdown}</pre>
          ) : (
            <p className="text-sm text-[var(--text2)]">{introText}</p>
          )}
        </div>
      </div>}
      {/* 会話本文 */}
      <div
        role={isEditing ? undefined : 'button'}
        tabIndex={isEditing ? undefined : 0}
        onClick={isEditing ? undefined : doConvCopy}
        onKeyDown={isEditing ? undefined : e => { if (e.key === 'Enter') doConvCopy() }}
        className={`group relative rounded-[14px] border border-[var(--border)] bg-[var(--surface)] ${isEditing ? 'ring-1 ring-[var(--accent)]/20' : 'cursor-pointer transition-colors hover:bg-[var(--bg2)] select-none'}`}
      >
        <div className={`sticky ${STICKY_TOP} z-[20] flex items-center justify-between gap-3 rounded-t-[14px] bg-[var(--surface)] group-hover:bg-[var(--bg2)] px-4 sm:px-5 pt-4 sm:pt-5 pb-2 transition-colors`}>
          <div className="flex items-center gap-2 min-w-0">
            <div className="text-xs font-bold tracking-[0.1em] uppercase text-[var(--text2)] whitespace-nowrap">会話本文</div>
            {!isEditing && (
              <button type="button" onClick={e => { e.stopPropagation(); setEmbedConv(v => !v) }}
                className={`text-xs px-2 py-1 rounded border transition-colors whitespace-nowrap ${embedConv ? 'border-[var(--accent)] bg-[var(--accent)] text-white' : 'border-[var(--border)] text-[var(--text2)] hover:text-[var(--text2)]'}`}>
                埋め込みHTML
              </button>
            )}
          </div>
          {!isEditing && (
            <span onClick={e => e.stopPropagation()} className="shrink-0">
              <HeaderCopyButton copied={conv.copied} onClick={(e) => { e.stopPropagation(); doConvCopy() }} />
            </span>
          )}
        </div>
        <div className="px-4 sm:px-5 pb-4 sm:pb-5">
          {isEditing ? (
            <ConversationBubbleEditor
              initialExchanges={exchanges}
              interviewerName={interviewerName}
              clientName={clientName}
              onExchangesChange={newExchanges => onEditConv?.(newExchanges)}
              themeColor={themeColor ?? DEFAULT_THEME_COLOR}
            />
          ) : embedConv ? (
            <div
              className="overflow-auto rounded border border-[var(--border)] bg-white px-3 py-2 text-sm"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(getConvHtml(), PURIFY_OPTS) }}
            />
          ) : mode === 'markdown' ? (
            <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-[var(--text2)]">{convMarkdown}</pre>
          ) : (
            <div className="flex flex-col gap-4">
              {exchanges.map((e, i) => (
                <p key={i} className="text-sm leading-relaxed">
                  <span className="block font-semibold text-[var(--text)]">{e.speaker}:</span>
                  <span className="block text-[var(--text2)]">{e.content}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
