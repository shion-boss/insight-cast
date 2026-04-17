import { createProject } from '@/lib/actions/projects'
import Link from 'next/link'

export default function NewProjectPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-100 px-6 py-4 flex items-center justify-between">
        <span className="font-semibold text-stone-800">Insight Cast</span>
        <Link href="/dashboard" className="text-sm text-stone-400 hover:text-stone-600">← 戻る</Link>
      </header>

      <div className="max-w-lg mx-auto px-6 py-12">
        <div className="flex items-start gap-3 mb-8">
          <span className="text-3xl">🦉</span>
          <div>
            <p className="text-stone-700 font-medium">調査したいホームページのURLを教えてください。</p>
            <p className="text-sm text-stone-400 mt-1">
              URLを登録すると、クラウスがホームページの調査を始めます。<br />
              競合サイトは次のステップで登録できます。
            </p>
          </div>
        </div>

        <form action={createProject} className="bg-white rounded-2xl border border-stone-100 p-6 space-y-4">
          <div>
            <label className="block text-sm text-stone-600 mb-1">プロジェクト名（任意）</label>
            <input
              type="text"
              name="name"
              placeholder="例: 山田工務店のHP"
              className="w-full px-4 py-2 border border-stone-200 rounded-lg text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
            />
          </div>
          <div>
            <label className="block text-sm text-stone-600 mb-1">
              自社HP URL <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="url"
              required
              placeholder="https://example.com"
              className="w-full px-4 py-2 border border-stone-200 rounded-lg text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
            />
            <p className="text-xs text-stone-400 mt-1">https:// がなくても大丈夫です</p>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-stone-800 text-white rounded-xl hover:bg-stone-700 cursor-pointer transition-colors text-sm"
          >
            次へ進む
          </button>
        </form>
      </div>
    </div>
  )
}
