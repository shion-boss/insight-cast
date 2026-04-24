import type { Metadata } from "next";
import { Geist_Mono, Noto_Sans_JP, Shippori_Mincho } from "next/font/google";
import ProjectAnalysisNotifier from "@/components/project-analysis-notifier";
import ToastViewport from "@/components/toast-viewport";
import { PageTransitionOverlay } from "@/components/page-transition-overlay";
import { NavigationOverlay } from "@/components/navigation-overlay";
import GoogleAnalytics from "@/app/components/google-analytics";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const shipporiMincho = Shippori_Mincho({
  variable: "--font-noto-serif-jp",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: 'Insight Cast',
    template: '%s | Insight Cast',
  },
  description: 'AI取材で、ホームページにまだ書けていない価値を引き出し、記事や訴求素材までつなげるサービス。',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${notoSansJP.variable} ${geistMono.variable} ${shipporiMincho.variable} antialiased`}
      >
        <ProjectAnalysisNotifier />
        <ToastViewport />
        <PageTransitionOverlay />
        <NavigationOverlay />
        {children}
        <GoogleAnalytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
