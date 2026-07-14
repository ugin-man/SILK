# SILK

SILKは、一人のAIエージェントが世界観を自律的に紡ぎ直し、壮大で緻密な第一版世界コーパスを構築するためのCodexスキルです。

単に設定を増やしません。候補となる点を作り、主題を縦に深掘りし、世界との横接続を審査し、弱い設定や誤った接続を切断、縮小、統合、置換、棄却しながら、世界の成熟レベルを上げます。

## 中核

- 一つの主題に正本ファイルは一つ
- 神、国家、都市などを前提にしない動的分類
- 分類ではなく安定IDで主題と関係を管理
- Level 0からLevel 4まで、同じ織機フェーズを反復
- 複雑な魔法、国家、宗教、歴史などを縦パッケージで深掘り
- 候補生成と正史採用を分離
- 一つの連想が世界全体へ伝染するのを防止
- 王道を否定せず、狙った魅力が出ているかを厳しく審査
- 改善価値がない設定は関連設定ごと大胆に置換
- 接続数ではなく、接続によって何が変わるかを審査
- 接続しないこと、影響しない地域、独立した因果も世界の輪郭として保存
- 章立てや主人公プロットはV3へ分離

## スキル

[SILK Worldbuilder](skills/silk-worldbuilder/SKILL.md)が司令塔です。詳細規則は`skills/silk-worldbuilder/references/`へ分割されています。

- 理論対応監査: `SILK_V1_THEORY_AUDIT.md`
- 実証時の人間評価: `USER_EVALUATION_GUIDE.md`

```powershell
Copy-Item -Recurse -Force .\skills\silk-worldbuilder "$HOME\.codex\skills\silk-worldbuilder"
```

使用例:

```text
$silk-worldbuilder を使って、この着想から壮大な世界を構築して。
Level 0から内部反復を続け、点の魅力、縦の深さ、横の接続、
設定伝染、影響範囲、置換可能性を監査し、完成条件まで進めて。
```

## 世界パッケージ

```text
worlds/<world>/
  manifest.yaml
  world.yaml
  state.yaml
  taxonomy.yaml
  subject_registry.yaml
  relation_registry.yaml
  claim_registry.yaml
  completion.yaml
  subjects/<status>/<dynamic_collection>/*.md
  workspace/
  views/
  reports/
```

`manifest.yaml`が人間とV2向けの入口です。人間が最初に読むのは`reports/world_overview.md`と`views/catalog.md`です。一つの対象を詳しく知る場合は`subject_registry.yaml`から正本ファイルへ進みます。関係は`relation_registry.yaml`と`views/relation_map.md`で追えます。

`subjects/approved/`はユーザー承認済みまたはユーザーが固定した正史だけです。SILKが内部的に完成と判断した生成物も、レビュー前は`subjects/pending/`に残ります。内部完成時は`reports/review_packet.md`から一括、分類別、主題別に評価できます。

## 現在地

V1の理論、スキル手順、状態モデル、世界テンプレートは構築されています。実際の新規世界を長時間自律生成し、人間がD&Dやクトゥルフ級の第一版として評価する実証は未実施です。新スキーマへ更新した構造検査器も今回は実行していません。したがって、現時点では「理論実装済み、実行と創作品質は未実証」と扱います。`internally_complete`はユーザー承認済みを意味しません。

旧`novel_world/worlds/arnebia/`と`scripts/v1_*.ps1`は旧方式の試作であり、新V1の品質証明ではありません。

## 既知の制約

- 創作品質は使用するモデルと利用者の好みに依存する
- すべてのホストが一つの応答で長時間自動継続できるとは限らない
- 中断時は`state.yaml`、作業パケット、変更セットから再開し、停止を完成扱いしない
- 構造検査器は面白さや壮大さを証明しない
- D&Dやクトゥルフの長年の文化蓄積そのものを一回で再現するとは主張しない
- V1が目指すのは、その規模へ育てられる緻密な第一版世界コーパスである

## ロードマップ

- V1: 自律世界構築、正本管理、成熟度反復、完成監査
- V2: ローカルWebで状態、分類、正本、関係、縦横の糸を可視化
- V3: 完成世界から多数の物語を生成し、長期的な文化蓄積へ育てる

## V2 ローカルアプリ

V2の公開候補は`v2.next/SILK-V2.html`です。初期状態には作品固有の世界設定を含まず、世界パッケージを読み込んで使います。球体WORLD、セル編集、ATLAS Graph、Wikipedia型Readerを一つのデータとID空間で扱います。

読み込み時はV1側の`validation.ok`をそのまま信用せず、V2側でもID、参照、地理形状、件数、容量、危険キーを検査します。ATLASとWORLDのどちらかが失敗した場合は読み込み前へ戻り、半端な世界を表示しません。セル編集後は未保存状態になり、`EXPORT`でセルを含むV2世界パッケージを書き出せます。デスクトップだけでなく、390px幅のWORLDとReader、キーボードによる球体操作も外部Chromiumで確認しています。

```powershell
.\v2.next\BUILD_AND_AUDIT.ps1
```

公開ビルドの入力は`v2.next/src/plain-host.html`、`v2.next/data/plain-world.json`、`v2.next/src/`の統合モジュールです。作品別のJSONや過去版HTMLは公開ビルドへ混ぜません。詳しい完成範囲と検証結果は`SILK_V2_COMPLETION.md`と`v2.next/RELEASE_READINESS.md`にあります。
