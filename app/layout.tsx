import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import Script from "next/script";
import ToastViewport from "@/components/toast-viewport";
import { PageTransitionOverlay } from "@/components/page-transition-overlay";
import { NavigationOverlay } from "@/components/navigation-overlay";
import GoogleAnalytics from "@/app/components/google-analytics";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

// 日本語本文フォントは OS の高品質システムフォント（Hiragino Sans / Yu Gothic /
// Noto Sans JP）にフォールバックする。M PLUS 1p を Google Fonts から読み込む
// と、Latin subset 指定でも 379 個の @font-face 宣言と 25MB の woff2 が生成
// され CSS bundle が 281KB 膨張するため。視覚差はほぼ無く、render-blocking
// な CSS と font 読み込みを排除できる。font-family 指定側 (globals.css) で
// 明示的に system stack を使う。
//
// Geist Mono は tool / admin の <pre> ブロックでのみ使うため、root では
// ロードしない（marketing pages の CSS から 1.2KB の @font-face 宣言と
// woff2 preload を排除して render-blocking を削る）。tool / admin layout
// 側で next/font/google から個別に読み込む。

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://insight-cast.jp').replace(/\/$/, '')

export const metadata: Metadata = {
  title: {
    default: 'Insight Cast',
    template: '%s | Insight Cast',
  },
  description: 'AIキャストがあなたに取材し、ホームページにまだ書けていない事業の価値を引き出すサービスです。更新が止まったHPを一次情報で少しずつ強くします。中小事業者向けのHP継続強化サービスです。',
  icons: {
    icon: [
      { url: '/favicon64.ico', sizes: '64x64', type: 'image/x-icon' },
      { url: '/favicon128.ico', sizes: '128x128', type: 'image/x-icon' },
    ],
    apple: { url: '/favicon128.ico', sizes: '128x128', type: 'image/x-icon' },
  },
  metadataBase: new URL(APP_URL),
  alternates: {
    canonical: '/',
    languages: {
      'ja': 'https://insight-cast.jp',
    },
  },
  openGraph: {
    title: 'Insight Cast',
    description: '動物AIインタビュアーが取材して、ホームページにまだ書けていない価値を引き出します。',
    url: APP_URL,
    siteName: 'Insight Cast',
    locale: 'ja_JP',
    type: 'website',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Insight Cast — 動物AIインタビュアーチーム' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Insight Cast',
    description: '動物AIインタビュアーが取材して、ホームページにまだ書けていない価値を引き出します。',
    images: ['/og-image.jpg'],
  },
  formatDetection: {
    telephone: false,
    date: false,
    address: false,
    email: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#c2722a',
  colorScheme: 'light',
};

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Insight Cast',
  url: APP_URL,
  description: '動物AIインタビュアーが取材して、ホームページにまだ書けていない価値を引き出します。更新が止まったHPを、一次情報で少しずつ強くします。',
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    email: 'info@insight-cast.jp',
    availableLanguage: 'Japanese',
    url: `${APP_URL}/contact`,
  },
  inLanguage: 'ja',
}

const softwareAppJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Insight Cast',
  url: APP_URL,
  applicationCategory: 'BusinessApplication',
  description: '動物AIインタビュアーが取材して、ホームページにまだ書けていない価値を引き出します。更新が止まったHPを、一次情報で少しずつ強くします。',
  operatingSystem: 'Web',
  offers: {
    '@type': 'AggregateOffer',
    priceCurrency: 'JPY',
    lowPrice: '0',
    highPrice: '14800',
  },
  inLanguage: 'ja',
}

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Insight Cast',
  url: APP_URL,
  inLanguage: 'ja',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${APP_URL}/blog?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" data-scroll-behavior="smooth">
      <head>
        {/* GTM/GA を lazyOnload で読み込むが、TLS ハンドシェイクを先行させる
            ことで初回計測 ping のレイテンシを 100〜300ms 削れる。 */}
        <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        {/* Atom feed の発見可能化（Feedly / Google News / LLM 検索ボットに blog
            と cast-talk の更新を通知するため）。 */}
        <link rel="alternate" type="application/atom+xml" title="Insight Cast Blog" href="/blog/feed.xml" />
        <link rel="alternate" type="application/atom+xml" title="Insight Cast — Cast Talk" href="/cast-talk/feed.xml" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body
        className="antialiased"
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-[var(--shape-sm)] focus:bg-[var(--primary)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[var(--on-primary)] focus:shadow-[var(--elevation-3)] focus:outline-none"
        >
          メインコンテンツへスキップ
        </a>
        <ToastViewport />
        <PageTransitionOverlay />
        <Suspense><NavigationOverlay /></Suspense>
        {children}
        <GoogleAnalytics />
        {process.env.NODE_ENV === 'production' && <SpeedInsights />}
        {process.env.NODE_ENV === 'production' && <Analytics />}
        {/* Service Worker 登録（public site のみキャッシュ、認証済みアプリ側はキャッシュしない）。
            requestIdleCallback で遅延し、初回描画後のメインスレッド空き時間で登録する。
            これにより初回訪問の INP / TBT を悪化させない。 */}
        <Script
          id="sw-register"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                var register = function () {
                  navigator.serviceWorker.register('/sw.js').catch(function () {});
                };
                if ('requestIdleCallback' in window) {
                  requestIdleCallback(register, { timeout: 4000 });
                } else {
                  setTimeout(register, 2000);
                }
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
