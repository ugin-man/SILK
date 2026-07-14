# SILK V2 公開候補

V2は、地理を扱うWORLDと、設定全体を読むATLAS Graph、Readerを一つのHTMLへまとめたローカルアプリです。公開候補は作品固有の設定を持たないプレーン状態から起動します。

## 正本

- 編集元: `v2.next/src/plain-host.html`、`v2.next/src/`、`v2.next/data/plain-world.json`
- ビルド: `node v2.next/scripts/build_v2_next.js`
- 起動ファイル: `v2.next/SILK-V2.html`
- 互換ファイル: `v2.next/SILK-V2-NEXT.html`
- 静的検査: `v2.next/STATIC_AUDIT.json`
- ブラウザ検査: `v2.next/BROWSER_VALIDATION.json`

## 初期状態

- 世界IDは`starter_world`
- 案内用の主題1件
- 関係0件
- 国家0件
- 都市0件
- 地理フィーチャー0件
- 12,962セルはすべて海、所有者なし

## 入っているもの

- 動的分類のATLAS GraphとWikipedia型Reader
- semantic zoom、検索、履歴、Inspector
- 球面セル地図、共有セル境界、国家、都市、島嶼の表示
- SURFACEとWHITEの表示切替
- 最初の操作後に停止する自動回転
- AIと人間が共有するセル編集API
- preview、apply、undo、redo
- V2側での世界パッケージ再検証
- 失敗時に読み込み前へ戻す原子的インポート
- セル編集を含むJSONエクスポートと未保存警告
- 390px幅のWORLDとReader
- WORLDのキーボード移動、セル選択、編集、ズーム
- WebGL2描画とCanvas 2Dフォールバック
- ロゴの連続操作で開くLOOM関係表示

## 読み込み契約

`validation.ok`は入口条件にすぎません。V2は主題と分類のID重複、存在しないrelation端点、claim参照、Spatial Registryの形状と主題参照、集計値のずれ、球面セル所有者、危険なオブジェクトキー、深さと容量を再検査します。不合格の場合は現在の世界を維持して画面上へ理由を表示します。

正しい地理付き試験パッケージでは、2国家、1都市、7,866所有セルがSpatial Registryから球面WORLDへ反映されることを確認しました。危険なHTML文字列は要素として実行されず、Reader内で文字列として表示されます。

## 対象外

- 銀河やダンジョン専用のrenderer
- 季節と天候
- 根拠のない地形や河川の自動生成
- 世界設定そのものの品質保証

地理を持たない世界ではATLASを中心に使います。WORLDは世界パッケージの空間モデルに応じて使います。

## 検証

ビルド、データ契約、公開文言、固有設定の混入、主要UI操作に加え、異常入力、ロールバック、書き出し再検証、モバイル、キーボード、reduced motion、外部通信を検査します。合否と証拠は`v2.next/RELEASE_READINESS.md`と`v2.next/BROWSER_VALIDATION.json`へ記録します。

V2が保証するのはパッケージの構造、参照、表示、操作の整合です。世界設定そのものが面白いか、十分に深いかはV1の生成・批評・完成監査で扱い、V2の構造検査だけで創作品質を合格扱いにはしません。
