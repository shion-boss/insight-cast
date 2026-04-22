'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function completeOnboarding(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { error } = await supabase
    .from('profiles')
    .upsert({
      id:        user.id,
      name:      formData.get('name') as string,
      onboarded: true,
    })

  const rawNext = formData.get('next')
  const next = typeof rawNext === 'string' && rawNext.startsWith('/') ? rawNext : '/dashboard'

  if (error) redirect(`/onboarding?error=1&next=${encodeURIComponent(next)}`)

  redirect(next)
}
