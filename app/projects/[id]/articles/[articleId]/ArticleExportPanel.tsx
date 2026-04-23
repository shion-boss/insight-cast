'use client'

import { useState, useCallback } from 'react'
import { marked } from 'marked'

type Format = 'text' | 'markdown' | 'html'

const FORMAT_LABELS: Record<Format, string> = {
  text:     'テキスト',
  markdown: 'Markdown',
  html:     '埋め込みHTML',
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

function toHtml(md: string): string {
  const raw = marked.parse(md, { async: false }) as string
  return raw.trim()
}

function getContent(markdown: string, format: Format): string {
  if (format === 'text') return toPlainText(markdown)
  if (format === 'html') return toHtml(markdown)
  return markdown
}

function getExtension(format: Format): string {
  if (format === 'text') return 'txt'
  if (format === 'html') return 'html'
  return 'md'
}

function getMimeType(format: Format): string {
  if (format === 'text') return 'text/plain'
  if (format === 'html') return 'text/html'
  return 'text/markdown'
}

export function ArticleExportPanel({ content, title }: { content: string; title: string }) {
  const [format, setFormat] = useState<Format>('markdown')
  const [copied, setCopied] = useState(false)

  const output = getContent(content, format)

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [output])

  const handleDownload = useCallback(() => {
    const blob = new Blob([output], { type: getMimeType(format) })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.slice(0, 40).replace(/[^\w぀-鿿]/g, '_')}.${getExtension(format)}`
    a.click()
    URL.revokeObjectURL(url)
  }, [output, format, title])

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      {/* フォーマット切り替え */}
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

      {/* プレビュー */}
      <div className="max-h-[320px] overflow-y-auto p-5">
        <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-[var(--text2)]">
          {output}
        </pre>
      </div>

      {/* アクション */}
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
