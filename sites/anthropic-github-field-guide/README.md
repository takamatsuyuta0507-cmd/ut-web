# Anthropic GitHub Field Guide

AnthropicのGitHub公開リポジトリ（**全90個 / 2026-06時点**）を、**網羅的に学んで実務に活かす**ための非公式学習サイト。

UTポートフォリオ（warm off-white × オレンジ、Noto Sans JP、番号付きセクション、ドット強調）のテイストを踏襲した、静的サイトです。

## 構成

| ページ | 内容 |
|---|---|
| `index.html` | ハブ。4本柱・実務での使いどころ・ロードマップ入口・カタログ案内 |
| `build.html` | **つくる** — Claude Code・エージェント・各言語SDK・MCP・話題作 |
| `use.html` | **つかう** — Skills・Plugins・Cowork・業界特化（法務/金融/医療） |
| `learn.html` | **まなぶ** — クックブック・コース・チュートリアル・クイックスタート |
| `research.html` | **しらべる** — セキュリティ・解釈可能性・評価・安全性研究 |
| `catalog.html` | 全90リポジトリの横断検索（カテゴリ・難易度・キーワード絞り込み） |
| `paths.html` | 実務シナリオ別の学習ロードマップ（7本・なぜそれをやるか付き） |

## ファイル

- `data.js` … 全リポジトリのデータ（説明・実務での使いどころ・タグ・難易度）＋カテゴリ／柱／ロードマップ／ユースケース定義。**内容の更新はここだけ直せばOK**。
- `styles.css` … デザインシステム（CSS変数でテーマ管理）。
- `site.js` … 共有ヘッダー／フッター・カード描画・カタログ絞り込み・スクロール演出。
- `*.html` … 各ページ（チャーム＝ヘッダー／フッターは `site.js` が注入）。

## ローカルで見る

ファイルを直接開いてもほぼ動きますが、`fetch` ではなくJSなので、簡易サーバー経由が確実です。

```powershell
cd "$env:USERPROFILE\Downloads\UT\anthropic-github-field-guide"
python -m http.server 5173
# → http://localhost:5173
```

## デプロイ（Cloudflare Pages）

このフォルダをそのまま公開できます（ビルド不要）。

1. フォルダをGitリポジトリにして push、または Cloudflare Pages の「Direct Upload」でフォルダごとアップロード。
2. ビルドコマンド: なし／出力ディレクトリ: ルート（このフォルダ）。

## メンテナンス

- リポジトリの追加・説明の修正は `data.js` の `REPOS` 配列を編集。
- 色やフォントは `styles.css` の `:root` 変数を編集。
- ロードマップの順番・理由は `data.js` の `PATHS` を編集。

---

データ出典: <https://github.com/anthropics> ／ Built with Claude Code.
