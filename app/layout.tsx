import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ProjectAnalysisNotifier from "@/components/project-analysis-notifier";
import ToastViewport from "@/components/toast-viewport";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ProjectAnalysisNotifier />
        <ToastViewport />
        {children}
      </body>
    </html>
  );
}
