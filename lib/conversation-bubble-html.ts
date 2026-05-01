// サーバーサイド専用。ブラウザAPI（document, window, DOMPurify等）は使わない。

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function lighten(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const mix = (c: number) => Math.round(c + (255 - c) * amount).toString(16).padStart(2, '0')
  return `#${mix(r)}${mix(g)}${mix(b)}`
}

/**
 * Markdown の会話行（**名前**: テキスト）を HTML バブルブロックに変換する。
 * 会話行が連続している区間を検出し、その区間全体を <!-- EMBED_HTML_START --> で囲む。
 * 会話行以外の行はそのまま残す。
 */
export function embedConversationBubblesAsHtml(opts: {
  content: string
  interviewerName: string
  clientName: string
  interviewerDisplayName: string
  clientDisplayName: string
  themeColor?: string
}): string {
  const {
    content,
    interviewerName,
    clientName,
    interviewerDisplayName,
    clientDisplayName,
    themeColor = '#c2722a',
  } = opts

  const questionBg = lighten(themeColor, 0.78)
  const answerBg = lighten(themeColor, 0.88)
  const sepColor = lighten(themeColor, 0.82)

  const lines = content.split('\n')
  const result: string[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const match = line.match(/^\*\*(.+?)\*\*[:：]\s*(.+)$/)
    const isConvLine = match && (match[1] === interviewerName || match[1] === clientName)

    if (!isConvLine) {
      result.push(line)
      i++
      continue
    }

    // 連続する会話行をすべて収集して HTML バブルに変換
    const bubblesHtml: string[] = []
    while (i < lines.length) {
      const l = lines[i]
      const m = l.match(/^\*\*(.+?)\*\*[:：]\s*(.+)$/)
      if (!m || (m[1] !== interviewerName && m[1] !== clientName)) break

      const rawText = escapeHtml(m[2]).replace(/([。！？])/g, '$1<br>')
      const isInterviewer = m[1] === interviewerName

      if (isInterviewer) {
        bubblesHtml.push(
          `<div style="display:flex;align-items:flex-start;justify-content:flex-end;gap:6px;margin-bottom:16px;">` +
          `<div style="display:flex;flex-direction:column;align-items:flex-end;flex:1;min-width:0;">` +
          `<div style="font-size:10px;color:#8f7d6d;margin-bottom:3px;">${escapeHtml(interviewerDisplayName)}</div>` +
          `<div style="background:${questionBg};border-radius:16px 4px 16px 16px;padding:10px 14px;max-width:75%;font-size:15px;line-height:1.85;color:#3d2b1f;box-sizing:border-box;">${rawText}</div>` +
          `</div>` +
          `<div style="width:28px;height:28px;border-radius:50%;background:${escapeHtml(themeColor)};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;flex-shrink:0;">${escapeHtml(interviewerDisplayName.slice(0, 1))}</div>` +
          `</div>`
        )
      } else {
        bubblesHtml.push(
          `<div style="display:flex;align-items:flex-start;gap:6px;margin-bottom:16px;">` +
          `<div style="width:28px;height:28px;border-radius:50%;background:${escapeHtml(themeColor)};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;flex-shrink:0;">${escapeHtml(clientDisplayName.slice(0, 1))}</div>` +
          `<div style="display:flex;flex-direction:column;align-items:flex-start;flex:1;min-width:0;">` +
          `<div style="font-size:10px;color:#8f7d6d;margin-bottom:3px;">${escapeHtml(clientDisplayName)}</div>` +
          `<div style="background:${answerBg};border-radius:4px 16px 16px 16px;padding:10px 14px;max-width:75%;font-size:15px;line-height:1.85;color:#2a2a3d;box-sizing:border-box;">${rawText}</div>` +
          `</div>` +
          `</div>`
        )
      }
      i++
    }

    if (bubblesHtml.length > 0) {
      const wrapper =
        `<div style="box-sizing:border-box;font-family:system-ui,-apple-system,sans-serif;padding:20px 0;">` +
        `<div style="height:1px;background:${sepColor};margin-bottom:24px;"></div>` +
        bubblesHtml.join('\n') +
        `<div style="height:1px;background:${sepColor};margin-top:8px;"></div>` +
        `</div>`
      result.push(`<!-- EMBED_HTML_START -->\n${wrapper}\n<!-- EMBED_HTML_END -->`)
    }
  }

  return result.join('\n')
}
