'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CharacterAvatar, InterviewerSpeech, PageHeader, PrimaryButton, TextInput } from '@/components/ui'
import { getCharacter } from '@/lib/characters'

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const mint = getCharacter('mint')

  const [userId, setUserId] = useState('')
  const [name, setName] = useState('')
  const [initialName, setInitialName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setLoadError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }

      setUserId(user.id)

      const { data, error } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single()

      if (error) {
        setLoadError('設定を読み込めませんでした。少し待ってからもう一度お試しください。')
      } else {
        const nextName = data?.name ?? ''
        setName(nextName)
        setInitialName(nextName)
      }

      setLoading(false)
    }

    load()
  }, [router, supabase])

  async function handleSave() {
    setSaveError(null)
    setSaving(true)

    const nextName = name.trim()
    const { error } = await supabase
      .from('profiles')
      .update({ name: nextName })
      .eq('id', userId)

    if (error) {
      setSaveError('保存できませんでした。通信状況を確認して、もう一度お試しください。')
      setSaving(false)
      return
    }

    setInitialName(nextName)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const hasUnsavedChanges = name.trim() !== initialName.trim()

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50">
        <PageHeader title="設定" backHref="/dashboard" backLabel="← ダッシュボード" />
        <div className="mx-auto max-w-lg px-6 py-10">
          <InterviewerSpeech
            icon={(
              <CharacterAvatar
                src={mint?.icon48}
                alt={`${mint?.name ?? 'インタビュアー'}のアイコン`}
                emoji={mint?.emoji}
                size={48}
              />
            )}
            name={mint?.name ?? 'インタビュアー'}
            title="呼びかけるお名前を確認しています。"
            description="開き終わると、このまま見直せます。"
            tone="soft"
          />
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-stone-50">
        <PageHeader title="設定" backHref="/dashboard" backLabel="← ダッシュボード" />
        <div className="mx-auto max-w-lg px-6 py-10">
          <InterviewerSpeech
            icon={(
              <CharacterAvatar
                src={mint?.icon48}
                alt={`${mint?.name ?? 'インタビュアー'}のアイコン`}
                emoji={mint?.emoji}
                size={48}
              />
            )}
            name={mint?.name ?? 'インタビュアー'}
            title="設定をまだ開けません。"
            description={loadError}
            tone="soft"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <PageHeader title="設定" backHref="/dashboard" backLabel="← ダッシュボード" />

      <div className="mx-auto max-w-lg px-6 py-8 space-y-6">
        <InterviewerSpeech
          icon={(
            <CharacterAvatar
              src={mint?.icon48}
              alt={`${mint?.name ?? 'インタビュアー'}のアイコン`}
              emoji={mint?.emoji}
              size={48}
            />
          )}
          name={mint?.name ?? 'インタビュアー'}
          title="ここでは、お呼びするお名前だけ教えてください。"
          description="取材先のホームページや競合候補は、取材先を登録するときにまとめて決められます。"
          tone="soft"
        />

        <section className="rounded-xl border border-stone-100 bg-white p-5 space-y-4">
          <div>
            <p className="text-sm font-medium text-stone-700">アカウント情報</p>
            <p className="mt-1 text-xs text-stone-400">
              取材班が会話の中で自然に呼びかけるためのお名前です。
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs text-stone-500">お名前</label>
            <TextInput
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 山田さん"
            />
          </div>

          {saveError && <p className="text-sm text-red-500">{saveError}</p>}

          <PrimaryButton
            onClick={handleSave}
            disabled={saving || !hasUnsavedChanges}
            className="w-full py-3 text-sm"
          >
            {saving ? '保存中...' : hasUnsavedChanges ? 'この名前で保存する' : saved ? '保存しました' : 'この内容で保存されています'}
          </PrimaryButton>
        </section>
      </div>
    </div>
  )
}
