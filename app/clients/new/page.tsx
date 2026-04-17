import { createClientRecord } from '@/lib/actions/clients'
import Link from 'next/link'

export default function NewClientPage() {
  return (
    <div className="min-h-screen bg-stone-50 p-8">
      <div className="max-w-md mx-auto">
        <div className="mb-8">
          <Link href="/clients" className="text-sm text-stone-400 hover:text-stone-600">
            ← 一覧に戻る
          </Link>
          <h1 className="text-xl font-semibold text-stone-800 mt-4">クライアントを追加</h1>
        </div>

        <form action={createClientRecord} className="bg-white p-6 rounded-xl border border-stone-100 space-y-5">
          <div>
            <label className="block text-sm text-stone-600 mb-1">
              店舗・企業名 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="例: 山田工務店"
              className="w-full px-4 py-2 border border-stone-200 rounded-lg text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300"
            />
          </div>
          <div>
            <label className="block text-sm text-stone-600 mb-1">
              HP の URL <span className="text-red-400">*</span>
            </label>
            <input
              type="url"
              name="url"
              required
              placeholder="https://example.com"
              className="w-full px-4 py-2 border border-stone-200 rounded-lg text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300"
            />
          </div>
          <div>
            <label className="block text-sm text-stone-600 mb-1">業種メモ（任意）</label>
            <input
              type="text"
              name="industry_memo"
              placeholder="例: 地域の工務店、リフォーム中心"
              className="w-full px-4 py-2 border border-stone-200 rounded-lg text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors"
          >
            追加する
          </button>
        </form>
      </div>
    </div>
  )
}
