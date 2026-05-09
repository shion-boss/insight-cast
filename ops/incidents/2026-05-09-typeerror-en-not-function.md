# 2026-05-09 / TypeError: e[n] is not a function 多発

> 本番モニター監査で報告された JS 例外。レンダー自体は完了するため
> ユーザーには見えないが、Sentry / コンソールに大量のスタックが流れ、
> 通知量が増えメンテナンス負荷が高い。**最優先で原因特定**。

## 観測内容（網羅テストレポートより）

- エラー: `TypeError: e[n] is not a function`
- 発火箇所: `webpack-420f7f653b91dab4.js` の `r` 関数
- 連鎖箇所: `app/[locale]/(site)/error-...js`、`app/[locale]/(site)/layout-...js`、
  `app/[locale]/(site)/page-...js`、`app/(tool)/articles/error-...js` など複数チャンク
- 取材メモ詳細 (`/projects/{id}/summary`) で **初回レンダーで 10 件以上**
- 多くのページで再現する模様

注: 実コードに `[locale]` セグメントは存在しない。webpack の chunk
ファイル名が偶然 `[locale]` 文字列を含んでいる可能性、または Sentry 側の
スタックラベルの混乱の可能性がある。

## 仮説

1. **stale chunk**: 古い HTML が新しい chunk を読みに行って破損 export を掴む（Vercel CDN にキャッシュされた古い asset）
2. **dependency の壊れた export**: 動的 import で取得したモジュールから関数を取り出そうとして undefined
3. **error boundary の二重投出**: error.tsx で更にエラーが起きて多重スタックに
4. **Next.js / Sentry SDK のバージョン差**: @sentry/nextjs と Next.js の adapter 不整合

## このサイクルでの応急対応 (commit 待ち、ブランチ `fix/monitor-feedback-2026-05-09`)

- `lib/use-error-report.ts` を新設し、`app/**/error.tsx` 19 個すべてで
  `useErrorReport(error)` を呼んで Sentry に送るよう統一。
  - これまで `app/error.tsx` だけが `Sentry.captureException` を呼んでおり、
    サブツリー側で捕まえたエラーは Sentry に届かなかった。
  - **これにより次回以降の Sentry でスタックが正しく取れるはず。**

## 次に確認すること（根本原因特定のため）

1. **Sentry の最新エラー詳細を確認**（応急対応後、新しいエラーが詳しく送信される）
   - スタックの先頭フレームのファイル/行
   - breadcrumb（直前のユーザー操作）
   - 環境（OS / ブラウザ / バージョン）
2. **ソースマップアップロードの状態**
   - Vercel ビルドログに `Successfully uploaded source maps to Sentry` が出ているか
   - Sentry プロジェクトの「Source Maps」タブで最新リリースの map が登録されているか
   - `widenClientFileUpload: true` は next.config.ts にあり OK
3. **stale chunk 仮説の検証**
   - エラーが発火するセッションの `__NEXT_DATA__` から build ID を取得
   - その build ID が現行と一致するか（古ければ CDN キャッシュ問題）
   - 不一致が多いなら `cache-control` を見直す
4. **依存パッケージのバージョン確認**
   - `@sentry/nextjs`、`next`、`react` のメジャー整合
   - 最近のアップデートで break が無いかリリースノートを確認
5. **再現環境の確定**
   - 報告されたページ (`/projects/[id]/summary` 等) を本番で開いてコンソールを録画
   - 別ブラウザ / シークレット / 異なるセッションで再現するかを切り分け

## 解像度が上がったら

- **stale chunk** が原因: Vercel の cache-control 見直し + Service Worker のキャッシュバスト戦略
- **依存の壊れた export**: 該当パッケージのピン留め or workaround
- **error.tsx の二重投出**: error.tsx 内で安全な fallback を強制する

## 追記欄

（Sentry を確認した結果、根本原因が判明したらここに追記）
