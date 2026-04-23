'use client'

import { useState, useCallback } from 'react'
import { marked } from 'marked'

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

const FOOTER_HTML = `<div style="margin-top:40px;padding-top:16px;border-top:1px solid #e2d5c3;text-align:right;"><a href="https://insight-cast.jp" target="_blank" style="font-size:11px;color:#b8a898;text-decoration:none;letter-spacing:0.05em;">Powered by Insight Cast ↗</a></div>`

function buildClientHtml(opts: { title: string; date: string; content: string }): string {
  const { title, date, content } = opts
  const bodyHtml = marked.parse(content, { async: false }) as string
  // h2 にインラインスタイルを付与
  const styledBody = bodyHtml
    .replace(/<h2>/g, '<h2 style="font-size:18px;font-weight:700;border-left:3px solid #c2722a;padding-left:12px;color:#1c1410;margin:32px 0 16px;">')
    .replace(/<h3>/g, '<h3 style="font-size:16px;font-weight:700;color:#1c1410;margin:24px 0 12px;">')
    .replace(/<p>/g, '<p style="font-size:15px;line-height:1.8;color:#7a6555;margin:0 0 16px;">')
    .replace(/<ul>/g, '<ul style="font-size:15px;line-height:1.8;color:#7a6555;margin:0 0 16px;padding-left:20px;">')
    .replace(/<ol>/g, '<ol style="font-size:15px;line-height:1.8;color:#7a6555;margin:0 0 16px;padding-left:20px;">')

  return `<div style="box-sizing:border-box;max-width:800px;width:100%;margin:0 auto;background:#fdf7f0;padding:40px 32px;font-family:system-ui,-apple-system,sans-serif;color:#1c1410;border-radius:4px;">
<div style="font-size:11px;font-weight:700;letter-spacing:0.1em;color:#c2722a;text-transform:uppercase;margin-bottom:14px;">取材記事</div>
<h1 style="font-size:24px;font-weight:700;color:#1c1410;line-height:1.4;margin:0 0 12px;">${title}</h1>
<div style="font-size:12px;color:#b8a898;margin-bottom:24px;">${date}</div>
<div style="height:2px;background:#c2722a;opacity:0.3;margin-bottom:32px;border-radius:1px;"></div>
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
  const bodyHtml = marked.parse(content, { async: false }) as string
  const styledBody = bodyHtml
    .replace(/<h2>/g, '<h2 style="font-size:17px;font-weight:700;border-top:1px solid #e2d5c3;padding-top:20px;margin-top:28px;margin-bottom:14px;color:#1c1410;">')
    .replace(/<h3>/g, '<h3 style="font-size:15px;font-weight:700;color:#1c1410;margin:20px 0 10px;">')
    .replace(/<p>/g, '<p style="font-size:15px;line-height:1.8;color:#3d2b1f;margin:0 0 16px;">')
    .replace(/<ul>/g, '<ul style="font-size:15px;line-height:1.8;color:#3d2b1f;margin:0 0 16px;padding-left:20px;">')
    .replace(/<ol>/g, '<ol style="font-size:15px;line-height:1.8;color:#3d2b1f;margin:0 0 16px;padding-left:20px;">')

  return `<div style="box-sizing:border-box;max-width:800px;width:100%;margin:0 auto;background:#fdf7f0;padding:40px 32px;font-family:system-ui,-apple-system,sans-serif;color:#1c1410;border-radius:4px;">
<div style="font-size:11px;font-weight:700;letter-spacing:0.1em;color:#c2722a;text-transform:uppercase;margin-bottom:14px;">取材レポート</div>
<h1 style="font-size:24px;font-weight:700;color:#1c1410;line-height:1.4;margin:0 0 20px;">${title}</h1>
<div style="background:#f5e8d8;border-radius:12px;padding:12px 16px;display:flex;align-items:center;gap:10px;margin-bottom:32px;box-sizing:border-box;">
  <div style="width:10px;height:10px;border-radius:50%;background:${interviewerColor};flex-shrink:0;"></div>
  <div style="flex:1;min-width:0;">
    <div style="font-size:13px;font-weight:700;color:#1c1410;">${interviewerName}<span style="font-size:11px;font-weight:400;color:#7a6555;margin-left:8px;">${interviewerLabel}</span></div>
    <div style="font-size:11px;color:#b8a898;margin-top:2px;">${date} 取材</div>
  </div>
</div>
<div>${styledBody}</div>
${FOOTER_HTML}
</div>`
}

function buildConversationHtml(opts: {
  title: string
  date: string
  content: string
  interviewerName: string
  interviewerColor: string
  interviewerInitial: string
  clientName: string
  clientInitial: string
}): string {
  const { title, date, content, interviewerName, interviewerColor, interviewerInitial, clientName, clientInitial } = opts

  const lines = content.split('\n')
  const bubblesHtml: string[] = []
  const proseParts: string[] = []

  for (const line of lines) {
    const match = line.match(/^\*\*(.+?)\*\*[:：]\s*(.+)$/)
    if (match) {
      // 直前の非会話テキストをまとめて出力
      if (proseParts.length > 0) {
        const proseText = proseParts.join(' ').trim()
        if (proseText) {
          bubblesHtml.push(`<p style="font-size:14px;line-height:1.8;color:#7a6555;margin:0 0 24px;">${proseText}</p>`)
        }
        proseParts.length = 0
      }
      const speaker = match[1]
      const text = match[2]
      const isCast = speaker === interviewerName
      if (isCast) {
        bubblesHtml.push(`<div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:16px;">
  <div style="width:32px;height:32px;border-radius:50%;background:${interviewerColor};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;flex-shrink:0;margin-top:2px;">${interviewerInitial}</div>
  <div style="background:#fff8f0;border:1px solid #e2d5c3;border-radius:4px 16px 16px 16px;padding:12px 16px;max-width:75%;font-size:14px;line-height:1.7;color:#3d2b1f;box-sizing:border-box;">${text}</div>
</div>`)
      } else {
        bubblesHtml.push(`<div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:28px;flex-direction:row-reverse;">
  <div style="width:32px;height:32px;border-radius:50%;background:#d4a26a;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;flex-shrink:0;margin-top:2px;">${clientInitial}</div>
  <div style="background:#f0f4ff;border:1px solid #d4d9f0;border-radius:16px 4px 16px 16px;padding:12px 16px;max-width:75%;font-size:14px;line-height:1.7;color:#3d2b1f;box-sizing:border-box;">${text}</div>
</div>`)
      }
    } else if (line.trim()) {
      proseParts.push(line.replace(/^#{1,6}\s+/, '').replace(/\*\*(.+?)\*\*/g, '$1'))
    }
  }
  if (proseParts.length > 0) {
    const proseText = proseParts.join(' ').trim()
    if (proseText) bubblesHtml.push(`<p style="font-size:14px;line-height:1.8;color:#7a6555;margin:0 0 24px;">${proseText}</p>`)
  }

  return `<div style="box-sizing:border-box;max-width:800px;width:100%;margin:0 auto;background:#fdf7f0;padding:40px 32px;font-family:system-ui,-apple-system,sans-serif;color:#1c1410;border-radius:4px;">
<div style="font-size:11px;font-weight:700;letter-spacing:0.1em;color:#c2722a;text-transform:uppercase;margin-bottom:14px;">インタビュー</div>
<h1 style="font-size:24px;font-weight:700;color:#1c1410;line-height:1.4;margin:0 0 16px;">${title}</h1>
<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap;">
  <div style="width:24px;height:24px;border-radius:50%;background:${interviewerColor};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;flex-shrink:0;">${interviewerInitial}</div>
  <span style="font-size:13px;font-weight:600;color:#1c1410;">${interviewerName}</span>
  <span style="font-size:12px;color:#b8a898;">×</span>
  <span style="font-size:13px;font-weight:600;color:#1c1410;">${clientName}</span>
</div>
<div style="font-size:12px;color:#b8a898;margin-bottom:28px;">${date}</div>
<div style="height:1px;background:#e2d5c3;margin-bottom:28px;"></div>
${bubblesHtml.join('\n')}
${FOOTER_HTML}
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
  clientName: string | null
}): string {
  const { articleType, title, date, content, interviewerName, interviewerLabel, interviewerId, clientName } = opts
  const interviewerColor = CAST_COLORS[interviewerId ?? ''] ?? '#c2722a'
  const dateStr = formatDateShort(date)

  if (articleType === 'conversation') {
    return buildConversationHtml({
      title, date: dateStr, content,
      interviewerName: interviewerName ?? 'インタビュアー',
      interviewerColor,
      interviewerInitial: initial(interviewerName),
      clientName: clientName ?? '事業者',
      clientInitial: initial(clientName),
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
  clientName: string | null
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
}: {
  content: string
  title: string
  articleType: string
  date: string
  interviewerId: string | null
  interviewerName: string | null
  interviewerLabel: string | null
  clientName: string | null
}) {
  const [format, setFormat] = useState<Format>('markdown')
  const [copied, setCopied] = useState(false)

  const output = getContent({ format, articleType, title, date, content, interviewerName, interviewerLabel, interviewerId, clientName })

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [output])

  const handleDownload = useCallback(() => {
    const mimeMap: Record<Format, string> = { text: 'text/plain', markdown: 'text/markdown', html: 'text/html' }
    const extMap: Record<Format, string> = { text: 'txt', markdown: 'md', html: 'html' }
    const blob = new Blob([output], { type: mimeMap[format] })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.slice(0, 40).replace(/[^\w぀-鿿]/g, '_')}.${extMap[format]}`
    a.click()
    URL.revokeObjectURL(url)
  }, [output, format, title])

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      <div className="flex border-b border-[var(--border)]">
        {(Object.keys(FORMAT_LABELS) as Format[]).map((f) => (
          <button
            key={f}
            onClick={() => setFormat(f)}
            className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline-none ${
              format === f
                ? 'bg-[var(--surface)] text-[var(--text)] border-b-2 border-[var(--accent)]'
                : 'text-[var(--text3)] hover:text-[var(--text2)]'
            }`}
          >
            {FORMAT_LABELS[f]}
          </button>
        ))}
      </div>

      <div className="max-h-[320px] overflow-y-auto p-5">
        <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-[var(--text2)]">
          {output}
        </pre>
      </div>

      <div className="flex gap-2 border-t border-[var(--border)] px-5 py-3">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--text)] transition-colors hover:bg-[var(--bg2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
        >
          {copied ? '✓ コピーしました' : 'コピー'}
        </button>
        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--text)] transition-colors hover:bg-[var(--bg2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
        >
          ダウンロード
        </button>
      </div>
    </section>
  )
}
