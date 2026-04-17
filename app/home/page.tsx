import { signOut } from '@/lib/actions/auth'

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="text-center space-y-4">
        <p className="text-stone-500">ホーム（準備中）</p>
        <form action={signOut}>
          <button type="submit" className="text-sm text-stone-400 underline hover:text-stone-600">
            ログアウト
          </button>
        </form>
      </div>
    </div>
  )
}
