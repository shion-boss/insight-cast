import { getCharacter } from '@/lib/characters'
import { CharacterAvatar, InterviewerSpeech, PageHeader } from '@/components/ui'
import NewProjectForm from './NewProjectForm'

function getErrorMessage(error: string) {
  if (error === 'name') return '取材先名を入力してから、もう一度登録してください。'
  if (error === 'url') return '自社HPのURLを入力してから、もう一度登録してください。'
  if (error === 'competitor_limit') return '参考HPは最大3件までです。件数を減らしてから、もう一度登録してください。'
  if (error === 'competitor_self') return '自社HPと同じURLは参考HPに入れられません。別のHPに差し替えてください。'
  if (error === 'plan_limit') return '現在のプランで登録できる取材先の上限に達しています。追加したい場合はお問い合わせください。'
  if (error === '1') return '登録中に問題が起きました。少し待ってから、もう一度お試しください。'
  return ''
}

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const claus = getCharacter('claus')
  const query = await searchParams
  const errorParam = Array.isArray(query.error) ? query.error[0] ?? '' : query.error ?? ''
  const errorMessage = getErrorMessage(errorParam)

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
            description="取材先を登録しながら、参考にしたい競合候補もここで一緒に選べます。"
            tone="soft"
          />
        </div>

        <NewProjectForm errorMessage={errorMessage} />
      </div>
    </div>
  )
}
