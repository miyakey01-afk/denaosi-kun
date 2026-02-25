# 営業パイプライン・カレンダー管理アプリ 実装計画書

## 1. 市場調査結果

### 1.1 既存の主要ツール

#### 商用ツール

| ツール名 | 特徴 | カレンダー連携 | 価格帯 |
|---------|------|-------------|--------|
| **Salesforce** | 大企業向けフルCRM。パイプラインビューで案件をクリックして直接更新可能 | ○ | 月額$25〜$300/ユーザー |
| **HubSpot CRM** | 無料プランあり。AI対応の予測機能。カスタマイズ可能な予測カテゴリ | ○ | 無料〜高額 |
| **Pipedrive** | パイプライン管理特化。カンバン式UI。カレンダー同期でリマインダー自動送信 | ○ | 月額$14〜$99/ユーザー |
| **Monday CRM** | 高カスタマイズ性。250以上の自動化レシピ。メール・カレンダー統合 | ○ | 月額$12〜/ユーザー |
| **Zoho CRM** | コスパが良い。テリトリーベースの予測。3ユーザーまで無料 | ○ | 無料〜月額$52/ユーザー |
| **Copper CRM** | Google Workspace公式推奨。メール・カレンダーと自動連携 | ○ | 月額$29/ユーザー |
| **kintone** | 日本企業向け。ノーコードでカスタマイズ可能 | △ | 月額¥1,500/ユーザー |

#### オープンソース/軽量ツール

| ツール名 | 特徴 | ライセンス | 適性 |
|---------|------|-----------|------|
| **Twenty CRM** | モダンなUI、カスタムオブジェクト対応、セルフホスト可 | GPL | 小〜中規模チーム |
| **Frappe CRM** | Python/Frappe基盤、拡張性高い、$5/月で無制限ユーザー | OSS | コスパ重視 |
| **Meow CRM** | カンバンボード特化、ドラッグ&ドロップ、コーディング不要 | OSS | 最もシンプル |
| **Odoo CRM** | フルビジネススイート、請求書・在庫管理まで拡張可 | LGPL | 将来拡張向け |

### 1.2 既存ツールの課題（今回のアプリで解決すべき点）

- **大規模CRM（Salesforce等）**: 機能過多、高コスト、設定が複雑
- **中規模CRM（Pipedrive等）**: 月額課金が必要、日本語対応が不十分な場合あり
- **軽量ツール（Notion等）**: カレンダー上でのステータス管理が弱い
- **オープンソース**: セットアップが複雑、営業現場の細かいニーズに合わせにくい
- **Excel管理**: カレンダー連動なし、データの一覧性が低い、共有が難しい

### 1.3 市場から学ぶベストプラクティス

1. **カンバンボード + カレンダーの二面表示**（Pipedrive方式）
2. **ドラッグ&ドロップでのステータス変更・日付変更**（Trello/Monday方式）
3. **カレンダー上の色分けによるステータス可視化**（信号機式: 赤=期限超過、黄=要注意、緑=順調）
4. **インコンテキスト編集** — カレンダー上のカードをクリックして直接編集（Salesforce方式）
5. **ダッシュボードでの売上予測・集計**（KPIカード+パイプラインファネル）
6. **案件カードにステージ確率を表示** — 受注確率×ポイントで加重予測
7. **モバイル対応**（営業マンは外出先で利用）

---

## 2. アプリコンセプト

### 2.1 基本コンセプト
**「出直しくん」 — 営業マンのためのシンプル案件カレンダー管理ツール**

Excelの手軽さとCRMのカレンダー機能を融合した、軽量な営業パイプライン管理アプリ。

### 2.2 差別化ポイント

| 特徴 | 説明 |
|-----|------|
| **カレンダーファースト** | カレンダーが主画面。訪問予定と案件状態が一目で分かる |
| **シンプル入力** | Excel感覚の簡単な入力フォーム |
| **色分けステータス** | 案件の状態をカレンダー上で色で瞬時に把握 |
| **ポイント集計** | 予想受注金額をポイントで管理し、月別・担当者別に自動集計 |
| **リアルタイム共有** | 複数ユーザーがリアルタイムで案件状態を共有（Firestore） |
| **低コスト運用** | Firebase無料枠で運用可能（Firestore: 1GB/50K読取日、Hosting: 10GB/360MB日） |

---

## 3. 機能要件

### 3.1 コア機能

#### A. 案件入力フォーム
| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| 担当者名 | テキスト（選択式） | ○ | 営業マンの名前 |
| 所属名 | 選択式（事前登録） | ○ | 営業マンの所属部署・支店名（管理画面で事前登録） |
| 顧客名 | テキスト | ○ | 訪問先の顧客名 |
| 訪問日 | 日付 | ○ | 訪問予定日 |
| 訪問時間 | 時刻 | ○ | 訪問予定時刻 |
| 提案物件 | テキスト | ○ | 提案する物件・商材 |
| 予想ポイント | 数値 | ○ | 予想される受注金額（ポイント表記） |
| 状態 | 選択式 | ○ | 初回訪問 / 提案中 / 見積提出 / 交渉中 / クロージング |
| 決済 | 選択式 | ○ | 未決済 / 決済中 / 決済済 |
| 結果 | 選択式 | - | 未確定 / 受注 / 失注 / 保留 |
| メモ | テキストエリア | - | 自由記述の備考 |

#### B. カレンダービュー（メイン画面）
- **月表示 / 週表示 / 日表示** の切り替え
- 各日付セルに案件カードを表示
- **ステータスごとの色分け表示**:
  - 🔵 初回訪問（青）
  - 🟡 提案中（黄）
  - 🟠 見積提出（オレンジ）
  - 🔴 交渉中（赤）
  - 🟢 受注（緑）
  - ⚫ 失注（グレー）
- カレンダー上のカードクリックで詳細表示・編集
- ドラッグ&ドロップで日付変更

#### C. 案件一覧（リストビュー）
- テーブル形式で全案件を表示（Excel風）
- ソート・フィルター機能（担当者・状態・日付範囲）
- インライン編集対応

#### D. ダッシュボード
- 月別ポイント合計
- 担当者別ポイント集計
- ステータス別案件数（円グラフ）
- 今月の受注率

### 3.2 追加機能（Phase 2）
- 担当者ごとのフィルター表示
- CSV インポート/エクスポート（Excel連携）
- 通知機能（訪問日リマインダー）
- モバイルレスポンシブ対応

---

## 4. 技術スタック

### 4.1 フロントエンド

| 技術 | 理由 |
|-----|------|
| **React 18** | コンポーネントベースで開発効率が高い |
| **TypeScript** | 型安全で保守性が高い |
| **Vite** | 高速な開発環境 |
| **FullCalendar** | 高機能カレンダーライブラリ（React対応、ドラッグ&ドロップ対応） |
| **Tailwind CSS** | ユーティリティファーストで素早くスタイリング |
| **Recharts** | ダッシュボード用のグラフライブラリ |

### 4.2 バックエンド（Firebase）

| 技術 | 理由 |
|-----|------|
| **Firebase SDK (v10+)** | Googleのマネージドサービス。セットアップが容易 |
| **Cloud Firestore** | NoSQLデータベース。リアルタイム同期・オフライン対応 |
| **Firebase Hosting** | React SPAホスティング。自動SSL・グローバルCDN |
| **Firebase Authentication** | Phase 2以降のユーザー認証基盤として利用 |

### 4.3 プロジェクト構成

```
denaosi-kun/
├── docs/
│   └── implementation-plan.md    # 本計画書
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Calendar/
│   │   │   ├── CalendarView.tsx       # カレンダーメインビュー
│   │   │   ├── EventCard.tsx          # カレンダー上の案件カード
│   │   │   └── CalendarToolbar.tsx     # 表示切替ツールバー
│   │   ├── Form/
│   │   │   ├── DealForm.tsx           # 案件入力フォーム
│   │   │   └── DealFormModal.tsx      # モーダル形式のフォーム
│   │   ├── List/
│   │   │   ├── DealList.tsx           # 案件一覧テーブル
│   │   │   └── DealListFilters.tsx    # フィルターコンポーネント
│   │   ├── Dashboard/
│   │   │   ├── Dashboard.tsx          # ダッシュボードメイン
│   │   │   ├── PointsSummary.tsx      # ポイント集計
│   │   │   └── StatusChart.tsx        # ステータスグラフ
│   │   ├── Layout/
│   │   │   ├── Header.tsx             # ヘッダー
│   │   │   ├── Sidebar.tsx            # サイドバー
│   │   │   └── Layout.tsx             # レイアウト共通
│   │   └── common/
│   │       ├── Button.tsx
│   │       ├── Modal.tsx
│   │       └── Select.tsx
│   ├── lib/
│   │   └── firebase.ts               # Firebase初期化設定
│   ├── hooks/
│   │   ├── useDeals.ts               # 案件データのCRUD（Firestore）
│   │   ├── useCalendarEvents.ts       # カレンダーイベント変換
│   │   ├── useFirestore.ts            # Firestore CRUD + リアルタイムリスナー
│   │   └── useMasterData.ts           # 所属名・担当者名マスタデータ管理
│   ├── types/
│   │   └── index.ts                   # 型定義
│   ├── utils/
│   │   ├── constants.ts               # 定数（ステータス、色など）
│   │   └── helpers.ts                 # ユーティリティ関数
│   ├── data/
│   │   └── sampleData.ts             # サンプルデータ
│   ├── App.tsx                        # メインアプリ
│   ├── main.tsx                       # エントリーポイント
│   └── index.css                      # グローバルスタイル
├── firebase.json                      # Firebase設定（Hosting/Firestore）
├── .firebaserc                        # Firebaseプロジェクト設定
├── .env.local                         # Firebase環境変数（APIキー等）※.gitignore対象
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── postcss.config.js
```

---

## 5. データモデル

### 5.1 案件（Deal）

```typescript
interface Deal {
  id: string;                    // UUID（Firestoreドキュメント ID）
  salesPerson: string;           // 担当者名
  department: string;            // 所属名（部署・支店）
  customerName: string;          // 顧客名
  visitDate: string;             // 訪問日 (YYYY-MM-DD)
  visitTime: string;             // 訪問時間 (HH:mm)
  property: string;              // 提案物件
  expectedPoints: number;        // 予想ポイント
  status: DealStatus;            // 状態
  settlement: Settlement;        // 決済
  result: DealResult;            // 結果
  memo: string;                  // メモ
  createdAt: string;             // 作成日時
  updatedAt: string;             // 更新日時
}

type DealStatus =
  | 'first_visit'     // 初回訪問
  | 'proposing'       // 提案中
  | 'quote_submitted' // 見積提出
  | 'negotiating'     // 交渉中
  | 'closing';        // クロージング

type Settlement =
  | 'unsettled'       // 未決済
  | 'in_progress'     // 決済中
  | 'settled';        // 決済済

type DealResult =
  | 'pending'         // 未確定
  | 'won'             // 受注
  | 'lost'            // 失注
  | 'on_hold';        // 保留
```

### 5.2 Firestoreコレクション設計

```
Firestore データベース構造:

deals/{dealId}                    — 案件データ（Dealインターフェースに対応）
  ├── salesPerson: string
  ├── department: string
  ├── customerName: string
  ├── visitDate: string
  ├── visitTime: string
  ├── property: string
  ├── expectedPoints: number
  ├── status: string
  ├── settlement: string
  ├── result: string
  ├── memo: string
  ├── createdAt: Timestamp
  └── updatedAt: Timestamp

master/departments                — 所属名マスタ（事前登録）
  └── list: string[]              — 例: ["営業1課", "営業2課", "東京支店", "大阪支店"]

master/salesPersons               — 担当者名マスタ（事前登録）
  └── list: string[]              — 例: ["田中太郎", "山田花子", "佐藤次郎"]
```

### 5.3 ステータス色定義

```typescript
const STATUS_COLORS: Record<DealStatus, string> = {
  first_visit:     '#3B82F6', // 青
  proposing:       '#EAB308', // 黄
  quote_submitted: '#F97316', // オレンジ
  negotiating:     '#EF4444', // 赤
  closing:         '#8B5CF6', // 紫
};

const RESULT_COLORS: Record<DealResult, string> = {
  pending:  '#6B7280', // グレー
  won:      '#22C55E', // 緑
  lost:     '#374151', // ダークグレー
  on_hold:  '#F59E0B', // アンバー
};
```

---

## 6. 画面設計

### 6.1 画面遷移

```
┌─────────────────────────────────────────────┐
│  ヘッダー: アプリ名 | 担当者フィルター       │
├─────────┬───────────────────────────────────┤
│         │                                   │
│  サイド  │   メインコンテンツエリア            │
│  バー    │                                   │
│         │   ┌─ カレンダー ─────────────┐     │
│ ・カレン │   │  月 / 週 / 日 表示       │     │
│   ダー   │   │                         │     │
│ ・一覧   │   │  [案件カード] [案件カード]│     │
│ ・ダッシ │   │  [案件カード]            │     │
│  ュボード│   │                         │     │
│         │   └─────────────────────────┘     │
│ ・新規   │                                   │
│   登録   │   + 新規案件ボタン → モーダル表示   │
│         │                                   │
└─────────┴───────────────────────────────────┘
```

### 6.2 カレンダー上の案件カード

```
┌────────────────────────┐
│ ● 10:00 山田商事        │  ← ●の色 = ステータス色
│   提案: A物件 | 50pt   │  ← ポイント表示
│   [提案中] [未決済]     │  ← バッジ表示
└────────────────────────┘
```

### 6.3 入力フォーム（モーダル）

```
┌──────────────────────────────────┐
│  案件登録                    [×] │
├──────────────────────────────────┤
│                                  │
│  担当者: [▼ 選択してください   ]  │
│  所属:  [▼ 選択してください   ]  │
│  顧客名: [                    ]  │
│  訪問日: [📅 2026-02-25       ]  │
│  訪問時間: [🕐 10:00          ]  │
│  提案物件: [                  ]  │
│  予想ポイント: [     ] pt        │
│                                  │
│  状態:  [▼ 初回訪問           ]  │
│  決済:  [▼ 未決済             ]  │
│  結果:  [▼ 未確定             ]  │
│                                  │
│  メモ:                           │
│  ┌────────────────────────────┐  │
│  │                            │  │
│  └────────────────────────────┘  │
│                                  │
│       [キャンセル]  [保存]        │
└──────────────────────────────────┘
```

---

## 7. 実装フェーズ

### Phase 1: 基本機能（MVP）— 目標: 動作するカレンダーアプリ

| ステップ | 内容 | 主要ファイル |
|---------|------|-------------|
| 1-1 | プロジェクト初期設定（Vite + React + TypeScript + Firebase SDK） | package.json, vite.config.ts |
| 1-2 | Tailwind CSS セットアップ | tailwind.config.js, index.css |
| 1-3 | Firebase初期化設定 | lib/firebase.ts, .env.local |
| 1-4 | 型定義とデータモデル作成 | types/index.ts, utils/constants.ts |
| 1-5 | レイアウトコンポーネント作成 | Layout/, Header.tsx, Sidebar.tsx |
| 1-6 | 案件入力フォーム作成（所属名フィールド含む） | Form/DealForm.tsx, DealFormModal.tsx |
| 1-7 | Firestoreによるデータ永続化（CRUD + onSnapshotリアルタイム同期） | hooks/useFirestore.ts, hooks/useDeals.ts |
| 1-8 | マスタデータ管理（所属名・担当者名の事前登録） | hooks/useMasterData.ts |
| 1-9 | カレンダービュー実装（FullCalendar連携） | Calendar/CalendarView.tsx, EventCard.tsx |
| 1-10 | カレンダー上の案件カード表示 | Calendar/EventCard.tsx |
| 1-11 | 案件の編集・削除機能 | Form/DealFormModal.tsx |
| 1-12 | ドラッグ&ドロップで日付変更 | Calendar/CalendarView.tsx |
| 1-13 | Firebase Hosting デプロイ設定 | firebase.json, .firebaserc |

### Phase 2: 拡張機能

| ステップ | 内容 |
|---------|------|
| 2-1 | 案件一覧（リストビュー）実装 |
| 2-2 | フィルター・ソート機能 |
| 2-3 | ダッシュボード（集計・グラフ） |
| 2-4 | CSV インポート/エクスポート |
| 2-5 | レスポンシブデザイン（モバイル対応） |

### Phase 3: 運用機能（将来）

| ステップ | 内容 |
|---------|------|
| 3-1 | Firebase Authentication によるユーザー認証 |
| 3-2 | Firestoreセキュリティルール設定（認証ベースのアクセス制御） |
| 3-3 | 複数ユーザー対応（担当者ごとの権限管理） |
| 3-4 | 通知・リマインダー機能 |

---

## 8. 開発ルール

### コーディング規約
- **言語**: TypeScript strict mode
- **コンポーネント**: 関数コンポーネント + React Hooks
- **スタイル**: Tailwind CSS（インラインユーティリティクラス）
- **状態管理**: React Context + useReducer（Phase 1では十分）
- **命名規則**:
  - コンポーネント: PascalCase
  - 関数・変数: camelCase
  - 定数: UPPER_SNAKE_CASE
  - ファイル: PascalCase（コンポーネント）、camelCase（ユーティリティ）

### 品質基準
- 全コンポーネントにTypeScript型を適用
- エラーハンドリングを適切に実装
- アクセシビリティ（ARIA属性）を考慮

---

## 9. まとめ

本アプリは、Excelでの営業管理の手軽さを維持しつつ、**カレンダー上での直感的な案件管理**を実現します。

**主な利点:**
1. カレンダーで訪問予定と案件状態が一目で分かる
2. 色分けにより案件の進捗状況を瞬時に把握
3. ポイント集計でチーム全体の営業パフォーマンスを可視化
4. Firestoreリアルタイム同期で複数ユーザーが同時利用可能
5. Firebase無料枠で低コスト運用（Spark プラン）
6. 所属名・担当者名のマスタデータ管理で入力の統一性を確保
