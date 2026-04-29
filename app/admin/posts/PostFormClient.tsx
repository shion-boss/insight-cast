'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { TextInput, PrimaryButton, SecondaryButton, FieldLabel } from '@/components/ui'
import { createPost, updatePost, deletePost, type PostFormData } from '@/lib/actions/admin-posts'
import { CHARACTERS } from '@/lib/characters'
import { ConfirmDialog } from '@/components/confirm-dialog'

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
  ...CHARACTERS.map((c) => ({ value: c.id, label: `${c.name}（${c.species}）` })),
]

function slugify(text: string): string {
  const ascii = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
  if (ascii) return ascii
  const date = new Date().toLocaleDateString('sv', { timeZone: 'Asia/Tokyo' })
  const suffix = crypto.randomUUID().slice(0, 8)
  return `${date}-${suffix}`
}

const selectClass =
  'min-h-11 w-full rounded-[var(--r-sm)] border-[1.5px] border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] transition-colors duration-150 hover:border-[var(--border2)] focus:outline-none focus:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40'

// ── ブロック型 ───────────────────────────────────────────
type Block =
  | { id: string; type: 'markdown'; content: string }
  | { id: string; type: 'embed'; content: string }

const EMBED_START = '<!-- EMBED_HTML_START -->'
const EMBED_END = '<!-- EMBED_HTML_END -->'

function bodyToBlocks(body: string): Block[] {
  const parts = body.split(new RegExp(`${EMBED_START}|${EMBED_END}`))
  const blocks: Block[] = []
  parts.forEach((part, i) => {
    const trimmed = part.trim()
    if (trimmed === '') return
    // 偶数インデックス = EMBED_START の前後なのでMarkdown、奇数 = embed内
    const isEmbed = i % 2 === 1
    blocks.push({ id: crypto.randomUUID(), type: isEmbed ? 'embed' : 'markdown', content: trimmed })
  })
  if (blocks.length === 0) blocks.push({ id: crypto.randomUUID(), type: 'markdown', content: '' })
  return blocks
}

function blocksToBody(blocks: Block[]): string {
  return blocks
    .map((b) =>
      b.type === 'embed'
        ? `${EMBED_START}\n${b.content}\n${EMBED_END}`
        : b.content
    )
    .join('\n\n')
}

function newBlock(type: Block['type']): Block {
  return { id: crypto.randomUUID(), type, content: '' }
}

// ── ブロックエディタ ─────────────────────────────────────
function AddBlockMenu({ onAdd }: { onAdd: (type: Block['type']) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div ref={ref} className="relative flex justify-center">
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-dashed border-[var(--border)]" />
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative z-10 flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-0.5 text-xs text-[var(--text3)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
      >
        ＋ ブロックを追加
      </button>
      {open && (
        <div className="absolute top-7 z-20 flex gap-2 rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] p-2 shadow-md">
          <button
            type="button"
            onClick={() => { onAdd('markdown'); setOpen(false) }}
            className="rounded px-3 py-1.5 text-xs font-semibold text-[var(--text2)] hover:bg-[var(--bg2)] transition-colors"
          >
            Markdown
          </button>
          <button
            type="button"
            onClick={() => { onAdd('embed'); setOpen(false) }}
            className="rounded px-3 py-1.5 text-xs font-semibold text-[var(--text2)] hover:bg-[var(--bg2)] transition-colors"
          >
            埋め込みHTML
          </button>
        </div>
      )}
    </div>
  )
}

function BlockEditor({
  blocks,
  onChange,
}: {
  blocks: Block[]
  onChange: (blocks: Block[]) => void
}) {
  function updateContent(id: string, content: string) {
    onChange(blocks.map((b) => (b.id === id ? { ...b, content } : b)))
  }

  function removeBlock(id: string) {
    const next = blocks.filter((b) => b.id !== id)
    onChange(next.length > 0 ? next : [newBlock('markdown')])
  }

  function insertAfter(index: number, type: Block['type']) {
    const next = [...blocks]
    next.splice(index + 1, 0, newBlock(type))
    onChange(next)
  }

  return (
    <div className="space-y-3">
      {blocks.map((block, i) => (
        <div key={block.id}>
          {block.type === 'markdown' ? (
            <div className="group relative">
              <div className="absolute right-2 top-2 hidden items-center gap-1 group-hover:flex">
                <span className="rounded bg-[var(--bg2)] px-1.5 py-0.5 text-xs text-[var(--text3)]">Markdown</span>
                {blocks.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeBlock(block.id)}
                    className="rounded bg-[var(--bg2)] px-1.5 py-0.5 text-xs text-[var(--text3)] hover:text-red-500 transition-colors"
                  >
                    削除
                  </button>
                )}
              </div>
              <textarea
                aria-label={`本文ブロック ${i + 1}（Markdown）`}
                value={block.content}
                onChange={(e) => updateContent(block.id, e.target.value)}
                rows={10}
                placeholder="## 見出し&#10;&#10;本文をMarkdown形式で入力してください..."
                className="min-h-40 w-full rounded-[var(--r-sm)] border-[1.5px] border-[var(--border)] bg-[var(--surface)] px-4 py-3 font-mono text-sm text-[var(--text)] transition-colors duration-150 placeholder:text-[var(--text3)] hover:border-[var(--border2)] focus:outline-none focus:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 resize-y"
              />
            </div>
          ) : (
            <div className="group relative rounded-[var(--r-sm)] border-[1.5px] border-dashed border-[var(--accent)]/40 bg-[var(--accent)]/[0.03]">
              <div className="flex items-center justify-between border-b border-dashed border-[var(--accent)]/30 px-3 py-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)]/60">埋め込みHTML</span>
                <button
                  type="button"
                  onClick={() => removeBlock(block.id)}
                  className="text-[11px] text-[var(--text3)] hover:text-red-500 transition-colors"
                >
                  削除
                </button>
              </div>
              <textarea
                aria-label={`本文ブロック ${i + 1}（埋め込みHTML）`}
                value={block.content}
                onChange={(e) => updateContent(block.id, e.target.value)}
                rows={8}
                placeholder="<div>埋め込みHTMLをここに貼り付けてください</div>"
                className="w-full bg-transparent px-4 py-3 font-mono text-sm text-[var(--text)] placeholder:text-[var(--text3)] focus:outline-none resize-y"
              />
            </div>
          )}

          <div className="py-2">
            <AddBlockMenu onAdd={(type) => insertAfter(i, type)} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── メインフォーム ───────────────────────────────────────
export function PostFormClient({ mode, id, defaultValues }: PostFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isDeleting, startDeleteTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const handleSaveRef = useRef<(() => void) | null>(null)

  // JST での今日の日付（UTC のまま計算すると 0〜8 時台に前日になる）
  const today = new Date().toLocaleDateString('sv', { timeZone: 'Asia/Tokyo' })
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

  const [blocks, setBlocks] = useState<Block[]>(() => bodyToBlocks(defaultValues?.body ?? ''))

  function handleChange<K extends keyof PostFormData>(key: K, value: PostFormData[K]) {
    setForm((prev: PostFormData) => ({ ...prev, [key]: value }))
    setHasChanges(true)
    setSuccessMsg(null)
  }

  function handleBlocksChange(next: Block[]) {
    setBlocks(next)
    const body = blocksToBody(next)
    setForm((prev) => ({ ...prev, body }))
    setHasChanges(true)
    setSuccessMsg(null)
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

  handleSaveRef.current = handleSave

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSaveRef.current?.()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  function handleDeleteRequest() {
    if (!id) return
    setShowDeleteConfirm(true)
  }

  function handleDeleteConfirm() {
    if (!id) return
    setShowDeleteConfirm(false)
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
      {/* 削除確認ダイアログ */}
      {showDeleteConfirm && (
        <ConfirmDialog
          dialogId="post-form-delete"
          title="この記事を削除しますか？"
          description="この操作は元に戻せません。"
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={handleDeleteConfirm}
          confirming={isDeleting}
          confirmingLabel="削除中..."
        />
      )}
      {errorMsg && (
        <div role="alert" className="flex items-start gap-3 rounded-[var(--r-sm)] bg-[var(--err-l)] px-4 py-3 text-sm text-[var(--err)]">
          <span className="mt-0.5 shrink-0">⚠</span>
          <div>
            <p>{errorMsg}</p>
            <p className="mt-0.5 text-xs opacity-80">入力内容を確認してから、もう一度お試しください。</p>
          </div>
        </div>
      )}
      {successMsg && (
        <div role="status" className="rounded-[var(--r-sm)] bg-[var(--ok-l)] px-4 py-3 text-sm text-[var(--ok)]">
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* メインカラム */}
        <div className="space-y-5">
          <div>
            <FieldLabel required htmlFor="post-title">タイトル</FieldLabel>
            <TextInput
              id="post-title"
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="記事のタイトルを入力してください"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <FieldLabel required htmlFor="post-slug">スラッグ（URL）</FieldLabel>
              <button
                type="button"
                onClick={() => handleChange('slug', slugify(form.title || ''))}
                className="text-xs text-[var(--accent)] hover:underline"
              >
                タイトルから生成
              </button>
            </div>
            <TextInput
              id="post-slug"
              value={form.slug}
              onChange={(e) => handleChange('slug', e.target.value)}
              placeholder="url-slug-here"
              pattern="[a-z0-9-]+"
            />
            <p className="mt-1 text-xs text-[var(--text3)]">
              半角英数字とハイフンのみ。公開後は変更しないでください。
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <FieldLabel htmlFor="post-excerpt">抜粋（一覧ページに表示されます）</FieldLabel>
              <span className={`text-[11px] tabular-nums ${form.excerpt.length > 150 ? 'text-[var(--err)]' : 'text-[var(--text3)]'}`}>
                {form.excerpt.length} / 150
              </span>
            </div>
            <textarea
              id="post-excerpt"
              value={form.excerpt}
              onChange={(e) => handleChange('excerpt', e.target.value)}
              rows={3}
              placeholder="記事の概要を150字程度で書いてください"
              className="min-h-24 w-full rounded-[var(--r-sm)] border-[1.5px] border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] transition-colors duration-150 placeholder:text-[var(--text3)] hover:border-[var(--border2)] focus:outline-none focus:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 resize-y"
            />
          </div>

          <div>
            <FieldLabel>本文</FieldLabel>
            <BlockEditor blocks={blocks} onChange={handleBlocksChange} />
          </div>
        </div>

        {/* サイドカラム */}
        <div className="space-y-5">
          <div className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4">
            <h3 className="text-sm font-semibold text-[var(--text)]">公開設定</h3>

            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={form.published}
                aria-label={form.published ? '下書きに戻す' : '公開する'}
                onClick={() => {
                  const next = !form.published
                  setForm((prev) => ({ ...prev, published: next, ...(next ? { date: today } : {}) }))
                  setHasChanges(true)
                  setSuccessMsg(null)
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 ${form.published ? 'bg-[var(--ok)]' : 'bg-[var(--border2)]'}`}
              >
                <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${form.published ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
              <span className={`text-sm font-semibold ${form.published ? 'text-[var(--ok)]' : 'text-[var(--text3)]'}`}>
                {form.published ? '公開中' : '下書き'}
              </span>
            </div>

            <div>
              <FieldLabel htmlFor="post-date">公開日</FieldLabel>
              <TextInput
                id="post-date"
                type="date"
                value={form.date}
                onChange={(e) => handleChange('date', e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4">
            <h3 className="text-sm font-semibold text-[var(--text)]">分類</h3>

            <div>
              <FieldLabel required htmlFor="post-category">カテゴリ</FieldLabel>
              <select
                id="post-category"
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
              <FieldLabel required htmlFor="post-type">記事タイプ</FieldLabel>
              <select
                id="post-type"
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
              <FieldLabel htmlFor="post-interviewer">インタビュアー</FieldLabel>
              <select
                id="post-interviewer"
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
            <div className={`h-12 rounded-xl ${form.cover_color}`} aria-hidden="true" />
          </div>

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
            <p className="text-center text-[11px] text-[var(--text3)]">Ctrl+S / ⌘S でも保存できます</p>

            {mode === 'edit' && (
              <SecondaryButton
                onClick={handleDeleteRequest}
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
