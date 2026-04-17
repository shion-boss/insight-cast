'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function completeOnboarding(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase
    .from('profiles')
    .update({
      name:          formData.get('name') as string,
      url:           formData.get('url') as string,
      industry_memo: formData.get('industry_memo') as string,
      location:      formData.get('location') as string,
      bio:           formData.get('bio') as string,
      onboarded:     true,
    })
    .eq('id', user.id)

  redirect('/home')
}
