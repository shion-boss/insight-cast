'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function completeOnboarding(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const name = ((formData.get('name') as string) ?? '').trim().slice(0, 100) || null

  const { error } = await supabase
    .from('profiles')
    .upsert({
      id:        user.id,
      name,
      onboarded: true,
    })

  const rawNext = formData.get('next')
  const next = typeof rawNext === 'string' && rawNext.startsWith('/') ? rawNext : '/dashboard'

  if (error) redirect(`/onboarding?error=1&next=${encodeURIComponent(next)}`)

  redirect(next)
}
