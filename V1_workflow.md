# SILK V1 実行ワークフロー

## 利用者の操作

利用者は世界の着想、感触、既存設定、禁止事項、用途を伝えます。分類、フェーズ、ノード数、文字数、反復回数を指定する必要はありません。

```text
$silk-worldbuilder を使って、この世界をLevel 0から構築して。
点の生成、縦掘り、横接続、批判、置換、統合を内部反復し、
構造上の完成条件まで進めて。章立てや主人公プロットは作らないで。
```

## 内部状態

SILKは`state.yaml`で世界Levelと現在Phaseを管理します。

```yaml
world_level: 2
current_phase: deepen
active_packet: magic_foundation
next_action: 大量行使時の相互作用を決める
promotion_blockers:
  - 魔法が戦争とインフラへ与える限界が未審査
```

## 反復

1. Spin: 世界の空白から複数仮説を作る。
2. Deepen: 重要主題を縦パッケージで掘る。
3. Weave: 関係と交点を提案し、切断も含めて審査する。
4. Challenge: 面白さ、目的適合、影響半径、コピー、収斂、説明負債を見る。
5. Integrate: 正本、台帳、ビュー、報告、次の作業を更新する。

Level内で何度も繰り返します。昇格後も同じ織機を高い解像度で回します。

## 中断と再開

環境上の中断前に、現在パケット、最後に統合した判断、影響主題、未処理義務、次の行動を保存します。再開時は全世界を作り直さず、`state.yaml`と関連ファイルから継続します。

## 人間が見る場所

- 世界への入口: `reports/world_overview.md`
- 分類と状態: `views/catalog.md`、`views/by_status.md`
- 一つの対象: `subject_registry.yaml`から正本ファイル
- 関係: `views/relation_map.md`
- 世界の縦横構造: `reports/shape_report.md`
- 面白さと置換判断: `reports/interest_audit.md`
- 完成根拠: `reports/quality_report.md`
- ユーザー確認用: `reports/review_packet.md`
- 空間モデルと地図対象: `spatial_registry.yaml`
- 地図レイヤー: `map_layers.yaml`
- 地図の時代・構築差分: `map_snapshots.yaml`

SILKが内部監査を通過しても、未レビューの生成物は`pending`に残ります。ユーザーが承認した主題だけ`approved`へ移し、修正依頼があれば影響する縦糸、関係、成熟ゲートを再度開きます。

地理が重要な世界では、正本主題を地図画像へ埋め込まず、stable IDへ接続したSpatial Registryを更新します。地理が未定義または不要な世界へ惑星地図を強制しません。座標や境界は、正史根拠と空間監査を通るまで`provisional`として扱います。

## 検査の扱い

構造検査器はファイル契約や台帳整合を補助します。検査通過だけで創作品質を完成扱いしません。本プロジェクトでの実世界生成と人間評価は別工程です。
