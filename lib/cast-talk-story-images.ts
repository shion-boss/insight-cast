// Cast Talk のストーリー画像（2 キャラの組合せごとに 1 枚）を一元管理する。
//
// `assets/story/` 配下の 15 ペア画像を全 6 キャラの組合せ C(6,2)=15 に対応づける。
// ファイル名は辞書順（例: claus-x-mogro.png）で命名されているが、cast-talk
// レコードの interviewer_id / guest_id は順不同なので、両方向のキー
// （interviewer-guest と guest-interviewer）で同じ画像を引けるようにする。
//
// 旧実装は CastTalkGrid.tsx と cast-talk/[slug]/page.tsx の 2 ファイルに
// 同じ Map がコピペされており、追加キャラ（hal/mogro/cocco）の組合せが
// 8 ペア漏れていた。1 ファイルに集約して両方から import する。

import type { StaticImageData } from 'next/image'

import clausXCocco from '@/assets/story/claus-x-cocco.png'
import clausXHal from '@/assets/story/claus-x-hal.png'
import clausXMogro from '@/assets/story/claus-x-mogro.png'
import clausXRain from '@/assets/story/claus-x-rain.jpg'
import halXCocco from '@/assets/story/hal-x-cocco.png'
import halXMogro from '@/assets/story/hal-x-mogro.png'
import halXRain from '@/assets/story/hal-x-rain.png'
import mintXClaus from '@/assets/story/mint-x-claus.png'
import mintXCocco from '@/assets/story/mint-x-cocco.png'
import mintXHal from '@/assets/story/mint-x-hal.png'
import mintXMogro from '@/assets/story/mint-x-mogro.png'
import mintXRain from '@/assets/story/mint-x-rain.jpg'
import mogroXCocco from '@/assets/story/mogro-x-cocco.png'
import mogroXRain from '@/assets/story/mogro-x-rain.png'
import rainXCocco from '@/assets/story/rain-x-cocco.png'

const STORY_IMAGE_MAP: Record<string, StaticImageData> = {
  'mint-claus':   mintXClaus,   'claus-mint':   mintXClaus,
  'mint-rain':    mintXRain,    'rain-mint':    mintXRain,
  'mint-hal':     mintXHal,     'hal-mint':     mintXHal,
  'mint-mogro':   mintXMogro,   'mogro-mint':   mintXMogro,
  'mint-cocco':   mintXCocco,   'cocco-mint':   mintXCocco,
  'claus-rain':   clausXRain,   'rain-claus':   clausXRain,
  'claus-hal':    clausXHal,    'hal-claus':    clausXHal,
  'claus-mogro':  clausXMogro,  'mogro-claus':  clausXMogro,
  'claus-cocco':  clausXCocco,  'cocco-claus':  clausXCocco,
  'rain-hal':     halXRain,     'hal-rain':     halXRain,
  'rain-mogro':   mogroXRain,   'mogro-rain':   mogroXRain,
  'rain-cocco':   rainXCocco,   'cocco-rain':   rainXCocco,
  'hal-mogro':    halXMogro,    'mogro-hal':    halXMogro,
  'hal-cocco':    halXCocco,    'cocco-hal':    halXCocco,
  'mogro-cocco':  mogroXCocco,  'cocco-mogro':  mogroXCocco,
}

export function getCastTalkStoryImage(
  interviewerId: string | null | undefined,
  guestId: string | null | undefined,
): StaticImageData | null {
  if (!interviewerId || !guestId) return null
  return STORY_IMAGE_MAP[`${interviewerId}-${guestId}`] ?? null
}
