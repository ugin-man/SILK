# SILK V2

世界設定と地理データをローカルブラウザで閲覧、編集する公開候補です。初期状態はプレーンで、作品固有の設定を含みません。

## 起動

`SILK-V2.html`をブラウザで開きます。単一HTMLなので、サーバーを立てなくても使えます。

## 画面

- `WORLD`: 球面セル上の地形、国家、都市を表示します。左側で表示項目とセル編集を切り替えます。
- `ATLAS / Graph`: 世界設定の規模と関係をグラフで表示します。
- `ATLAS / Reader`: 分類ツリーから設定記事を読みます。
- `LOOM`: SILKロゴを5秒以内に10回押すと開く関係表示です。`WORLD`か`ATLAS`を押すと戻ります。

初期パッケージは案内用の1主題だけを持ち、関係、国家、都市は0件です。球面セルはすべて未所有の海として始まります。

## WORLD

- WebGL2を優先し、使えない環境ではCanvas 2Dへ切り替えます。
- 12,962セルのメッシュを起動時に一度構築します。
- `SURFACE`では地形と高度、`WHITE`ではセル構造を表示します。
- 最初の操作後は自動回転を停止します。
- `SILK_MAP.applyCellTransaction()`から地形と所有者を変更できます。
- セルは単一所有で、変更にはpreview、validation、undo、redoがあります。

## ビルドと検査

```powershell
.\v2.next\BUILD_AND_AUDIT.ps1
```

正式候補`SILK-V2.html`と互換名`SILK-V2-NEXT.html`は同じ内容で生成されます。公開ビルドの入力は`src/plain-host.html`、`data/plain-world.json`、`src/`の統合モジュールだけです。

検査結果は`STATIC_AUDIT.json`、`BROWSER_VALIDATION.json`、`RELEASE_READINESS.md`に記録します。
