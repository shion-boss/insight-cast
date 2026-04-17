'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Profile = {
  name: string | null
  url: string | null
  industry_memo: string | null
  location: string | null
  avatar_url: string | null
}

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [profile, setProfile] = useState<Profile>({
    name: '', url: '', industry_memo: '', location: '', avatar_url: null,
  })
  const [userId, setUserId] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/')
      setUserId(user.id)

      const { data } = await supabase
        .from('profiles')
        .select('name, url, industry_memo, location, avatar_url')
        .eq('id', user.id)
        .single()

      if (data) {
        setProfile(data)
        if (data.avatar_url) setAvatarPreview(data.avatar_url)
      }
    }
    load()
  }, [])

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  async function handleSave() {
    setSaving(true)
    let avatar_url = profile.avatar_url

    if (avatarFile && userId) {
      const ext = avatarFile.name.split('.').pop()
      const path = `${userId}/avatar.${ext}`
      const { error } = await supabase.storage.from('avatars').upload(path, avatarFile, { upsert: true })
      if (!error) {
        const { data } = supabase.storage.from('avatars').getPublicUrl(path)
        avatar_url = data.publicUrl
      }
    }

    await supabase
      .from('profiles')
      .update({
        name:          profile.name,
        url:           profile.url,
        industry_memo: profile.industry_memo,
        location:      profile.location,
        avatar_url,
      })
      .eq('id', userId)

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-100 px-6 py-4 flex items-center justify-between">
        <h1 className="font-semibold text-stone-800">プロフィール</h1>
        <Link href="/dashboard" className="text-sm text-stone-400 hover:text-stone-600 cursor-pointer">← ダッシュボードへ</Link>
      </header>

      <div className="max-w-lg mx-auto px-6 py-8 space-y-6">

        {/* アバター */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="group relative cursor-pointer"
          >
            <div className="w-20 h-20 rounded-full overflow-hidden bg-stone-100 flex items-center justify-center">
              {avatarPreview
                ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                : <span className="text-3xl">🏪</span>
              }
            </div>
            <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-white text-xs">変更</span>
            </div>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          <p className="text-xs text-stone-400">クリックして画像を変更</p>
        </div>

        {/* 基本情報 */}
        <section className="bg-white rounded-xl border border-stone-100 p-5 space-y-4">
          <h2 className="text-sm font-medium text-stone-600">基本情報</h2>

          {[
            { label: '店舗・企業名', key: 'name', placeholder: '例: 山田工務店' },
            { label: '自社HP URL', key: 'url', placeholder: 'https://example.com' },
            { label: '業種', key: 'industry_memo', placeholder: '例: 地域の工務店' },
            { label: '地域', key: 'location', placeholder: '例: 大阪府吹田市' },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className="block text-xs text-stone-500 mb-1">{label}</label>
              <input
                type="text"
                value={(profile[key as keyof Profile] as string) ?? ''}
                onChange={(e) => setProfile((p) => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
              />
            </div>
          ))}
        </section>

        {/* 保存ボタン */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 bg-stone-800 text-white rounded-xl hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors text-sm"
        >
          {saving ? '保存中...' : saved ? '保存しました ✓' : '保存する'}
        </button>
      </div>
    </div>
  )
}
