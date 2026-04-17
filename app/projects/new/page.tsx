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
            title="まずは、調べたいホームページを教えてください。"
            description="URLを受け取ると、クラウスが今の見え方を確認します。競合サイトはこの次に登録できます。"
            align="left"
            tone="soft"
          />
        </div>

        <form action={createProject} className="bg-white rounded-2xl border border-stone-100 p-6 space-y-4">
          <div>
            <FieldLabel>プロジェクト名（任意）</FieldLabel>
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
            クラウスにお願いする
          </PrimaryButton>
        </form>
      </div>
    </div>
  )
}
