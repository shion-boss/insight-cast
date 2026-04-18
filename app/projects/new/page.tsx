import { getCharacter } from '@/lib/characters'
import { CharacterAvatar, InterviewerSpeech, PageHeader } from '@/components/ui'
import NewProjectForm from './NewProjectForm'

export default function NewProjectPage() {
  const claus = getCharacter('claus')

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.2),transparent_24%),radial-gradient(circle_at_82%_10%,rgba(15,118,110,0.12),transparent_22%),linear-gradient(180deg,_#efe4d3_0%,_#f6eee2_28%,_#fbf8f2_100%)]">
      <PageHeader title="取材先を登録する" backHref="/projects" backLabel="← 取材先一覧" />

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
