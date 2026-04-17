'use client'

import { useState } from 'react'
import { completeOnboarding } from '@/lib/actions/onboarding'

type Step = 'greeting' | 'name' | 'url' | 'industry' | 'location' | 'bio' | 'confirm'

type Message = { role: 'mint' | 'user'; text: string }

const MINT_MESSAGES: Record<Step, string> = {
  greeting:  'はじめまして！わたし、ミントといいます。取材のお手伝いをする猫です。\nまず、お店や会社のことを少し教えてもらえますか？',
  name:      'こちらこそ！\nまず、お店や会社の名前を教えてもらえますか？',
  url:       'ありがとうございます。\nホームページのURLを教えてもらえますか？',
  industry:  'ありがとうございます。\nどんなお仕事をされているか、一言で教えてもらえますか？（例: 地域の工務店、カフェ、整骨院など）',
  location:  'なるほど！\n活動されている地域はどのあたりですか？（例: 大阪府吹田市、東京都新宿区など）',
  bio:       'わかりました。\n最後に、お店や会社のことを一言でPRするとしたら、どんな言葉が浮かびますか？\n（例: 地元密着30年、家族みんなで楽しめるカフェなど）',
  confirm:   'ありがとうございます！これで準備ができました。さっそく始めましょう。',
}

const STEPS: Step[] = ['greeting', 'name', 'url', 'industry', 'location', 'bio', 'confirm']

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>('greeting')
  const [messages, setMessages] = useState<Message[]>([
    { role: 'mint', text: MINT_MESSAGES.greeting },
  ])
  const [values, setValues] = useState({ name: '', url: '', industry_memo: '', location: '', bio: '' })
  const [input, setInput] = useState('')

  function addMessage(role: 'mint' | 'user', text: string) {
    setMessages((prev) => [...prev, { role, text }])
  }

  function next(userText: string, nextStep: Step) {
    addMessage('user', userText)
    addMessage('mint', MINT_MESSAGES[nextStep])
    setInput('')
    setStep(nextStep)
  }

  function handleGreeting() {
    addMessage('user', 'よろしくお願いします')
    addMessage('mint', MINT_MESSAGES.name)
    setStep('name')
  }

  function handleSubmit() {
    if (!input.trim()) return
    const v = input.trim()
    if (step === 'name') {
      setValues((p) => ({ ...p, name: v }))
      next(`${v}`, 'url')
    } else if (step === 'url') {
      setValues((p) => ({ ...p, url: v }))
      next(v, 'industry')
    } else if (step === 'industry') {
      setValues((p) => ({ ...p, industry_memo: v }))
      next(v, 'location')
    } else if (step === 'location') {
      setValues((p) => ({ ...p, location: v }))
      next(v, 'bio')
    } else if (step === 'bio') {
      setValues((p) => ({ ...p, bio: v }))
      next(v, 'confirm')
    }
  }

  const progress = Math.round((STEPS.indexOf(step) / (STEPS.length - 1)) * 100)

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md flex flex-col" style={{ height: '85vh' }}>

        {/* プログレスバー */}
        <div className="mb-4">
          <div className="h-1 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* 会話ログ */}
        <div className="flex-1 overflow-y-auto space-y-4 pb-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'mint' && (
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-sm flex-shrink-0 mt-1">
                  🐱
                </div>
              )}
              <div className={`max-w-xs px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap ${
                msg.role === 'mint'
                  ? 'bg-white text-stone-700 rounded-tl-sm shadow-sm'
                  : 'bg-stone-800 text-white rounded-tr-sm'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        {/* 入力エリア */}
        <div className="pt-4 border-t border-stone-100">
          {step === 'greeting' && (
            <button
              onClick={handleGreeting}
              className="w-full py-3 bg-stone-800 text-white rounded-xl hover:bg-stone-700 transition-colors text-sm"
            >
              よろしくお願いします
            </button>
          )}

          {['name', 'url', 'industry', 'location', 'bio'].includes(step) && (
            <div className="flex gap-2">
              <input
                type={step === 'url' ? 'url' : 'text'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder={
                  step === 'name' ? '例: 山田工務店' :
                  step === 'url' ? 'https://example.com' :
                  step === 'industry' ? '例: 地域の工務店' :
                  step === 'location' ? '例: 大阪府吹田市' :
                  '例: 地元密着30年の工務店'
                }
                autoFocus
                className="flex-1 px-4 py-2 border border-stone-200 rounded-xl text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
              />
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-stone-800 text-white rounded-xl hover:bg-stone-700 transition-colors text-sm"
              >
                送信
              </button>
            </div>
          )}

          {step === 'confirm' && (
            <form action={completeOnboarding}>
              <input type="hidden" name="name"          value={values.name} />
              <input type="hidden" name="url"           value={values.url} />
              <input type="hidden" name="industry_memo" value={values.industry_memo} />
              <input type="hidden" name="location"      value={values.location} />
              <input type="hidden" name="bio"           value={values.bio} />
              <button
                type="submit"
                className="w-full py-3 bg-stone-800 text-white rounded-xl hover:bg-stone-700 transition-colors text-sm"
              >
                はじめる
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
