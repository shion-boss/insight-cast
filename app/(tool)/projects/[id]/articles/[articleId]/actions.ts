'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveArticleContent(
  articleId: string,
  projectId: string,
  original: string,
  corrected: string,
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('articles')
    .update({ content: corrected })
    .eq('id', articleId)
    .is('deleted_at', null)

  if (error) throw new Error(error.message)

  if (original !== corrected) {
    const { error: correctionError } = await supabase.from('article_corrections').insert({
      article_id: articleId,
      original,
      corrected,
    })
    // 差分ログの保存失敗はメインの保存には影響させない（ログのみ）
    if (correctionError) {
      console.error('[saveArticleContent] article_corrections insert failed:', correctionError.message)
    }
  }

  revalidatePath(`/projects/${projectId}/articles/${articleId}`)
}
