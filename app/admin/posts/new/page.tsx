import Link from 'next/link'
import { PostFormClient } from '../PostFormClient'

export default function AdminPostNewPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/posts"
          className="text-sm text-[var(--text3)] transition-colors hover:text-[var(--text)]"
        >
          ← 記事一覧
        </Link>
        <h1 className="mt-2 font-serif text-2xl font-bold text-[var(--text)]">新しい記事を書く</h1>
      </div>

      <PostFormClient mode="new" />
    </div>
  )
}
