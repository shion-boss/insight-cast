# Character Assets

Insight Cast のキャラ画像は、画像種別ごとではなくキャラごとに管理する。

## 方針

- 各キャラは `id` 単位でディレクトリを持つ
- 画像差分が増えても、キャラごとに閉じて管理できる形にする
- UIで使う小さい画像と、紹介・選択画面で使う大きい画像を分ける
- 将来の表情差分や状態差分を `states/` に追加できるようにしておく

## ディレクトリ構成

```text
assets/characters/
  mint/
    icons/
    portraits/
    states/
  claus/
    icons/
    portraits/
    states/
  rain/
    icons/
    portraits/
    states/
  hal/
    icons/
    portraits/
    states/
  mogro/
    icons/
    portraits/
    states/
  cocco/
    icons/
    portraits/
    states/
```

## 使い分け

- `icons/`
  - UIメッセージ、通知、会話ヘッダー、状態カードで使う小サイズ画像
- `portraits/`
  - キャラ選択、LP、紹介画面で使う全身・半身画像
- `states/`
  - thinking / error / welcome など、状態差分や表情差分

## 命名の目安

- `icons/icon.png`
- `icons/icon-48.png`
- `icons/icon-96.png`
- `portraits/portrait.png`
- `portraits/portrait-half.png`
- `states/thinking.png`
- `states/welcome.png`
- `states/error.png`

## 注意

- 既存の `lib/characters.ts` の `id` と同じ名前でディレクトリを切る
- 画像を置く時は、まずこの構成に沿って置く
- 画像パスの参照方法は、後で `lib/characters.ts` 側に寄せて一元管理する
