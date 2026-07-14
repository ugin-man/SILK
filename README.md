# SILK

[English](README.en.md)

## SILKとは

SILKは、単一のAIエージェントが世界設定を主題ごとに深め、意味のある関係だけを織り、弱い案や過剰な接続を切りながら内部完成まで進めるCodexスキルです。一つの主題に正本は一つ、関係は安定IDで管理し、人間が承認していない生成物は`pending`に残します。

リポジトリ版は`v0.1.0`です。[MIT License](LICENSE)で公開しています。

## V1

V1は生成ワークフローと世界パッケージ形式です。[SKILL.md](skills/silk-worldbuilder/SKILL.md)がLevel 0からLevel 4までのSpin、Deepen、Weave、Challenge、Integrateを統括します。

`manifest.yaml`、正本主題、関係、主張、作業状態、ビュー、監査報告を一つのパッケージに保存します。正式なYAMLパーサーを使う検証器は、重複ID、壊れた参照、承認状態、完了阻害、二つの独立監査などを確認します。

## V2

V2は[V2公開候補](v2.next/SILK-V2.html)として配布する単一HTMLのローカルアプリです。WORLD、ATLAS、Reader、セル編集、パッケージ読込と書出しを同じID空間で扱います。ビルド、Node契約、静的監査、Chromium証拠は[リリース準備記録](v2.next/RELEASE_READINESS.md)にあります。

## 5分で試す

Node.js 20以上を使います。

```powershell
npm ci
npm run validate:demo
npm run test:v2
npm run audit:v2
```

V1スキルをCodexへ入れる場合:

```powershell
Copy-Item -Recurse -Force .\skills\silk-worldbuilder "$HOME\.codex\skills\silk-worldbuilder"
```

## 公開デモ

[Glass Tide](examples/worlds/glass-tide)は、「熱を記憶する潮からガラスを採る」という入力から今回生成した小規模世界です。入力、Level 0からLevel 4の実行記録、6主題、5関係、3主張、作業台帳、AI自己監査、人間評価欄を公開しています。

このデモで、小規模なrevision 2パッケージを生成し、過程を記録し、正式パーサーで構造検証できることを確認しました。全主題は人間未承認のため`subjects/pending/`にあります。

## 検証済み範囲

- Glass Tideの必須ファイル、YAML構文、主題・関係・主張参照、完了状態
- V1検証器の引用符、複数行値、インライン配列、重複キー、壊れた参照の回帰テスト
- V2の再現ビルド、データ契約、描画契約、性能上限、ブラウザ証拠SHA
- Chromiumでの390px表示、キーボード操作、XSS文字列、壊れた読込のロールバック
- GitHub ActionsのV1、V2、リリース整合性チェック

構造検証は創作品質を証明しません。

## 未実証範囲

- 長時間中断なしの大規模世界生成
- 複数モデルと複数環境での再現性
- 独立した複数人による創作品質評価
- 書籍規模の世界や長期運用での保守性

Glass Tideは小規模な実行証拠であり、壮大さや面白さの一般的証明ではありません。長時間検証は[GitHub Issue #1](https://github.com/ugin-man/SILK/issues/1)で追跡します。

## 貢献

[CONTRIBUTING.md](CONTRIBUTING.md)に、V1規則・検証器、V2、文書、人間評価の参加経路と必要な確認コマンドを書いています。バグ報告と検証提案には再現条件と証拠を添えてください。

## ロードマップ

- V1: 長時間実行と独立評価を増やし、検証器の意味契約を広げる
- V2: 世界パッケージの可視化と編集の回帰証拠を維持する
- V3: 完成世界から物語を作る別工程として扱い、V1へプロットを混ぜない

## ライセンス

SILKは[MIT License](LICENSE)です。
