/**
 * lib/article-quality-check.ts のユニットテスト
 * 実行: npx tsx --test __tests__/article-quality-check.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { runDeterministicCheck } from '../lib/article-quality-check'

const SAMPLE_CLIENT_OK = `# うちの整骨院で大事にしていること

## 朝の準備で見えてくるもの

うちでは毎朝、施術ベッドの高さを患者さんごとに調整します。先週の月曜日、80歳の女性が「腰が楽になった」と話してくれて、それからその方法を全員に広げました。

## お客様の反応

「他の整骨院では聞かれなかった」と言ってもらえました。

抜粋: 整骨院の朝の準備に込めた工夫を、うちの院長が語ります。
`

test('client 記事で視点違反「と話してくれました」を検出する', () => {
  const result = runDeterministicCheck({
    content: SAMPLE_CLIENT_OK,
    articleType: 'client',
    volume: 'short',
    ownerFirstPerson: 'うち',
  })
  assert.ok(result.perspective_violations.includes('〜と話してくれました'))
})

test('一人称統一: 「うち」設定なのに「弊社」が混ざると検出', () => {
  const content = `# テスト

うちでは毎日掃除しています。弊社のスタッフ全員で取り組んでいます。
`
  const result = runDeterministicCheck({
    content,
    articleType: 'client',
    volume: 'short',
    ownerFirstPerson: 'うち',
  })
  assert.ok(result.first_person_mixed !== null)
  assert.equal(result.first_person_mixed?.dominant, 'うち')
  assert.ok(result.first_person_mixed?.others.some((o) => o.token === '弊社'))
})

test('一人称統一: 設定通りなら混在検出しない', () => {
  const content = `# テスト

うちでは毎日掃除しています。うちのスタッフ全員で取り組んでいます。
`
  const result = runDeterministicCheck({
    content,
    articleType: 'client',
    volume: 'short',
    ownerFirstPerson: 'うち',
  })
  assert.equal(result.first_person_mixed, null)
})

test('owner_first_person 未設定なら一人称チェックは null', () => {
  const content = `# テスト

私と弊社のスタッフで取り組みます。
`
  const result = runDeterministicCheck({
    content,
    articleType: 'client',
    volume: 'short',
    ownerFirstPerson: null,
  })
  assert.equal(result.first_person_mixed, null)
})

test('文字数チェック: short 範囲内なら ok=true', () => {
  // 600字程度のダミー
  const body = 'うちでは毎朝丁寧に準備をします。患者さんに合わせて施術台の高さを変えています。'.repeat(20)
  const content = `# テスト\n\n${body}\n`
  const result = runDeterministicCheck({
    content,
    articleType: 'client',
    volume: 'short',
    ownerFirstPerson: null,
  })
  assert.equal(result.volume_range.min, 600)
  assert.equal(result.volume_range.max, 800)
  assert.ok(result.char_count >= 600 && result.char_count <= 800, `char_count=${result.char_count}`)
  assert.ok(result.volume_range.ok)
})

test('文字数チェック: 大幅に下回ると tolerance_ok=false', () => {
  const content = `# 短い\n\nひとこと。\n`
  const result = runDeterministicCheck({
    content,
    articleType: 'client',
    volume: 'long',
    ownerFirstPerson: null,
  })
  assert.equal(result.volume_range.ok, false)
  assert.equal(result.volume_range.tolerance_ok, false)
  assert.ok(result.warnings.some((w) => w.includes('文字数乖離')))
})

test('タイトル抽出と長さカウント', () => {
  const content = `# 30字を超える長いタイトル長すぎるタイトルですよ本当に本当に長いタイトルだ\n\n本文。`
  const result = runDeterministicCheck({
    content,
    articleType: 'client',
    volume: 'short',
    ownerFirstPerson: null,
  })
  assert.ok(result.title.startsWith('30字を超える'))
  assert.ok(result.title_length > 30)
  assert.ok(result.warnings.some((w) => w.includes('タイトル長')))
})

test('interviewer 記事は perspective_violations 対象外', () => {
  const content = `# 取材記事

## 取材で印象的だったこと

院長は「お客様第一」と話してくれました。本当にそうだということがわかりました。
`
  const result = runDeterministicCheck({
    content,
    articleType: 'interviewer',
    volume: 'short',
    ownerFirstPerson: null,
  })
  assert.equal(result.perspective_violations.length, 0)
})

test('conversation 記事の散文では「とのこと」を検出するが、会話バブル内は対象外', () => {
  const content = `# 取材

## この記事でわかること

- 朝の準備
- お客様の反応

**ミント**: お話を聞かせてください。
**院長**: うちでは毎朝整えています。
**ミント**: ありがとうございました。

## まとめ

院長の温度感が伝わってきた取材でした。
`
  const result = runDeterministicCheck({
    content,
    articleType: 'conversation',
    volume: 'short',
    ownerFirstPerson: null,
  })
  // 散文・インタビュアー発話に第三者伝聞表現がないので 0
  assert.equal(result.perspective_violations.length, 0)
})

test('タイトルに em-dash が入っていると検出される', () => {
  const content = `# パフォーマンス50から91へ——使い心地を目指した記録\n\n## 普通の見出し\n\n本文。`
  const result = runDeterministicCheck({
    content,
    articleType: 'client',
    volume: 'short',
    ownerFirstPerson: null,
  })
  assert.ok(result.em_dash_lines.length >= 1)
  assert.ok(result.warnings.some((w) => w.includes('ダッシュ記号')))
})

test('H2 に em-dash が入っていると検出される', () => {
  const content = `# 普通のタイトル\n\n## 改善前─改善後\n\n本文。`
  const result = runDeterministicCheck({
    content,
    articleType: 'client',
    volume: 'short',
    ownerFirstPerson: null,
  })
  assert.ok(result.em_dash_lines.length >= 1)
})

test('ダッシュ記号がない普通の記事では検出されない', () => {
  const content = `# 普通のタイトルです\n\n## 普通の見出し\n\n本文中に「ー」のような伸ばし棒は許容される。`
  const result = runDeterministicCheck({
    content,
    articleType: 'client',
    volume: 'short',
    ownerFirstPerson: null,
  })
  assert.equal(result.em_dash_lines.length, 0)
  assert.ok(!result.warnings.some((w) => w.includes('ダッシュ記号')))
})

test('日本語と英単語の間に半角スペースが入っていると検出される', () => {
  const content = `# 普通のタイトル\n\nInsight Cast は AI を使った 30 文字以内の タイトル を作ります。\n`
  const result = runDeterministicCheck({
    content,
    articleType: 'client',
    volume: 'short',
    ownerFirstPerson: null,
  })
  // 「t は」「は A」「I を」「を 3」「0 文」「文 A」など多数マッチする
  assert.ok(result.jp_en_spacing_count >= 4, `count=${result.jp_en_spacing_count}`)
  assert.ok(result.warnings.some((w) => w.includes('日本語×英数字スペース癖')))
})

test('日本語と英数字を詰めて書いていれば検出されない', () => {
  const content = `# 普通のタイトル\n\nInsight CastはAIを使った30文字以内のタイトルを作ります。\n`
  const result = runDeterministicCheck({
    content,
    articleType: 'client',
    volume: 'short',
    ownerFirstPerson: null,
  })
  assert.equal(result.jp_en_spacing_count, 0)
})

test('英語フレーズ内のスペース（Insight Cast 内）は検出対象外', () => {
  const content = `# Insight Castの紹介\n\nInsight Castは記事を書きます。Cast Talkも便利です。\n`
  const result = runDeterministicCheck({
    content,
    articleType: 'client',
    volume: 'short',
    ownerFirstPerson: null,
  })
  // 英語同士のスペース（Insight␣Cast / Cast␣Talk）はマッチしない
  assert.equal(result.jp_en_spacing_count, 0)
})

test('conversation の「**Name**: 」行頭ラベルは検出対象外', () => {
  const content = `# 取材\n\n**ミント**: お話を聞かせてください。\n**院長**: AIで記事を書きます。\n`
  const result = runDeterministicCheck({
    content,
    articleType: 'conversation',
    volume: 'short',
    ownerFirstPerson: null,
  })
  // 「**ミント**:␣お」のような行頭ラベル直後のスペースは無視される
  assert.equal(result.jp_en_spacing_count, 0)
})

test('H1 が複数あると warning に出る', () => {
  const content = `# タイトル

# もう一つのH1

本文。
`
  const result = runDeterministicCheck({
    content,
    articleType: 'client',
    volume: 'short',
    ownerFirstPerson: null,
  })
  assert.ok(result.h1_count >= 2)
  assert.ok(result.warnings.some((w) => w.includes('H1 異常')))
})
