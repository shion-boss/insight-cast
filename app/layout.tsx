import type { Metadata, Viewport } from "next";
import { Geist_Mono, M_PLUS_1p } from "next/font/google";
import Script from "next/script";
import ProjectAnalysisNotifier from "@/components/project-analysis-notifier";
import ToastViewport from "@/components/toast-viewport";
import { PageTransitionOverlay } from "@/components/page-transition-overlay";
import { NavigationOverlay } from "@/components/navigation-overlay";
import GoogleAnalytics from "@/app/components/google-analytics";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const mplus1p = M_PLUS_1p({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://insight-cast.jp').replace(/\/$/, '')

export const metadata: Metadata = {
  title: {
    default: 'Insight Cast',
    template: '%s | Insight Cast',
  },
  description: '動物モチーフのAIキャストがあなたに取材し、ホームページにまだ書けていない事業の価値を引き出すサービスです。更新が止まったHPを一次情報で少しずつ強くします。中小事業者向けのHP継続強化サービスです。',
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
    images: [{ url: '/og-image.jpg', width: 600, height: 500, alt: 'Insight Cast チーム全員集合' }],
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
        className={`${mplus1p.variable} ${geistMono.variable} antialiased`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-[var(--r-sm)] focus:bg-[var(--accent)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:outline-none"
        >
          メインコンテンツへスキップ
        </a>
        <ProjectAnalysisNotifier />
        <ToastViewport />
        <PageTransitionOverlay />
        <NavigationOverlay />
        {children}
        <GoogleAnalytics />
        {process.env.NODE_ENV === 'production' && <SpeedInsights />}
        {process.env.NODE_ENV === 'production' && <Analytics />}
        {/* Service Worker 登録（public site のみキャッシュ、認証済みアプリ側はキャッシュしない） */}
        <Script
          id="sw-register"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js').catch(function() {});
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
