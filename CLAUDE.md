# CLAUDE.md

このファイルはClaude Codeがこのリポジトリで作業する際のガイダンスを提供します。

## プロジェクト概要

Tapbackは、モバイル端末からClaude Code/Codexのターミナルを監視・操作するNode.js CLIツールです。tmuxセッションの出力をWebSocket経由でリアルタイム配信し、localhostで動作するWebアプリへのリバースプロキシ機能も提供します。

## ビルドとテスト

```bash
# 依存インストール
npm install

# 実行
node bin/cli.js

# ポート指定
node bin/cli.js 8080

# プロキシ付き
node bin/cli.js --proxy 3000:3001

# PIN無効
node bin/cli.js --no-pin
```

## アーキテクチャ

### ディレクトリ構造

```text
tapback-node/
├── package.json          # bin: tapback, dependencies
├── bin/cli.js            # エントリーポイント (#!/usr/bin/env node)
├── src/
│   ├── server.js         # Express + WebSocket サーバー (ポート9876)
│   ├── tmux.js           # tmuxコマンド実行 (child_process.execFile)
│   ├── proxy.js          # リバースプロキシ (localhost書き換え)
│   ├── claudeStatus.js   # Claude Codeステータス管理 + hooks設置
│   ├── config.js         # 設定ファイル (~/.tapback.json) 読み書き
│   └── html.js           # モバイルUI HTML生成
```

### 主要コンポーネント

- **server.js**: Express + wsベースのサーバー。ターミナルUI、PIN認証（メイン/設定で別PIN）、WebSocket、設定API
- **tmux.js**: tmuxコマンド（capture-pane, send-keys, list-sessions, display-message）のPromiseラッパー
- **proxy.js**: http-proxyベースのリバースプロキシ。localhost参照を自動的にMacのIPに書き換え
- **claudeStatus.js**: Claude Codeフック設置、ステータス受信・保存。`~/.claude/settings.json`を更新
- **config.js**: `~/.tapback.json`による設定永続化（PIN有効/無効、プロキシポート、クイックボタン）
- **html.js**: モバイル向けレスポンシブWebUI、設定ページ、PIN認証ページ

### 通信フロー

1. モバイル → `/api/sessions` でtmuxセッション一覧取得
2. モバイル → `/ws` WebSocket接続
3. サーバー → 全tmuxセッションの出力を1秒ごとにブロードキャスト
4. モバイル → WebSocketでコマンド送信 → `tmux.sendKeys`でtmuxに転送

### 認証

- メインページ (`/`): 4桁PIN、Cookie(24h)。`--no-pin`または設定で無効化可能
- 設定ページ (`/settings`): 別の4桁PIN、常に有効

## コーディング規約

- Node.js (CommonJS)
- 非同期処理はasync/awaitとPromise
- サーバーはExpress + ws

## 依存関係

- **express**: HTTPサーバー
- **ws**: WebSocket
- **http-proxy**: リバースプロキシ
- **cookie-parser**: Cookie認証

## 注意点

- tmuxコマンドは明示的に`session:0.0`を指定（複数ウィンドウ/ペーン対応のため）
- PATH設定で`/opt/homebrew/bin`と`/usr/local/bin`を追加（tmux検出用）
- プロキシはlocalhost参照を自動的にMacのIPに書き換え
- 設定ファイルは`~/.tapback.json`に保存
