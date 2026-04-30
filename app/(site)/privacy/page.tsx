import type { Metadata } from 'next'

import { LegalPageTemplate } from '@/components/public-layout'

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://insight-cast.jp').replace(/\/$/, '')

export const metadata: Metadata = {
  title: 'プライバシーポリシー | Insight Cast',
  description: 'Insight Cast のプライバシーポリシーです。取得する情報の範囲、利用目的、外部サービスとの関係、Cookie利用など、個人情報の取り扱い方針を記載しています。',
  alternates: { canonical: `${APP_URL}/privacy` },
}

export default function PrivacyPage() {
  return (
    <LegalPageTemplate
      title="プライバシーポリシー"
      updatedAt="2026年4月28日"
      summary="取得する情報の範囲、利用目的、外部サービスとの関係、Cookie 利用など、個人情報の取り扱い方針を記載しています。"
    >
      <section>
        <h2>1. はじめに</h2>
        <p>
          Insight Cast（以下「当サービス」）は、利用者のプライバシーを尊重し、個人情報の保護に努めます。
          本ポリシーは、当サービスが収集する情報の種類・利用目的・管理方法についてご説明するものです。
          当サービスをご利用いただくことで、本ポリシーの内容にご同意いただいたものとみなします。
        </p>
      </section>

      <section>
        <h2>2. 収集する情報</h2>
        <p>当サービスでは、以下の情報を収集することがあります。</p>
        <ul>
          <li>メールアドレス（アカウント登録時）</li>
          <li>ホームページURL（プロジェクトとして登録する際）</li>
          <li>インタビューの入力内容（テキスト）</li>
          <li>サービス利用状況（アクセスログ、操作履歴等）</li>
        </ul>
      </section>

      <section>
        <h2>3. 情報の利用目的</h2>
        <p>収集した情報は、以下の目的で利用します。</p>
        <ul>
          <li>サービスの提供および機能改善</li>
          <li>お問い合わせへのサポート対応</li>
          <li>ご同意を得た場合に限るお知らせの送信</li>
        </ul>
      </section>

      <section>
        <h2>4. 情報の第三者提供</h2>
        <p>
          法令に基づく開示が必要な場合を除き、収集した情報を第三者に提供することはありません。
        </p>
      </section>

      <section>
        <h2>5. 情報の管理</h2>
        <p>
          当サービスは、以下の外部サービスを利用して情報を管理・処理しています。
          各サービスのセキュリティポリシーに準拠した形で情報を取り扱います。
        </p>
        <ul>
          <li>
            <strong>Supabase</strong>（データベース）: ユーザー情報・利用データの保存に使用。
            詳細: <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">supabase.com/privacy</a>
          </li>
          <li>
            <strong>Vercel</strong>（ホスティング）: アプリケーションの配信に使用。
            詳細: <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">vercel.com/legal/privacy-policy</a>
          </li>
          <li>
            <strong>Anthropic</strong>（AIインタビュー応答）: AIインタビューの応答を生成するために使用。インタビューへの入力内容は、応答の生成を目的として Anthropic の API に送信されます。Anthropic は API 経由で受け取ったデータをAIモデルの学習に使用しません（Anthropic 利用規約に基づく）。
            詳細: <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer">anthropic.com/privacy</a>
          </li>
          <li>
            <strong>Stripe</strong>（決済処理）: 有料プランのお支払い処理に使用。クレジットカード情報は Stripe が管理し、当サービスは保持しません。
            詳細: <a href="https://stripe.com/jp/privacy" target="_blank" rel="noopener noreferrer">stripe.com/jp/privacy</a>
          </li>
          <li>
            <strong>Resend</strong>（メール配信）: サービスに関するメールの送信に使用。
            詳細: <a href="https://resend.com/privacy" target="_blank" rel="noopener noreferrer">resend.com/privacy</a>
          </li>
        </ul>
      </section>

      <section>
        <h2>6. Cookieについて</h2>
        <p>
          当サービスでは、認証・セッション管理のためにCookieを使用します。
          ブラウザの設定によりCookieを無効にすることができますが、その場合、一部機能をご利用いただけない場合があります。
        </p>
      </section>

      <section>
        <h2>7. お問い合わせ</h2>
        <p>個人情報の取り扱いに関するお問い合わせは、以下のメールアドレスまでご連絡ください。</p>
        <p>
          メールアドレス: <a href="mailto:info@insight-cast.jp">info@insight-cast.jp</a>
        </p>
      </section>

      <section>
        <h2>8. 改定について</h2>
        <p>
          本ポリシーの内容は、法令の改正やサービスの変更に伴い、予告なく変更する場合があります。
          変更後のポリシーは、本ページに掲載した時点で効力を生じるものとします。
        </p>
      </section>
    </LegalPageTemplate>
  )
}
