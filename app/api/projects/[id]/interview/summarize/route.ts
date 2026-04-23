import Anthropic from '@anthropic-ai/sdk'
import { extractJsonBlock, formatConversationForPrompt, normalizeUniqueStringList } from '@/lib/ai-quality'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCharacter } from '@/lib/characters'
import { logApiUsage } from '@/lib/api-usage'
import { isFreePlanLocked } from '@/lib/plans'
import { NextRequest, NextResponse } from 'next/server'
import { syncProjectContentStatus } from '@/lib/project-content-status'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (await isFreePlanLocked(supabase, user.id)) {
    return NextResponse.json({ error: 'free_plan_locked' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  const { interviewId } = body as { interviewId?: string }

  const { data: interview } = await supabase
    .from('interviews')
    .select('id, interviewer_type, status, summary, themes, project_id, focus_theme_mode, focus_theme, interviews_project:projects(name, hp_url)')
    .eq('id', interviewId)
    .eq('project_id', projectId)
    .single()

  if (!interview) return NextResponse.json({ error: 'not found' }, { status: 404 })

  if (interview.summary) {
    return NextResponse.json({ summary: interview.summary, themes: interview.themes })
  }

  const { data: messages } = await supabase
    .from('interview_messages')
    .select('role, content')
    .eq('interview_id', interviewId)
    .order('created_at', { ascending: true })

  if (!messages || messages.length === 0) {
    return NextResponse.json({ error: 'no messages' }, { status: 400 })
  }

  const char = getCharacter(interview.interviewer_type)
  const charName = char?.name ?? 'インタビュアー'
  const projectData = interview.interviews_project as { name: string | null; hp_url: string | null } | { name: string | null; hp_url: string | null }[] | null
  const projectInfo = Array.isArray(projectData) ? (projectData[0] ?? null) : projectData
  const conversation = formatConversationForPrompt(
    messages.map((message) => ({
      role: message.role === 'user' ? 'user' : 'interviewer',
      content: message.content,
    })),
    {
      userLabel: '事業者',
      assistantLabel: charName,
      maxMessageLength: 900,
    },
  )

  const focusThemeContext = interview.focus_theme_mode === 'omakase' || !interview.focus_theme
    ? 'テーマ指定なし'
    : `テーマ: ${interview.focus_theme}`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    system: `あなたは、インタビュー内容をホームページ改善に使える形で整理する編集者です。

- values は 3〜5件
- themes は 3〜5件
- values は「具体的な行動・判断・お客様の反応・他社との違い」が見える表現にする
- themes はそのまま記事企画に使える切り口にする
- 「丁寧さ」「安心感」だけのような抽象語で終わらせない
- 会話に出ていない事実や数字を足さない
- JSON以外は返さない`,
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `以下のインタビュー記録を分析して、日本語でJSONを返してください。

## 取材先
${projectInfo?.name ?? projectInfo?.hp_url ?? '未設定'}

## 進め方
${focusThemeContext}

## インタビュー記録
${conversation}

## 出力形式（JSONのみ）
{
  "values": ["引き出せた価値（3〜5点、具体的に）"],
  "themes": ["記事にできそうなテーマ（3〜5点、具体的に）"]
}`,
    }],
  })

  logApiUsage({
    userId: user.id,
    projectId,
    route: 'interview/summarize',
    model: 'claude-sonnet-4-6',
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  }).catch(() => {})

  const textBlock = response.content.find((block) => block.type === 'text')
  const text = textBlock?.type === 'text' ? textBlock.text : ''
  const jsonText = extractJsonBlock(text)
  if (!jsonText) return NextResponse.json({ error: 'parse failed' }, { status: 500 })

  let parsed: { values?: unknown; themes?: unknown }
  try {
    parsed = JSON.parse(jsonText) as { values?: unknown; themes?: unknown }
  } catch {
    return NextResponse.json({ error: 'parse failed' }, { status: 500 })
  }

  const values = normalizeUniqueStringList(parsed.values, { maxItems: 5, maxLength: 110 })
  const themes = normalizeUniqueStringList(parsed.themes, { maxItems: 5, maxLength: 120 })

  if (values.length === 0) {
    return NextResponse.json({ error: 'empty summary' }, { status: 500 })
  }

  const nextThemes = themes.length > 0
    ? themes
    : values.slice(0, 3)

  await supabase.from('interviews').update({
    status: 'completed',
    summary: values.map((value) => `・${value}`).join('\n'),
    themes: nextThemes,
  }).eq('id', interviewId)

  await syncProjectContentStatus(supabase, projectId)
  revalidatePath('/dashboard')
  revalidatePath('/projects')
  revalidatePath('/interviews')
  revalidatePath(`/projects/${projectId}`)
  revalidatePath(`/projects/${projectId}/summary`)

  return NextResponse.json({ summary: values, themes: nextThemes })
}
