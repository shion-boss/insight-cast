// 記事HTML生成。サーバー/クライアント両方で動く（純粋関数のみ）。

import { marked } from 'marked'

const DEFAULT_THEME_COLOR = '#c2722a'

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

export function buildIntroHtml(opts: {
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

/**
 * 記事マークダウンを単一の埋め込みHTMLに変換する。
 *
 * - **名前**: テキスト 行 → 会話バブル
 * - 会話前後の Markdown → marked で HTML に変換し、インラインstyleを付与
 * - 全体を1つのコンテナで包む（タイトル・イントロカード・フッター含む）
 *
 * 出力は記事の確認画面（ArticleExportPanel）と同一の構造になるため、
 * 下書きをブログに貼り付けたときに確認画面と同じ見た目になる。
 *
 * `title` が空文字または未指定なら、タイトル・前後セクション・フッターを省いた
 * 「会話ブロックのみ」の HTML を返す（ブロックコピー用途）。
 */
export function buildArticleHtml(opts: {
  content: string
  title?: string
  date?: string
  interviewerName: string
  interviewerDisplayName: string
  interviewerLabel?: string | null
  interviewerAvatarUrl?: string | null
  clientName: string
  clientDisplayName: string
  clientInitial?: string
  userAvatarUrl?: string | null
  themeColor?: string
  showIcon?: boolean
  showName?: boolean
  showClientIcon?: boolean
  showClientName?: boolean
  showIntro?: boolean
}): string {
  const {
    content,
    title,
    date = '',
    interviewerName,
    interviewerDisplayName,
    interviewerLabel = null,
    interviewerAvatarUrl = null,
    clientName,
    clientDisplayName,
    clientInitial,
    userAvatarUrl = null,
    themeColor = DEFAULT_THEME_COLOR,
    showIcon = true,
    showName = true,
    showClientIcon = true,
    showClientName = true,
    showIntro = true,
  } = opts

  const questionBg = lighten(themeColor, 0.78)
  const answerBg = lighten(themeColor, 0.88)
  const separatorColor = lighten(themeColor, 0.82)

  const imgStyle = 'width:28px;height:28px;border-radius:50%;object-fit:cover;display:block;'
  const divStyle = 'width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;'
  const nameStyle = 'font-size:10px;color:#8f7d6d;margin-bottom:3px;white-space:nowrap;'

  const resolvedClientInitial = clientInitial ?? clientDisplayName.slice(0, 1) ?? '?'

  const userIconHtml = showClientIcon
    ? (userAvatarUrl
        ? `<img src="${escapeHtml(userAvatarUrl)}" alt="${escapeHtml(resolvedClientInitial)}" style="${imgStyle}" />`
        : `<div style="${divStyle}background:${themeColor};">${escapeHtml(resolvedClientInitial)}</div>`)
    : ''

  const interviewerIconHtml = showIcon
    ? (interviewerAvatarUrl
        ? `<img src="${escapeHtml(interviewerAvatarUrl)}" alt="${escapeHtml(interviewerDisplayName)}" style="${imgStyle}" />`
        : `<div style="${divStyle}background:${themeColor};">${escapeHtml(interviewerDisplayName.slice(0, 1))}</div>`)
    : ''

  const nameHtmlInterviewer = showName ? `<div style="${nameStyle}">${escapeHtml(interviewerDisplayName)}</div>` : ''
  const nameHtmlClient = showClientName ? `<div style="${nameStyle}">${escapeHtml(clientDisplayName)}</div>` : ''

  const iconGapInterviewer = showIcon ? 'gap:5px;' : ''
  const iconGapClient = showClientIcon ? 'gap:5px;' : ''
  const iconMarginTopInterviewer = showIcon ? 'margin-top:4px;' : ''
  const iconMarginTopClient = showClientIcon ? 'margin-top:4px;' : ''

  const introHtml = showIntro ? buildIntroHtml({ interviewerDisplayName, interviewerLabel, interviewerAvatarUrl, themeColor }) : ''

  const contentLines = content.split('\n')
  const bubblesHtml: string[] = []

  for (const line of contentLines) {
    const match = line.match(/^\*\*(.+?)\*\*[:：]\s*(.+)$/)
    if (!match) continue
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
  <div style="font-size:12px;color:#8f7d6d;">${escapeHtml(date)}</div>
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
