import Stripe from 'stripe'

let stripeInstance: Stripe | null = null

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
    stripeInstance = new Stripe(key, { apiVersion: '2026-03-25.dahlia' })
  }
  return stripeInstance
}

/** 環境変数 STRIPE_PRICE_ID_LIGHTNING / STRIPE_PRICE_ID_PERSONAL / STRIPE_PRICE_ID_BUSINESS の存在を検証し、
 *  priceId → plan 名のマッピングを返す。未設定の場合は早期に throw する。 */
export function getPriceIdToPlan(): Record<string, string> {
  const lightning = process.env.STRIPE_PRICE_ID_LIGHTNING
  const personal = process.env.STRIPE_PRICE_ID_PERSONAL
  const business = process.env.STRIPE_PRICE_ID_BUSINESS
  if (!lightning) throw new Error('STRIPE_PRICE_ID_LIGHTNING is not set')
  if (!personal) throw new Error('STRIPE_PRICE_ID_PERSONAL is not set')
  if (!business) throw new Error('STRIPE_PRICE_ID_BUSINESS is not set')
  return {
    [lightning]: 'lightning',
    [personal]: 'personal',
    [business]: 'business',
  }
}
