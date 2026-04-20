'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CharacterAvatar, InterviewerSpeech, TextInput } from '@/components/ui'
import { AppShell } from '@/components/app-shell'
import { getCharacter } from '@/lib/characters'

type Section = 'アカウント' | 'プラン・請求' | '通知' | 'セキュリティ'
const SECTIONS: Section[] = ['アカウント', 'プラン・請求', '通知', 'セキュリティ']

const NOTIFICATIONS = [
  { label: '取材完了の通知', desc: 'AIキャストによる取材が完了したときにメールを受け取る', defaultOn: true },
  { label: '記事素材生成完了', desc: '記事素材が生成されたときにメールを受け取る', defaultOn: true },
  { label: '月次利用レポート', desc: '月末に利用状況のサマリーを受け取る', defaultOn: false },
  { label: 'サービスのお知らせ', desc: '新機能・キャスト追加などのお知らせを受け取る', defaultOn: true },
]

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className="w-11 h-6 rounded-full relative transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 flex-shrink-0 cursor-pointer"
      style={{ background: on ? 'var(--accent)' : 'var(--border)' }}
    >
      <span
        className="block w-[18px] h-[18px] rounded-full bg-white absolute top-[3px] transition-[left] duration-200 shadow-[0_1px_4px_rgba(0,0,0,0.2)]"
        style={{ left: on ? '23px' : '3px' }}
      />
    </button>
  )
}

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const mint = getCharacter('mint')

  const [userId, setUserId] = useState('')
  const [name, setName] = useState('')
  const [initialName, setInitialName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<Section>('アカウント')
  const [notifOn, setNotifOn] = useState(NOTIFICATIONS.map((n) => n.defaultOn))
  const [interviewCount, setInterviewCount] = useState<number | null>(null)

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

      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const { data: userProjects } = await supabase
        .from('projects')
        .select('id')
        .eq('user_id', user.id)
      const projectIds = (userProjects ?? []).map((p) => p.id)
      if (projectIds.length > 0) {
        const { count } = await supabase
          .from('interviews')
          .select('id', { count: 'exact', head: true })
          .in('project_id', projectIds)
          .gte('created_at', monthStart)
        setInterviewCount(count ?? 0)
      } else {
        setInterviewCount(0)
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
  const accountInitial = (name.trim() || '設').charAt(0)

  if (loading) {
    return (
      <AppShell title="設定" active="settings" accountLabel={name || '設定'}>
        <div className="max-w-lg py-2">
          <InterviewerSpeech
            icon={(
              <CharacterAvatar
                src={mint?.icon48}
                alt={`${mint?.name ?? 'ミント'}のアイコン`}
                emoji={mint?.emoji}
                size={48}
              />
            )}
            name={mint?.name ?? 'ミント'}
            title="設定を読み込んでいます。"
            description="少しお待ちください。"
            tone="soft"
          />
        </div>
      </AppShell>
    )
  }

  if (loadError) {
    return (
      <AppShell title="設定" active="settings" accountLabel={name || '設定'}>
        <div className="max-w-lg py-2">
          <InterviewerSpeech
            icon={(
              <CharacterAvatar
                src={mint?.icon48}
                alt={`${mint?.name ?? 'ミント'}のアイコン`}
                emoji={mint?.emoji}
                size={48}
              />
            )}
            name={mint?.name ?? 'ミント'}
            title="設定をまだ開けません。"
            description={loadError}
            tone="soft"
          />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title="設定" active="settings" accountLabel={name.trim() || '設定'}>
      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-8 items-start">
        {/* サイドナビ */}
        <nav className="lg:sticky lg:top-20 flex flex-row lg:flex-col gap-0.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {SECTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setActiveSection(s)}
              className={`whitespace-nowrap text-left px-3 py-2.5 rounded-[var(--r-sm)] text-sm font-medium transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 ${
                activeSection === s
                  ? 'bg-[var(--accent-l)] text-[var(--accent)] border-l-2 border-[var(--accent)]'
                  : 'text-[var(--text2)] hover:bg-[var(--bg2)] hover:text-[var(--text)] border-l-2 border-transparent'
              }`}
            >
              {s}
            </button>
          ))}
        </nav>

        {/* コンテンツ */}
        <div className="space-y-5">
          {activeSection === 'アカウント' && (
            <>
              {/* アカウント情報 */}
              <section className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-lg)] p-7">
                <h2 className="font-[family-name:var(--font-noto-serif-jp)] font-bold text-[var(--text)] text-lg mb-1">アカウント情報</h2>
                <p className="text-xs text-[var(--text3)] mb-6">登録名とメールアドレスを管理します</p>

                {/* アバター */}
                <div className="flex items-center gap-5 pb-6 mb-6 border-b border-[var(--border)]">
                  <div
                    className="w-16 h-16 rounded-full bg-[var(--accent-l)] border-2 border-[var(--border)] flex items-center justify-center font-[family-name:var(--font-noto-serif-jp)] text-2xl font-bold text-[var(--accent)]"
                    aria-hidden="true"
                  >
                    {accountInitial}
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--text)] mb-1">{name.trim() || '名前未設定'}</p>
                    <span className="border border-[var(--border)] text-[var(--text3)] text-[11px] font-semibold px-2.5 py-1 rounded-[var(--r-sm)] opacity-50 cursor-not-allowed select-none">
                      アイコンは現在準備中です
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[13px] font-semibold text-[var(--text)] mb-1.5">表示名</label>
                    <TextInput
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="例: 山田 太郎"
                    />
                  </div>
                </div>

                {saveError && (
                  <p className="mt-4 bg-[var(--err-l)] text-[var(--err)] rounded-[var(--r-sm)] px-4 py-3 text-sm">
                    {saveError}
                  </p>
                )}

                <div className="mt-5 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving || !hasUnsavedChanges}
                    className="bg-[var(--accent)] text-white text-sm font-semibold px-4 py-2 rounded-[var(--r-sm)] hover:bg-[var(--accent-h)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
                  >
                    {saving ? '保存中...' : '変更を保存する'}
                  </button>
                  {saved && (
                    <span className="text-[13px] text-[var(--teal)] font-semibold">✓ 保存しました</span>
                  )}
                </div>
              </section>

              {/* アカウント削除 */}
              <section className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-lg)] p-7">
                <h2 className="font-[family-name:var(--font-noto-serif-jp)] font-bold text-[var(--text)] text-lg mb-1">アカウントを削除</h2>
                <p className="text-xs text-[var(--text3)] mb-5">取り消せない操作です</p>
                <div className="border border-[var(--err-l)] rounded-xl p-5">
                  <h3 className="font-semibold text-[var(--err)] mb-1.5">アカウントを削除する</h3>
                  <p className="text-[13px] text-[var(--text2)] leading-[1.75] mb-4">
                    すべての取材先・取材メモ・記事素材が完全に削除されます。この操作は取り消せません。削除前にデータをエクスポートしてください。
                  </p>
                  <button
                    type="button"
                    className="bg-[var(--err)] text-white text-sm font-semibold px-4 py-2 rounded-[var(--r-sm)] hover:opacity-90 transition-opacity cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--err)]/40"
                  >
                    アカウントを削除する
                  </button>
                </div>
              </section>
            </>
          )}

          {activeSection === 'プラン・請求' && (
            <section className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-lg)] p-7">
              <h2 className="font-[family-name:var(--font-noto-serif-jp)] font-bold text-[var(--text)] text-lg mb-1">現在のプラン</h2>
              <p className="text-xs text-[var(--text3)] mb-6">プランの確認・変更ができます</p>

              <div className="bg-[var(--accent-l)] border border-[rgba(194,114,42,0.25)] rounded-xl p-5 flex items-center justify-between mb-5">
                <div>
                  <p className="text-[11px] text-[var(--accent)] font-semibold tracking-[0.08em] uppercase mb-1">現在のプラン</p>
                  <p className="font-[family-name:var(--font-noto-serif-jp)] font-bold text-[var(--accent)] text-xl">Free</p>
                </div>
                <a
                  href="/pricing"
                  className="bg-[var(--accent)] text-white text-sm font-semibold px-4 py-2 rounded-[var(--r-sm)] hover:bg-[var(--accent-h)] transition-colors"
                >
                  アップグレード →
                </a>
              </div>

              <div>
                <div className="flex justify-between text-xs text-[var(--text2)] mb-1.5">
                  <span>今月の取材回数</span>
                  <span className="font-semibold">{interviewCount === null ? '...' : `${interviewCount} 回`}</span>
                </div>
              </div>

              <div className="mt-5 bg-[var(--bg2)] rounded-xl p-4">
                <p className="text-[13px] font-semibold text-[var(--text)] mb-3">Standardにアップグレードで</p>
                {['月10回の取材', '詳細HP分析レポート', '記事素材 月10本'].map((f) => (
                  <div key={f} className="flex items-center gap-2 text-[13px] text-[var(--text2)] py-1">
                    <span className="text-[var(--teal)] font-bold flex-shrink-0">✓</span>
                    {f}
                  </div>
                ))}
                <a
                  href="/pricing"
                  className="mt-3 inline-flex bg-[var(--accent)] text-white text-sm font-semibold px-4 py-2 rounded-[var(--r-sm)] hover:bg-[var(--accent-h)] transition-colors"
                >
                  プランを見る →
                </a>
              </div>
            </section>
          )}

          {activeSection === '通知' && (
            <section className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-lg)] p-7">
              <h2 className="font-[family-name:var(--font-noto-serif-jp)] font-bold text-[var(--text)] text-lg mb-1">通知設定</h2>
              <p className="text-xs text-[var(--text3)] mb-3">メール通知の受信設定を管理します</p>
              <div className="text-[12px] text-[var(--text3)] bg-[var(--bg2)] rounded-lg px-3 py-2 mb-5">通知設定の保存機能は現在準備中です</div>

              <div className="space-y-0">
                {NOTIFICATIONS.map((n, i) => (
                  <div
                    key={n.label}
                    className={`flex items-center justify-between py-4 gap-4 ${i > 0 ? 'border-t border-[var(--border)]' : ''}`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-[var(--text)] mb-0.5">{n.label}</p>
                      <p className="text-xs text-[var(--text3)]">{n.desc}</p>
                    </div>
                    <Toggle
                      on={notifOn[i]}
                      onToggle={() => setNotifOn((prev) => prev.map((v, idx) => idx === i ? !v : v))}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeSection === 'セキュリティ' && (
            <section className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-lg)] p-7">
              <h2 className="font-[family-name:var(--font-noto-serif-jp)] font-bold text-[var(--text)] text-lg mb-1">セキュリティ</h2>
              <p className="text-xs text-[var(--text3)] mb-6">ログインセッションとパスワードの管理</p>

              <div className="bg-[var(--bg2)] border border-[var(--border)] rounded-xl p-5 text-center">
                <p className="text-[13px] text-[var(--text2)] mb-1">パスワード変更は現在準備中です</p>
                <p className="text-[12px] text-[var(--text3)]">ご不便をおかけします。しばらくお待ちください。</p>
              </div>
            </section>
          )}
        </div>
      </div>
    </AppShell>
  )
}
