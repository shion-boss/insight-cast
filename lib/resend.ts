import { Resend } from 'resend'

let _resend: Resend | null = null

export function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

export const FROM_INFO = 'Insight Cast <info@insight-cast.jp>'
export const FROM_NOREPLY = 'Insight Cast <noreply@insight-cast.jp>'
