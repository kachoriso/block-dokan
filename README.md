# 🦭 ブロザラシ

ブロックブラストのオマージュ作品。派手なエフェクトと美しいデザインで楽しめるWebベースのパズルゲームです。

![ブロザラシ](https://img.shields.io/badge/Game-ブロザラシ-purple?style=for-the-badge)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

## ✨ 特徴

- 🎯 **直感的な操作**: ドラッグ&ドロップで簡単にプレイ
- 💥 **派手なエフェクト**: パーティクルエフェクトとアニメーション
- 🏆 **スコアシステム**: ハイスコア記録とコンボボーナス
- 📱 **レスポンシブデザイン**: PC・タブレット・スマホ対応
- 🎨 **モダンなUI**: グラデーションとガラスモーフィズム

## 🎮 遊び方

1. **ピースの配置**
   - 画面下部に表示される3つのピースから選択
   - ドラッグして8×8のボードに配置

2. **ラインを消す**
   - 横一列または縦一列を埋めるとラインが消える
   - 複数ライン同時消しでコンボボーナス獲得

3. **スコアを稼ぐ**
   - ラインを消すとスコア獲得
   - コンボが続くほど高得点

4. **ゲームオーバー**
   - どのピースも配置できなくなったら終了
   - ハイスコアを目指そう！

## 🚀 プレイ方法

### オンラインでプレイ

Webサーバーで公開するか、ローカルでファイルを開いてプレイできます。

### ローカル環境

1. リポジトリをクローン
```bash
git clone <repository-url>
cd block-dokan
```

2. `index.html` をブラウザで開く
```bash
# macOS
open index.html

# Linux
xdg-open index.html

# Windows
start index.html
```

または、簡易サーバーを起動
```bash
# Python 3
python -m http.server 8000

# Node.js (http-server)
npx http-server
```

ブラウザで `http://localhost:8000` にアクセス

## 📁 ファイル構成

```
block-dokan/
├── index.html      # ゲームのHTML構造
├── style.css       # スタイルとアニメーション
├── game.js         # ゲームロジックとエフェクト
└── README.md       # このファイル
```

## 🎨 技術的な特徴

### CSS アニメーション
- `@keyframes` による滑らかなアニメーション
- `backdrop-filter` を使用したガラスモーフィズム
- グラデーションとシャドウで立体感を演出

### JavaScript 機能
- **ゲーム状態管理**: `Game` クラスで状態を一元管理
- **ピース生成**: 19種類のランダムなブロック形状
- **パーティクルシステム**: Canvas API を使用した派手なエフェクト
- **ドラッグ&ドロップ**: マウスとタッチの両対応
- **ローカルストレージ**: ハイスコアの保存

### レスポンシブデザイン
- モバイルファーストなアプローチ
- タッチイベント完全対応
- メディアクエリで最適なサイズ調整

## 🎯 ゲームルール

### スコア計算
- 基本スコア: 消したセル数 × 10
- コンボボーナス: 基本スコア × (コンボ数 - 1)

例：
- 1ライン（8セル）消去: 80点
- 2ライン同時消し: 160点 + 160点（コンボ）= 320点
- 3ライン同時消し: 240点 + 480点（コンボ）= 720点

### ピース形状
- 1×1から5×1まで様々な形状
- L字型、T字型、Z字型などの複雑な形状
- 3×3の大型ブロック

## 🛠️ カスタマイズ

### 色の変更
`style.css` のグラデーション部分を編集：
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### ボードサイズの変更
`game.js` の `Game` クラス内の配列サイズを変更：
```javascript
this.board = Array(8).fill(null).map(() => Array(8).fill(0));
```

### ピース形状の追加
`game.js` の `getRandomShape()` メソッドに新しい形状を追加：
```javascript
const shapes = [
    // 新しい形状を追加
    [[1, 1, 1], [1, 0, 1]],
    // ...
];
```

## 🐛 トラブルシューティング

### ドラッグが動作しない
- ブラウザがモダンなものか確認（Chrome、Firefox、Safari、Edge推奨）
- JavaScriptが有効になっているか確認

### エフェクトが表示されない
- Canvas API対応ブラウザか確認
- ハードウェアアクセラレーションが有効か確認

### スコアが保存されない
- ブラウザのローカルストレージが有効か確認
- プライベートモード/シークレットモードでないか確認

## 📝 ライセンス

このプロジェクトはオリジナルの「ブロックブラスト」へのオマージュ作品です。
教育目的および個人使用のために作成されました。

## 🤝 貢献

バグ報告や機能追加の提案を歓迎します！

## 🎉 楽しんでください！

ハイスコアを目指して頑張りましょう！🚀

