import type { Metadata, Viewport } from "next";
import { Geist_Mono, M_PLUS_1p } from "next/font/google";
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
});

const mplus1p = M_PLUS_1p({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://insight-cast.jp'

export const metadata: Metadata = {
  title: {
    default: 'Insight Cast',
    template: '%s | Insight Cast',
  },
  description: '動物AIインタビュアーが取材して、ホームページにまだ書けていない価値を引き出します。更新が止まったHPを、一次情報で少しずつ強くします。',
  metadataBase: new URL(APP_URL),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Insight Cast',
    description: '動物AIインタビュアーが取材して、ホームページにまだ書けていない価値を引き出します。',
    url: APP_URL,
    siteName: 'Insight Cast',
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Insight Cast',
    description: '動物AIインタビュアーが取材して、ホームページにまだ書けていない価値を引き出します。',
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
    <html lang="ja">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body
        className={`${mplus1p.variable} ${geistMono.variable} antialiased`}
      >
        <ProjectAnalysisNotifier />
        <ToastViewport />
        <PageTransitionOverlay />
        <NavigationOverlay />
        {children}
        <GoogleAnalytics />
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
