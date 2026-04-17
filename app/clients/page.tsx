import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-stone-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-xl font-semibold text-stone-800">クライアント一覧</h1>
          <Link
            href="/clients/new"
            className="px-4 py-2 bg-stone-800 text-white text-sm rounded-lg hover:bg-stone-700 transition-colors"
          >
            + 追加
          </Link>
        </div>

        {clients && clients.length > 0 ? (
          <ul className="space-y-3">
            {clients.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/clients/${c.id}`}
                  className="block p-4 bg-white rounded-xl border border-stone-100 hover:border-stone-300 transition-colors"
                >
                  <p className="font-medium text-stone-800">{c.name}</p>
                  <p className="text-sm text-stone-400 mt-1">{c.url}</p>
                  {c.industry_memo && (
                    <p className="text-sm text-stone-500 mt-1">{c.industry_memo}</p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-16 text-stone-400">
            <p>まだクライアントがいません</p>
            <Link href="/clients/new" className="text-stone-600 underline mt-2 inline-block">
              最初のクライアントを追加する
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
