# 設計ドキュメント: Business Card Manager

## 概要

Business Card Manager は、Firebase Authentication によるユーザー認証と Firestore によるデータ永続化を基盤とした、モバイルファースト＋PC対応の名刺管理 Web アプリケーションである。

主な機能は以下の通り。

- メール/パスワード認証によるユーザー管理とデータ分離
- 手入力および Claude Vision API（OCR）による名刺登録
- Google Custom Search API を用いた会社 HP 自動取得
- Web Speech API による音声検索
- ユーザー間の名刺共有と重複検出
- Next.js 15 App Router + Tailwind CSS v4 + shadcn/ui によるレスポンシブ UI

---

## アーキテクチャ

### 全体構成

```
┌─────────────────────────────────────────────────────────┐
│                    クライアント (Next.js)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │  Pages   │  │Components│  │  Contexts / Hooks    │  │
│  │(App Router│  │(UI Layer)│  │  (AuthContext等)     │  │
│  └────┬─────┘  └────┬─────┘  └──────────────────────┘  │
│       │              │                                    │
│  ┌────▼──────────────▼──────────────────────────────┐   │
│  │              lib/ (ビジネスロジック)               │   │
│  │  auth.ts │ storage.ts │ ocr.ts │ ocr-parse.ts    │   │
│  └────┬─────────────────────────┬────────────────────┘   │
└───────┼─────────────────────────┼────────────────────────┘
        │                         │
        ▼                         ▼
┌───────────────┐      ┌──────────────────────┐
│   Firebase    │      │   Next.js API Routes  │
│  Auth         │      │  /api/ocr             │
│  Firestore    │      │  /api/company-url     │
└───────────────┘      └──────────┬───────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼               ▼
             Claude Vision   Google CSE      Anthropic SDK
             API             API
```

### データフロー

1. 認証フロー: クライアント → Firebase Auth → AuthContext → 各ページ
2. 名刺 CRUD: クライアント → storage.ts → Firestore (`users/{uid}/businessCards`)
3. OCR フロー: 画像 → `/api/ocr` → Claude Vision API → OCR_Parser → フォーム自動入力
4. 会社 HP 取得: 会社名 → `/api/company-url` → Google CSE API → `companyUrl` フィールド
5. 共有フロー: storage.ts → `sharedWith[]` 更新 + `cardIndex` コレクション更新

---

## コンポーネントとインターフェース

### ページ構成（App Router）

| ルート | コンポーネント | 説明 |
|---|---|---|
| `/` | `app/page.tsx` | 名刺一覧・検索 |
| `/auth/login` | `app/auth/login/page.tsx` | ログイン |
| `/auth/signup` | `app/auth/signup/page.tsx` | 新規登録 |
| `/auth/reset-password` | `app/auth/reset-password/page.tsx` | パスワードリセット |
| `/cards/new` | `app/cards/new/page.tsx` | 名刺新規登録 |
| `/cards/[id]` | `app/cards/[id]/page.tsx` | 名刺詳細 |
| `/cards/[id]/edit` | `app/cards/[id]/edit/page.tsx` | 名刺編集 |

### 主要コンポーネント

| コンポーネント | 責務 |
|---|---|
| `AuthProvider` | Firebase Auth の状態監視・配信 |
| `AuthGuard` | 未認証時のリダイレクト |
| `BusinessCardForm` | 名刺フォーム（新規・編集共通） |
| `BusinessCardList` | 名刺一覧表示 |
| `CardDetail` | 名刺詳細表示 |
| `OcrCapture` | カメラ/ファイル取込 + OCR 実行 |
| `SearchBar` | テキスト検索 + 音声入力 |
| `ShareDialog` | 名刺共有ダイアログ |
| `RegistrationMethodDialog` | 登録方法選択ダイアログ |

### API ルート

#### `POST /api/ocr`

```typescript
// リクエスト
{ imageBase64: string; mediaType: string }

// レスポンス
{
  values: Record<keyof BusinessCardFormData, string>;
  confidence: Record<keyof BusinessCardFormData, number>;
}
```

#### `GET /api/company-url`

```typescript
// クエリパラメータ
?company=株式会社ネオジャパン

// レスポンス
{ url: string }
```

### lib/ モジュールインターフェース

#### `auth.ts`

```typescript
signUp(email: string, password: string): Promise<UserCredential>
signIn(email: string, password: string): Promise<UserCredential>
signOutUser(): Promise<void>
resetPassword(email: string): Promise<void>
```

#### `storage.ts`

```typescript
getCards(userId: string): Promise<BusinessCard[]>
getCardById(userId: string, id: string): Promise<BusinessCard | undefined>
saveCard(userId: string, data: BusinessCardFormData): Promise<BusinessCard>
updateCard(userId: string, id: string, data: BusinessCardFormData): Promise<BusinessCard | undefined>
deleteCard(userId: string, id: string): Promise<boolean>
searchCards(userId: string, query: string): Promise<BusinessCard[]>
shareCard(userId: string, cardId: string, targetEmail: string): Promise<void>
unshareCard(userId: string, cardId: string, targetUserId: string): Promise<void>
getSharedCards(userId: string): Promise<BusinessCard[]>
findDuplicateOwners(userId: string, card: BusinessCard): Promise<DuplicateOwner[]>
toCard(id: string, data: Record<string, unknown>): BusinessCard
```

#### `ocr.ts`

```typescript
parseDataUrl(dataUrl: string): { base64: string; mediaType: string }
analyzeBusinessCard(imageDataUrl: string): Promise<OcrResult>
```

#### `ocr-parse.ts`

```typescript
extractJson(rawText: string): string
parseOcrResponse(parsed: Record<string, unknown>): { values: Record<string, string>; confidence: Record<string, number> }
```

---

## データモデル

### BusinessCard（Firestore ドキュメント）

パス: `users/{userId}/businessCards/{cardId}`

```typescript
interface BusinessCard {
  id: string;
  lastName: string;        // 姓
  firstName: string;       // 名
  lastNameKana: string;    // 姓（フリガナ）
  firstNameKana: string;   // 名（フリガナ）
  company: string;         // 会社名
  department: string;      // 部署
  position: string;        // 役職
  email: string;           // メールアドレス
  phone: string;           // 電話番号
  mobile: string;          // 携帯番号
  postalCode: string;      // 郵便番号
  address: string;         // 住所
  companyUrl: string;      // 会社 HP URL
  website: string;         // 関連サイト URL
  notes: string;           // メモ
  imageUrl: string;        // 名刺画像（Base64 data URL）
  ownerId: string;         // 所有者 UID
  sharedWith: string[];    // 共有先 UID の配列
  createdAt: string;       // 作成日時（ISO 8601）
  updatedAt: string;       // 更新日時（ISO 8601）
}
```

### CardIndex（重複検出用インデックス）

パス: `cardIndex/{autoId}`

```typescript
interface CardIndex {
  email: string;
  lastName: string;
  firstName: string;
  company: string;
  ownerId: string;
  cardId: string;
  ownerEmail: string;
}
```

### User（ユーザー情報）

パス: `users/{userId}`

```typescript
interface UserDoc {
  email: string;
  displayName?: string;
  createdAt: string;
}
```

### Firestore セキュリティルール

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ユーザー情報: 認証済み全員が読み取り可（共有機能のユーザー検索用）
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // 名刺データ: 所有者のみ読み書き、sharedWith に含まれるユーザーは読み取りのみ
    match /users/{userId}/businessCards/{cardId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null
                  && request.auth.uid in resource.data.sharedWith;
    }

    // 重複検出インデックス: 認証済み全員が読み取り可、書き込みは所有者のみ
    match /cardIndex/{indexId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
                   && request.auth.uid == request.resource.data.ownerId;
    }
  }
}
```

### 画像保存方式

名刺画像は Base64 data URL として Firestore ドキュメントの `imageUrl` フィールドに直接保存する。Firestore の 1 ドキュメント上限（1 MB）を超えないよう、`image-compress.ts` で画像を圧縮してから保存する。

将来的にカード数増加やパフォーマンス劣化が顕著になった場合は Firebase Storage への移行を検討する。

### OCR 処理フロー

```
画像取込（カメラ/ファイル）
  → parseDataUrl() で base64 + mediaType 抽出
  → POST /api/ocr
    → Claude Vision API（claude-sonnet-4-20250514）
    → extractJson() で JSON 抽出
    → parseOcrResponse() で values / confidence 分離
  → analyzeBusinessCard() が formData を返す
  → companyUrl が空 && company あり → GET /api/company-url
  → フォームに自動入力
```

---

## 正確性プロパティ

*プロパティとは、システムのすべての有効な実行において成立すべき特性または振る舞いのことである。プロパティは人間が読める仕様と機械で検証可能な正確性保証の橋渡しをする。*

### Property 1: サインアップ→ログイン ラウンドトリップ

*For any* 有効なメールアドレスとパスワードの組み合わせについて、サインアップを実行した後に同じ認証情報でログインすると、認証済みユーザーが返される。

**Validates: Requirements 1.1, 1.2**

### Property 2: サインアップ後のユーザードキュメント作成

*For any* 有効なメールアドレスでサインアップを完了したとき、`users/{uid}` ドキュメントにそのメールアドレスが保存されている。

**Validates: Requirements 1.8**

### Property 3: 名刺保存時のタイムスタンプ設定

*For any* 名刺フォームデータについて、`saveCard` を呼び出すと返ってきた `BusinessCard` の `createdAt` と `updatedAt` が現在時刻に設定されている。

**Validates: Requirements 3.1**

### Property 4: 名刺更新時の updatedAt 更新

*For any* 既存の名刺と更新データについて、`updateCard` を呼び出すと返ってきた `BusinessCard` の `updatedAt` が元の値より新しく、変更フィールドが反映されている。

**Validates: Requirements 3.3**

### Property 5: 名刺 CRUD ラウンドトリップ

*For any* 名刺フォームデータについて、`saveCard` で保存した後に `getCardById` で取得すると、保存したデータと等価な `BusinessCard` が返される。

**Validates: Requirements 3.1, 3.2**

### Property 6: 名刺削除後の不在確認

*For any* 保存済みの名刺について、`deleteCard` を呼び出した後に `getCardById` を呼び出すと `undefined` が返される。

**Validates: Requirements 3.4**

### Property 7: 名刺一覧の降順ソート

*For any* 複数の名刺セットについて、`getCards` が返す配列は `updatedAt` の降順に並んでいる。

**Validates: Requirements 4.1**

### Property 8: 検索結果の正確性

*For any* 名刺セットと検索クエリについて、`searchCards` が返すすべての名刺は、検索対象フィールド（姓・名・フリガナ・会社名・部署・役職・メール・電話・携帯・住所・メモ）のいずれかにクエリ文字列を含む。

**Validates: Requirements 4.2**

### Property 9: マイクボタンの表示制御

*For any* ブラウザ環境について、Web Speech API が利用可能な場合はマイクボタンが表示され、利用不可能な場合はマイクボタンが表示されない。

**Validates: Requirements 5.1, 5.7**

### Property 10: OCR レスポンスのパース正確性

*For any* `{ field: { value, confidence } }` 形式の OCR レスポンスオブジェクトについて、`parseOcrResponse` を呼び出すと `values` と `confidence` が正しく分離される。

**Validates: Requirements 6.3**

### Property 11: data URL パース ラウンドトリップ

*For any* 有効な Base64 data URL（`data:image/[種別];base64,[データ]` 形式）について、`parseDataUrl` を呼び出すと `base64` と `mediaType` が正しく抽出され、再構築した data URL が元の値と等価になる。

**Validates: Requirements 6.8, 6.9**

### Property 12: OCR URL 種別振り分け

*For any* OCR 解析結果について、`websiteType` が `corporate` の場合は URL が `companyUrl` に設定され、それ以外の場合は `website` に設定される。

**Validates: Requirements 6.7**

### Property 13: 名刺共有の追加・削除 ラウンドトリップ

*For any* 名刺と対象ユーザーについて、`shareCard` を呼び出した後に `unshareCard` を呼び出すと、`sharedWith` 配列が元の状態に戻る。

**Validates: Requirements 8.1, 8.4**

### Property 14: 共有名刺の取得

*For any* ユーザー A が名刺をユーザー B に共有した場合、ユーザー B の `getSharedCards` がその名刺を返す。

**Validates: Requirements 8.2**

### Property 15: Firestore セキュリティルール - データ分離

*For any* ユーザー A とユーザー B（A ≠ B）について、ユーザー A の認証情報でユーザー B の名刺コレクションへの書き込みを試みると拒否される。

**Validates: Requirements 2.2, 2.4, 12.1, 12.2**

### Property 16: Firestore セキュリティルール - 共有読み取り

*For any* 名刺の `sharedWith` 配列に含まれるユーザーは、その名刺の読み取りが許可され、書き込みは拒否される。

**Validates: Requirements 8.6**

### Property 17: cardIndex の作成・更新

*For any* 名刺データについて、`saveCard` を呼び出した後に `cardIndex` コレクションに対応するインデックスドキュメントが存在する。

**Validates: Requirements 9.1**

### Property 18: 重複名刺の検出

*For any* 同じメールアドレスを持つ名刺を異なるユーザーが保存している場合、`findDuplicateOwners` がその他のユーザーを返す。

**Validates: Requirements 9.2**

---

## エラーハンドリング

### 認証エラー

| エラーコード | 表示メッセージ |
|---|---|
| `auth/email-already-in-use` | このメールアドレスは既に使用されています |
| `auth/invalid-credential` | メールアドレスまたはパスワードが正しくありません |
| `auth/weak-password` | パスワードは6文字以上で入力してください |
| `auth/invalid-email` | 有効なメールアドレスを入力してください |

### Firestore エラー

- 書き込み失敗: トースト通知でエラー内容を表示
- 存在しない名刺 ID へのアクセス: 「名刺が見つかりません」メッセージ + 一覧ページへ誘導

### OCR エラー

- `parseDataUrl` 失敗: `"Invalid data URL format"` エラーをスロー
- Claude API 呼び出し失敗: 「名刺の解析に失敗しました」メッセージ + 手入力フォームへの切り替えを促す
- JSON パース失敗: エラーログ出力 + 500 レスポンス

### 会社 HP 取得エラー

- Google CSE API 失敗: エラーをログに記録し、`companyUrl` を空のまま処理を継続（ユーザーへの通知なし）

### 音声認識エラー

| エラー種別 | 対応 |
|---|---|
| `not-allowed` | 「マイクへのアクセスが許可されていません」アラート |
| `no-speech` / `aborted` | 無視（正常動作） |
| その他 | トースト通知でエラー内容を表示 |

### 共有エラー

- 存在しないメールアドレス: 「指定されたユーザーが見つかりません」エラーメッセージ

---

## テスト戦略

### デュアルテストアプローチ

ユニットテストとプロパティベーステストを組み合わせて包括的なカバレッジを実現する。

- ユニットテスト: 特定の例、エッジケース、エラー条件を検証
- プロパティテスト: すべての入力に対して成立する普遍的プロパティを検証

### テストフレームワーク

| 種別 | ライブラリ |
|---|---|
| ユニットテスト | Vitest |
| プロパティベーステスト | fast-check（TypeScript 対応の PBT ライブラリ） |
| Firebase エミュレータ | Firebase Local Emulator Suite |

### ユニットテスト対象

- `ocr-parse.ts`: `extractJson`、`parseOcrResponse` の具体的な入出力例
- `ocr-parser.ts`: `parseOcrText`、`mergeOcrResult` のエッジケース
- `storage.ts`: `toCard` の Firestore Timestamp 変換
- `auth.ts`: 認証エラーコードのマッピング
- コンポーネント: `SearchBar`（マイクボタン表示制御）、`CardDetail`（フィールド表示）

### プロパティベーステスト対象

各プロパティテストは fast-check を使用し、最低 100 回のイテレーションを実行する。

| テスト | 対応プロパティ | タグ |
|---|---|---|
| サインアップ→ログイン ラウンドトリップ | Property 1 | `Feature: business-card-manager, Property 1: signup-login-roundtrip` |
| 名刺保存時のタイムスタンプ設定 | Property 3 | `Feature: business-card-manager, Property 3: save-card-timestamps` |
| 名刺更新時の updatedAt 更新 | Property 4 | `Feature: business-card-manager, Property 4: update-card-updatedAt` |
| 名刺 CRUD ラウンドトリップ | Property 5 | `Feature: business-card-manager, Property 5: card-crud-roundtrip` |
| 名刺削除後の不在確認 | Property 6 | `Feature: business-card-manager, Property 6: delete-card-absent` |
| 名刺一覧の降順ソート | Property 7 | `Feature: business-card-manager, Property 7: cards-sorted-desc` |
| 検索結果の正確性 | Property 8 | `Feature: business-card-manager, Property 8: search-accuracy` |
| マイクボタンの表示制御 | Property 9 | `Feature: business-card-manager, Property 9: mic-button-visibility` |
| OCR レスポンスのパース正確性 | Property 10 | `Feature: business-card-manager, Property 10: ocr-parse-accuracy` |
| data URL パース ラウンドトリップ | Property 11 | `Feature: business-card-manager, Property 11: data-url-roundtrip` |
| OCR URL 種別振り分け | Property 12 | `Feature: business-card-manager, Property 12: ocr-url-classification` |
| 名刺共有の追加・削除 ラウンドトリップ | Property 13 | `Feature: business-card-manager, Property 13: share-unshare-roundtrip` |
| 共有名刺の取得 | Property 14 | `Feature: business-card-manager, Property 14: shared-cards-retrieval` |
| Firestore セキュリティルール - データ分離 | Property 15 | `Feature: business-card-manager, Property 15: firestore-data-isolation` |
| Firestore セキュリティルール - 共有読み取り | Property 16 | `Feature: business-card-manager, Property 16: firestore-shared-read` |
| cardIndex の作成・更新 | Property 17 | `Feature: business-card-manager, Property 17: card-index-creation` |
| 重複名刺の検出 | Property 18 | `Feature: business-card-manager, Property 18: duplicate-detection` |

### Firebase エミュレータを使ったテスト

Firestore セキュリティルール（Property 15、16）および Firestore CRUD（Property 3〜7、13、14、17、18）のテストは Firebase Local Emulator Suite を使用する。

```bash
# エミュレータ起動
firebase emulators:start --only firestore,auth

# テスト実行
npx vitest --run
```

### テスト設定例（fast-check）

```typescript
// Property 8: 検索結果の正確性
// Feature: business-card-manager, Property 8: search-accuracy
it("searchCards returns only cards matching the query", async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.array(arbitraryBusinessCard(), { minLength: 1, maxLength: 20 }),
      fc.string({ minLength: 1 }),
      async (cards, query) => {
        // Firebase Emulator にカードを保存
        const userId = "test-user";
        for (const card of cards) {
          await saveCard(userId, card);
        }
        const results = await searchCards(userId, query);
        const q = query.toLowerCase();
        return results.every((c) => {
          const searchable = [
            c.lastName, c.firstName, c.lastNameKana, c.firstNameKana,
            c.company, c.department, c.position, c.email,
            c.phone, c.mobile, c.address, c.notes,
          ].join(" ").toLowerCase();
          return searchable.includes(q);
        });
      }
    ),
    { numRuns: 100 }
  );
});
```
