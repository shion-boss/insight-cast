import type { ReactNode } from 'react'

const EMBED_START = '<!-- EMBED_HTML_START -->'
const EMBED_END = '<!-- EMBED_HTML_END -->'

type MarkdownBlock =
  | { type: 'h1' | 'h2' | 'h3'; text: string }
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'blockquote'; lines: string[] }
  | { type: 'embed'; html: string }

function renderInlineMarkdown(text: string, keyPrefix: string): ReactNode[] {
  const pattern = /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|`[^`]+`)/
  const match = text.match(pattern)

  if (!match || match.index === undefined) {
    return [text]
  }

  const token = match[0]
  const before = text.slice(0, match.index)
  const after = text.slice(match.index + token.length)
  const parts: ReactNode[] = []

  if (before) {
    parts.push(...renderInlineMarkdown(before, `${keyPrefix}-before`))
  }

  if (token.startsWith('[')) {
    const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (linkMatch) {
      parts.push(
        <a
          key={`${keyPrefix}-link-${match.index}`}
          href={linkMatch[2]}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-[var(--accent)] underline underline-offset-2"
        >
          {linkMatch[1]}
        </a>,
      )
    }
  } else if (token.startsWith('**')) {
    parts.push(
      <strong key={`${keyPrefix}-strong-${match.index}`} className="font-semibold text-[var(--text)]">
        {token.slice(2, -2)}
      </strong>,
    )
  } else if (token.startsWith('`')) {
    parts.push(
      <code
        key={`${keyPrefix}-code-${match.index}`}
        className="rounded bg-[var(--bg2)] px-1.5 py-0.5 font-mono text-[0.95em] text-[var(--text)]"
      >
        {token.slice(1, -1)}
      </code>,
    )
  }

  if (after) {
    parts.push(...renderInlineMarkdown(after, `${keyPrefix}-after`))
  }

  return parts
}

function parseMarkdown(markdown: string): MarkdownBlock[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const blocks: MarkdownBlock[] = []
  let index = 0

  while (index < lines.length) {
    const rawLine = lines[index]
    const line = rawLine.trim()

    if (line === EMBED_START) {
      const htmlLines: string[] = []
      index += 1
      while (index < lines.length && lines[index].trim() !== EMBED_END) {
        htmlLines.push(lines[index])
        index += 1
      }
      blocks.push({ type: 'embed', html: htmlLines.join('\n') })
      index += 1
      continue
    }

    if (!line) {
      index += 1
      continue
    }

    if (line.startsWith('### ')) {
      blocks.push({ type: 'h3', text: line.slice(4).trim() })
      index += 1
      continue
    }

    if (line.startsWith('## ')) {
      blocks.push({ type: 'h2', text: line.slice(3).trim() })
      index += 1
      continue
    }

    if (line.startsWith('# ')) {
      blocks.push({ type: 'h1', text: line.slice(2).trim() })
      index += 1
      continue
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = []
      while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^[-*]\s+/, ''))
        index += 1
      }
      blocks.push({ type: 'ul', items })
      continue
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = []
      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+\.\s+/, ''))
        index += 1
      }
      blocks.push({ type: 'ol', items })
      continue
    }

    if (line.startsWith('> ')) {
      const quoteLines: string[] = []
      while (index < lines.length && lines[index].trim().startsWith('> ')) {
        quoteLines.push(lines[index].trim().slice(2).trim())
        index += 1
      }
      blocks.push({ type: 'blockquote', lines: quoteLines })
      continue
    }

    const paragraphLines = [line]
    index += 1
    while (index < lines.length) {
      const nextLine = lines[index].trim()
      if (
        !nextLine
        || nextLine.startsWith('#')
        || /^[-*]\s+/.test(nextLine)
        || /^\d+\.\s+/.test(nextLine)
        || nextLine.startsWith('> ')
      ) {
        break
      }
      paragraphLines.push(nextLine)
      index += 1
    }
    blocks.push({ type: 'p', text: paragraphLines.join(' ') })
  }

  return blocks
}

export function MarkdownArticleBody({ markdown }: { markdown: string }) {
  const blocks = parseMarkdown(markdown)

  return (
    <div>
      {blocks.map((block, index) => {
        if (block.type === 'embed') {
          return (
            <div
              key={`embed-${index}`}
              className="my-8"
              dangerouslySetInnerHTML={{ __html: block.html }}
            />
          )
        }

        if (block.type === 'h1') {
          return (
            <h2 key={`h1-${index}`} className="mb-4 mt-10 text-2xl font-bold text-[var(--text)] first:mt-0">
              {renderInlineMarkdown(block.text, `h1-${index}`)}
            </h2>
          )
        }

        if (block.type === 'h2') {
          return (
            <h2 key={`h2-${index}`} className="mb-4 mt-10 text-xl font-bold text-[var(--text)] first:mt-0">
              {renderInlineMarkdown(block.text, `h2-${index}`)}
            </h2>
          )
        }

        if (block.type === 'h3') {
          return (
            <h3 key={`h3-${index}`} className="mb-3 mt-8 text-lg font-semibold text-[var(--text)]">
              {renderInlineMarkdown(block.text, `h3-${index}`)}
            </h3>
          )
        }

        if (block.type === 'ul') {
          return (
            <ul key={`ul-${index}`} className="mb-5 space-y-2 pl-4">
              {block.items.map((item, itemIndex) => (
                <li
                  key={`ul-${index}-${itemIndex}`}
                  className="relative pl-4 leading-7 text-[var(--text2)] before:absolute before:left-0 before:top-3 before:h-1.5 before:w-1.5 before:rounded-full before:bg-[var(--text3)]"
                >
                  {renderInlineMarkdown(item, `ul-${index}-${itemIndex}`)}
                </li>
              ))}
            </ul>
          )
        }

        if (block.type === 'ol') {
          return (
            <ol key={`ol-${index}`} className="mb-5 space-y-2 pl-6">
              {block.items.map((item, itemIndex) => (
                <li key={`ol-${index}-${itemIndex}`} className="list-decimal leading-7 text-[var(--text2)]">
                  {renderInlineMarkdown(item, `ol-${index}-${itemIndex}`)}
                </li>
              ))}
            </ol>
          )
        }

        if (block.type === 'blockquote') {
          return (
            <blockquote
              key={`quote-${index}`}
              className="mb-6 rounded-r-[var(--r-md)] border-l-4 border-[var(--accent)]/60 bg-[var(--bg2)] px-5 py-4 text-sm leading-7 text-[var(--text2)]"
            >
              {block.lines.map((line, lineIndex) => (
                <p key={`quote-${index}-${lineIndex}`}>
                  {renderInlineMarkdown(line, `quote-${index}-${lineIndex}`)}
                </p>
              ))}
            </blockquote>
          )
        }

        return (
          <p key={`p-${index}`} className="mb-5 leading-8 text-[var(--text2)]">
            {renderInlineMarkdown(block.text, `p-${index}`)}
          </p>
        )
      })}
    </div>
  )
}
