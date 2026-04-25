import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { readFileSync } from 'fs'
import { join } from 'path'
import { getCastName } from '@/lib/characters'
import { logApiUsage } from '@/lib/api-usage'

export const maxDuration = 120

// ---------- 型定義 ----------

type ThemeSelection = {
  theme: string
  format: 'interview' | 'dialogue'
  interviewer: string
  guest: string
  reason: string
}

type ConversationMessage = {
  castId: string
  text: string
}

type ConversationOutput = {
  title: string
  messages: ConversationMessage[]
  summary: string
}

// ---------- バリデーション ----------

function isThemeSelection(v: unknown): v is ThemeSelection {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  return (
    typeof o.theme === 'string' &&
    (o.format === 'interview' || o.format === 'dialogue') &&
    typeof o.interviewer === 'string' &&
    typeof o.guest === 'string' &&
    typeof o.reason === 'string'
  )
}

function isConversationOutput(v: unknown): v is ConversationOutput {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  if (typeof o.title !== 'string') return false
  if (typeof o.summary !== 'string') return false
  if (!Array.isArray(o.messages)) return false
  return o.messages.every(
    (m: unknown) =>
      m && typeof m === 'object' &&
      typeof (m as Record<string, unknown>).castId === 'string' &&
      typeof (m as Record<string, unknown>).text === 'string',
  )
}

// ---------- プロンプト読み込み ----------

function loadPromptFile(relativePath: string): string {
  try {
    const fullPath = join(process.cwd(), relativePath)
    return readFileSync(fullPath, 'utf-8')
  } catch (e) {
    console.warn('[cast-talk] プロンプトファイルの読み込みに失敗:', relativePath, e)
    return ''
  }
}

function extractCodeBlock(content: string, lang = ''): string {
  const re = new RegExp(`\`\`\`${lang}\\s*([\\s\\S]*?)\`\`\``, 'm')
  const m = re.exec(content)
  return m ? m[1].trim() : content.trim()
}

// ---------- 認証 ----------

async function isAdminSession(): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) return false
    const adminEmails = (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean)
    return adminEmails.includes(user.email)
  } catch {
    return false
  }
}

async function isAuthorized(req: NextRequest): Promise<boolean> {
  // Vercel Cron: Authorization: Bearer <CRON_SECRET>
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = req.headers.get('authorization')
    if (auth === `Bearer ${cronSecret}`) return true
  }
  const adminSecret = process.env.ADMIN_SECRET
  if (adminSecret && req.headers.get('x-admin-key') === adminSecret) return true
  return isAdminSession()
}

// ---------- HP調査データ取得 ----------

type HpAnalysisContext = {
  strengths: string[]
  gaps: string[]
  suggestedThemes: string[]
}

async function fetchSelfHpAnalysis(supabase: ReturnType<typeof createAdminClient>): Promise<HpAnalysisContext | null> {
  const selfProjectId = process.env.SELF_PROJECT_ID
  if (!selfProjectId) return null

  const { data } = await supabase
    .from('hp_audits')
    .select('strengths, gaps, suggested_themes')
    .eq('project_id', selfProjectId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!data) return null

  return {
    strengths: Array.isArray(data.strengths) ? data.strengths : [],
    gaps: Array.isArray(data.gaps) ? data.gaps : [],
    suggestedThemes: Array.isArray(data.suggested_themes) ? data.suggested_themes : [],
  }
}

// ---------- テーマ選定 ----------

async function selectTheme(
  client: Anthropic,
  existingBlogTitles: string[],
  pastCastTalkTitles: string[],
  hpAnalysis: HpAnalysisContext | null,
  forcedTheme?: string,
): Promise<{ theme: ThemeSelection; usage: { inputTokens: number; outputTokens: number } }> {
  const promptFile = loadPromptFile('.claude/skills/cast-talk/theme-selection-prompt.md')

  let systemPrompt = ''
  if (promptFile) {
    const systemMatch = /## システムプロンプト\s*```([\s\S]*?)```/m.exec(promptFile)
    systemPrompt = systemMatch ? systemMatch[1].trim() : ''
  }
  if (!systemPrompt) {
    systemPrompt = `あなたはInsight CastのAIキャスト記事の企画担当です。
キャスト同士の対話記事（cast-talk）のテーマを1件選定してください。
キャストはmint（猫）、claus（フクロウ）、rain（キツネ）の3人です。
40〜60代の中小企業経営者が関心を持てるテーマにしてください。
出力はJSONのみ（説明文なし）。`
  }

  const existingList =
    existingBlogTitles.length > 0
      ? existingBlogTitles.map((t) => `- ${t}`).join('\n')
      : '（まだ記事がありません）'

  const pastList =
    pastCastTalkTitles.length > 0
      ? pastCastTalkTitles.map((t) => `- ${t}`).join('\n')
      : '（まだcast-talkがありません）'

  const hpContext = hpAnalysis
    ? (() => {
        // 過去のcast-talkタイトルとの簡易マッチで、suggested_themesの取り上げ回数を推定
        const themeFrequency = hpAnalysis.suggestedThemes.map((theme) => {
          const keywords = theme.replace(/[、。・]/g, ' ').split(/\s+/).filter((w) => w.length >= 2)
          const count = pastCastTalkTitles.filter((title) =>
            keywords.some((kw) => title.includes(kw))
          ).length
          return { theme, count }
        })
        const fresh = themeFrequency.filter((t) => t.count === 0).map((t) => t.theme)
        const revisit = themeFrequency.filter((t) => t.count >= 1 && t.count <= 2).map((t) => `${t.theme}（${t.count}回取り上げ済み）`)
        const saturated = themeFrequency.filter((t) => t.count >= 3).map((t) => `${t.theme}（${t.count}回取り上げ済み）`)

        return `
【自社HPの強み】
${hpAnalysis.strengths.length > 0 ? hpAnalysis.strengths.map((s) => `- ${s}`).join('\n') : '（データなし）'}

【自社HPの課題・不足している情報】
${hpAnalysis.gaps.length > 0 ? hpAnalysis.gaps.map((g) => `- ${g}`).join('\n') : '（データなし）'}

【HP調査から提案されたテーマ候補】
未取り上げ（優先して選ぶ）:
${fresh.length > 0 ? fresh.map((t) => `- ${t}`).join('\n') : '（なし）'}

取り上げ済み・再掘り下げ可（別角度なら可）:
${revisit.length > 0 ? revisit.map((t) => `- ${t}`).join('\n') : '（なし）'}

取り上げ済み・当面は避ける（3回以上）:
${saturated.length > 0 ? saturated.map((t) => `- ${t}`).join('\n') : '（なし）'}

未取り上げのテーマを優先し、取り上げ済みのものは同じ切り口を繰り返さず別の角度から掘り下げる場合のみ選んでください。3回以上のテーマは他に選択肢がない場合を除き避けてください。`
      })()
    : ''

  const userMessage = forcedTheme
    ? `テーマはこちらで指定しています。このテーマに最も合う形式（interview/dialogue）と担当キャストを選んでください。

指定テーマ: ${forcedTheme}

出力形式（JSONのみ）:
{
  "theme": "${forcedTheme}",
  "format": "interview" または "dialogue",
  "interviewer": "mint" または "claus" または "rain",
  "guest": "mint" または "claus" または "rain",
  "reason": "この形式とキャストを選んだ理由（1〜2文）"
}

※ interviewer と guest は必ず異なるキャストにしてください。`
    : `以下の情報をもとに、今日のcast-talkのテーマを1つ選んでください。
${hpContext}
【既存ブログ記事のタイトル一覧】
${existingList}

【過去のcast-talkのタイトル一覧】
${pastList}

出力形式（JSONのみ）:
{
  "theme": "テーマの説明（日本語・2〜3文）",
  "format": "interview" または "dialogue",
  "interviewer": "mint" または "claus" または "rain",
  "guest": "mint" または "claus" または "rain",
  "reason": "このテーマを選んだ理由（1〜2文）"
}

※ interviewer と guest は必ず異なるキャストにしてください。`

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    temperature: 0.7,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  })

  const rawText = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')

  const jsonText = extractCodeBlock(rawText, 'json') || extractCodeBlock(rawText)

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    throw new Error(`テーマ選定JSONのパースに失敗しました: ${rawText.slice(0, 200)}`)
  }

  if (!isThemeSelection(parsed)) {
    throw new Error(`テーマ選定の出力形式が不正です: ${JSON.stringify(parsed).slice(0, 200)}`)
  }

  return {
    theme: parsed,
    usage: { inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens },
  }
}

// ---------- 会話生成 ----------

const DEFAULT_CONVERSATION_SYSTEM = `あなたはInsight Castの編集担当です。
AIキャスト同士の会話を、ブログ記事として読めるかたちに書き起こす仕事をしています。

会話を書くときのルール:

【全体のルール】
- 会話は8〜14ターン。読み切れる長さを守る
- 1ターンのセリフは3文以内。長くなるなら次のターンに分ける
- 読者は40〜60代の経営者・事業主。難しい言葉は使わない
- 話が抽象的になりそうなときは、具体的なエピソード・場面・言葉に引き戻す
- 会話の流れに山場を1つ作る（「そうか、そういうことか」と読者が感じる瞬間）

【禁止事項】
- 「ホームページを最適化する」「SEO対策」「コンバージョン」などのマーケティング専門用語
- 「〜を生成する」「〜を処理する」「データが示す」などの機械的な表現
- 「AIとして」「私はAIなので」のような自己紹介
- カタカナ横文字の乱用（必要な場合は日本語で言い換えを添える）
- 結論を先に言いすぎる（会話のテンポが死ぬ）

【3人の関係性】
ミント（猫・女性）、クラウス（フクロウ・男性）、レイン（キツネ・男性）は、Insight Castに同期入社したフラットな同僚です。上下関係はありません。専門が違うからこそ互いを頼りにしています。

【口調の基本ルール】
- ミント: 一人称「私」。柔らかい敬語。「〜ですよね」「〜が多いんです」「〜かなと思います」
- クラウス: 一人称「私」。落ち着いた敬語。断定より問いかけ。「〜ということですよね」「〜なんでしょうね」
- レイン: 一人称「僕」。軽めの敬語・観察スタンス。「〜じゃないですか」「〜が気になって」
- 3人は互いを名前で呼ぶ。ただし毎ターン呼ぶのは不自然なので必要な場面だけ
- 「だよね」「じゃん」のような崩した言い方はしない。読者（40〜60代の経営者）が置いてけぼりになる

【会話の雰囲気】
- 職場の休憩室で仕事の話をしている感覚。固い会議でも、とりとめない雑談でもない
- 意見が分かれても否定から入らない。「それはそうなんですが、一方で〜」と視点の違いを言葉にする
- どちらかが急に折れて収束させない。違いが残ったまま「どちらも大事ですね」で着地していい
- 会話の中盤（6〜9ターン目あたり）に「そうか、そういうことか」と読者が腑に落ちる瞬間を1つ作る

【インタビュー形式の場合】
- インタビュアー側の発言は短め（問いを立てる）。ゲスト側がやや長く話す（2:3の比率が目安）
- インタビュアーは答えを先に言わない

【対話形式の場合】
- 発言の長さをほぼ均等にする
- 結論に収束させなくていい。余韻で終わる方が自然

出力はJSONのみ（説明文なし）。

{
  "title": "記事タイトル（読者が読みたくなる、30文字以内）",
  "messages": [
    { "castId": "mint", "text": "セリフ" }
  ],
  "summary": "この記事を一言で表す文（SNS投稿やメタディスクリプションに使える、60文字以内）"
}`

// ---------- 修正例取得 ----------

type EditRecord = {
  cast_id: string
  original_text: string
  edited_text: string
}

async function fetchRecentEdits(supabase: ReturnType<typeof createAdminClient>): Promise<EditRecord[]> {
  const { data, error } = await supabase
    .from('cast_talk_edits')
    .select('cast_id, original_text, edited_text')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.warn('[cast-talk/generate] cast_talk_edits 取得失敗:', error.message)
    return []
  }
  return (data ?? []) as EditRecord[]
}

const MAX_EDITS_PER_CAST = 5

function buildEditFewShot(edits: EditRecord[]): string {
  if (edits.length === 0) return ''

  // キャストごとにまとめ、重複除去してMAX_EDITS_PER_CAST件に絞る
  const grouped: Record<string, EditRecord[]> = {}
  for (const e of edits) {
    if (!grouped[e.cast_id]) grouped[e.cast_id] = []
    const seen = grouped[e.cast_id]
    const isDuplicate = seen.some((s) => s.original_text === e.original_text)
    if (!isDuplicate && seen.length < MAX_EDITS_PER_CAST) {
      seen.push(e)
    }
  }

  const castNameMap: Record<string, string> = {
    mint: 'ミント',
    claus: 'クラウス',
    rain: 'レイン',
  }

  const lines: string[] = ['【過去の修正例（参考にして同じ言い回しを避けてください）】']
  for (const [castId, records] of Object.entries(grouped)) {
    if (records.length === 0) continue
    const displayName = castNameMap[castId] ?? castId
    lines.push(`${displayName}:`)
    for (const r of records) {
      lines.push(`- 「${r.original_text}」→「${r.edited_text}」`)
    }
  }
  return lines.join('\n')
}

// ---------- 会話生成 ----------

async function generateConversation(
  client: Anthropic,
  theme: ThemeSelection,
  supabase: ReturnType<typeof createAdminClient>,
): Promise<{ conversation: ConversationOutput; usage: { inputTokens: number; outputTokens: number } }> {
  const promptFile = loadPromptFile('.claude/skills/cast-talk/conversation-prompt.md')

  let systemPrompt = ''
  if (promptFile) {
    const systemMatch = /## システムプロンプト\s*```([\s\S]*?)```/m.exec(promptFile)
    systemPrompt = systemMatch ? systemMatch[1].trim() : ''
  }
  if (!systemPrompt) {
    systemPrompt = DEFAULT_CONVERSATION_SYSTEM
  }

  const interviewerName = getCastName(theme.interviewer)
  const guestName = getCastName(theme.guest)

  const formatDesc =
    theme.format === 'interview'
      ? `${interviewerName}が取材する形式（${interviewerName}→${guestName}）`
      : `${interviewerName}と${guestName}が対等に話し合う形式`

  // 過去の修正例を取得してfew-shotとしてプロンプトに追加する
  const recentEdits = await fetchRecentEdits(supabase)
  const editFewShot = buildEditFewShot(recentEdits)

  const userMessage = `以下のテーマと条件で対話記事を生成してください。

テーマ: ${theme.theme}
形式: ${formatDesc}
登場キャスト:
  - インタビュアー側: ${interviewerName}（id: ${theme.interviewer}）
  - 回答者側: ${guestName}（id: ${theme.guest}）

出力形式（JSONのみ）:
{
  "title": "記事のタイトル（20〜30文字）",
  "messages": [
    { "castId": "mint" または "claus" または "rain", "text": "発言内容" },
    ...
  ],
  "summary": "記事の要約（SNS投稿に使える・80〜120文字）"
}

※ messages の最後は必ずインタビュアー側（interviewer_id）の締めのひとことで終わらせてください。${editFewShot ? `\n\n${editFewShot}` : ''}`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3000,
    temperature: 0.85,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  })

  const rawText = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')

  const jsonText = extractCodeBlock(rawText, 'json') || extractCodeBlock(rawText)

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    throw new Error(`会話生成JSONのパースに失敗しました: ${rawText.slice(0, 200)}`)
  }

  if (!isConversationOutput(parsed)) {
    throw new Error(`会話生成の出力形式が不正です: ${JSON.stringify(parsed).slice(0, 200)}`)
  }

  return {
    conversation: parsed,
    usage: { inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens },
  }
}

// ---------- slug 生成 ----------

function generateSlug(): string {
  const now = new Date()
  const date = now.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.random().toString(36).slice(2, 6)
  return `cast-talk-${date}-${random}`
}

// ---------- ハンドラー ----------

export async function POST(req: NextRequest) {
  const traceId = crypto.randomUUID()

  if (!(await isAuthorized(req))) {
    return NextResponse.json(
      { code: 'UNAUTHORIZED', message: '認証に失敗しました', traceId },
      { status: 401 },
    )
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!anthropicKey) {
    return NextResponse.json(
      { code: 'MISSING_API_KEY', message: 'ANTHROPIC_API_KEY が設定されていません', traceId },
      { status: 500 },
    )
  }

  const client = new Anthropic({ apiKey: anthropicKey })
  const supabase = createAdminClient()

  const body = await req.json().catch(() => ({})) as Record<string, unknown>
  const rawTheme = typeof body.theme === 'string' ? body.theme.trim() : ''
  const forcedTheme = rawTheme.length > 0 && rawTheme.length <= 200 ? rawTheme : undefined

  try {
    const [{ data: blogPosts }, { data: pastTalks }, hpAnalysis] = await Promise.all([
      supabase.from('blog_posts').select('title').eq('published', true).limit(30),
      supabase.from('cast_talks').select('title').order('published_at', { ascending: false }).limit(30),
      fetchSelfHpAnalysis(supabase),
    ])

    const existingBlogTitles = (blogPosts ?? []).map((p: { title: string }) => p.title)
    const pastCastTalkTitles = (pastTalks ?? []).map((p: { title: string }) => p.title)

    const { theme, usage: themeUsage } = await selectTheme(client, existingBlogTitles, pastCastTalkTitles, hpAnalysis, forcedTheme)
    const { conversation, usage: convUsage } = await generateConversation(client, theme, supabase)

    const slug = generateSlug()

    const { data, error } = await supabase
      .from('cast_talks')
      .insert({
        title: conversation.title,
        theme: theme.theme,
        format: theme.format,
        interviewer_id: theme.interviewer,
        guest_id: theme.guest,
        messages: conversation.messages,
        summary: conversation.summary,
        slug,
        status: 'draft',
      })
      .select('id, title, slug, format, interviewer_id, guest_id, status, created_at')
      .single()

    if (error) {
      console.error('[cast-talk/generate] DB insert error', { traceId, error: error.message })
      return NextResponse.json(
        { code: 'DB_ERROR', message: 'DBへの保存に失敗しました', traceId },
        { status: 500 },
      )
    }

    await Promise.all([
      logApiUsage({ route: 'cast-talk/generate', model: 'claude-haiku-4-5-20251001', inputTokens: themeUsage.inputTokens, outputTokens: themeUsage.outputTokens }),
      logApiUsage({ route: 'cast-talk/generate', model: 'claude-sonnet-4-6', inputTokens: convUsage.inputTokens, outputTokens: convUsage.outputTokens }),
    ])

    return NextResponse.json({ ...data, traceId })
  } catch (err) {
    const message = err instanceof Error ? err.message : '不明なエラー'
    console.error('[cast-talk/generate] error', { traceId, message })
    return NextResponse.json(
      { code: 'GENERATION_ERROR', message, traceId },
      { status: 500 },
    )
  }
}
