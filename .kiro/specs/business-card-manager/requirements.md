# 要件定義書

## はじめに

本ドキュメントは、手入力およびOCR（Tesseract.js / Claude Vision API）による名刺登録に対応した、モバイルファースト＋PC対応の名刺管理Webアプリケーション「Business Card Manager」の要件を定義する。

Firebase Authentication によるユーザー認証、Firestore によるデータ永続化、Google Custom Search API による会社HP自動取得、名刺共有機能、音声検索など、コア機能から追加機能までを網羅する。

## 用語集

- **System**: 名刺管理Webアプリケーション全体
- **Auth_Service**: Firebase Authentication を利用した認証サービス
- **Card_Store**: Firestore の `users/{userId}/businessCards` サブコレクションを操作するデータ層
- **OCR_Engine**: Tesseract.js または Claude Vision API を用いた光学文字認識エンジン
- **OCR_Parser**: OCR結果テキストを名刺フィールドに変換するパーサー
- **Company_Search**: Google Custom Search API を用いた会社HP検索サービス
- **Share_Service**: 名刺共有・重複検出を担うサービス層
- **Card_Index**: Firestore の `cardIndex` コレクション（重複検出用インデックス）
- **Speech_Input**: Web Speech API を用いた音声入力機能
- **User**: Firebase Authentication で認証済みのアプリ利用者
- **BusinessCard**: 名刺1件を表すデータオブジェクト（後述のスキーマ参照）

## データスキーマ

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
  companyUrl: string;      // 会社HP URL
  website: string;         // 関連サイト URL
  notes: string;           // メモ
  imageUrl: string;        // 名刺画像（Base64 data URL）
  ownerId: string;         // 所有者UID
  sharedWith: string[];    // 共有先UIDの配列
  createdAt: string;       // 作成日時（ISO 8601）
  updatedAt: string;       // 更新日時（ISO 8601）
}
```

---

## 要件

### 要件1: ユーザー認証

**ユーザーストーリー:** 利用者として、メールアドレスとパスワードでアカウントを作成・ログインしたい。そうすることで、自分の名刺データを安全に管理できる。

#### 受け入れ基準

1. THE System SHALL メールアドレスとパスワードによる新規アカウント登録機能を提供する
2. THE System SHALL メールアドレスとパスワードによるログイン機能を提供する
3. WHEN ユーザーがログアウト操作を行ったとき、THE Auth_Service SHALL セッションを終了し、ログインページへリダイレクトする
4. WHEN 未認証のユーザーが保護されたページにアクセスしたとき、THE System SHALL ログインページへリダイレクトする
5. WHILE ユーザーが認証済みのとき、THE System SHALL Firebase Auth のセッション永続化により、ブラウザ再起動後も自動ログイン状態を維持する
6. IF サインアップ時にメールアドレスが既に登録済みの場合、THEN THE Auth_Service SHALL 「このメールアドレスは既に使用されています」というエラーメッセージを表示する
7. IF ログイン時に認証情報が誤っている場合、THEN THE Auth_Service SHALL 「メールアドレスまたはパスワードが正しくありません」というエラーメッセージを表示する
8. WHEN ユーザーが新規登録を完了したとき、THE System SHALL `users/{uid}` ドキュメントにメールアドレスを保存する

---

### 要件2: ユーザーごとのデータ分離

**ユーザーストーリー:** 利用者として、自分の名刺データが他のユーザーから見えないようにしたい。そうすることで、プライバシーを保護できる。

#### 受け入れ基準

1. THE Card_Store SHALL 名刺データを `users/{userId}/businessCards/{cardId}` のパスに保存する
2. THE System SHALL Firestore セキュリティルールにより、`request.auth.uid == userId` を満たすユーザーのみが自身のデータへの読み書きを許可する
3. WHEN 認証済みユーザーが名刺一覧を取得するとき、THE Card_Store SHALL そのユーザーの `userId` に紐づく名刺のみを返す
4. IF 認証されていないリクエストが Firestore に到達した場合、THEN THE System SHALL そのリクエストを拒否する

---

### 要件3: 名刺のCRUD操作

**ユーザーストーリー:** 利用者として、名刺を登録・閲覧・編集・削除したい。そうすることで、名刺情報を一元管理できる。

#### 受け入れ基準

1. WHEN ユーザーが名刺フォームを送信したとき、THE Card_Store SHALL 新しい BusinessCard ドキュメントを Firestore に保存し、`createdAt` と `updatedAt` に現在時刻を設定する
2. WHEN ユーザーが名刺詳細ページにアクセスしたとき、THE System SHALL 該当する BusinessCard の全フィールドを表示する
3. WHEN ユーザーが名刺を編集して保存したとき、THE Card_Store SHALL 変更されたフィールドと `updatedAt` を更新する
4. WHEN ユーザーが名刺の削除を確認したとき、THE Card_Store SHALL 該当ドキュメントを Firestore から削除する
5. IF 存在しない名刺IDへのアクセスが発生した場合、THEN THE System SHALL 「名刺が見つかりません」というメッセージを表示し、一覧ページへ誘導する
6. THE System SHALL 名刺フォームに以下のフィールドを提供する: 姓・名・姓フリガナ・名フリガナ・会社名・部署・役職・メール・電話・携帯・郵便番号・住所・会社HP・関連サイト・メモ・名刺画像

---

### 要件4: 名刺一覧・検索

**ユーザーストーリー:** 利用者として、登録した名刺を一覧表示し、キーワードで検索したい。そうすることで、目的の名刺をすばやく見つけられる。

#### 受け入れ基準

1. THE System SHALL 名刺一覧を `updatedAt` の降順で表示する
2. WHEN ユーザーが検索バーにキーワードを入力したとき、THE System SHALL 姓・名・フリガナ・会社名・部署・役職・メール・電話・携帯・住所・メモを対象にインクリメンタル検索を実行する
3. WHEN 検索結果が0件のとき、THE System SHALL 「該当する名刺が見つかりません」というメッセージを表示する
4. THE System SHALL モバイル（768px未満）では1カラムリスト、PC（768px以上）では3カラムグリッドで名刺一覧を表示する

---

### 要件5: 音声検索

**ユーザーストーリー:** 利用者として、検索バーで音声入力を使いたい。そうすることで、ハンズフリーで名刺を検索できる。

#### 受け入れ基準

1. WHERE ブラウザが Web Speech API に対応している場合、THE System SHALL 検索バーにマイクボタンを表示する
2. WHEN ユーザーがマイクボタンを押したとき、THE Speech_Input SHALL 日本語（`ja-JP`）で音声認識を開始する
3. WHILE 音声認識が実行中のとき、THE System SHALL マイクアイコンをアニメーション表示して録音中であることを示す
4. WHEN 音声認識が結果を返したとき、THE Speech_Input SHALL 認識結果を検索バーに反映し、検索を実行する
5. WHEN ユーザーが録音中にマイクボタンを再度押したとき、THE Speech_Input SHALL 音声認識を停止する
6. IF 音声認識でエラーが発生した場合、THEN THE System SHALL トースト通知でエラー内容をユーザーに伝える
7. WHERE ブラウザが Web Speech API に対応していない場合、THE System SHALL マイクボタンを表示しない

---

### 要件6: OCRによる名刺自動入力

**ユーザーストーリー:** 利用者として、名刺を撮影または画像を選択してOCR解析し、フォームに自動入力したい。そうすることで、手入力の手間を省ける。

#### 受け入れ基準

1. THE System SHALL カメラ撮影またはファイル選択による名刺画像の取り込みを提供する
2. WHEN ユーザーが「解析する」ボタンを押したとき、THE OCR_Engine SHALL 取り込んだ画像を解析し、テキストを抽出する
3. WHEN OCR_Engine がテキストを抽出したとき、THE OCR_Parser SHALL 姓・名・会社名・部署・役職・メール・電話・携帯・郵便番号・住所・URLの各フィールドに分類して返す
4. WHEN OCR解析が完了したとき、THE System SHALL 抽出結果を名刺フォームに自動入力する
5. WHILE OCR解析が実行中のとき、THE System SHALL 進捗状況をプログレスバーまたはローディング表示でユーザーに示す
6. IF OCR解析に失敗した場合、THEN THE System SHALL エラーメッセージを表示し、手入力フォームへの切り替えを促す
7. WHEN OCR_Parser が名刺記載URLを解析したとき、THE OCR_Parser SHALL URLの種別（`corporate` または `product`）を判定し、`corporate` の場合は `companyUrl` に、それ以外は `website`（関連サイト）に設定する
8. THE OCR_Parser SHALL 有効な Base64 data URL（`data:image/[種別];base64,[データ]` 形式）を正しく処理する
9. FOR ALL 有効な名刺画像について、OCR解析後に得られたテキストを再度フォーマットして解析した結果は、元の解析結果と等価でなければならない（ラウンドトリップ特性）

---

### 要件7: 会社HP自動取得・リンク紐づけ

**ユーザーストーリー:** 利用者として、会社名から会社のWebサイトを自動で取得し、会社名にリンクを紐づけたい。そうすることで、会社情報へのアクセスが容易になる。

#### 受け入れ基準

1. WHEN OCR解析が完了し `companyUrl` が空で `company` が設定されている場合、THE Company_Search SHALL Google Custom Search API を用いて「{会社名} 公式サイト」を検索し、最初の結果のURLを `companyUrl` に設定する
2. WHEN ユーザーが名刺詳細ページで会社名をクリックしたとき、THE System SHALL `companyUrl` が設定されている場合、新しいタブで会社HPを開く
3. THE System SHALL 名刺フォームに `companyUrl`（会社HP）フィールドを提供し、手動での入力・編集を可能にする
4. IF Google Custom Search API の呼び出しに失敗した場合、THEN THE Company_Search SHALL エラーをログに記録し、`companyUrl` を空のまま処理を継続する

---

### 要件8: 名刺共有機能

**ユーザーストーリー:** 利用者として、自分の名刺データを他のユーザーと共有したい。そうすることで、チームで名刺情報を活用できる。

#### 受け入れ基準

1. WHEN ユーザーが共有ダイアログで対象ユーザーのメールアドレスを入力して共有を実行したとき、THE Share_Service SHALL 対象ユーザーのUIDを `sharedWith` 配列に追加する
2. WHEN 共有を受けたユーザーが名刺一覧を表示したとき、THE System SHALL 自分の名刺に加えて、共有された名刺を「共有された名刺」セクションとして表示する
3. THE System SHALL 共有された名刺を読み取り専用で表示し、共有を受けたユーザーによる編集・削除を禁止する
4. WHEN ユーザーが共有を解除したとき、THE Share_Service SHALL 対象ユーザーのUIDを `sharedWith` 配列から削除する
5. IF 指定されたメールアドレスのユーザーが存在しない場合、THEN THE Share_Service SHALL 「指定されたユーザーが見つかりません」というエラーメッセージを表示する
6. THE System SHALL Firestore セキュリティルールにより、`sharedWith` に含まれるユーザーに対して該当名刺の読み取りのみを許可する

---

### 要件9: 重複名刺の検出・表示

**ユーザーストーリー:** 利用者として、同じ名刺を他のユーザーも持っているかどうかを確認したい。そうすることで、社内での名刺情報の重複を把握できる。

#### 受け入れ基準

1. WHEN ユーザーが名刺を保存したとき、THE Share_Service SHALL `cardIndex` コレクションに `email`・`lastName`・`firstName`・`company`・`ownerId`・`cardId`・`ownerEmail` を含むインデックスドキュメントを作成または更新する
2. WHEN ユーザーが名刺詳細ページを表示したとき、THE Share_Service SHALL `cardIndex` を検索し、同じメールアドレス（優先）または同じ氏名＋会社名を持つ他ユーザーを特定する
3. WHEN 重複する名刺を持つ他ユーザーが存在するとき、THE System SHALL 名刺詳細ページに「この名刺を持っているユーザー」セクションとして表示する
4. THE System SHALL Firestore セキュリティルールにより、認証済みユーザーは `cardIndex` の読み取りを許可し、書き込みは `ownerId == request.auth.uid` の場合のみ許可する

---

### 要件10: レスポンシブデザイン

**ユーザーストーリー:** 利用者として、スマートフォンでもPCでも快適に操作したい。そうすることで、場所を選ばず名刺管理ができる。

#### 受け入れ基準

1. THE System SHALL モバイル（768px未満）とPC（768px以上）の両方で正常に動作するレスポンシブレイアウトを提供する
2. THE System SHALL モバイルでは画面下部にフローティングアクションボタン（FAB）で「新規登録」を提供する
3. THE System SHALL PCでは3カラムグリッドの名刺一覧と、ヘッダー右上の「新規登録」ボタンを提供する
4. THE System SHALL 名刺フォームをモバイルでは1カラム縦積み、PCでは2カラムグリッドで表示する
5. THE System SHALL 名刺詳細ページをモバイルでは1カラム縦積み、PCでは左に名刺画像（40%）・右に詳細情報（60%）の2カラムで表示する
6. THE System SHALL タッチ操作に適した十分なタッチターゲットサイズ（最小44×44px）を確保する

---

### 要件11: 通知・フィードバック

**ユーザーストーリー:** 利用者として、操作の結果をすぐに確認したい。そうすることで、操作が成功したか失敗したかを把握できる。

#### 受け入れ基準

1. WHEN 名刺の保存・更新・削除が成功したとき、THE System SHALL トースト通知で操作の完了をユーザーに伝える
2. WHEN 名刺の削除をユーザーが要求したとき、THE System SHALL 確認ダイアログを表示し、ユーザーの明示的な確認を得てから削除を実行する
3. IF ネットワークエラーまたは Firestore への書き込みに失敗した場合、THEN THE System SHALL エラー内容をトースト通知でユーザーに伝える
4. WHILE データの読み込みが実行中のとき、THE System SHALL ローディング状態をユーザーに示す

---

### 要件12: セキュリティ

**ユーザーストーリー:** 利用者として、自分のデータが不正アクセスから保護されていることを確認したい。そうすることで、安心してアプリを利用できる。

#### 受け入れ基準

1. THE System SHALL Firestore セキュリティルールにより、認証されていないリクエストをすべて拒否する
2. THE System SHALL `users/{userId}/businessCards` へのアクセスを `request.auth.uid == userId` の場合のみ許可する
3. THE System SHALL `users/{userId}` ドキュメントの読み取りを認証済みユーザー全員に許可し、書き込みは `request.auth.uid == userId` の場合のみ許可する（ユーザー検索機能のため）
4. THE System SHALL APIルート（`/api/ocr`, `/api/company-url`）へのリクエストにサーバーサイドでのバリデーションを実施する
5. THE System SHALL 環境変数（APIキー等）をクライアントサイドに露出しない
