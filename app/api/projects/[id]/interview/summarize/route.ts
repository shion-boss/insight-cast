import Anthropic from '@anthropic-ai/sdk'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCharacter } from '@/lib/characters'
import { NextRequest, NextResponse } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { interviewId } = await req.json()

  const { data: interview } = await supabase
    .from('interviews')
    .select('id, interviewer_type, status, summary, themes, project_id')
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
  const conversation = messages
    .map(m => `${m.role === 'user' ? '事業者' : charName}: ${m.content}`)
    .join('\n\n')

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `以下のインタビュー記録を分析して、日本語でJSONを返してください。

## インタビュー記録
${conversation}

## 出力形式（JSONのみ）
{
  "values": ["引き出せた価値（3〜5点、具体的に）"],
  "themes": ["記事にできそうなテーマ（3点）"]
}`,
    }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return NextResponse.json({ error: 'parse failed' }, { status: 500 })

  const parsed = JSON.parse(jsonMatch[0])

  await supabase.from('interviews').update({
    status: 'completed',
    summary: parsed.values.map((v: string) => `・${v}`).join('\n'),
    themes: parsed.themes,
  }).eq('id', interviewId)

  await supabase.from('projects').update({ status: 'interview_done' }).eq('id', projectId)
  revalidatePath('/dashboard')
  revalidatePath('/projects')
  revalidatePath('/interviews')
  revalidatePath(`/projects/${projectId}`)
  revalidatePath(`/projects/${projectId}/summary`)

  return NextResponse.json({ summary: parsed.values, themes: parsed.themes })
}
