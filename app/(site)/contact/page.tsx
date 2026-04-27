import { CharacterAvatar, InterviewerSpeech } from '@/components/ui'
import { getCharacter } from '@/lib/characters'
import { ContactForm } from './_components/contact-form'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://insight-cast.jp'

export const metadata = {
  title: 'お問い合わせ | Insight Cast',
  description: 'Insight Cast へのご質問・ご相談はこちらから。まず気になることを聞かせてください。',
  alternates: { canonical: `${APP_URL}/contact` },
  openGraph: {
    title: 'お問い合わせ | Insight Cast',
    description: 'Insight Cast へのご質問・ご相談はこちらから。まず気になることを聞かせてください。',
    url: `${APP_URL}/contact`,
    siteName: 'Insight Cast',
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'お問い合わせ | Insight Cast',
    description: 'Insight Cast へのご質問・ご相談はこちらから。まず気になることを聞かせてください。',
  },
}

export default function ContactPage() {
  const mint = getCharacter('mint')

  return (
    <>


      <main className="relative z-10 bg-gradient-to-br from-[#fdf7f0] to-[#f5e8d8] px-6 pb-14 pt-[72px] sm:pb-24 sm:pt-[108px]">
        <div className="mx-auto max-w-lg">
          {/* キャラ吹き出し + キャッチ */}
          <div className="mb-10">
            <InterviewerSpeech
              icon={
                <CharacterAvatar
                  src={mint?.icon96}
                  alt="ミントのアイコン"
                  emoji={mint?.emoji}
                  size={56}
                  priority
                />
              }
              name="ミント"
              title="まず、気になることを聞かせてください。"
              description="「こんな使い方はできますか？」「まず何から始めればいいですか？」そんなところから聞かせてください。業種のことも、ホームページの状況も、何も準備しなくて大丈夫です。"
              tone="soft"
            />
          </div>

          {/* フォームカード */}
          <div className="rounded-[var(--r-xl)] border border-[var(--border)] bg-[var(--surface)] p-7 sm:p-9">
            <ContactForm />
          </div>

          {/* 補足文 */}
          <p className="mt-5 text-center text-xs leading-6 text-[var(--text3)]">
            通常2営業日以内にご返信します。強引な売り込みはしません。
          </p>
        </div>
      </main>


    </>
  )
}
