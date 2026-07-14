# SILK V2 リリース準備

## 対象

- `SILK-V2.html`
- `SILK-V2-NEXT.html`

## 公開状態

- プレーン世界パッケージ: PASS
- 作品固有データの公開ビルドからの分離: PASS
- 公開向けUI文言: PASS
- WORLD、ATLAS Graph、Reader、隠しLOOM: PASS
- V2パッケージ再検証: PASS
- 原子的インポートと失敗時ロールバック: PASS
- JSONエクスポートと未保存状態: PASS
- 390px幅のWORLD、Reader: PASS
- キーボードWORLD操作、reduced motion: PASS
- 外部通信なし: PASS
- 静的監査: PASS
- 外部Chromium監査: PASS

## 初期データ契約

- 1主題
- 0関係
- 0国家
- 0都市
- 0地理フィーチャー
- 12,962セル、全セル未所有

## 検証結果

- 公開候補SHA256: `F5C3FB5FCB1F9DC606715D204360F1F9FA393006F28E29469220650803FD53BC`
- `BUILD_AND_AUDIT.ps1`: PASS
- Node契約テスト: 全件PASS
- `STATIC_AUDIT.json`: `ok: true`、failures 0件
- `BROWSER_VALIDATION.json`: PASS
- Chromium console: Errors 0、Warnings 0

ブラウザではプレーン起動、SURFACEとWHITE、地形編集とUndo、ATLASの1主題、Reader記事、隠しLOOM、WORLDとATLASによるLOOM終了を確認しました。さらに、重複IDと切れた参照の拒否、拒否後の世界維持、地理付きパッケージの実反映、XSS文字列の無害化、編集後の書き出し、390px表示、横はみ出し0、キーボード編集、reduced motion、外部通信0を確認しました。合計32項目が現行SHAと一致しています。

## 公開境界

旧世界用の検証スクリプト、旧監査画像、再統合メモ、移行補助スクリプトは`recovery/2026-07-15-before-v2-plain-release/legacy-v2-next/`へ退避しました。現行`v2.next`内で作品固有名を持つのは、混入を検出するdenylistを定義した監査と契約テストだけです。公開HTML、プレーンデータ、ビルド入力には作品固有名を含みません。

## 残る作業

GitHubで公開する前に、ライセンス、リポジトリ説明、リリースタグ、配布対象ファイルの選定が必要です。V2アプリ本体はプレーン公開候補として検証済みです。V1が生成する創作内容の面白さと完成度は別の評価対象であり、V2のPASSには含めません。
