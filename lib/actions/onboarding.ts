'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function completeOnboarding(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const name = formData.get('name') as string
  const url = formData.get('url') as string
  const industry_memo = formData.get('industry_memo') as string

  await supabase
    .from('profiles')
    .update({ name, url, industry_memo, onboarded: true })
    .eq('id', user.id)

  redirect('/home')
}
