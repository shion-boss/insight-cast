# 決定: 運用業務の本格スタートは Phase 3 から

## 日付
2026-05-05

## 背景
Sentry（本番エラーロギング、improvement-backlog C-1）を Phase 2 中の磨き込みとして導入完了した（コミット `c66d545`、本番デプロイ動作確認済み）。

導入直後にアラートルール・ランブック・SLO 定義・障害対応プロセス等の「運用業務」を本格化させるかをディレクターと相談したところ、Phase 2 はドッグフーディングが主軸でトラフィックも自分たちのみのため、運用業務に正面からリソースを割くと空回りすると判断した。

## 検討した選択肢

- **選択肢A: 今すぐ運用業務をフル稼働させる**
  - メリット: バグ・障害をすぐ拾える
  - デメリット: トラフィックが薄い Phase 2 でアラート閾値・SLO・ランブックを作っても基準値が無く、Phase 3 で作り直しになる。チューニングが空回り
- **選択肢B: 運用業務を完全に Phase 3 まで止める**
  - メリット: Phase 2 はドッグフーディングに集中できる
  - デメリット: 自分が踏んだ致命バグに気付けない。ドッグフーディング自体が止まる
- **選択肢C: 段階分け（Phase 2 は最低限、Phase 3 で本格化）** ← 採用

## 決定内容

運用業務を **段階的に立ち上げる**。

| 項目 | Phase 2（現在） | Phase 3 開始時 |
|---|---|---|
| Sentry 受信 | ✓ 起動済み・維持 | ✓ |
| 通知先 | **GitHub Issue 自動作成** のみ（`shion-boss/insight-cast` リポジトリに sentry[bot] が起票） | ✓ Slack を追加。リアルタイムアラート併用 |
| アラートルール | `Issues → A new issue is created → Create GitHub issue` の 1 本のみ | ✓ ルール細分化（致命系・regression・volume 急増 等） |
| docs/runbook.md | 骨格のみ（Sentry セットアップ手順は記載済み） | ✓ 実運用で肉付け |
| アラート閾値 / SLO | 設定しない | ✓ 定義 |
| 障害対応プロセス | アドホック（GitHub Issue で気付いて対応） | ✓ ops 役割で稼働 |
| 月次運用レビュー | 行わない | ✓ |
| インシデント記録 (`ops/incidents/`) | 書きたい時だけ | ✓ ルール化 |

## 理由

- ドッグフーディング期間でも「自分が踏むクラッシュを見逃す」のは本末転倒なので、Sentry 受信 + GitHub Issue 自動起票という最小ループだけは Phase 2 で機能させる
- **通知先を Slack ではなく GitHub Issue にした理由**：ソロ運用かつ既に GitHub を毎日触っているため、別チャネルを増やさずに済む。エラー → スタックトレース → ソース該当行 → 修正コミット → `Fixes #N` で close、までが GitHub 内で完結する。Slack のリアルタイム通知が必要になるのは複数顧客がついて分単位の応答が求められるフェーズで、それは Phase 3 の話
- 一方、トラフィックが薄い段階で SLO や閾値を細かく決めても基準値が定まらないので無駄
- Phase 3 開始時にまとめて運用設計を行う方が合理的（中間マイルストーン達成後の最初のスプリントで対応）
- improvement-backlog の HIGH 4 項目（A-1/A-2/S-1/C-1）は Phase 2 中に潰し終えており、Phase 3 への引き継ぎ条件は満たしている

## やること（Phase 2 残期間）

- Sentry の GitHub Integration を 1 ルールだけ設定する：`Issues → A new issue is created → Create GitHub issue (shion-boss/insight-cast)` ✓ 設定済み
- 致命系エラー（500、auth、Stripe webhook 失敗 等）が GitHub に Issue として上がることを実利用の中で確認
- `docs/runbook.md` の「Sentry エラーモニタリング」節は維持

## やらないこと（Phase 2 中）

- Slack 連携の追加
- アラートルールの細分化
- SLO / SLA の数値定義
- ランブックの章追加（実インシデント発生時のみ追記）
- 月次運用レビューの定例化
- インシデント記録ルールの厳格化

## 関連

- `docs/improvement-backlog.md` C-1 完了
- `docs/runbook.md` Sentry セットアップ節
- improvement-backlog A-1 / A-2 / S-1 / C-1 はすべて Phase 2 中に完了
- 中間マイルストーン定義: `docs/decisions/2026-04-17-milestone-definition.md`
