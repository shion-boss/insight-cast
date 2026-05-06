import Script from 'next/script'

// SRI (Subresource Integrity) について:
// Next.js の <Script> コンポーネントは integrity / crossOrigin 属性を直接サポートしていない。
// GTM スクリプトは CDN で配信され SRI ハッシュが固定されないため、SRI は適用できない仕様。
//
// 戦略: lazyOnload を採用。GA は計測目的で初回描画より後でよいので、
// window.load 完了後にロードする。afterInteractive だと TBT/INP に
// 153 KiB の GTM が乗り、LCP の競合になるため。
export default function GoogleAnalytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID
  if (!gaId) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="lazyOnload"
      />
      <Script id="ga-init" strategy="lazyOnload">
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
