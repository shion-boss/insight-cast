import { Breadcrumb } from '@/components/ui'

type ServiceStatus = 'active' | 'free' | 'inactive'

type Service = {
  name: string
  description: string
  role: string
  status: ServiceStatus
  plan: string
  dashboardUrl: string
  envKeys?: string[]
}

const SERVICES: Service[] = [
  {
    name: 'Anthropic',
    description: 'Claude API',
    role: 'インタビュー会話・記事生成・HP分析のAI処理',
    status: 'active',
    plan: '従量課金（API）',
    dashboardUrl: 'https://console.anthropic.com',
    envKeys: ['ANTHROPIC_API_KEY'],
  },
  {
    name: 'Supabase',
    description: 'データベース・認証・ストレージ',
    role: 'ユーザー認証・全データの永続化・ファイルストレージ',
    status: 'free',
    plan: 'Free（無料枠）',
    dashboardUrl: 'https://supabase.com/dashboard',
    envKeys: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'],
  },
  {
    name: 'Vercel',
    description: 'ホスティング・デプロイ',
    role: 'Next.jsアプリのビルド・配信・サーバーレス関数の実行',
    status: 'free',
    plan: 'Hobby（無料）',
    dashboardUrl: 'https://vercel.com/dashboard',
    envKeys: [],
  },
  {
    name: 'Firecrawl',
    description: 'Webスクレイピング',
    role: '取材先・競合HPのMarkdown取得（HP分析の入力データ）',
    status: 'active',
    plan: '従量課金',
    dashboardUrl: 'https://www.firecrawl.dev/app',
    envKeys: ['FIRECRAWL_API_KEY'],
  },
  {
    name: 'Stripe',
    description: '決済・サブスク管理',
    role: 'クレジットカード決済・サブスクリプション管理・Webhook受信',
    status: 'active',
    plan: '従量課金（2.9% + ¥30/件）',
    dashboardUrl: 'https://dashboard.stripe.com',
    envKeys: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'STRIPE_PRICE_ID_PERSONAL', 'STRIPE_PRICE_ID_BUSINESS'],
  },
  {
    name: 'Resend',
    description: 'メール送信',
    role: '問い合わせ受信通知・（将来）分析完了通知',
    status: 'free',
    plan: 'Free（3,000通/月）',
    dashboardUrl: 'https://resend.com/overview',
    envKeys: ['RESEND_API_KEY'],
  },
  {
    name: 'Google OAuth',
    description: 'ソーシャルログイン',
    role: 'Googleアカウントによるユーザー認証（Supabase経由）',
    status: 'free',
    plan: '無料',
    dashboardUrl: 'https://console.cloud.google.com',
    envKeys: [],
  },
  {
    name: 'GitHub',
    description: 'コード管理',
    role: 'ソースコードのバージョン管理・Issue・Pull Request管理',
    status: 'free',
    plan: '無料',
    dashboardUrl: 'https://github.com',
    envKeys: [],
  },
  {
    name: 'Google Analytics',
    description: 'アクセス解析',
    role: '公開サイトのPV・ユーザー行動の計測',
    status: 'free',
    plan: '無料',
    dashboardUrl: 'https://analytics.google.com',
    envKeys: ['NEXT_PUBLIC_GA_ID'],
  },
  {
    name: 'Google Search Console',
    description: '検索パフォーマンス計測・連携',
    role: '取材先HPの検索流入データ取得（キーワード・表示回数・CTR）',
    status: 'active',
    plan: '無料',
    dashboardUrl: 'https://search.google.com/search-console',
    envKeys: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
  },
  {
    name: 'OpenAI',
    description: 'GPT API',
    role: '記事生成・テキスト処理の補助（Anthropicと併用）',
    status: 'active',
    plan: '従量課金（API）',
    dashboardUrl: 'https://platform.openai.com',
    envKeys: ['OPENAI_API_KEY'],
  },
  {
    name: 'お名前.com',
    description: 'ドメイン管理',
    role: 'insight-cast.jp ドメインの登録・DNS管理・更新',
    status: 'active',
    plan: '年額課金',
    dashboardUrl: 'https://www.onamae.com',
    envKeys: [],
  },
]

const STATUS_STYLES: Record<ServiceStatus, { badge: string; label: string }> = {
  active: { badge: 'bg-[var(--ok-l)] text-[var(--ok)]', label: '稼働中' },
  free:   { badge: 'bg-[var(--bg2)] text-[var(--text3)] border border-[var(--border)]', label: '無料枠' },
  inactive: { badge: 'bg-red-50 text-red-500', label: '未使用' },
}

export default function AdminServicesPage() {
  return (
    <div className="space-y-8">
      <Breadcrumb items={[{ label: '管理', href: '/admin' }, { label: '関連サービス' }]} />
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">関連サービス</h1>
        <p className="mt-1 text-sm text-[var(--text2)]">Insight Cast が利用する外部サービスの一覧</p>
      </div>

      <div className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)]">
        {SERVICES.map((svc, i) => (
          <div
            key={svc.name}
            className={`px-5 py-4 ${i < SERVICES.length - 1 ? 'border-b border-[var(--border)]' : ''}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-[var(--text)]">{svc.name}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLES[svc.status].badge}`}>
                    {STATUS_STYLES[svc.status].label}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-[var(--text3)]">{svc.description} — {svc.plan}</p>
                <p className="mt-1.5 text-sm text-[var(--text2)]">{svc.role}</p>
                {svc.envKeys && svc.envKeys.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {svc.envKeys.map((key) => (
                      <code key={key} className="rounded bg-[var(--bg2)] px-1.5 py-0.5 text-[11px] text-[var(--text3)]">
                        {key}
                      </code>
                    ))}
                  </div>
                )}
              </div>
              <a
                href={svc.dashboardUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-[var(--r-sm)] border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text2)] transition-colors hover:bg-[var(--bg2)] hover:text-[var(--text)]"
              >
                ダッシュボード <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
