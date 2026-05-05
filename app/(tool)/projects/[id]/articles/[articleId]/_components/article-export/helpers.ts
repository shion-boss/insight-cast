// ConversationBubbleEditor 内のバブル背景色生成に使用
export function lighten(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const mix = (c: number) => Math.round(c + (255 - c) * amount).toString(16).padStart(2, '0')
  return `#${mix(r)}${mix(g)}${mix(b)}`
}

export function toPlainText(md: string): string {
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

export function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function applyBlockEdit(md: string, kind: string, oldText: string, newText: string): string {
  if (!oldText || oldText === newText) return md
  if (kind === 'title') return md.replace(new RegExp(`^(# )${escapeRegex(oldText)}`, 'm'), `$1${newText}`)
  if (kind === 'heading') return md.replace(new RegExp(`^(## )${escapeRegex(oldText)}`, 'm'), `$1${newText}`)
  return md.replace(oldText, newText)
}

// コンテンツ内の **Name**: 行を走査してインタビュアー以外の最初の話者名を返す。
// 旧フォーマット（bizName）で生成された記事にも対応するため使用する。
export function detectRespondentName(content: string, interviewerName: string | null): string | null {
  for (const line of content.split('\n')) {
    const m = line.match(/^\*\*(.+?)\*\*[:：]\s*(.+)$/)
    if (!m) continue
    if (m[1] !== interviewerName) return m[1]
  }
  return null
}

export function applyConvEdit(md: string, interviewerName: string, clientName: string, exchanges: { speaker: string; content: string }[]): string {
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

export function initial(name: string | null): string {
  return name ? name.slice(0, 1) : '?'
}
