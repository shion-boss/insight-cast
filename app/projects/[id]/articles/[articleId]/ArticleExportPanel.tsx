'use client'

import { useState, useCallback, useTransition } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import Image from 'next/image'
import { getCharacter } from '@/lib/characters'
import { saveArticleContent } from './actions'

type Format = 'text' | 'markdown' | 'html'

const FORMAT_LABELS: Record<Format, string> = {
  text:     'テキスト',
  markdown: 'Markdown',
  html:     '埋め込みHTML',
}

const CAST_COLORS: Record<string, string> = {
  mint:  '#c2722a',
  claus: '#0f766e',
  rain:  '#7c3aed',
  hal:   '#1d4ed8',
  mogro: '#065f46',
  cocco: '#be185d',
}

const DEFAULT_THEME_COLOR = '#c2722a'

// テーマカラーから明度を上げた色を生成
function lighten(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const mix = (c: number) => Math.round(c + (255 - c) * amount).toString(16).padStart(2, '0')
  return `#${mix(r)}${mix(g)}${mix(b)}`
}

// インラインHTML文字列内でのXSS防止用エスケープ
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function toPlainText(md: string): string {
  return md
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/~~(.+?)~~/g, '$1')
    .replace(/`{3}[\s\S]*?`{3}/gm, '')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/^>\s+/gm, '')
    .replace(/^---+$/gm, '')
    .replace(/^\|.*\|$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function formatDateShort(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

function initial(name: string | null): string {
  return name ? name.slice(0, 1) : '?'
}

const FOOTER_HTML = `<div style="height:1px;background:#e2d5c3;margin-top:40px;"></div><div style="padding-top:16px;text-align:right;"><a href="https://insight-cast.jp" target="_blank" style="font-size:11px;color:#b8a898;text-decoration:none;letter-spacing:0.05em;">Powered by Insight Cast ↗</a></div>`

function buildClientHtml(opts: { title: string; date: string; content: string }): string {
  const { title, date, content } = opts
  const bodyHtml = String(marked.parse(content, { async: false }))
  const styledBody = bodyHtml
    .replace(/<h2>/g, '<h2 style="font-size:18px;font-weight:700;border-left:3px solid #c2722a;padding-left:12px;color:#1c1410;margin:32px 0 16px;">')
    .replace(/<h3>/g, '<h3 style="font-size:16px;font-weight:700;color:#1c1410;margin:24px 0 12px;">')
    .replace(/<p>/g, '<p style="font-size:15px;line-height:1.8;color:#7a6555;margin:0 0 16px;">')
    .replace(/<ul>/g, '<ul style="font-size:15px;line-height:1.8;color:#7a6555;margin:0 0 16px;padding-left:20px;">')
    .replace(/<ol>/g, '<ol style="font-size:15px;line-height:1.8;color:#7a6555;margin:0 0 16px;padding-left:20px;">')

  return `<div style="box-sizing:border-box;max-width:800px;width:100%;margin:0 auto;background:#fdf7f0;padding:40px 32px;font-family:system-ui,-apple-system,sans-serif;color:#1c1410;border-radius:4px;">
<div style="font-size:11px;font-weight:700;letter-spacing:0.1em;color:#c2722a;text-transform:uppercase;margin-bottom:14px;">取材記事</div>
<h1 style="font-size:24px;font-weight:700;color:#1c1410;line-height:1.4;margin:0 0 12px;">${escapeHtml(title)}</h1>
<div style="font-size:12px;color:#b8a898;margin-bottom:32px;">${escapeHtml(date)}</div>
<div>${styledBody}</div>
${FOOTER_HTML}
</div>`
}

function buildInterviewerHtml(opts: {
  title: string
  date: string
  content: string
  interviewerName: string
  interviewerLabel: string
  interviewerColor: string
}): string {
  const { title, date, content, interviewerName, interviewerLabel, interviewerColor } = opts
  const bodyHtml = String(marked.parse(content, { async: false }))
  const styledBody = bodyHtml
    .replace(/<h2>/g, '<h2 style="font-size:17px;font-weight:700;margin-top:32px;margin-bottom:14px;color:#1c1410;">')
    .replace(/<h3>/g, '<h3 style="font-size:15px;font-weight:700;color:#1c1410;margin:20px 0 10px;">')
    .replace(/<p>/g, '<p style="font-size:15px;line-height:1.8;color:#3d2b1f;margin:0 0 16px;">')
    .replace(/<ul>/g, '<ul style="font-size:15px;line-height:1.8;color:#3d2b1f;margin:0 0 16px;padding-left:20px;">')
    .replace(/<ol>/g, '<ol style="font-size:15px;line-height:1.8;color:#3d2b1f;margin:0 0 16px;padding-left:20px;">')

  return `<div style="box-sizing:border-box;max-width:800px;width:100%;margin:0 auto;background:#fdf7f0;padding:40px 32px;font-family:system-ui,-apple-system,sans-serif;color:#1c1410;border-radius:4px;">
<div style="font-size:11px;font-weight:700;letter-spacing:0.1em;color:#c2722a;text-transform:uppercase;margin-bottom:14px;">取材レポート</div>
<h1 style="font-size:24px;font-weight:700;color:#1c1410;line-height:1.4;margin:0 0 20px;">${escapeHtml(title)}</h1>
<div style="background:#f5e8d8;border-radius:12px;padding:12px 16px;display:flex;align-items:center;gap:10px;margin-bottom:32px;box-sizing:border-box;">
  <div style="width:10px;height:10px;border-radius:50%;background:${escapeHtml(interviewerColor)};flex-shrink:0;"></div>
  <div style="flex:1;min-width:0;">
    <div style="font-size:13px;font-weight:700;color:#1c1410;">${escapeHtml(interviewerName)}<span style="font-size:11px;font-weight:400;color:#7a6555;margin-left:8px;">${escapeHtml(interviewerLabel)}</span></div>
    <div style="font-size:11px;color:#b8a898;margin-top:2px;">${escapeHtml(date)} 取材</div>
  </div>
</div>
<div>${styledBody}</div>
${FOOTER_HTML}
</div>`
}

function buildConversationHtml(opts: {
  content: string
  interviewerName: string
  interviewerDisplayName: string
  interviewerAvatarUrl: string | null
  clientName: string
  clientDisplayName: string
  clientInitial: string
  userAvatarUrl: string | null
  themeColor: string
  showIcon: boolean
  showName: boolean
  showClientIcon: boolean
  showClientName: boolean
}): string {
  const { content, interviewerName, interviewerDisplayName, interviewerAvatarUrl, clientDisplayName, clientInitial, userAvatarUrl, themeColor, showIcon, showName, showClientIcon, showClientName } = opts
  const questionBg = lighten(themeColor, 0.78)
  const answerBg   = lighten(themeColor, 0.88)
  const badgeBg    = themeColor

  const imgStyle = 'width:36px;height:36px;border-radius:50%;object-fit:cover;display:block;'
  const divStyle = 'width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#fff;'
  const nameStyle = 'font-size:10px;color:#b8a898;margin-bottom:4px;white-space:nowrap;'

  const userIconHtml = showClientIcon
    ? (userAvatarUrl
        ? `<img src="${escapeHtml(userAvatarUrl)}" alt="${escapeHtml(clientInitial)}" style="${imgStyle}" />`
        : `<div style="${divStyle}background:${badgeBg};">${escapeHtml(clientInitial)}</div>`)
    : ''

  const interviewerIconHtml = showIcon
    ? (interviewerAvatarUrl
        ? `<img src="${escapeHtml(interviewerAvatarUrl)}" alt="${escapeHtml(interviewerDisplayName)}" style="${imgStyle}" />`
        : `<div style="${divStyle}background:${themeColor};">${escapeHtml(interviewerDisplayName.slice(0, 1))}</div>`)
    : ''

  const nameHtmlInterviewer = showName      ? `<div style="${nameStyle}">${escapeHtml(interviewerDisplayName)}</div>` : ''
  const nameHtmlClient      = showClientName ? `<div style="${nameStyle}">${escapeHtml(clientDisplayName)}</div>` : ''

  const iconGapInterviewer = showIcon       ? 'gap:8px;' : ''
  const iconGapClient      = showClientIcon ? 'gap:8px;' : ''
  const iconMarginTopInterviewer = showIcon       ? 'margin-top:8px;' : ''
  const iconMarginTopClient      = showClientIcon ? 'margin-top:8px;' : ''

  const bubblesHtml: string[] = []

  for (const line of content.split('\n')) {
    const match = line.match(/^\*\*(.+?)\*\*[:：]\s*(.+)$/)
    if (!match) continue
    const rawText = escapeHtml(match[2]).replace(/([。！？])/g, '$1<br>')
    // マッチングは元のinterviewerName（コンテンツ内の名前）で行う
    if (match[1] === interviewerName) {
      bubblesHtml.push(`<div style="display:flex;align-items:flex-start;justify-content:flex-end;${iconGapInterviewer}margin-bottom:20px;">
  <div style="display:flex;flex-direction:column;align-items:flex-end;${iconMarginTopInterviewer}flex:1;min-width:0;">
    ${nameHtmlInterviewer}
    <div style="background:${questionBg};border-radius:16px 4px 16px 16px;padding:10px 14px;max-width:75%;font-size:15px;line-height:1.85;color:#3d2b1f;box-sizing:border-box;">${rawText}</div>
  </div>
  ${interviewerIconHtml ? `<div style="flex-shrink:0;">${interviewerIconHtml}</div>` : ''}
</div>`)
    } else {
      bubblesHtml.push(`<div style="display:flex;align-items:flex-start;${iconGapClient}margin-bottom:20px;">
  ${userIconHtml ? `<div style="flex-shrink:0;">${userIconHtml}</div>` : ''}
  <div style="display:flex;flex-direction:column;align-items:flex-start;${iconMarginTopClient}flex:1;min-width:0;">
    ${nameHtmlClient}
    <div style="background:${answerBg};border-radius:4px 16px 16px 16px;padding:10px 14px;max-width:75%;font-size:15px;line-height:1.85;color:#2a2a3d;box-sizing:border-box;">${rawText}</div>
  </div>
</div>`)
    }
  }

  return `<div style="box-sizing:border-box;max-width:800px;width:100%;margin:0 auto;padding:28px 4px;font-family:system-ui,-apple-system,sans-serif;color:#1c1410;">
<div style="height:1px;background:#e2d5c3;margin-bottom:28px;"></div>
${bubblesHtml.join('\n')}
<div style="text-align:right;margin-bottom:12px;"><a href="https://insight-cast.jp" target="_blank" style="font-size:11px;color:#b8a898;text-decoration:none;letter-spacing:0.05em;">Powered by Insight Cast ↗</a></div>
<div style="height:1px;background:#e2d5c3;"></div>
</div>`
}

function buildHtml(opts: {
  articleType: string
  title: string
  date: string
  content: string
  interviewerName: string | null
  interviewerLabel: string | null
  interviewerId: string | null
  interviewerAvatarUrl: string | null
  interviewerDisplayName: string | null
  clientName: string | null
  clientDisplayName: string | null
  userAvatarUrl: string | null
  themeColor: string
  showIcon: boolean
  showName: boolean
  showClientIcon: boolean
  showClientName: boolean
}): string {
  const { articleType, title, date, content, interviewerName, interviewerLabel, interviewerId, interviewerAvatarUrl, interviewerDisplayName, clientName, userAvatarUrl, themeColor, showIcon, showName, showClientIcon, showClientName } = opts
  const interviewerColor = CAST_COLORS[interviewerId ?? ''] ?? '#c2722a'
  const dateStr = formatDateShort(date)
  const resolvedInterviewerName = interviewerDisplayName || interviewerName

  if (articleType === 'conversation' && interviewerName !== null) {
    return buildConversationHtml({
      content,
      interviewerName,
      interviewerDisplayName: resolvedInterviewerName ?? interviewerName,
      interviewerAvatarUrl,
      clientName: clientName ?? '事業者',
      clientDisplayName: opts.clientDisplayName ?? clientName ?? '事業者',
      clientInitial: initial(opts.clientDisplayName ?? clientName),
      userAvatarUrl,
      themeColor,
      showIcon,
      showName,
      showClientIcon,
      showClientName,
    })
  }
  if (articleType === 'interviewer') {
    return buildInterviewerHtml({
      title, date: dateStr, content,
      interviewerName: interviewerName ?? 'インタビュアー',
      interviewerLabel: interviewerLabel ?? '',
      interviewerColor,
    })
  }
  return buildClientHtml({ title, date: dateStr, content })
}

function getContent(opts: {
  format: Format
  articleType: string
  title: string
  date: string
  content: string
  interviewerName: string | null
  interviewerLabel: string | null
  interviewerId: string | null
  interviewerAvatarUrl: string | null
  interviewerDisplayName: string | null
  clientName: string | null
  clientDisplayName: string | null
  userAvatarUrl: string | null
  themeColor: string
  showIcon: boolean
  showName: boolean
  showClientIcon: boolean
  showClientName: boolean
}): string {
  const { format, ...rest } = opts
  if (format === 'text') return toPlainText(rest.content)
  if (format === 'html') return buildHtml(rest)
  return rest.content
}

export function ArticleExportPanel({
  content,
  title,
  articleType,
  date,
  interviewerId,
  interviewerName,
  interviewerLabel,
  clientName,
  userAvatarUrl,
  articleId,
  projectId,
}: {
  content: string
  title: string
  articleType: string
  date: string
  interviewerId: string | null
  interviewerName: string | null
  interviewerLabel: string | null
  clientName: string | null
  userAvatarUrl: string | null
  articleId: string
  projectId: string
}) {
  const availableFormats = Object.keys(FORMAT_LABELS) as Format[]
  const [format, setFormat] = useState<Format>('markdown')
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)
  const [themeColor, setThemeColor] = useState(DEFAULT_THEME_COLOR)
  const [htmlPreview, setHtmlPreview] = useState(false)
  const [editedContent, setEditedContent] = useState(content)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [, startTransition] = useTransition()

  const isDirty = editedContent !== content

  const char = getCharacter(interviewerId ?? 'mint')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const defaultInterviewerAvatarUrl = char?.icon48?.src ? `${appUrl}${char.icon48.src}` : null
  const [interviewerAvatarUrl, setInterviewerAvatarUrl] = useState<string>(defaultInterviewerAvatarUrl ?? '')
  const [interviewerDisplayName, setInterviewerDisplayName] = useState<string>(interviewerName ?? '')
  const [clientDisplayName, setClientDisplayName] = useState<string>(clientName ?? '')
  const [clientAvatarUrl, setClientAvatarUrl] = useState<string>(userAvatarUrl ?? '')
  const [showInterviewerIcon, setShowInterviewerIcon] = useState(true)
  const [showInterviewerName, setShowInterviewerName] = useState(true)
  const [showClientIcon, setShowClientIcon] = useState(true)
  const [showClientName, setShowClientName] = useState(true)

  const safeFormat = availableFormats.includes(format) ? format : 'markdown'
  const output = getContent({
    format: safeFormat, articleType, title, date, content: editedContent,
    interviewerName, interviewerLabel, interviewerId,
    interviewerAvatarUrl: interviewerAvatarUrl || null,
    interviewerDisplayName: interviewerDisplayName || null,
    clientName,
    clientDisplayName: clientDisplayName || null,
    userAvatarUrl: clientAvatarUrl || userAvatarUrl,
    themeColor,
    showIcon: showInterviewerIcon,
    showName: showInterviewerName,
    showClientIcon,
    showClientName,
  })

  const handleSave = useCallback(() => {
    setSaveState('saving')
    startTransition(async () => {
      try {
        await saveArticleContent(articleId, projectId, content, editedContent)
        setSaveState('saved')
        setTimeout(() => setSaveState('idle'), 2000)
      } catch {
        setSaveState('error')
        setTimeout(() => setSaveState('idle'), 3000)
      }
    })
  }, [articleId, projectId, content, editedContent])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(output)
      setCopied(true)
      setCopyError(false)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopyError(true)
      setTimeout(() => setCopyError(false), 3000)
    }
  }, [output])

  const handleDownload = useCallback(() => {
    const mimeMap: Record<Format, string> = { text: 'text/plain', markdown: 'text/markdown', html: 'text/html' }
    const extMap: Record<Format, string> = { text: 'txt', markdown: 'md', html: 'html' }
    const blob = new Blob([output], { type: mimeMap[safeFormat] })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.slice(0, 40).replace(/[^\w぀-ゟ゠-ヿ一-鿿]/g, '_')}.${extMap[safeFormat]}`
    a.click()
    URL.revokeObjectURL(url)
  }, [output, safeFormat, title])

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      {/* キャラ吹き出しヘッダー */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-4">
        <div className="relative flex-shrink-0">
          {char?.icon48 ? (
            <Image
              src={char.icon48}
              alt={`${char.name ?? 'インタビュアー'}のアイコン`}
              width={40}
              height={40}
              className="rounded-full border border-[var(--border)] object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-lg">
              {char?.emoji ?? '🐱'}
            </div>
          )}
        </div>
        <div className="relative rounded-2xl rounded-tl-sm border border-[var(--border)] bg-[var(--bg)] px-4 py-2 text-sm text-[var(--text2)]">
          記事をまとめました。好きな形式でお使いください。
        </div>
      </div>

      <div className="flex flex-col border-b border-[var(--border)] sm:flex-row sm:items-center">
        <div className="flex overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {availableFormats.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFormat(f)}
              className={`whitespace-nowrap px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)]/40 border-b-2 ${
                safeFormat === f
                  ? 'bg-[var(--surface)] text-[var(--text)] border-[var(--accent)]'
                  : 'text-[var(--text3)] hover:text-[var(--text2)] border-transparent'
              }`}
            >
              {FORMAT_LABELS[f]}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-[var(--border)] px-4 py-2 sm:ml-auto sm:border-t-0 sm:py-0">
          {isDirty && (
            <button
              type="button"
              onClick={handleSave}
              disabled={saveState === 'saving'}
              className="min-w-24 min-h-[44px] rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
            >
              {saveState === 'saving' ? '保存中...' : saveState === 'saved' ? '✓ 保存済み' : saveState === 'error' ? '保存できませんでした' : '保存する'}
            </button>
          )}
          <button
            type="button"
            onClick={handleCopy}
            className="min-w-[8rem] min-h-[44px] rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--text)] transition-colors hover:bg-[var(--bg2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
          >
            {copied ? '✓ コピーしました' : 'コピー'}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="min-h-[44px] rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--text)] transition-colors hover:bg-[var(--bg2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
          >
            ファイル保存
          </button>
        </div>
      </div>

      {safeFormat === 'html' && (
        <div className="border-b border-[var(--border)] divide-y divide-[var(--border)] text-xs">
          {/* テーマカラー */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0 px-5 py-3">
            <span className="sm:w-28 shrink-0 text-[var(--text3)]">テーマカラー</span>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="color"
                value={themeColor}
                onChange={(e) => setThemeColor(e.target.value)}
                className="h-7 w-10 cursor-pointer rounded border border-[var(--border)] bg-transparent p-0.5"
              />
              <span className="font-mono text-[var(--text3)]">{themeColor}</span>
              <button type="button" onClick={() => setThemeColor(DEFAULT_THEME_COLOR)} className="text-[var(--text3)] hover:text-[var(--text2)] transition-colors">
                リセット
              </button>
              <div className="flex rounded-lg border border-[var(--border)] overflow-hidden font-semibold">
                <button type="button" onClick={() => setHtmlPreview(false)} className={`px-3 py-1.5 transition-colors ${!htmlPreview ? 'bg-[var(--accent)] text-white' : 'text-[var(--text3)] hover:text-[var(--text2)]'}`}>コード</button>
                <button type="button" onClick={() => setHtmlPreview(true)}  className={`px-3 py-1.5 transition-colors ${htmlPreview  ? 'bg-[var(--accent)] text-white' : 'text-[var(--text3)] hover:text-[var(--text2)]'}`}>プレビュー</button>
              </div>
            </div>
          </div>
          {/* インタビュアー（会話形式のみ） */}
          {articleType === 'conversation' && (
            <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-0 px-5 py-3">
              <span className="sm:w-28 shrink-0 text-[var(--text3)] sm:pt-1">インタビュアー</span>
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="h-7 w-7 shrink-0 rounded-full border border-[var(--border)] overflow-hidden bg-[var(--bg2)]">
                    {interviewerAvatarUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={interviewerAvatarUrl} alt="preview" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <label className="cursor-pointer rounded border border-[var(--border)] bg-transparent px-2 py-1 text-[var(--text2)] hover:bg-[var(--bg2)] transition-colors shrink-0">
                    画像を選ぶ
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                      const file = e.target.files?.[0]; if (!file) return
                      const reader = new FileReader(); reader.onload = () => setInterviewerAvatarUrl(reader.result as string); reader.readAsDataURL(file)
                    }} />
                  </label>
                  {interviewerAvatarUrl && interviewerAvatarUrl !== (defaultInterviewerAvatarUrl ?? '') && (
                    <button type="button" onClick={() => setInterviewerAvatarUrl(defaultInterviewerAvatarUrl ?? '')} className="shrink-0 text-[var(--text3)] hover:text-[var(--text2)] transition-colors">削除</button>
                  )}
                  <input type="text" value={interviewerDisplayName} onChange={(e) => setInterviewerDisplayName(e.target.value)} placeholder="名前" className="min-w-0 w-24 rounded border border-[var(--border)] bg-transparent px-2 py-1 text-[var(--text2)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" />
                  <button type="button" onClick={() => { setInterviewerAvatarUrl(defaultInterviewerAvatarUrl ?? ''); setInterviewerDisplayName(interviewerName ?? '') }} className="shrink-0 text-[var(--text3)] hover:text-[var(--text2)] transition-colors">リセット</button>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button type="button" role="switch" aria-checked={showInterviewerIcon} onClick={() => setShowInterviewerIcon(v => !v)} className="flex items-center gap-1.5 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 rounded">
                    <div className={`relative h-5 w-9 rounded-full transition-colors pointer-events-none ${showInterviewerIcon ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`}>
                      <span className={`absolute left-0 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${showInterviewerIcon ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </div>
                    <span className="text-[var(--text3)]">アイコン</span>
                  </button>
                  <button type="button" role="switch" aria-checked={showInterviewerName} onClick={() => setShowInterviewerName(v => !v)} className="flex items-center gap-1.5 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 rounded">
                    <div className={`relative h-5 w-9 rounded-full transition-colors pointer-events-none ${showInterviewerName ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`}>
                      <span className={`absolute left-0 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${showInterviewerName ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </div>
                    <span className="text-[var(--text3)]">名前</span>
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* 取材先（会話形式のみ） */}
          {articleType === 'conversation' && (
            <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-0 px-5 py-3">
              <span className="sm:w-28 shrink-0 text-[var(--text3)] sm:pt-1">取材先</span>
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="h-7 w-7 shrink-0 rounded-full border border-[var(--border)] overflow-hidden" style={{ background: clientAvatarUrl ? undefined : themeColor }}>
                    {clientAvatarUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={clientAvatarUrl} alt="preview" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <label className="cursor-pointer rounded border border-[var(--border)] bg-transparent px-2 py-1 text-[var(--text2)] hover:bg-[var(--bg2)] transition-colors shrink-0">
                    画像を選ぶ
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                      const file = e.target.files?.[0]; if (!file) return
                      const reader = new FileReader(); reader.onload = () => setClientAvatarUrl(reader.result as string); reader.readAsDataURL(file)
                    }} />
                  </label>
                  {clientAvatarUrl && (
                    <button type="button" onClick={() => setClientAvatarUrl('')} className="shrink-0 text-[var(--text3)] hover:text-[var(--text2)] transition-colors">削除</button>
                  )}
                  <input type="text" value={clientDisplayName} onChange={(e) => setClientDisplayName(e.target.value)} placeholder="名前" className="min-w-0 w-24 rounded border border-[var(--border)] bg-transparent px-2 py-1 text-[var(--text2)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" />
                  <button type="button" onClick={() => { setClientAvatarUrl(''); setClientDisplayName(clientName ?? '') }} className="shrink-0 text-[var(--text3)] hover:text-[var(--text2)] transition-colors">リセット</button>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button type="button" role="switch" aria-checked={showClientIcon} onClick={() => setShowClientIcon(v => !v)} className="flex items-center gap-1.5 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 rounded">
                    <div className={`relative h-5 w-9 rounded-full transition-colors pointer-events-none ${showClientIcon ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`}>
                      <span className={`absolute left-0 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${showClientIcon ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </div>
                    <span className="text-[var(--text3)]">アイコン</span>
                  </button>
                  <button type="button" role="switch" aria-checked={showClientName} onClick={() => setShowClientName(v => !v)} className="flex items-center gap-1.5 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 rounded">
                    <div className={`relative h-5 w-9 rounded-full transition-colors pointer-events-none ${showClientName ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`}>
                      <span className={`absolute left-0 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${showClientName ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </div>
                    <span className="text-[var(--text3)]">名前</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {safeFormat === 'html' && htmlPreview ? (
        <div className="p-5" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(output, { ALLOWED_URI_REGEXP: /^(?:(?:https?|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i }) }} />
      ) : safeFormat === 'html' ? (
        <div className="p-5">
          <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-[var(--text2)]">
            {output.replace(/src="data:image\/[^;]+;base64,[^"]+"/g, 'src="[画像データ]"')}
          </pre>
        </div>
      ) : (
        <textarea
          aria-label="記事コンテンツ編集エリア"
          value={safeFormat === 'markdown' ? editedContent : output}
          onChange={safeFormat === 'markdown' ? (e) => setEditedContent(e.target.value) : undefined}
          readOnly={safeFormat !== 'markdown'}
          className="w-full resize-none bg-transparent p-5 text-sm leading-relaxed text-[var(--text2)] focus:outline-none"
          style={{ minHeight: '200px', height: 'auto', fieldSizing: 'content' } as React.CSSProperties}
        />
      )}
      {copyError && (
        <p className="px-5 pb-3 text-xs text-[var(--err)]">コピーできませんでした。手動でお試しください。</p>
      )}
    </section>
  )
}
