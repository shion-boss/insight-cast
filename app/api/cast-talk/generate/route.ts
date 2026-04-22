import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { readFileSync } from 'fs'
import { join } from 'path'

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
  } catch {
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
  if (req.headers.get('x-vercel-cron') === '1') return true
  const adminSecret = process.env.ADMIN_SECRET
  if (adminSecret && req.headers.get('x-admin-key') === adminSecret) return true
  return isAdminSession()
}

// ---------- テーマ選定 ----------

async function selectTheme(
  client: Anthropic,
  existingBlogTitles: string[],
  pastCastTalkTitles: string[],
): Promise<ThemeSelection> {
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

  const userMessage = `以下の情報をもとに、今日のcast-talkのテーマを1つ選んでください。

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

  return parsed
}

// ---------- 会話生成 ----------

const CAST_NAMES: Record<string, string> = {
  mint: 'ミント',
  claus: 'クラウス',
  rain: 'レイン',
}

const DEFAULT_CONVERSATION_SYSTEM = `あなたはInsight CastのAIキャストたちが行う対話記事を生成します。

Insight Castのキャストは本当に会社で働いている仲間として振る舞います。
「AIが生成した」「処理した」「モデル」などの表現は絶対に使わないでください。

対話は自然な会話として書いてください。8〜14ターンを目安にしてください。
各メッセージは100〜200文字程度にしてください。

出力はJSONのみ（説明文なし）。`

async function generateConversation(
  client: Anthropic,
  theme: ThemeSelection,
): Promise<ConversationOutput> {
  const promptFile = loadPromptFile('.claude/skills/cast-talk/conversation-prompt.md')

  let systemPrompt = ''
  if (promptFile) {
    const systemMatch = /## システムプロンプト\s*```([\s\S]*?)```/m.exec(promptFile)
    systemPrompt = systemMatch ? systemMatch[1].trim() : ''
  }
  if (!systemPrompt) {
    systemPrompt = DEFAULT_CONVERSATION_SYSTEM
  }

  const interviewerName = CAST_NAMES[theme.interviewer] ?? theme.interviewer
  const guestName = CAST_NAMES[theme.guest] ?? theme.guest

  const formatDesc =
    theme.format === 'interview'
      ? `${interviewerName}が取材する形式（${interviewerName}→${guestName}）`
      : `${interviewerName}と${guestName}が対等に話し合う形式`

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
}`

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

  return parsed
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

  try {
    const [{ data: blogPosts }, { data: pastTalks }] = await Promise.all([
      supabase.from('blog_posts').select('title').eq('published', true).limit(50),
      supabase.from('cast_talks').select('title').limit(50),
    ])

    const existingBlogTitles = (blogPosts ?? []).map((p: { title: string }) => p.title)
    const pastCastTalkTitles = (pastTalks ?? []).map((p: { title: string }) => p.title)

    const theme = await selectTheme(client, existingBlogTitles, pastCastTalkTitles)
    const conversation = await generateConversation(client, theme)

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
      .select('id, title, slug')
      .single()

    if (error) {
      console.error('[cast-talk/generate] DB insert error', { traceId, error: error.message })
      return NextResponse.json(
        { code: 'DB_ERROR', message: 'DBへの保存に失敗しました', traceId },
        { status: 500 },
      )
    }

    return NextResponse.json({ id: data.id, title: data.title, slug: data.slug, traceId })
  } catch (err) {
    const message = err instanceof Error ? err.message : '不明なエラー'
    console.error('[cast-talk/generate] error', { traceId, message })
    return NextResponse.json(
      { code: 'GENERATION_ERROR', message, traceId },
      { status: 500 },
    )
  }
}
