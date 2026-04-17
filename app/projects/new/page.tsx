import { createProject } from '@/lib/actions/projects'
import { FieldLabel, PageHeader, PrimaryButton, StateCard, TextInput } from '@/components/ui'

export default function NewProjectPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <PageHeader title="Insight Cast" backHref="/dashboard" />

      <div className="max-w-lg mx-auto px-6 py-12">
        <div className="mb-8">
          <StateCard
            icon="🦉"
            title="まずは、取材先のホームページを教えてください。"
            description="ここでは取材先を登録します。自社HPの確認や競合サイトの比較は、このあと別で見直せます。"
            align="left"
            tone="soft"
          />
        </div>

        <form action={createProject} className="bg-white rounded-2xl border border-stone-100 p-6 space-y-4">
          <div>
            <FieldLabel>取材先名（任意）</FieldLabel>
            <TextInput
              type="text"
              name="name"
              placeholder="例: 山田工務店のHP"
            />
          </div>
          <div>
            <FieldLabel required>自社HP URL</FieldLabel>
            <TextInput
              type="text"
              name="url"
              required
              placeholder="https://example.com"
            />
            <p className="text-xs text-stone-400 mt-1">https:// がなくても大丈夫です</p>
          </div>

          <PrimaryButton
            type="submit"
            className="w-full py-3 text-sm"
          >
            取材先を登録する
          </PrimaryButton>
        </form>
      </div>
    </div>
  )
}
