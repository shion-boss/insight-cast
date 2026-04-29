import type { NextConfig } from "next";

// TODO(P-3): Bundle Analyzer の設定
// @next/bundle-analyzer をインストール後、以下を有効化する:
//   npm install --save-dev @next/bundle-analyzer
// const withBundleAnalyzer = require('@next/bundle-analyzer')({ enabled: process.env.ANALYZE === 'true' })
// export default withBundleAnalyzer(nextConfig)

// ワイルドカード **.supabase.co は任意のサブドメインを許可するためセキュリティリスクがある。
// 環境変数からプロジェクト固有のホスト名を取得して限定する。
// 環境変数が未設定の場合（CI など）はフォールバックとしてワイルドカードを使う。
const supabaseImageHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : '**.supabase.co'

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: supabaseImageHost },
    ],
  },
  experimental: {
    // marked と dompurify はクライアント側で使用されるため tree-shaking を最適化
    optimizePackageImports: ['marked', 'dompurify'],
  },
  webpack: (config) => {
    // Node.js 22/24 + webpack WASM hash bug workaround: use sha256 (no WASM dependency)
    config.output.hashFunction = "sha256";
    // Bust stale Vercel build cache that causes ERR_INVALID_ARG_TYPE on sha256.update(undefined)
    config.output.hashSalt = "v3";
    return config;
  },
  async redirects() {
    return [
      { source: '/casts', destination: '/cast', permanent: true },
    ]
  },
  async headers() {
    const isDev = process.env.NODE_ENV === 'development'
    const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host
      : '*.supabase.co'

    const csp = [
      "default-src 'self'",
      // Next.js の hydration・インライン処理に unsafe-inline が必要
      // gtag.js が new Function() を使うため unsafe-eval も必要（unsafe-inline と同居するため実質的なリスク増なし）
      // 将来的には nonce ベースに移行する
      `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.googletagmanager.com https://va.vercel-scripts.com`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      `connect-src 'self' https://${supabaseHost} wss://${supabaseHost} https://api.stripe.com https://www.google-analytics.com https://www.googletagmanager.com https://*.vercel-insights.com`,
      "frame-src https://js.stripe.com https://hooks.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
    ].join('; ')

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: csp },
          ...(!isDev ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }] : []),
        ],
      },
    ];
  },
};

export default nextConfig;
