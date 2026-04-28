import Script from 'next/script'

// SRI (Subresource Integrity) について:
// Next.js の <Script> コンポーネントは integrity / crossOrigin 属性を直接サポートしていない。
// strategy="afterInteractive" による遅延ロードで XSS リスクを軽減している。
// GTM スクリプトは CDN で配信され SRI ハッシュが固定されないため、SRI は適用できない仕様。
export default function GoogleAnalytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID
  if (!gaId) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}');
        `}
      </Script>
    </>
  )
}
