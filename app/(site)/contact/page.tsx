import { PublicPageFrame } from '@/components/public-layout'
import { CharacterAvatar, InterviewerSpeech } from '@/components/ui'
import { getCharacter } from '@/lib/characters'
import { ContactForm } from './_components/contact-form'

export const metadata = {
  title: 'お問い合わせ | Insight Cast',
  description: 'Insight Cast へのご質問・ご相談はこちらから。まず気になることを聞かせてください。',
}

export default function ContactPage() {
  const mint = getCharacter('mint')

  return (
    <>


      <main className="relative z-10 bg-gradient-to-br from-[#fdf7f0] to-[#f5e8d8] px-6 pb-24 pt-[108px]">
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
                />
              }
              name="ミント"
              title="まず、気になることを聞かせてください。"
              description="Insight Cast がどんなサービスか、あなたのホームページに使えるかどうか、お気軽にご相談ください。"
              tone="soft"
            />
          </div>

          {/* フォームカード */}
          <div className="rounded-[var(--r-xl)] border border-[var(--border)] bg-[var(--surface)] p-7 sm:p-9">
            <ContactForm />
          </div>

          {/* 補足文 */}
          <p className="mt-5 text-center text-xs leading-6 text-[var(--text3)]">
            通常2営業日以内にご返信します。しつこい営業はしません。
          </p>
        </div>
      </main>


    </>
  )
}
