'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createClientRecord(formData: FormData) {
  const supabase = await createClient()

  const name = formData.get('name') as string
  const url = formData.get('url') as string
  const industry_memo = formData.get('industry_memo') as string

  const { error } = await supabase.from('clients').insert({ name, url, industry_memo })
  if (error) throw new Error(error.message)

  redirect('/clients')
}
