# 実装計画: Business Card Manager

## 概要

既存のコードベースをベースに、未実装の機能（名刺共有・重複検出・Firestoreセキュリティルール強化・プロパティベーステスト）を追加実装する。

### 実装済みの機能（スキップ可能）

- Firebase Authentication（ログイン・サインアップ・パスワードリセット）
- 名刺 CRUD（`storage.ts`、`business-card-form.tsx`、各ページ）
- OCR 解析（`/api/ocr`、`ocr.ts`、`ocr-parse.ts`、`ocr-capture.tsx`）
- 会社 HP 自動取得（`/api/company-url`）
- 音声検索（`search-bar.tsx`）
- レスポンシブ UI（一覧・詳細・フォーム各ページ）
- ユニットテスト（`auth.test.ts`、`ocr-parse.test.ts`、`storage-to-card.test.ts`、`confidence-style.test.ts`、`ocr-data-url.test.ts`）

### 未実装の機能（実装対象）

- `BusinessCard` 型への `ownerId` / `sharedWith` フィールド追加
- `storage.ts` への共有・重複検出関数追加
- `ShareDialog` コンポーネント
- 名刺一覧への「共有された名刺」セクション
- Firestore セキュリティルール強化
- `cardIndex` コレクション連携
- fast-check によるプロパティベーステスト

---

## タスク

- [ ] 1. データ型とストレージ層の拡張
  - [ ] 1.1 `BusinessCard` 型に `ownerId` と `sharedWith` フィールドを追加する
    - `src/types/business-card.ts` の `BusinessCard` インターフェースに `ownerId: string` と `sharedWith: string[]` を追加する
    - `toCard` 関数（`storage.ts`）で `ownerId` と `sharedWith` を正しくマッピングする
    - `saveCard` で `ownerId` を自動設定し、`sharedWith` を空配列で初期化する
    - _要件: 2.1, 3.1_

  - [ ]* 1.2 `toCard` のプロパティテストを書く
    - **Property 5: 名刺 CRUD ラウンドトリップ**
    - **Validates: Requirements 3.1, 3.2**

  - [ ] 1.3 `storage.ts` に共有・重複検出関数を追加する
    - `shareCard(userId, cardId, targetEmail)`: `users` コレクションからメールアドレスでUIDを検索し、`sharedWith` 配列に追加する。存在しない場合は `"指定されたユーザーが見つかりません"` エラーをスローする
    - `unshareCard(userId, cardId, targetUserId)`: `sharedWith` 配列から対象UIDを削除する
    - `getSharedCards(userId)`: `cardIndex` を検索し、`sharedWith` に自分のUIDが含まれる名刺を取得する
    - `findDuplicateOwners(userId, card)`: `cardIndex` を検索し、同じメールアドレスまたは同じ氏名＋会社名を持つ他ユーザーを返す
    - _要件: 8.1, 8.2, 8.4, 8.5, 9.2_

  - [ ]* 1.4 共有ラウンドトリップのプロパティテストを書く
    - **Property 13: 名刺共有の追加・削除 ラウンドトリップ**
    - **Validates: Requirements 8.1, 8.4**

  - [ ]* 1.5 共有名刺取得のプロパティテストを書く
    - **Property 14: 共有名刺の取得**
    - **Validates: Requirements 8.2**

- [ ] 2. `cardIndex` コレクション連携
  - [ ] 2.1 `saveCard` と `updateCard` で `cardIndex` を更新する
    - `saveCard` 実行後に `cardIndex` コレクションへ `{ email, lastName, firstName, company, ownerId, cardId, ownerEmail }` を書き込む
    - `updateCard` 実行後に対応する `cardIndex` ドキュメントを更新する
    - `deleteCard` 実行後に対応する `cardIndex` ドキュメントを削除する
    - _要件: 9.1_

  - [ ]* 2.2 `cardIndex` 作成のプロパティテストを書く
    - **Property 17: cardIndex の作成・更新**
    - **Validates: Requirements 9.1**

  - [ ]* 2.3 重複検出のプロパティテストを書く
    - **Property 18: 重複名刺の検出**
    - **Validates: Requirements 9.2**

- [ ] 3. チェックポイント - ストレージ層のテストがすべてパスすることを確認する
  - すべてのテストがパスすることを確認する。問題があればユーザーに確認する。

- [ ] 4. Firestore セキュリティルールの強化
  - [ ] 4.1 `firestore.rules` を設計ドキュメントの仕様に合わせて更新する
    - `users/{userId}` ドキュメント: 認証済み全員が読み取り可、書き込みは本人のみ
    - `users/{userId}/businessCards/{cardId}`: 所有者は読み書き可、`sharedWith` に含まれるユーザーは読み取りのみ
    - `cardIndex/{indexId}`: 認証済み全員が読み取り可、書き込みは `ownerId == request.auth.uid` の場合のみ
    - _要件: 2.2, 2.4, 8.6, 9.4, 12.1, 12.2, 12.3_

  - [ ]* 4.2 Firestore セキュリティルール（データ分離）のプロパティテストを書く
    - Firebase Local Emulator Suite を使用する
    - **Property 15: Firestore セキュリティルール - データ分離**
    - **Validates: Requirements 2.2, 2.4, 12.1, 12.2**

  - [ ]* 4.3 Firestore セキュリティルール（共有読み取り）のプロパティテストを書く
    - Firebase Local Emulator Suite を使用する
    - **Property 16: Firestore セキュリティルール - 共有読み取り**
    - **Validates: Requirements 8.6**

- [ ] 5. `ShareDialog` コンポーネントの実装
  - [ ] 5.1 `src/components/share-dialog.tsx` を作成する
    - メールアドレス入力フィールドと「共有する」ボタンを持つダイアログ
    - `shareCard` を呼び出し、成功時はトースト通知、失敗時はエラーメッセージを表示する
    - 現在の共有先ユーザー一覧と共有解除ボタンを表示する（`unshareCard` を呼び出す）
    - _要件: 8.1, 8.3, 8.4, 8.5, 11.1_

- [ ] 6. 名刺詳細ページへの共有・重複検出 UI 追加
  - [ ] 6.1 名刺詳細ページ（`src/app/cards/[id]/page.tsx`）に共有ボタンを追加する
    - ヘッダーに「共有」ボタンを追加し、`ShareDialog` を開く
    - 自分の名刺（`ownerId == user.uid`）の場合のみ共有ボタンを表示する
    - _要件: 8.1, 8.3_

  - [ ] 6.2 名刺詳細ページに「この名刺を持っているユーザー」セクションを追加する
    - `findDuplicateOwners` を呼び出し、重複ユーザーが存在する場合にセクションを表示する
    - 各ユーザーのメールアドレスを表示する
    - _要件: 9.2, 9.3_

- [ ] 7. 名刺一覧ページへの「共有された名刺」セクション追加
  - [ ] 7.1 `src/app/page.tsx` で `getSharedCards` を呼び出し、共有名刺を取得する
    - 自分の名刺と共有された名刺を分けて取得する
    - _要件: 8.2_

  - [ ] 7.2 `BusinessCardList` コンポーネントを拡張して共有名刺セクションを表示する
    - 共有された名刺がある場合、「共有された名刺」セクションとして別表示する
    - 共有名刺には編集・削除ボタンを表示しない（読み取り専用）
    - _要件: 8.2, 8.3_

- [ ] 8. チェックポイント - 共有・重複検出機能のテストがすべてパスすることを確認する
  - すべてのテストがパスすることを確認する。問題があればユーザーに確認する。

- [ ] 9. プロパティベーステストの追加（fast-check）
  - [ ] 9.1 fast-check をインストールし、テスト環境を設定する
    - `npm install --save-dev fast-check` を実行する
    - Firebase Local Emulator Suite のセットアップ手順をコメントに記載する
    - _要件: テスト戦略_

  - [ ]* 9.2 タイムスタンプ設定のプロパティテストを書く
    - **Property 3: 名刺保存時のタイムスタンプ設定**
    - **Validates: Requirements 3.1**

  - [ ]* 9.3 `updatedAt` 更新のプロパティテストを書く
    - **Property 4: 名刺更新時の updatedAt 更新**
    - **Validates: Requirements 3.3**

  - [ ]* 9.4 名刺削除後の不在確認プロパティテストを書く
    - **Property 6: 名刺削除後の不在確認**
    - **Validates: Requirements 3.4**

  - [ ]* 9.5 名刺一覧の降順ソートのプロパティテストを書く
    - **Property 7: 名刺一覧の降順ソート**
    - **Validates: Requirements 4.1**

  - [ ]* 9.6 検索結果の正確性プロパティテストを書く
    - **Property 8: 検索結果の正確性**
    - **Validates: Requirements 4.2**

  - [ ]* 9.7 マイクボタン表示制御のプロパティテストを書く
    - **Property 9: マイクボタンの表示制御**
    - **Validates: Requirements 5.1, 5.7**

  - [ ]* 9.8 OCR レスポンスパース正確性のプロパティテストを書く
    - **Property 10: OCR レスポンスのパース正確性**
    - **Validates: Requirements 6.3**

  - [ ]* 9.9 data URL パース ラウンドトリップのプロパティテストを書く
    - **Property 11: data URL パース ラウンドトリップ**
    - **Validates: Requirements 6.8, 6.9**

  - [ ]* 9.10 OCR URL 種別振り分けのプロパティテストを書く
    - **Property 12: OCR URL 種別振り分け**
    - **Validates: Requirements 6.7**

- [ ] 10. 最終チェックポイント - すべてのテストがパスすることを確認する
  - すべてのテストがパスすることを確認する。問題があればユーザーに確認する。

## 注意事項

- `*` が付いたサブタスクはオプションであり、MVP では省略可能
- Firebase Local Emulator Suite が必要なテスト（Property 3〜7、13〜18）は `firebase emulators:start --only firestore,auth` を事前に起動する
- テスト実行: `npm test`（`vitest run`）
- プロパティテストは最低 100 回のイテレーションを実行する（`{ numRuns: 100 }`）
