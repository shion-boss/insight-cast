'use client'

import { useState } from 'react'
import { completeOnboarding } from '@/lib/actions/onboarding'

type Step = 'greeting' | 'name' | 'url' | 'industry' | 'confirm'

type Message = {
  role: 'mint' | 'user'
  text: string
}

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>('greeting')
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'mint',
      text: 'はじめまして！わたし、ミントといいます。取材のお手伝いをする猫です。\nまず、お店や会社のことを少し教えてもらえますか？',
    },
  ])
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [industryMemo, setIndustryMemo] = useState('')
  const [input, setInput] = useState('')

  function addMessage(role: 'mint' | 'user', text: string) {
    setMessages((prev) => [...prev, { role, text }])
  }

  function handleNameSubmit() {
    if (!input.trim()) return
    setName(input.trim())
    addMessage('user', input.trim())
    addMessage('mint', `「${input.trim()}」さんですね。よろしくお願いします！\n次に、ホームページのURLを教えてもらえますか？`)
    setInput('')
    setStep('url')
  }

  function handleUrlSubmit() {
    if (!input.trim()) return
    setUrl(input.trim())
    addMessage('user', input.trim())
    addMessage('mint', `ありがとうございます。\n最後に、どんなお仕事をされているか、一言で教えてもらえますか？（例: 地域の工務店、カフェ、整骨院など）`)
    setInput('')
    setStep('industry')
  }

  function handleIndustrySubmit() {
    if (!input.trim()) return
    setIndustryMemo(input.trim())
    addMessage('user', input.trim())
    addMessage('mint', `ありがとうございます！\nこれで準備ができました。さっそく始めましょう。`)
    setInput('')
    setStep('confirm')
  }

  function handleGreeting() {
    addMessage('user', 'よろしくお願いします')
    addMessage('mint', 'こちらこそ！\nまず、お店や会社の名前を教えてもらえますか？')
    setStep('name')
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md flex flex-col" style={{ height: '80vh' }}>
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

          {(step === 'name' || step === 'url' || step === 'industry') && (
            <div className="flex gap-2">
              <input
                type={step === 'url' ? 'url' : 'text'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (step === 'name') handleNameSubmit()
                    else if (step === 'url') handleUrlSubmit()
                    else handleIndustrySubmit()
                  }
                }}
                placeholder={
                  step === 'name' ? '例: 山田工務店' :
                  step === 'url' ? 'https://example.com' :
                  '例: 地域の工務店'
                }
                autoFocus
                className="flex-1 px-4 py-2 border border-stone-200 rounded-xl text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
              />
              <button
                onClick={
                  step === 'name' ? handleNameSubmit :
                  step === 'url' ? handleUrlSubmit :
                  handleIndustrySubmit
                }
                className="px-4 py-2 bg-stone-800 text-white rounded-xl hover:bg-stone-700 transition-colors text-sm"
              >
                送信
              </button>
            </div>
          )}

          {step === 'confirm' && (
            <form action={completeOnboarding}>
              <input type="hidden" name="name" value={name} />
              <input type="hidden" name="url" value={url} />
              <input type="hidden" name="industry_memo" value={industryMemo} />
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
