import { getCharacter } from '@/lib/characters'
import { CharacterAvatar, InterviewerSpeech, PageHeader } from '@/components/ui'
import NewProjectForm from './NewProjectForm'

export default function NewProjectPage() {
  const claus = getCharacter('claus')

  return (
    <div className="min-h-screen bg-stone-50">
      <PageHeader title="Insight Cast" backHref="/dashboard" />

      <div className="max-w-lg mx-auto px-6 py-12">
        <div className="mb-8">
          <InterviewerSpeech
            icon={(
              <CharacterAvatar
                src={claus?.icon48}
                alt={`${claus?.name ?? 'インタビュアー'}のアイコン`}
                emoji={claus?.emoji}
                size={48}
              />
            )}
            name={claus?.name ?? 'インタビュアー'}
            title="まずは、取材先のホームページを教えてください。"
            description="取材先を登録しながら、似た競合候補もここで一緒に選べます。"
            tone="soft"
          />
        </div>

        <NewProjectForm />
      </div>
    </div>
  )
}
