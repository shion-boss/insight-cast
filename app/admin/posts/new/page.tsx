import { Breadcrumb } from '@/components/ui'
import { PostFormClient } from '../PostFormClient'

export default function AdminPostNewPage() {
  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb items={[
          { label: '管理', href: '/admin' },
          { label: '記事管理', href: '/admin/posts' },
          { label: '新規作成' },
        ]} />
        <h1 className="font-serif text-2xl font-bold text-[var(--text)]">新しい記事を書く</h1>
      </div>

      <PostFormClient mode="new" />
    </div>
  )
}
