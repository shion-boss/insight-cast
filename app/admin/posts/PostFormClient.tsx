'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { TextInput, PrimaryButton, SecondaryButton, FieldLabel } from '@/components/ui'
import { createPost, updatePost, deletePost, type PostFormData } from '@/lib/actions/admin-posts'

type PostFormProps = {
  mode: 'new' | 'edit'
  id?: string
  defaultValues?: Partial<PostFormData>
}

const CATEGORY_OPTIONS = [
  { value: 'insight-cast', label: 'サービス紹介' },
  { value: 'interview', label: 'インタビュー' },
  { value: 'case', label: '事例' },
  { value: 'news', label: 'お知らせ' },
]

const TYPE_OPTIONS = [
  { value: 'normal', label: '通常記事' },
  { value: 'interview', label: 'インタビュー風記事' },
]

const INTERVIEWER_OPTIONS = [
  { value: '', label: '（なし）' },
  { value: 'mint', label: 'ミント（猫）' },
  { value: 'claus', label: 'クラウス（フクロウ）' },
  { value: 'rain', label: 'レイン（キツネ）' },
]

function slugify(text: string): string {
  const ascii = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
  if (ascii) return ascii
  // 日本語など非ASCII タイトルは日付+ランダムsuffixにフォールバック
  const date = new Date().toISOString().slice(0, 10)
  const suffix = Math.random().toString(36).slice(2, 7)
  return `${date}-${suffix}`
}

const selectClass =
  'min-h-11 w-full rounded-[var(--r-sm)] border-[1.5px] border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] transition-colors duration-150 hover:border-[var(--border2)] focus:outline-none focus:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40'

export function PostFormClient({ mode, id, defaultValues }: PostFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isDeleting, startDeleteTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const defaultSlug = defaultValues?.slug ?? (mode === 'new' ? slugify('') : '')

  const [form, setForm] = useState<PostFormData>({
    slug: defaultSlug,
    title: defaultValues?.title ?? '',
    excerpt: defaultValues?.excerpt ?? '',
    category: defaultValues?.category ?? 'insight-cast',
    type: defaultValues?.type ?? 'normal',
    interviewer: defaultValues?.interviewer ?? null,
    cover_color: defaultValues?.cover_color ?? 'bg-gradient-to-br from-stone-200 to-stone-300',
    date: defaultValues?.date ?? today,
    published: defaultValues?.published ?? false,
    body: defaultValues?.body ?? '',
  })

  function handleChange<K extends keyof PostFormData>(key: K, value: PostFormData[K]) {
    setForm((prev: PostFormData) => ({ ...prev, [key]: value }))
    setHasChanges(true)
    setSuccessMsg(null)
  }

  function handleTitleChange(title: string) {
    handleChange('title', title)
  }

  function handleSave() {
    setErrorMsg(null)
    setSuccessMsg(null)

    startTransition(async () => {
      if (mode === 'new') {
        const result = await createPost(form)
        if ('error' in result) {
          setErrorMsg(result.error)
          return
        }
        router.push(`/admin/posts/${result.id}/edit`)
      } else {
        if (!id) return
        const result = await updatePost(id, form)
        if ('error' in result) {
          setErrorMsg(result.error)
          return
        }
        setHasChanges(false)
        setSuccessMsg('保存しました')
      }
    })
  }

  function handleDelete() {
    if (!id) return
    if (!confirm('この記事を削除しますか？この操作は元に戻せません。')) return

    setErrorMsg(null)
    startDeleteTransition(async () => {
      const result = await deletePost(id)
      if ('error' in result) {
        setErrorMsg(result.error)
        return
      }
      router.push('/admin/posts')
    })
  }

  return (
    <div className="space-y-8">
      {/* エラー・成功メッセージ */}
      {errorMsg && (
        <div className="rounded-[var(--r-sm)] bg-[var(--err-l)] px-4 py-3 text-sm text-[var(--err)]">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="rounded-[var(--r-sm)] bg-[var(--ok-l)] px-4 py-3 text-sm text-[var(--ok)]">
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* メインカラム */}
        <div className="space-y-5">
          <div>
            <FieldLabel required>タイトル</FieldLabel>
            <TextInput
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="記事のタイトルを入力してください"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <FieldLabel required>スラッグ（URL）</FieldLabel>
              <button
                type="button"
                onClick={() => handleChange('slug', slugify(form.title || ''))}
                className="text-xs text-[var(--accent)] hover:underline"
              >
                タイトルから生成
              </button>
            </div>
            <TextInput
              value={form.slug}
              onChange={(e) => handleChange('slug', e.target.value)}
              placeholder="url-slug-here"
              pattern="[a-z0-9-]+"
            />
            <p className="mt-1 text-xs text-stone-400">
              半角英数字とハイフンのみ。公開後は変更しないでください。
            </p>
          </div>

          <div>
            <FieldLabel>抜粋（一覧ページに表示されます）</FieldLabel>
            <textarea
              value={form.excerpt}
              onChange={(e) => handleChange('excerpt', e.target.value)}
              rows={3}
              placeholder="記事の概要を150字程度で書いてください"
              className="min-h-24 w-full rounded-[var(--r-sm)] border-[1.5px] border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] transition-colors duration-150 placeholder:text-[var(--text3)] hover:border-[var(--border2)] focus:outline-none focus:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 resize-y"
            />
          </div>

          <div>
            <FieldLabel>本文（Markdown）</FieldLabel>
            <textarea
              value={form.body ?? ''}
              onChange={(e) => handleChange('body', e.target.value)}
              rows={20}
              placeholder="## 見出し&#10;&#10;本文をMarkdown形式で入力してください..."
              className="min-h-96 w-full rounded-[var(--r-sm)] border-[1.5px] border-[var(--border)] bg-[var(--surface)] px-4 py-3 font-mono text-sm text-[var(--text)] transition-colors duration-150 placeholder:text-[var(--text3)] hover:border-[var(--border2)] focus:outline-none focus:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 resize-y"
            />
          </div>
        </div>

        {/* サイドカラム */}
        <div className="space-y-5">
          {/* 公開設定 */}
          <div className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4">
            <h3 className="text-sm font-semibold text-[var(--text)]">公開設定</h3>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => handleChange('published', e.target.checked)}
                className="h-4 w-4 rounded border-[var(--border)] accent-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
              />
              <span className="text-sm text-stone-700">公開する</span>
            </label>

            <div>
              <FieldLabel>公開日</FieldLabel>
              <TextInput
                type="date"
                value={form.date}
                onChange={(e) => handleChange('date', e.target.value)}
              />
            </div>
          </div>

          {/* 分類 */}
          <div className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4">
            <h3 className="text-sm font-semibold text-[var(--text)]">分類</h3>

            <div>
              <FieldLabel required>カテゴリ</FieldLabel>
              <select
                value={form.category}
                onChange={(e) => handleChange('category', e.target.value as PostFormData['category'])}
                className={selectClass}
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <FieldLabel required>記事タイプ</FieldLabel>
              <select
                value={form.type}
                onChange={(e) => handleChange('type', e.target.value as PostFormData['type'])}
                className={selectClass}
              >
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <FieldLabel>インタビュアー</FieldLabel>
              <select
                value={form.interviewer ?? ''}
                onChange={(e) => handleChange('interviewer', e.target.value || null)}
                className={selectClass}
              >
                {INTERVIEWER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* カバーカラー */}
          <div className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 space-y-3">
            <h3 className="text-sm font-semibold text-[var(--text)]">カバーカラー</h3>
            <div>
              <TextInput
                value={form.cover_color}
                onChange={(e) => handleChange('cover_color', e.target.value)}
                placeholder="bg-emerald-100"
              />
              <p className="mt-1 text-[12px] text-[var(--text3)]">Tailwind CSSのクラス名を入力</p>
            </div>
            {/* プレビュー */}
            <div className={`h-12 rounded-xl ${form.cover_color}`} aria-hidden="true" />
          </div>

          {/* アクションボタン */}
          <div className="space-y-3">
            <PrimaryButton
              onClick={handleSave}
              disabled={isPending || (!hasChanges && mode === 'edit')}
              className="w-full justify-center"
            >
              {isPending
                ? '保存中...'
                : mode === 'new'
                  ? '記事を作成する'
                  : hasChanges
                    ? '変更を保存する'
                    : '保存済み'}
            </PrimaryButton>

            {mode === 'edit' && (
              <SecondaryButton
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-full justify-center border-red-200 text-red-600 hover:border-red-400 hover:bg-red-50"
              >
                {isDeleting ? '削除中...' : 'この記事を削除する'}
              </SecondaryButton>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
