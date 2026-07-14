# SILK V1 理論完成監査

## 結論

SILK V1は、単純な世界観生成プロンプトから、単一エージェントが長時間反復できるNested Loomへ再設計された。

理論、判断手順、状態モデル、ファイル構造、監査基準、再開方法に加え、小規模な新規世界`examples/worlds/glass-tide/`の生成と正式YAML検証器の実行まで行った。Glass Tideは実行証拠だが、長時間の大規模生成や人間が壮大さと面白さを認めることまでは証明しない。

## 要件対応

| 要求 | 対応 | 主な場所 | 状態 |
|---|---|---|---|
| 一回の依頼から一人のAIが内部反復する | 状態保存と作業パケットを持つ | `SKILL.md`, `autonomy-and-context.md` | 理論実装済み |
| 世界ごとに必要な分類だけ作る | 分類を動的ビューに変更 | `core-model.md`, `taxonomy-and-views.md` | 理論実装済み |
| 未知概念で構造が壊れない | すべてを種類非依存の正本主題として扱う | `core-model.md` | 理論実装済み |
| 一つの対象を一つのファイルで理解できる | 一主題一正本と分割条件を固定 | `core-model.md`, `documentation-quality.md` | 理論実装済み |
| 関連国家や事件を追える | 安定ID、関係台帳、関係要約を導入 | `weaving-engine.md`, `package-contract.md` | 理論実装済み |
| ユーザー承認と未承認が見える | 内部採用とユーザー承認を分離 | `approval-and-canon.md` | 理論実装済み |
| 面白いかを厳しく判断する | 狙った魅力と成果物を分離審査 | `interest-and-structural-critic.md` | 理論実装済み |
| 王道を既視感だけで棄却しない | 新奇性ではなく意図した魅力を見る | `interest-and-structural-critic.md` | 理論実装済み |
| 面白くない設定を大胆に置き換える | 置換、依存隔離、影響修復を定義 | `interest-and-structural-critic.md`, `phase-contracts.md` | 理論実装済み |
| 弱い設定を後付けで救済し続けない | 救済連鎖と説明負債を検出 | `interest-and-structural-critic.md`, `failure-modes.md` | 理論実装済み |
| 一つの設定が世界全体を支配しない | 影響範囲、独立因果、非適用領域を管理 | `anti-convergence.md`, `ideation-engine.md` | 理論実装済み |
| 魔物や遺物がコピーされない | 分類からの性質継承を禁止 | `anti-convergence.md`, `deepening-engine.md` | 理論実装済み |
| 世界中にいる設定を乱発しない | 分布機構と非存在範囲を要求 | `anti-convergence.md`, `simulation-and-consistency.md` | 理論実装済み |
| 魔法などを芯まで深掘りする | 汎用レンズと魔法専用レンズを用意 | `deepening-engine.md` | 理論実装済み |
| 属性や等級以外の想発を起こす | 継承、変質、独立、反証、非適用から仮説生成 | `ideation-engine.md` | 理論実装済み |
| 最初の連想へ世界が収斂しない | 仮説と正史を分離し、主張昇格を審査 | `ideation-engine.md`, `anti-convergence.md` | 理論実装済み |
| 点を縦横に織って球体へ育てる | Level 0から4と反復Phaseを分離 | `maturity-loop.md`, `weaving-engine.md` | 理論実装済み |
| 間違った接続を切る | 非関係台帳と関係審査を導入 | `weaving-engine.md` | 理論実装済み |
| 歴史が現在の制度や生活へ残る | 歴史変化と残存物を縦掘り | `deepening-engine.md`, `scale-and-completion.md` | 理論実装済み |
| 魔法の大量利用で世界が壊れないか見る | 規模、軍事、犯罪、インフラ利用を監査 | `simulation-and-consistency.md` | 理論実装済み |
| 深掘りが謎を消さない | 知識状態と意図した謎を分離 | `epistemics-and-mystery.md` | 理論実装済み |
| 壮大さを文字数で測らない | 時間、空間、社会、物質、知識などで監査 | `scale-and-completion.md` | 理論実装済み |
| 日常まで世界の影響が見える | 生活上の結果と複数視点を扱う | `lived-world.md` | 理論実装済み |
| 世界観から章や主人公プロットへ逸脱しない | Plot Boundaryを完成条件にする | `SKILL.md`, `scale-and-completion.md` | 理論実装済み |
| 長時間作業で文脈を失わない | state、台帳、キュー、変更セットから再開 | `autonomy-and-context.md`, `phase-contracts.md` | 理論実装済み |
| 何十万文字を固定目標にしない | 規模包絡と証拠付き完成条件を採用 | `scale-and-completion.md` | 理論実装済み |
| D&Dやクトゥルフ級を目指す | 大規模第一版コーパスと将来の物語蓄積を分離 | `scale-and-completion.md`, `V1_product_workflow.md` | 理論実装済み、品質未実証 |

## 理論上の完成状態

エージェントはLevel 0から開始し、Spin、Deepen、Weave、Challenge、Integrateを各Levelで繰り返す。主要主題を正本へ統合し、誤接続や過剰な一般化を切り、Level 4で異なる二経路のクリーン監査を行う。

自動終了時の状態は`internally_complete`であり、生成物は`pending`に残る。ユーザーが確認した範囲だけ`approved`へ移る。

## 未証明

- 実際のCodexが一回の依頼から長時間停止せずにLevel 4まで進めるか
- 複雑な魔法体系を十分な深さで生成できるか
- 題材が変わっても動的分類が適切に変化するか
- Interest Criticが利用者の好みと一致するか
- 置換後に大規模な依存関係を正しく修復できるか
- D&Dやクトゥルフに匹敵すると利用者が感じるか
- V2が台帳とビューを問題なく可視化できるか

これらは小規模デモや理論文書では証明できない。Glass TideではLevel 0から4の記録、6主題、5関係、二経路監査、正式YAML検証まで実行した。構造検証が通っても創作品質と長時間自律性は別に評価する。

## 現行の実行証拠

- `node --test tests/v1_validator_contract.js`で引用符、複数行値、重複キー、重複ID、壊れた関係・主張参照、承認パス、完了阻害を検査した
- `npm run validate:demo`でGlass Tide revision 2パッケージを検証した
- `tests/glass_tide_demo_contract.js`で6主題、5関係、3主張、全主題pending、Rain Vaultの非関係を固定した
- 入力、実行記録、AI自己監査、人間評価欄を`examples/worlds/glass-tide/`に保存した

## 初期静的監査

2026-07-11にファイル一覧と仕様語彙を読み取りで確認した。

- TODO、TBD、FIXMEは検出されなかった
- 旧`links >= 2`、`counter_argument`、自己採点完成度は新スキルと公開仕様から検出されなかった
- 旧線形Phaseを正本として扱う参照は検出されなかった
- `world_shape.json`は旧資産移行時に正本扱いしないという注意だけに残っている
- `plot_contamination`は構造検査器のエラーコードとして残り、完成次元の正本名称は`plot_boundary`である
- スキル本体、専門参照、世界雛形、判断雛形、公開仕様、評価ガイドが存在することを確認した

これは初期公開時の内容読み取り監査である。現在の実行結果は前節の自動テストとGlass Tide証拠を参照する。

## 実証時に見る成果物

- `manifest.yaml`
- `reports/world_overview.md`
- `views/catalog.md`
- `views/by_status.md`
- `views/relation_map.md`
- `reports/shape_report.md`
- `reports/interest_audit.md`
- `reports/quality_report.md`
- `reports/review_packet.md`
- `subject_registry.yaml`
- `relation_registry.yaml`
- `claim_registry.yaml`

人間評価では、設定量だけでなく、一主題の深さ、接続の意味、独立因果、置換判断、読みやすさ、王道の魅力、収斂の少なさ、複数縮尺での世界の存在感を見る。
