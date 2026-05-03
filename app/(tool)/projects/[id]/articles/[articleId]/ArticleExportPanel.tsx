'use client'

import { useState, useCallback, useTransition, useMemo, useEffect, useRef, Fragment } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import Image from 'next/image'
import { getCharacter } from '@/lib/characters'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { saveArticleContent } from './actions'
import type { ArticleSuggestions, ArticleSuggestion } from '@/lib/article-suggestions'


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

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function applyBlockEdit(md: string, kind: string, oldText: string, newText: string): string {
  if (!oldText || oldText === newText) return md
  if (kind === 'title') return md.replace(new RegExp(`^(# )${escapeRegex(oldText)}`, 'm'), `$1${newText}`)
  if (kind === 'heading') return md.replace(new RegExp(`^(## )${escapeRegex(oldText)}`, 'm'), `$1${newText}`)
  return md.replace(oldText, newText)
}


// コンテンツ内の **Name**: 行を走査してインタビュアー以外の最初の話者名を返す。
// 旧フォーマット（bizName）で生成された記事にも対応するため使用する。
function detectRespondentName(content: string, interviewerName: string | null): string | null {
  for (const line of content.split('\n')) {
    const m = line.match(/^\*\*(.+?)\*\*[:：]\s*(.+)$/)
    if (!m) continue
    if (m[1] !== interviewerName) return m[1]
  }
  return null
}

function applyConvEdit(md: string, interviewerName: string, clientName: string, exchanges: { speaker: string; content: string }[]): string {
  const writeable = exchanges.filter(e => e.content !== '')
  const lines = md.split('\n')
  const result: string[] = []
  let convInserted = false
  let inConv = false
  for (const line of lines) {
    const m = line.match(/^\*\*(.+?)\*\*[:：]\s*(.*)$/)
    const isQA = m && (m[1] === interviewerName || m[1] === clientName)
    if (isQA) {
      if (!inConv && !convInserted) {
        result.push(...writeable.map(e => `**${e.speaker}**: ${e.content}`))
        convInserted = true
      }
      inConv = true
    } else {
      inConv = false
      result.push(line)
    }
  }
  return result.join('\n')
}



function initial(name: string | null): string {
  return name ? name.slice(0, 1) : '?'
}

const PURIFY_OPTS = { ALLOWED_URI_REGEXP: /^(?:(?:https?|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i }


function buildIntroHtml(opts: {
  interviewerDisplayName: string
  interviewerLabel: string | null
  interviewerAvatarUrl: string | null
  themeColor: string
}): string {
  const { interviewerDisplayName, interviewerLabel, interviewerAvatarUrl, themeColor } = opts
  const iconHtml = interviewerAvatarUrl
    ? `<img src="${escapeHtml(interviewerAvatarUrl)}" alt="${escapeHtml(interviewerDisplayName)}" style="width:44px;height:44px;border-radius:50%;object-fit:cover;flex-shrink:0;" />`
    : `<div style="width:44px;height:44px;border-radius:50%;background:${escapeHtml(themeColor)};display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;color:#fff;flex-shrink:0;">${escapeHtml(interviewerDisplayName.slice(0, 1))}</div>`
  const labelText = interviewerLabel ? `AIインタビュアー · ${escapeHtml(interviewerLabel)}` : 'AIインタビュアー'
  return `<div style="background:${escapeHtml(lighten(themeColor, 0.88))};border-radius:14px;padding:16px 20px;box-sizing:border-box;margin-bottom:24px;">
  <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
    ${iconHtml}
    <div style="flex:1;min-width:0;">
      <div style="font-size:14px;font-weight:700;color:#1c1410;">${escapeHtml(interviewerDisplayName)}</div>
      <div style="font-size:11px;color:#8f7d6d;margin-top:2px;">${labelText}</div>
    </div>
  </div>
  <p style="font-size:13px;line-height:1.7;color:#5a4a3a;margin:0;">この記事は <a href="https://insight-cast.jp" target="_blank" rel="noopener noreferrer" style="color:${escapeHtml(themeColor)};text-decoration:none;font-weight:600;">Insight Cast</a> のAIインタビュアーが取材・構成しました。</p>
</div>`
}

function buildConversationHtml(opts: {
  title?: string
  date?: string
  content: string
  interviewerName: string
  interviewerDisplayName: string
  interviewerLabel: string | null
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
  showIntro: boolean
}): string {
  const { title, date, content, interviewerName, clientName, interviewerDisplayName, interviewerLabel, interviewerAvatarUrl, clientDisplayName, clientInitial, userAvatarUrl, themeColor, showIcon, showName, showClientIcon, showClientName, showIntro } = opts
  const questionBg = lighten(themeColor, 0.78)
  const answerBg   = lighten(themeColor, 0.88)
  const badgeBg    = themeColor

  const imgStyle = 'width:28px;height:28px;border-radius:50%;object-fit:cover;display:block;'
  const divStyle = 'width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;'
  const nameStyle = 'font-size:10px;color:#8f7d6d;margin-bottom:3px;white-space:nowrap;'

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

  const iconGapInterviewer = showIcon       ? 'gap:5px;' : ''
  const iconGapClient      = showClientIcon ? 'gap:5px;' : ''
  const iconMarginTopInterviewer = showIcon       ? 'margin-top:4px;' : ''
  const iconMarginTopClient      = showClientIcon ? 'margin-top:4px;' : ''

  const introHtml = showIntro ? buildIntroHtml({ interviewerDisplayName, interviewerLabel, interviewerAvatarUrl, themeColor }) : ''

  const contentLines = content.split('\n')
  const bubblesHtml: string[] = []

  for (const line of contentLines) {
    const match = line.match(/^\*\*(.+?)\*\*[:：]\s*(.+)$/)
    if (!match) continue
    // interviewerName・clientName 以外の行（メタデータ等）はスキップ
    if (match[1] !== interviewerName && match[1] !== clientName) continue
    const rawText = escapeHtml(match[2]).replace(/([。！？])/g, '$1<br>')
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

  // 全体エクスポート（title あり）: タイトル・前後セクションを含む完全な記事HTMLを生成
  if (title) {
    let firstQaIdx = -1
    let lastQaIdx = -1
    for (let i = 0; i < contentLines.length; i++) {
      const m = contentLines[i].match(/^\*\*(.+?)\*\*[:：]\s*(.+)$/)
      if (m && (m[1] === interviewerName || m[1] === clientName)) {
        if (firstQaIdx === -1) firstQaIdx = i
        lastQaIdx = i
      }
    }
    const beforeMd = contentLines
      .slice(0, firstQaIdx > 0 ? firstQaIdx : 0)
      .filter(l => {
        if (/^# /.test(l)) return false
        if (/^-{3,}$/.test(l.trim())) return false
        const m = l.match(/^\*\*(.+?)\*\*[:：]/)
        if (m && m[1] !== interviewerName && m[1] !== clientName) return false
        return true
      })
      .join('\n')
      .trim()
    const afterMd = lastQaIdx >= 0 && lastQaIdx < contentLines.length - 1
      ? contentLines.slice(lastQaIdx + 1).join('\n').trim()
      : ''

    const separatorColor = lighten(themeColor, 0.82)
    const styledSection = (md: string): string => {
      if (!md) return ''
      return String(marked.parse(md, { async: false }))
        .replace(/<h2>/g, '<h2 style="font-size:17px;font-weight:700;margin:24px 0 12px;color:#1c1410;border-left:3px solid #c2722a;padding-left:12px;">')
        .replace(/<h3>/g, '<h3 style="font-size:15px;font-weight:700;color:#1c1410;margin:18px 0 8px;">')
        .replace(/<p>/g, '<p style="font-size:15px;line-height:1.8;color:#3d2b1f;margin:0 0 14px;">')
        .replace(/<ul>/g, '<ul style="font-size:15px;line-height:1.8;color:#3d2b1f;margin:0 0 14px;padding-left:20px;">')
        .replace(/<ol>/g, '<ol style="font-size:15px;line-height:1.8;color:#3d2b1f;margin:0 0 14px;padding-left:20px;">')
        .replace(/<li>/g, '<li style="margin-bottom:6px;">')
        .replace(/<hr>/g, `<hr style="border:none;height:1px;background:${separatorColor};margin:24px 0;">`)
    }

    const beforeSection = beforeMd
      ? `\n<div style="padding:24px 32px 0;box-sizing:border-box;">${styledSection(beforeMd)}</div>`
      : ''
    const afterSection = afterMd
      ? `\n<div style="padding:0 32px;box-sizing:border-box;">${styledSection(afterMd)}</div>`
      : ''

    const convSeparator = `<div style="height:1px;background:${separatorColor};margin-bottom:28px;"></div>\n`
    return `<div style="box-sizing:border-box;max-width:800px;width:100%;margin:0 auto;font-family:system-ui,-apple-system,sans-serif;color:#1c1410;">
<div style="padding:40px 32px 0;box-sizing:border-box;">
  <div style="font-size:11px;font-weight:700;letter-spacing:0.1em;color:#c2722a;text-transform:uppercase;margin-bottom:14px;">取材インタビュー</div>
  <h1 style="font-size:24px;font-weight:700;color:#1c1410;line-height:1.4;margin:0 0 12px;">${escapeHtml(title)}</h1>
  <div style="font-size:12px;color:#8f7d6d;">${escapeHtml(date ?? '')}</div>
</div>${beforeSection}
<div style="padding:24px 4px 0;box-sizing:border-box;">
${introHtml}${convSeparator}${bubblesHtml.join('\n')}
</div>${afterSection}
<div style="padding:28px 4px 28px;box-sizing:border-box;">
<div style="height:1px;background:${separatorColor};margin-bottom:16px;"></div>
<div style="text-align:right;"><a href="https://insight-cast.jp" target="_blank" rel="noopener noreferrer" style="font-size:11px;color:#8f7d6d;text-decoration:none;letter-spacing:0.05em;">Powered by Insight Cast ↗</a></div>
</div>
</div>`
  }

  // ブロックコピー用（title なし）: 会話部分のみ
  const blockSepColor = lighten(themeColor, 0.82)
  return `<div style="box-sizing:border-box;max-width:800px;width:100%;margin:0 auto;padding:28px 4px;font-family:system-ui,-apple-system,sans-serif;color:#1c1410;">
<div style="height:1px;background:${blockSepColor};margin-bottom:28px;"></div>
${introHtml}${bubblesHtml.join('\n')}
<div style="text-align:right;margin-bottom:12px;"><a href="https://insight-cast.jp" target="_blank" rel="noopener noreferrer" style="font-size:11px;color:#8f7d6d;text-decoration:none;letter-spacing:0.05em;">Powered by Insight Cast ↗</a></div>
<div style="height:1px;background:${blockSepColor};"></div>
</div>`
}



export function ArticleExportPanel({
  content,
  title,
  articleType,
  interviewerId,
  interviewerName,
  interviewerLabel,
  clientName,
  userAvatarUrl,
  articleId,
  projectId,
  suggestions,
  canEdit,
}: {
  content: string
  title: string
  articleType: string
  interviewerId: string | null
  interviewerName: string | null
  interviewerLabel: string | null
  clientName: string | null
  userAvatarUrl: string | null
  articleId: string
  projectId: string
  suggestions?: ArticleSuggestions | null
  canEdit?: boolean
}) {
  const [copiedText, setCopiedText] = useState(false)
  const [copiedMd, setCopiedMd] = useState(false)
  const [copyError, setCopyError] = useState(false)
  const [themeColor, setThemeColor] = useState(DEFAULT_THEME_COLOR)
  const [editedContent, setEditedContent] = useState(content)
  const savedContentRef = useRef(content)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [isEditing, setIsEditing] = useState(false)
  const [, startTransition] = useTransition()
  const [globalMode, setGlobalMode] = useState<'text' | 'markdown'>('text')

  const [showSuggestions, setShowSuggestions] = useState(false)
  const hasSuggestions = (suggestions?.items.length ?? 0) > 0

  const char = getCharacter(interviewerId ?? 'mint')
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '')
  const defaultInterviewerAvatarUrl = char?.icon48?.src ? `${appUrl}${char.icon48.src}` : null

  // コンテンツ内の実際の respondent 名を検出。旧フォーマット（bizName）の記事にも対応。
  const detectedClientName = detectRespondentName(content, interviewerName)
  // マッチングには検出名を優先。表示名は profile.name を優先。
  const effectiveClientName = detectedClientName ?? clientName ?? '事業者'

  const [interviewerAvatarUrl, setInterviewerAvatarUrl] = useState<string>(defaultInterviewerAvatarUrl ?? '')
  const [interviewerDisplayName, setInterviewerDisplayName] = useState<string>(interviewerName ?? '')
  const [clientDisplayName, setClientDisplayName] = useState<string>(clientName ?? detectedClientName ?? '')
  const [clientAvatarUrl, setClientAvatarUrl] = useState<string>(userAvatarUrl ?? '')
  const [showInterviewerIcon, setShowInterviewerIcon] = useState(true)
  const [showInterviewerName, setShowInterviewerName] = useState(true)
  const [showClientIcon, setShowClientIcon] = useState(true)
  const [showClientName, setShowClientName] = useState(true)
  const [showIntro, setShowIntro] = useState(true)

  const makeConvOnlyHtml = useCallback((text: string) =>
    buildConversationHtml({
      content: text,
      interviewerName: interviewerName ?? 'インタビュアー',
      interviewerDisplayName: interviewerDisplayName || interviewerName || 'インタビュアー',
      interviewerLabel,
      interviewerAvatarUrl: interviewerAvatarUrl || null,
      clientName: effectiveClientName,
      clientDisplayName: clientDisplayName || clientName || effectiveClientName,
      clientInitial: initial(clientDisplayName || clientName || effectiveClientName),
      userAvatarUrl: clientAvatarUrl || userAvatarUrl || null,
      themeColor,
      showIcon: showInterviewerIcon,
      showName: showInterviewerName,
      showClientIcon,
      showClientName,
      showIntro: false,
    }),
    [themeColor, interviewerName, interviewerLabel, interviewerDisplayName, interviewerAvatarUrl, clientName, clientDisplayName, clientAvatarUrl, userAvatarUrl, showInterviewerIcon, showInterviewerName, showClientIcon, showClientName, effectiveClientName]
  )

  const makeIntroHtml = useCallback(() =>
    buildIntroHtml({
      interviewerDisplayName: interviewerDisplayName || interviewerName || 'インタビュアー',
      interviewerLabel,
      interviewerAvatarUrl: interviewerAvatarUrl || null,
      themeColor,
    }),
    [themeColor, interviewerName, interviewerLabel, interviewerDisplayName, interviewerAvatarUrl]
  )

  const handleCopyText = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(toPlainText(editedContent))
      setCopiedText(true)
      setCopyError(false)
      setTimeout(() => setCopiedText(false), 2000)
    } catch {
      setCopyError(true)
      setTimeout(() => setCopyError(false), 3000)
    }
  }, [editedContent])

  const handleCopyMd = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(editedContent)
      setCopiedMd(true)
      setCopyError(false)
      setTimeout(() => setCopiedMd(false), 2000)
    } catch {
      setCopyError(true)
      setTimeout(() => setCopyError(false), 3000)
    }
  }, [editedContent])

  const handleDownload = useCallback((fmt: 'text' | 'markdown') => {
    const blob = new Blob(
      [fmt === 'text' ? toPlainText(editedContent) : editedContent],
      { type: fmt === 'text' ? 'text/plain' : 'text/markdown' }
    )
    const ext = fmt === 'text' ? 'txt' : 'md'
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.slice(0, 40).replace(/[^\w぀-ゟ゠-ヿ一-鿿]/g, '_')}.${ext}`
    a.click()
    URL.revokeObjectURL(url)
  }, [editedContent, title])

  function handleStartEdit() {
    setIsEditing(true)
  }

  function handleSaveAndExit() {
    setSaveState('saving')
    startTransition(async () => {
      try {
        await saveArticleContent(articleId, projectId, content, editedContent)
        savedContentRef.current = editedContent
        setSaveState('saved')
        setTimeout(() => { setIsEditing(false); setSaveState('idle') }, 800)
      } catch {
        setSaveState('error')
        setTimeout(() => setSaveState('idle'), 3000)
      }
    })
  }

  function handleCancel() {
    setEditedContent(savedContentRef.current)
    setIsEditing(false)
  }

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
            <div aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-lg">
              {char?.emoji ?? '🐱'}
            </div>
          )}
        </div>
        <div className="relative rounded-2xl rounded-tl-sm border border-[var(--border)] bg-[var(--bg)] px-4 py-2 text-sm text-[var(--text2)]">
          記事をまとめました。好きな形式でお使いください。
        </div>
      </div>

      {/* アクションボタン行 */}
      <div className="border-b border-[var(--border)] px-4 pt-2 pb-2 flex flex-col gap-1.5">

        {/* コピー・書き出し行（非編集時） */}
        {!isEditing && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold tracking-[0.08em] uppercase text-[var(--text3)] whitespace-nowrap">全文コピー</span>
              <button type="button" onClick={handleCopyText}
                className="relative min-h-[36px] rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] transition-colors hover:bg-[var(--bg2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40">
                <span className={copiedText ? 'opacity-0' : ''}>テキスト</span>
                <span className={`absolute inset-0 flex items-center justify-center ${copiedText ? '' : 'opacity-0'}`}>✓ コピー</span>
              </button>
              <button type="button" onClick={handleCopyMd}
                className="relative min-h-[36px] rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] transition-colors hover:bg-[var(--bg2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40">
                <span className={copiedMd ? 'opacity-0' : ''}>Markdown</span>
                <span className={`absolute inset-0 flex items-center justify-center ${copiedMd ? '' : 'opacity-0'}`}>✓ コピー</span>
              </button>
            </div>
            <span aria-hidden="true" className="h-4 w-px bg-[var(--border)]" />
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold tracking-[0.08em] uppercase text-[var(--text3)] whitespace-nowrap">書き出し</span>
              <button type="button" onClick={() => handleDownload('text')}
                className="min-h-[36px] rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] transition-colors hover:bg-[var(--bg2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40">
                .txt
              </button>
              <button type="button" onClick={() => handleDownload('markdown')}
                className="min-h-[36px] rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] transition-colors hover:bg-[var(--bg2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40">
                .md
              </button>
            </div>
          </div>
        )}

        {/* 編集・提案・テーマカラー行 */}
        <div className="flex flex-wrap items-center gap-2">
          {canEdit !== false && (isEditing ? (
            <div className="flex gap-2">
              <button type="button" onClick={handleSaveAndExit} disabled={saveState === 'saving'}
                className="min-h-[44px] rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40">
                {saveState === 'saving' ? '保存中...' : saveState === 'saved' ? <><span aria-hidden="true">✓ </span>保存済み</> : saveState === 'error' ? '保存できませんでした' : '保存'}
              </button>
              <button type="button" onClick={handleCancel} disabled={saveState === 'saving'}
                className="min-h-[44px] rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs font-semibold text-[var(--text)] transition-colors hover:bg-[var(--bg2)] disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40">
                キャンセル
              </button>
            </div>
          ) : (
            <button type="button" onClick={handleStartEdit}
              className="min-h-[44px] rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--text)] transition-colors hover:bg-[var(--bg2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40">
              編集する
            </button>
          ))}
          {hasSuggestions && (
            <button type="button" role="switch" aria-label="クオリティアップ提案を表示" aria-checked={showSuggestions}
              onClick={() => setShowSuggestions((v) => !v)}
              className="flex items-center gap-1.5 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 rounded min-h-[44px] px-1">
              <div className={`relative h-5 w-9 rounded-full transition-colors pointer-events-none ${showSuggestions ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`}>
                <span className={`absolute left-0 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${showSuggestions ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-xs text-[var(--text3)] whitespace-nowrap">クオリティアップ提案</span>
            </button>
          )}
          {articleType === 'conversation' && (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-[var(--text3)] hidden sm:inline">テーマカラー</span>
              <input type="color" aria-label="テーマカラーを選択" value={themeColor} onChange={(e) => setThemeColor(e.target.value)}
                className="h-8 w-8 sm:h-7 sm:w-7 cursor-pointer rounded border border-[var(--border)] bg-transparent p-0.5" />
              <button type="button" onClick={() => setThemeColor(DEFAULT_THEME_COLOR)}
                className="min-h-[44px] px-2 text-xs text-[var(--text3)] hover:text-[var(--text2)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 rounded sm:min-h-0 sm:px-0">
                リセット
              </button>
            </div>
          )}
        </div>

      </div>

      {/* 設定パネル（会話形式のみ） */}
      {articleType === 'conversation' && (
        <div className="border-b border-[var(--border)] divide-y divide-[var(--border)] text-xs">
          {/* インタビュアー */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-0 px-5 py-3">
            <span className="sm:w-28 shrink-0 text-[var(--text3)] sm:pt-1">インタビュアー</span>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <div className="h-7 w-7 shrink-0 rounded-full border border-[var(--border)] overflow-hidden bg-[var(--bg2)]">
                  {interviewerAvatarUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={interviewerAvatarUrl} alt="インタビュアーのアイコンプレビュー" className="h-full w-full object-cover" />
                  )}
                </div>
                <label className="cursor-pointer rounded border border-[var(--border)] bg-transparent px-2 min-h-[44px] inline-flex items-center text-[var(--text2)] hover:bg-[var(--bg2)] transition-colors shrink-0 sm:min-h-0 sm:py-1">
                  画像を選ぶ
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0]; if (!file) return
                    const reader = new FileReader(); reader.onload = () => setInterviewerAvatarUrl(reader.result as string); reader.readAsDataURL(file)
                  }} />
                </label>
                {interviewerAvatarUrl && interviewerAvatarUrl !== (defaultInterviewerAvatarUrl ?? '') && (
                  <button type="button" onClick={() => setInterviewerAvatarUrl(defaultInterviewerAvatarUrl ?? '')} className="shrink-0 min-h-[44px] px-2 text-[var(--text3)] hover:text-[var(--text2)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 rounded sm:min-h-0 sm:px-0">削除</button>
                )}
                <input type="text" aria-label="インタビュアーの表示名" value={interviewerDisplayName} onChange={(e) => setInterviewerDisplayName(e.target.value)} placeholder="名前" className="min-w-0 w-24 rounded border border-[var(--border)] bg-transparent px-2 py-1 text-[var(--text2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40" />
                <button type="button" onClick={() => { setInterviewerAvatarUrl(defaultInterviewerAvatarUrl ?? ''); setInterviewerDisplayName(interviewerName ?? '') }} className="shrink-0 min-h-[44px] px-2 text-[var(--text3)] hover:text-[var(--text2)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 rounded sm:min-h-0 sm:px-0">リセット</button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" role="switch" aria-label="インタビュアーアイコンを表示" aria-checked={showInterviewerIcon} onClick={() => setShowInterviewerIcon(v => !v)} className="flex items-center gap-1.5 select-none min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 rounded sm:min-h-0">
                  <div className={`relative h-5 w-9 rounded-full transition-colors pointer-events-none ${showInterviewerIcon ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`}>
                    <span className={`absolute left-0 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${showInterviewerIcon ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </div>
                  <span className="text-[var(--text3)]">アイコン</span>
                </button>
                <button type="button" role="switch" aria-label="インタビュアー名を表示" aria-checked={showInterviewerName} onClick={() => setShowInterviewerName(v => !v)} className="flex items-center gap-1.5 select-none min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 rounded sm:min-h-0">
                  <div className={`relative h-5 w-9 rounded-full transition-colors pointer-events-none ${showInterviewerName ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`}>
                    <span className={`absolute left-0 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${showInterviewerName ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </div>
                  <span className="text-[var(--text3)]">名前</span>
                </button>
              </div>
            </div>
          </div>
          {/* 取材先 */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-0 px-5 py-3">
            <span className="sm:w-28 shrink-0 text-[var(--text3)] sm:pt-1">取材先</span>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <div className="h-7 w-7 shrink-0 rounded-full border border-[var(--border)] overflow-hidden" style={{ background: clientAvatarUrl ? undefined : themeColor }}>
                  {clientAvatarUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={clientAvatarUrl} alt="取材先のアイコンプレビュー" className="h-full w-full object-cover" />
                  )}
                </div>
                <label className="cursor-pointer rounded border border-[var(--border)] bg-transparent px-2 min-h-[44px] inline-flex items-center text-[var(--text2)] hover:bg-[var(--bg2)] transition-colors shrink-0 sm:min-h-0 sm:py-1">
                  画像を選ぶ
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0]; if (!file) return
                    const reader = new FileReader(); reader.onload = () => setClientAvatarUrl(reader.result as string); reader.readAsDataURL(file)
                  }} />
                </label>
                {clientAvatarUrl && (
                  <button type="button" onClick={() => setClientAvatarUrl('')} className="shrink-0 min-h-[44px] px-2 text-[var(--text3)] hover:text-[var(--text2)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 rounded sm:min-h-0 sm:px-0">削除</button>
                )}
                <input type="text" aria-label="取材先の表示名" value={clientDisplayName} onChange={(e) => setClientDisplayName(e.target.value)} placeholder="名前" className="min-w-0 w-24 rounded border border-[var(--border)] bg-transparent px-2 py-1 text-[var(--text2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40" />
                <button type="button" onClick={() => { setClientAvatarUrl(''); setClientDisplayName(clientName ?? '') }} className="shrink-0 min-h-[44px] px-2 text-[var(--text3)] hover:text-[var(--text2)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 rounded sm:min-h-0 sm:px-0">リセット</button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" role="switch" aria-label="取材先アイコンを表示" aria-checked={showClientIcon} onClick={() => setShowClientIcon(v => !v)} className="flex items-center gap-1.5 select-none min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 rounded sm:min-h-0">
                  <div className={`relative h-5 w-9 rounded-full transition-colors pointer-events-none ${showClientIcon ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`}>
                    <span className={`absolute left-0 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${showClientIcon ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </div>
                  <span className="text-[var(--text3)]">アイコン</span>
                </button>
                <button type="button" role="switch" aria-label="取材先の名前を表示" aria-checked={showClientName} onClick={() => setShowClientName(v => !v)} className="flex items-center gap-1.5 select-none min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 rounded sm:min-h-0">
                  <div className={`relative h-5 w-9 rounded-full transition-colors pointer-events-none ${showClientName ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`}>
                    <span className={`absolute left-0 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${showClientName ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </div>
                  <span className="text-[var(--text3)]">名前</span>
                </button>
              </div>
            </div>
          </div>
          {/* 紹介文 */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0 px-5 py-3">
            <span className="sm:w-28 shrink-0 text-[var(--text3)]">紹介文</span>
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" role="switch" aria-label="AIキャスト紹介文を表示" aria-checked={showIntro} onClick={() => setShowIntro(v => !v)} className="flex items-center gap-1.5 select-none min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 rounded sm:min-h-0">
                <div className={`relative h-5 w-9 rounded-full transition-colors pointer-events-none ${showIntro ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`}>
                  <span className={`absolute left-0 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${showIntro ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-[var(--text3)]">AIキャスト・Insight Cast を紹介する</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* グローバルコピー形式トグル */}
      {!isEditing && (
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2">
          <span className="text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--text3)]">コピー形式</span>
          <div className="flex overflow-hidden rounded-[var(--r-sm)] border border-[var(--border)] text-xs">
            <button type="button" onClick={() => setGlobalMode('text')} className={`px-3 py-1.5 transition-colors ${globalMode === 'text' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--surface)] text-[var(--text2)] hover:bg-[var(--bg2)]'}`}>テキスト</button>
            <button type="button" onClick={() => setGlobalMode('markdown')} className={`border-l border-[var(--border)] px-3 py-1.5 transition-colors ${globalMode === 'markdown' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--surface)] text-[var(--text2)] hover:bg-[var(--bg2)]'}`}>Markdown</button>
          </div>
        </div>
      )}

      {/* コンテンツ描画（blocks のみ） */}
      <div className="flex flex-col gap-3 p-4 sm:p-5">
        {articleType === 'conversation'
          ? (() => {
              const rawGroups = buildConversationRenderGroups(editedContent, interviewerName, effectiveClientName)
              // 概要ブロック（standalone/intro）が会話グループより後ろにある場合、前に移動する
              // 会話本文と小見出し+本文の上下関係は記事の内容に従う
              const allGroups = (() => {
                const convIdx = rawGroups.findIndex(g => g.type === 'conversation')
                if (convIdx < 0) return rawGroups
                const lateIntroIdxs = new Set<number>()
                const lateIntros: ConvRenderGroup[] = []
                for (let i = convIdx + 1; i < rawGroups.length; i++) {
                  const g = rawGroups[i]
                  if (g.type === 'standalone' && g.block.kind === 'intro') {
                    lateIntros.push(g)
                    lateIntroIdxs.add(i)
                  }
                }
                if (lateIntros.length === 0) return rawGroups
                const result: ConvRenderGroup[] = []
                for (let i = 0; i < rawGroups.length; i++) {
                  if (lateIntroIdxs.has(i)) continue
                  if (i === convIdx) result.push(...lateIntros)
                  result.push(rawGroups[i])
                }
                return result
              })()
              const firstConvIdx = allGroups.findIndex(g => g.type === 'conversation')
              return allGroups.map((group, idx) => {
                const anchor = group.type === 'section' ? group.heading.text
                  : group.type === 'standalone' && group.block.kind === 'intro' ? 'intro'
                  : null
                const groupSuggestions = anchor && showSuggestions
                  ? (suggestions?.items.filter((s) => s.anchor === anchor) ?? [])
                  : []
                return (
                  <Fragment key={idx}>
                    {group.type === 'conversation'
                      ? <InterviewerIntroPanelCard
                          interviewerDisplayName={interviewerDisplayName || interviewerName || 'インタビュアー'}
                          interviewerLabel={interviewerLabel}
                          text={group.text}
                          interviewerName={interviewerName ?? ''}
                          clientName={effectiveClientName}
                          getIntroHtml={makeIntroHtml}
                          getConvHtml={() => makeConvOnlyHtml(group.text)}
                          isEditing={isEditing}
                          onEditConv={newExchanges => setEditedContent(prev => applyConvEdit(prev, interviewerName ?? '', effectiveClientName, newExchanges))}
                          themeColor={themeColor}
                          showIntro={showIntro && idx === firstConvIdx}
                          mode={globalMode}
                        />
                      : group.type === 'meta'
                      ? null
                      : group.type === 'section'
                      ? <SectionGroupCard
                          heading={group.heading}
                          body={group.body}
                          isEditing={isEditing}
                          onEditHeading={(o, n) => setEditedContent(prev => applyBlockEdit(prev, 'heading', o, n))}
                          onEditBody={(o, n) => setEditedContent(prev => applyBlockEdit(prev, 'body', o, n))}
                          mode={globalMode}
                        />
                      : <BlockCopyCard
                          kind={group.block.kind}
                          text={group.block.text}
                          rawText={group.block.rawText}
                          isEditing={isEditing}
                          onEditDone={(o, n) => setEditedContent(prev => applyBlockEdit(prev, group.block.kind, o, n))}
                          mode={globalMode}
                        />
                    }
                    {groupSuggestions.map((item, sIdx) => (
                      <SuggestionCard key={sIdx} item={item} />
                    ))}
                  </Fragment>
                )
              })
            })()
          : groupArticleBlocks(splitIntoArticleBlocks(editedContent)).map((group, idx) => {
              const anchor = group.type === 'section' ? group.heading.text
                : group.type === 'standalone' && group.block.kind === 'intro' ? 'intro'
                : null
              const groupSuggestions = anchor && showSuggestions
                ? (suggestions?.items.filter((s) => s.anchor === anchor) ?? [])
                : []
              return (
                <Fragment key={idx}>
                  {group.type === 'section' ? (
                    <SectionGroupCard
                      heading={group.heading}
                      body={group.body}
                      isEditing={isEditing}
                      onEditHeading={(o, n) => setEditedContent(prev => applyBlockEdit(prev, 'heading', o, n))}
                      onEditBody={(o, n) => setEditedContent(prev => applyBlockEdit(prev, 'body', o, n))}
                      mode={globalMode}
                    />
                  ) : (
                    <BlockCopyCard
                      kind={group.block.kind}
                      text={group.block.text}
                      rawText={group.block.rawText}
                      isEditing={isEditing}
                      onEditDone={(o, n) => setEditedContent(prev => applyBlockEdit(prev, group.block.kind, o, n))}
                      mode={globalMode}
                    />
                  )}
                  {groupSuggestions.map((item, sIdx) => (
                    <SuggestionCard key={sIdx} item={item} />
                  ))}
                </Fragment>
              )
            })
        }
      </div>
      {copyError && (
        <p role="alert" className="px-5 pb-3 text-xs text-[var(--err)]">コピーできませんでした。手動でお試しください。</p>
      )}
    </section>
  )
}


type ArticleBlockKind = 'title' | 'intro' | 'heading' | 'body'
type ArticleBlock = { kind: ArticleBlockKind; text: string; rawText?: string }

const BLOCK_LABEL: Record<ArticleBlockKind, string> = {
  title:   'タイトル',
  intro:   '概要',
  heading: '小見出し',
  body:    '本文',
}


function ClipboardIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function ClipboardHint({ copied }: { copied: boolean }) {
  return (
    <span className="relative inline-flex items-center justify-center min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0">
      <ClipboardIcon />
      {copied && (
        <span className="pointer-events-none absolute z-20 top-1/2 -translate-y-1/2 right-full mr-2 rounded-full bg-[#1c1410] px-3 py-[3px] text-[10px] font-semibold tracking-wide text-white whitespace-nowrap shadow-lg ring-1 ring-white/10">
          ✓ コピーしました
        </span>
      )}
    </span>
  )
}

// 会話記事専用のレンダーグループ
type ConvRenderGroup =
  | { type: 'standalone'; block: ArticleBlock }
  | { type: 'section'; heading: ArticleBlock; body: ArticleBlock | null }
  | { type: 'conversation'; text: string }
  | { type: 'meta'; key: string; value: string }

function buildConversationRenderGroups(
  markdown: string,
  interviewerName?: string | null,
  clientName?: string | null,
): ConvRenderGroup[] {
  const lines = markdown.split('\n')
  const groups: ConvRenderGroup[] = []
  let phase: 'before' | 'conv' | 'after' = 'before'
  let hasH1 = false
  let pastFirstH2 = false
  let hasSeenQA = false
  let currentHeading: ArticleBlock | null = null
  let accLines: string[] = []
  let convLines: string[] = []

  const isConvLine = (l: string) => /^\*\*.+?\*\*[:：]/.test(l)

  function flushGroup() {
    const rawMd = accLines.join('\n').trim()
    const text = toPlainText(rawMd)
    if (currentHeading) {
      groups.push({ type: 'section', heading: currentHeading, body: text ? { kind: 'body', text, rawText: rawMd } : null })
      currentHeading = null
    } else if (text) {
      groups.push({ type: 'standalone', block: { kind: (hasH1 && pastFirstH2) ? 'body' : 'intro', text, rawText: rawMd } })
    }
    accLines = []
  }

  function flushConv() {
    const convText = convLines.join('\n').trim()
    if (convText) groups.push({ type: 'conversation', text: convText })
    convLines = []
  }

  for (const line of lines) {
    if (phase === 'before') {
      if (isConvLine(line)) {
        const bMatch = line.match(/^\*\*(.+?)\*\*[:：]\s*(.+)$/)
        const bKey = bMatch?.[1] ?? ''
        const bVal = bMatch?.[2] ?? ''
        const bIsQA = !interviewerName && !clientName || bKey === interviewerName || bKey === clientName
        if (bIsQA) {
          flushGroup()
          phase = 'conv'
          convLines.push(line)
          hasSeenQA = true
        } else {
          flushGroup()
          groups.push({ type: 'meta', key: bKey, value: bVal })
        }
        continue
      }
      const h1 = line.match(/^# (.+)$/)
      const h2 = line.match(/^## (.+)$/)
      if (h1 && !hasH1) {
        flushGroup(); hasH1 = true
        groups.push({ type: 'standalone', block: { kind: 'title', text: h1[1].trim(), rawText: `# ${h1[1].trim()}` } })
        continue
      }
      if (h2) { flushGroup(); pastFirstH2 = true; currentHeading = { kind: 'heading', text: h2[1].trim(), rawText: `## ${h2[1].trim()}` }; continue }
      accLines.push(line)
    } else if (phase === 'conv') {
      if (line.trim() === '' || /^-{3,}$/.test(line.trim()) || line.trimStart().startsWith('>')) { convLines.push(line); continue }
      if (isConvLine(line)) {
        const match = line.match(/^\*\*(.+?)\*\*[:：]\s*(.+)$/)
        const key = match?.[1] ?? ''
        const value = match?.[2] ?? ''
        const isQA = !interviewerName && !clientName
          || key === interviewerName
          || key === clientName
        if (isQA) {
          convLines.push(line)
          hasSeenQA = true
        } else if (!hasSeenQA) {
          // Q&A 前のメタデータ行（**インタビュアー**: xxx 等）
          flushConv()
          groups.push({ type: 'meta', key, value })
        } else {
          // Q&A 後の非会話行（**まとめ**: xxx 等）→ 別ブロックに分離
          flushConv()
          phase = 'after'
          accLines.push(value)
        }
        continue
      }
      // 非 conv, 非 blank 行 → 会話終了
      flushConv()
      phase = 'after'
      const h2 = line.match(/^## (.+)$/)
      if (h2) { pastFirstH2 = true; currentHeading = { kind: 'heading', text: h2[1].trim() } } else { accLines.push(line) }
    } else {
      if (isConvLine(line)) {
        const match = line.match(/^\*\*(.+?)\*\*[:：]\s*(.+)$/)
        const key = match?.[1] ?? ''
        const isQA = !interviewerName && !clientName || key === interviewerName || key === clientName
        if (isQA) {
          flushGroup()
          phase = 'conv'
          convLines.push(line)
          hasSeenQA = true
          continue
        }
      }
      const h2 = line.match(/^## (.+)$/)
      if (h2) { flushGroup(); pastFirstH2 = true; currentHeading = { kind: 'heading', text: h2[1].trim(), rawText: `## ${h2[1].trim()}` }; continue }
      accLines.push(line)
    }
  }
  if (phase === 'conv' && convLines.length > 0) {
    flushConv()
  }
  flushGroup()
  return groups
}

function splitIntoArticleBlocks(markdown: string): ArticleBlock[] {
  const lines = markdown.split('\n')
  const blocks: ArticleBlock[] = []
  let hasH1 = false
  let pastFirstHeading = false
  let accLines: string[] = []

  function flushAcc() {
    const rawMd = accLines.join('\n').trim()
    const text = toPlainText(rawMd)
    if (text) blocks.push({ kind: pastFirstHeading ? 'body' : 'intro', text, rawText: rawMd })
    accLines = []
  }

  for (const line of lines) {
    const h1 = line.match(/^# (.+)$/)
    const h2 = line.match(/^## (.+)$/)

    if (h1 && !hasH1) {
      flushAcc()
      hasH1 = true
      blocks.push({ kind: 'title', text: h1[1].trim(), rawText: `# ${h1[1].trim()}` })
      continue
    }

    if (h2) {
      flushAcc()
      pastFirstHeading = true
      blocks.push({ kind: 'heading', text: h2[1].trim(), rawText: `## ${h2[1].trim()}` })
      continue
    }

    accLines.push(line)
  }

  flushAcc()
  return blocks.filter((b) => b.text.length > 0)
}

type RenderGroup =
  | { type: 'standalone'; block: ArticleBlock }
  | { type: 'section'; heading: ArticleBlock; body: ArticleBlock | null }

function groupArticleBlocks(blocks: ArticleBlock[]): RenderGroup[] {
  const groups: RenderGroup[] = []
  let i = 0
  while (i < blocks.length) {
    const block = blocks[i]
    if (block.kind === 'heading') {
      const next = blocks[i + 1]
      if (next?.kind === 'body') {
        groups.push({ type: 'section', heading: block, body: next })
        i += 2
      } else {
        groups.push({ type: 'section', heading: block, body: null })
        i += 1
      }
    } else {
      groups.push({ type: 'standalone', block })
      i += 1
    }
  }
  return groups
}

function ConversationBubbleEditor({
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
                <button type="button" onClick={() => { if (i === 0) return; const n = [...exchanges]; [n[i-1], n[i]] = [n[i], n[i-1]]; handleChange(n) }} disabled={i === 0} aria-label="上に移動" className="px-1 py-0.5 text-[10px] text-[var(--text3)] hover:text-[var(--text)] disabled:opacity-20 transition-colors">▲</button>
                <span aria-label="ドラッグして並べ替え" className="cursor-grab active:cursor-grabbing px-1 py-1 text-[var(--text3)] hover:text-[var(--text2)] select-none" onMouseDown={() => { dragFromHandle.current = true }} onMouseUp={() => { dragFromHandle.current = false }}>
                  <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor"><circle cx="2" cy="2" r="1.3"/><circle cx="6" cy="2" r="1.3"/><circle cx="2" cy="6" r="1.3"/><circle cx="6" cy="6" r="1.3"/><circle cx="2" cy="10" r="1.3"/><circle cx="6" cy="10" r="1.3"/></svg>
                </span>
                <button type="button" onClick={() => { if (i === exchanges.length - 1) return; const n = [...exchanges]; [n[i], n[i+1]] = [n[i+1], n[i]]; handleChange(n) }} disabled={i === exchanges.length - 1} aria-label="下に移動" className="px-1 py-0.5 text-[10px] text-[var(--text3)] hover:text-[var(--text)] disabled:opacity-20 transition-colors">▼</button>
              </div>
              {/* バブル */}
              <div className={`flex flex-col flex-1 min-w-0 ${isInterviewer ? 'items-end' : 'items-start'}`}>
                <textarea
                  value={e.content}
                  onChange={ev => handleChange(exchanges.map((ex, j) => j === i ? { ...ex, content: ev.target.value } : ex))}
                  className="w-full max-w-[80%] resize-none px-3.5 py-2.5 text-sm leading-relaxed focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
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
              <button type="button" onClick={() => setPendingDeleteIdx(i)} aria-label="この発言を削除" className={`mt-2 shrink-0 px-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]/40 rounded ${pendingDeleteIdx === i ? 'text-[var(--err)]' : 'text-[var(--text3)] hover:text-[var(--err)]'}`}>×</button>
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

function InterviewerIntroPanelCard({
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
  const [introCopied, setIntroCopied] = useState(false)
  const [convCopied, setConvCopied] = useState(false)
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
    try { await navigator.clipboard.writeText(content); setIntroCopied(true); setTimeout(() => setIntroCopied(false), 1500) } catch { /* ignore */ }
  }
  async function doConvCopy() {
    const content = embedConv ? getConvHtml() : mode === 'markdown' ? convMarkdown : convPlainText
    try { await navigator.clipboard.writeText(content); setConvCopied(true); setTimeout(() => setConvCopied(false), 1500) } catch { /* ignore */ }
  }

  return (
    <>
      {/* インタビュアー紹介 */}
      {showIntro !== false && <div className={`rounded-[14px] border border-[var(--border)] bg-[var(--surface)] overflow-hidden ${isEditing ? 'ring-1 ring-[var(--accent)]/20' : ''}`}>
        <div
          role={isEditing ? undefined : 'button'}
          tabIndex={isEditing ? undefined : 0}
          onClick={isEditing ? undefined : () => doIntroCopy()}
          onKeyDown={isEditing ? undefined : e => e.key === 'Enter' && doIntroCopy()}
          className={`${isEditing ? '' : 'cursor-pointer transition-colors hover:bg-[var(--bg2)] select-none'}`}
        >
          <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--text3)]">インタビュアー紹介</div>
              {!isEditing && (
                <button type="button" onClick={e => { e.stopPropagation(); setEmbedIntro(v => !v) }}
                  className={`text-[10px] px-2 py-1 rounded border transition-colors ${embedIntro ? 'border-[var(--accent)] bg-[var(--accent)] text-white' : 'border-[var(--border)] text-[var(--text3)] hover:text-[var(--text2)]'}`}>
                  埋め込みHTML
                </button>
              )}
            </div>
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
          {!isEditing && (
            <div className="flex justify-end px-4 sm:px-5 pb-3 pt-1" onClick={e => e.stopPropagation()}>
              <button type="button" onClick={e => { e.stopPropagation(); doIntroCopy() }} className="text-[var(--text3)] hover:text-[var(--text2)] transition-colors focus-visible:outline-none">
                <ClipboardHint copied={introCopied} />
              </button>
            </div>
          )}
        </div>
      </div>}
      {/* 会話本文 */}
      <div className={`rounded-[14px] border border-[var(--border)] bg-[var(--surface)] overflow-hidden ${isEditing ? 'ring-1 ring-[var(--accent)]/20' : ''}`}>
        <div
          role={isEditing ? undefined : 'button'}
          tabIndex={isEditing ? undefined : 0}
          onClick={isEditing ? undefined : () => doConvCopy()}
          onKeyDown={isEditing ? undefined : e => e.key === 'Enter' && doConvCopy()}
          className={`${isEditing ? '' : 'cursor-pointer transition-colors hover:bg-[var(--bg2)] select-none'}`}
        >
          <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--text3)]">会話本文</div>
              {!isEditing && (
                <button type="button" onClick={e => { e.stopPropagation(); setEmbedConv(v => !v) }}
                  className={`text-[10px] px-2 py-1 rounded border transition-colors ${embedConv ? 'border-[var(--accent)] bg-[var(--accent)] text-white' : 'border-[var(--border)] text-[var(--text3)] hover:text-[var(--text2)]'}`}>
                  埋め込みHTML
                </button>
              )}
            </div>
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
          {!isEditing && (
            <div className="flex justify-end px-4 sm:px-5 pb-3 pt-1" onClick={e => e.stopPropagation()}>
              <button type="button" onClick={e => { e.stopPropagation(); doConvCopy() }} className="text-[var(--text3)] hover:text-[var(--text2)] transition-colors focus-visible:outline-none">
                <ClipboardHint copied={convCopied} />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}


function SectionGroupCard({
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
    <div className={`rounded-[14px] border border-[var(--border)] bg-[var(--surface)] overflow-hidden ${isEditing ? 'ring-1 ring-[var(--accent)]/20' : ''}`}>
      <BlockCopyCardInner kind="heading" text={heading.text} markdownCopyText={heading.rawText} isEditing={isEditing} onEditDone={onEditHeading} mode={mode} />
      {body && (
        <>
          <div className="border-t border-[var(--border)]" />
          <BlockCopyCardInner kind="body" text={body.text} markdownCopyText={body.rawText} isEditing={isEditing} onEditDone={onEditBody} mode={mode} />
        </>
      )}
    </div>
  )
}

function BlockCopyCardInner({ kind, text, markdownCopyText, label, isEditing, onEditDone, mode }: {
  kind: ArticleBlockKind
  text: string
  markdownCopyText?: string
  label?: string
  isEditing?: boolean
  onEditDone?: (oldText: string, newText: string) => void
  mode?: 'text' | 'markdown'
}) {
  const [copied, setCopied] = useState(false)
  const [localText, setLocalText] = useState(text)
  const origRef = useRef(text)

  useEffect(() => {
    setLocalText(text)
    origRef.current = text
  }, [text])

  async function handleCopy() {
    if (isEditing) return
    const copyContent = mode === 'markdown' && markdownCopyText ? markdownCopyText : text
    try { await navigator.clipboard.writeText(copyContent); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch { /* ignore */ }
  }

  return (
    <div
      role={isEditing ? undefined : 'button'}
      tabIndex={isEditing ? undefined : 0}
      onClick={isEditing ? undefined : handleCopy}
      onKeyDown={isEditing ? undefined : e => e.key === 'Enter' && handleCopy()}
      className={`${isEditing ? '' : 'cursor-pointer transition-colors hover:bg-[var(--bg2)] select-none'}`}
    >
      <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--text3)]">
            {label ?? BLOCK_LABEL[kind]}
          </div>
        </div>
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
      {!isEditing && (
        <div className="flex justify-end px-4 sm:px-5 pb-3 pt-1" onClick={e => e.stopPropagation()}>
          <button type="button" onClick={e => { e.stopPropagation(); handleCopy() }} className="text-[var(--text3)] hover:text-[var(--text2)] transition-colors focus-visible:outline-none">
            <ClipboardHint copied={copied} />
          </button>
        </div>
      )}
    </div>
  )
}


function SuggestionCard({ item }: { item: ArticleSuggestion }) {
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

function BlockCopyCard({ kind, text, rawText, isEditing, onEditDone, mode }: {
  kind: ArticleBlockKind
  text: string
  rawText?: string
  isEditing?: boolean
  onEditDone?: (oldText: string, newText: string) => void
  mode?: 'text' | 'markdown'
}) {
  const [copied, setCopied] = useState(false)
  const [localText, setLocalText] = useState(text)
  const origRef = useRef(text)

  useEffect(() => {
    setLocalText(text)
    origRef.current = text
  }, [text])

  async function handleClick() {
    if (isEditing) return
    const copyContent = mode === 'markdown' && rawText ? rawText : text
    try { await navigator.clipboard.writeText(copyContent); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch { /* ignore */ }
  }

  return (
    <div
      role={isEditing ? undefined : 'button'}
      tabIndex={isEditing ? undefined : 0}
      onClick={isEditing ? undefined : handleClick}
      onKeyDown={isEditing ? undefined : e => e.key === 'Enter' && handleClick()}
      className={`rounded-[14px] border border-[var(--border)] bg-[var(--surface)] ${isEditing ? 'ring-1 ring-[var(--accent)]/30' : 'cursor-pointer transition-colors hover:bg-[var(--bg2)] select-none'}`}
    >
      <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--text3)]">
            {BLOCK_LABEL[kind]}
          </div>
        </div>
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
      {!isEditing && (
        <div className="flex justify-end px-4 sm:px-5 pb-3 pt-1" onClick={e => e.stopPropagation()}>
          <button type="button" onClick={e => { e.stopPropagation(); handleClick() }} className="text-[var(--text3)] hover:text-[var(--text2)] transition-colors focus-visible:outline-none">
            <ClipboardHint copied={copied} />
          </button>
        </div>
      )}
    </div>
  )
}
