import { toPlainText } from './helpers'
import type { ArticleBlock, ConvRenderGroup, RenderGroup } from './types'

export function buildConversationRenderGroups(
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
      if (isConvLine(line)) {
        convLines.push(line)
      } else if (line.trim() === '') {
        // 空行は会話継続として許容
        convLines.push(line)
      } else {
        flushConv()
        phase = 'after'
        const h1 = line.match(/^# (.+)$/)
        const h2 = line.match(/^## (.+)$/)
        if (h1 && !hasH1) {
          hasH1 = true
          groups.push({ type: 'standalone', block: { kind: 'title', text: h1[1].trim(), rawText: `# ${h1[1].trim()}` } })
          continue
        }
        if (h2) {
          pastFirstH2 = true
          currentHeading = { kind: 'heading', text: h2[1].trim(), rawText: `## ${h2[1].trim()}` }
          continue
        }
        accLines.push(line)
      }
    } else {
      // phase === 'after'
      if (isConvLine(line) && hasSeenQA) {
        flushGroup()
        phase = 'conv'
        convLines.push(line)
        continue
      }
      const h1 = line.match(/^# (.+)$/)
      if (h1 && !hasH1) {
        flushGroup(); hasH1 = true
        groups.push({ type: 'standalone', block: { kind: 'title', text: h1[1].trim(), rawText: `# ${h1[1].trim()}` } })
        continue
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

export function splitIntoArticleBlocks(markdown: string): ArticleBlock[] {
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

export function groupArticleBlocks(blocks: ArticleBlock[]): RenderGroup[] {
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
