import { PageHeader, StateCard } from '@/components/ui'
import NewProjectForm from './NewProjectForm'

export default function NewProjectPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <PageHeader title="Insight Cast" backHref="/dashboard" />

      <div className="max-w-lg mx-auto px-6 py-12">
        <div className="mb-8">
          <StateCard
            icon="🦉"
            title="まずは、取材先のホームページを教えてください。"
            description="取材先を登録しながら、似た競合候補もここで一緒に選べます。"
            align="left"
            tone="soft"
          />
        </div>

        <NewProjectForm />
      </div>
    </div>
  )
}
