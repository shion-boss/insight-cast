'use client'

import { useState } from 'react'
import { createProject } from '@/lib/actions/projects'
import CompetitorSelectionFields from '@/components/competitor-selection-fields'
import { FieldLabel, PrimaryButton, TextInput } from '@/components/ui'

export default function NewProjectForm() {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')

  return (
    <form action={createProject} className="space-y-6">
      <section className="bg-white rounded-2xl border border-stone-100 p-6 space-y-4">
        <div>
          <FieldLabel required>取材先名</FieldLabel>
          <TextInput
            type="text"
            name="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: 山田工務店"
          />
        </div>
        <div>
          <FieldLabel required>自社HP URL</FieldLabel>
          <TextInput
            type="text"
            name="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
          />
          <p className="mt-1 text-xs text-stone-400">https:// がなくても大丈夫です</p>
        </div>
      </section>

      <CompetitorSelectionFields siteUrl={url} />

      <PrimaryButton
        type="submit"
        className="w-full py-3 text-sm"
      >
        取材先を登録する
      </PrimaryButton>
    </form>
  )
}
