# CLAUDE.md — 名刺管理アプリ

## このファイルについて

Claude が作業中に得た設計決定・注意点・ルールを自発的に追記・更新する。
既存の記述を大きく変える・削除する場合は事前に確認する。

## プロジェクト概要

Firebase + Next.js で構築した名刺管理 Web アプリ。OCR（Claude API）で名刺画像を読み取り、Firestore にデータを保存する。ユーザー認証・データ分離・名刺共有機能を持つ。

## 技術スタック

| 分類 | 技術 |
|---|---|
| フレームワーク | Next.js 16 (App Router) |
| 言語 | TypeScript |
| スタイリング | Tailwind CSS v4 |
| バックエンド | Firebase (Firestore + Authentication) |
| OCR | Anthropic Claude API (`@anthropic-ai/sdk`) |
| アイコン | Lucide React |
| テスト | Vitest |
| ホスティング | Vercel (main ブランチへのプッシュで自動デプロイ) |

## ディレクトリ構成

```
src/
  app/
    page.tsx                    # ホーム（名刺一覧）
    layout.tsx                  # ルートレイアウト（Server Component）
    auth/login/page.tsx         # ログイン
    auth/signup/page.tsx        # サインアップ
    cards/new/page.tsx          # 名刺新規登録
    cards/[id]/page.tsx         # 名刺詳細
    cards/[id]/edit/page.tsx    # 名刺編集
    api/ocr/route.ts            # OCR APIルート
    api/company-url/route.ts    # 会社URL検索 APIルート
  components/
    business-card-form.tsx      # 名刺フォーム（新規・編集共通）
    business-card-list.tsx      # 名刺一覧グリッド
    card-detail.tsx             # 名刺詳細表示
    search-bar.tsx              # 検索バー（音声入力対応）
    share-dialog.tsx            # 共有ダイアログ
    account-dialog.tsx          # アカウント設定・削除ダイアログ
    auth-guard.tsx              # 未認証リダイレクト
    client-layout.tsx           # AuthProvider ラッパー
    registration-method-dialog.tsx  # 手動 or OCR 選択ダイアログ
  contexts/
    auth-context.tsx            # AuthProvider + useAuth()
  lib/
    firebase.ts                 # Firebase 初期化 (db, auth)
    auth.ts                     # signUp / signIn / signOut
    storage.ts                  # Firestore CRUD + 共有機能
    ocr.ts                      # OCR ロジック (Claude API 呼び出し)
  types/
    business-card.ts            # 型定義
    speech-recognition.d.ts     # Web Speech API 型定義
```

## Firestore データモデル

```
users/{uid}
  └─ email: string                      # ユーザーのメールアドレス

users/{uid}/businessCards/{cardId}
  └─ (BusinessCard フィールド群)
     sharedWith: string[]               # 共有先 UID 配列

users/{uid}/receivedCards/{docId}
  └─ ownerId: string
     cardId: string
     sharedAt: Timestamp

cardIndex/{ownerId_cardId}             # 重複検出用インデックス
  └─ email, lastName, firstName, company, ownerId, cardId, ownerEmail

userIndex/{email}                      # メール→UID ルックアップ（共有機能用）
  └─ uid: string
```

## 環境変数 (.env.local)

```
ANTHROPIC_API_KEY=           # Claude API キー（OCR用）
GOOGLE_CSE_API_KEY=          # Google Custom Search API キー（会社URL検索用）
GOOGLE_CSE_ID=               # Google カスタム検索エンジン ID
NEXT_PUBLIC_FIREBASE_*=      # Firebase クライアント設定
```

## 開発コマンド

```bash
npm run dev       # 開発サーバー起動
npm run build     # 本番ビルド（変更後は必ず通ることを確認）
npm run test      # テスト実行（Vitest）
npm run lint      # Lint

# Firestoreルールのデプロイ
firebase deploy --only firestore:rules --project business-card-manager-app
```

## ブランチ運用

- `main` — 本番（Vercel 自動デプロイ）
- `feature/phase*` — フェーズ別機能ブランチ
- **ブランチはマージ後も削除しない。削除は明示的な指示があった場合のみ。**
- PR マージには `gh pr merge <番号> --merge` を使用（`--delete-branch` は付けない）

## 実装済みフェーズ

| フェーズ | 内容 |
|---|---|
| Phase 1 | OCRバグ修正、ラベル名変更（「Webサイト」→「関連サイト」）、音声検索 |
| Phase 2 | Firebase Authentication、ユーザーごとのデータ分離、AuthGuard |
| Phase 3 | 会社URL自動取得（Google CSE）、companyUrl フィールド追加、URL自動振り分け |
| Phase 4 | 名刺共有（sharedWith[]）、重複所有者表示、cardIndex、アカウント削除 |

## 重要な設計上の注意点

### 共有機能
- 名刺の所有権はオーナーのみ。共有先は **読み取り専用**（編集・削除ボタン非表示）。
- オーナーが名刺を削除した場合、受信者側の `receivedCards` エントリは **lazy に削除**（`getSharedCards` 呼び出し時に自動クリーンアップ）。
- オーナーがアカウント削除した場合も同様に、次回受信者がデータを取得したタイミングで消える。

### サインアップ時の処理
- Firebase Auth でアカウント作成後、`userIndex/{email}: { uid }` と `users/{uid}: { email }` を Firestore に保存する。
- この 2 つが欠けると共有機能が動作しないため、サインアップロジックを変更する際は必ず維持すること。

### Firestoreセキュリティルール
- `receivedCards` の `create` は **任意の認証済みユーザーが可能**（ユーザー A が ユーザー B の receivedCards に書き込むため）。
- `read/delete` はオーナーのみ。
- この非対称な設計は意図的なもの。

### layout.tsx
- `src/app/layout.tsx` は Server Component のまま維持する。
- `AuthProvider` は `src/components/client-layout.tsx` 経由でラップする。

## OCR
- Claude API（`claude-opus-4-5` 等）に名刺画像を base64 で送信し、JSON でフィールドを抽出。
- OCR 後に姓・名・会社名が空の場合、フォーム上に警告スタイルを表示する。
- 名刺記載 URL の種別（`corporate` / `product`）を判定し、`companyUrl` か `website`（関連サイト）に振り分ける。
