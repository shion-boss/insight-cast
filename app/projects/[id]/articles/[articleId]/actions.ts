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

  if (error) throw new Error(error.message)

  if (original !== corrected) {
    await supabase.from('article_corrections').insert({
      article_id: articleId,
      original,
      corrected,
    })
  }

  revalidatePath(`/projects/${projectId}/articles/${articleId}`)
}
