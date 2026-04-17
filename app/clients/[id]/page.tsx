import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (!client) notFound()

  const { data: sessions } = await supabase
    .from('interview_sessions')
    .select('*')
    .eq('client_id', id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-stone-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link href="/clients" className="text-sm text-stone-400 hover:text-stone-600">
            ← 一覧に戻る
          </Link>
          <h1 className="text-xl font-semibold text-stone-800 mt-4">{client.name}</h1>
          <a href={client.url} target="_blank" rel="noopener noreferrer"
            className="text-sm text-stone-400 hover:text-stone-600 underline">
            {client.url}
          </a>
          {client.industry_memo && (
            <p className="text-sm text-stone-500 mt-1">{client.industry_memo}</p>
          )}
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-stone-600">インタビュー</h2>
          <Link
            href={`/clients/${id}/interview/new`}
            className="px-3 py-1.5 bg-stone-800 text-white text-sm rounded-lg hover:bg-stone-700 transition-colors"
          >
            + 新しくはじめる
          </Link>
        </div>

        {sessions && sessions.length > 0 ? (
          <ul className="space-y-3">
            {sessions.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/clients/${id}/interview/${s.id}`}
                  className="flex items-center justify-between p-4 bg-white rounded-xl border border-stone-100 hover:border-stone-300 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-stone-800 capitalize">{s.character_id}</p>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {new Date(s.created_at).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    s.status === 'completed'
                      ? 'bg-stone-100 text-stone-500'
                      : 'bg-green-50 text-green-600'
                  }`}>
                    {s.status === 'completed' ? '完了' : '進行中'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-12 text-stone-400">
            <p>まだインタビューがありません</p>
          </div>
        )}
      </div>
    </div>
  )
}
