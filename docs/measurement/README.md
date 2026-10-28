# 切手買取 計測構築（2026-10-15）

正式手順: ai-operations v5。キャンペーン作成・入稿・配信・請求設定は対象外。

## 接続先

- GA4: 切手買取LP / property `559084496` / stream `16131934719` / measurement `G-NWC1Z8NMEJ`。日本・Asia/Tokyo・JPY。
- GTM: 切手買取 / kitte.navolio.net / `GTM-P5BDV4FC`。account `6382641621` / container `267191304`。
- Google広告: 切手買取 `253-112-3349`、ボスMCC `820-007-4047`直下。日本・JPY・日本標準時。自動タグ「はい」を確認。請求設定なし、キャンペーン0件。専用GA4へのリンク済み（指標共有オン・オーディエンス共有オフ）。
- 公開先: `https://kitte.navolio.net/kitte-kaitori/` と既存ドメイン直下を維持。Pages配信ブランチは `codex/pages`。

## 実装と重複防止

`measurement-init.js` がGTMを一度だけロード。GTMが専用GA4のGoogleタグを管理する。`kitte.js` は既存のdataLayer記録を保ち、各イベントを一度だけ `gtag('event', name, {send_to:'G-NWC1Z8NMEJ', ...})` に送る。

**同じdataLayerイベントに追加のGA4カスタムイベントタグを設定しない**。Googleタグの初期page_viewと `lp_page_view` は異なる用途。標準PVは初期page_viewのみで、lp_page_viewをpage_viewに変換しない。GTMの自動離脱クリック・スクロール・フォーム等は無効とし、独自イベントを使う。ユーザー提供データの自動収集も無効。

|イベント|条件・主なパラメータ|
|---|---|
|lp_page_view|ページ表示 / lp_id, lp_path|
|lp_scroll|25,50,75,90,100%各1回 / scroll_percent|
|lp_section_view|セクション見出しの35%以上表示で各1回 / section_id|
|lp_cta_view|CTAの50%以上表示で各要素1回 / cta_company, cta_place, cta_pending|
|lp_active_read|表示・フォーカス中30,60,120秒各1回 / active_seconds|
|lp_faq_open|FAQを開くたび / faq_label（診断回答は送信しない）|
|lp_finder_start|診断の初回入力 / 回答値なし|
|lp_finder_complete|診断実行 / 回答値なし|
|cta_click|data-place付き導線 / 内部移動も含む。成果ではない|
|kitte_mcv|確認済み成果URLに完全一致するdata-aff付き外部HTTP(S)リンク / cta_company, cta_place, conversion_stage=affiliate_outbound|

共通: measurement_mode, event_id。同じJSの重複読込を抑止。MCVは同じ要素の1.5秒以内の再クリックを抑止。中クリックにも対応。診断で動的に増えるCTAも表示計測する。

`measurement-init.js` の `approvedAffiliateUrls` は会社ごとの発行・確認済みURL一覧。2026-10-28にウリエル（felmat `https://t.felmat.net/fmcl?ak=D107130.1.K150885J.L1419226&pb=`）と福ちゃん（A8 `https://px.a8.net/svt/ejp?a8mat=4BEMLP+7DJH7M+35HU+BZ0Z6`）を登録。バイセルは未取得で空。一覧にない外部URLはMCV対象にならない。

## 検証アクセスと広告流入

- `?measurement_mode=debug` を付けると、同じタブのページ遷移後もdebugを保持。デバッグ表示にイベントを記録し、GA4へdebug_mode=trueを送る。
- `?measurement_mode=normal` でdebug解除。テストの広告MCVは送らない設計とする。
- GA4フィルタ `切手_検証アクセス除外` はデベロッパートラフィック除外をテスト状態で作成。現時点は自動除外済みと報告せず、measurement_mode=normalで通常分析と区別する。有効化によるデータ破棄は後から復元できない。
- 将来の広告URLサフィックス例（今回広告は作成しない）: `utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_content={creative}&utm_term={keyword}&ad_campaign_id={campaignid}&ad_group_id={adgroupid}&ad_keyword={keyword}&ad_matchtype={matchtype}`。
- ad_campaign_id/ad_group_id/ad_keyword/ad_matchtypeはタブ内で保持し内部ページへ引き継ぐ。任意URLパラメータはGA4のpage_locationに転送しない。
- GCLID/GBRAID/WBRAIDは通常モードでこのドメインのlocalStorageに最大90日保管。GA4の独自パラメータには入れず、ASPへ渡す処理もまだ無効。

## Google広告コンバージョン

|アクション名|最適化|カウント・値|状態|
|---|---|---|---|
|切手_MCV_公式遷移|Secondary|初回のみ・0円・30日|作成済み。action 7846399900。実送客未確認|
|切手_申込発生_オフライン|Secondary|全件・値を使用しない・90日|受け皿作成済み。データソース未接続、実取込なし|
|切手_申込承認_オフライン|Primary|全件・実際の確定報酬JPY（デフォルト0円）・90日|受け皿作成済み。データソース未接続、実取込なし|

MCVのGA4側の同イベントをGoogle広告へ再インポートしない。現行の個別CPCではPrimary/Secondaryは自動入札の稼働を意味しない。申込発生と承認を合算して実成果件数・売上として扱わない。

## オフライン成果の突合

1. ASPの許可されたpb/subidを確認する。felmat管理画面はpbが有効で、値の成果発生画面・広告掲載URL別レポートへの返却を説明している。ただし対象成果リンク未取得、個別成果データ未照合。ASPの他案件の設定を変更しない。
2. 実装候補はランダムな送客トークンをpbへ付け、非公開の対応表に元クリック識別子と時刻を保持する方式。GCLIDそのものを未許可のパラメータに付与しない。現在は実装・運用していない。
3. ASP成果ID・pb・申込発生日時・承認日時・状態・確定報酬を取得。クリック時刻と実成果時刻を分離し、時刻はISO8601の `+09:00` を明示。承認イベントには承認時刻、申込イベントには発生時刻を使う。承認の遅れが広告側取込期限を超える場合は、その成果を無理に遡及しない。
4. `asp + asp_result_id + conversion_action` を重複キーにし、安定したorder_idを作る。取込日時を成果時刻に使わない。Google受付結果・行別エラーを非公開台帳へ記録し、成功済みを再送しない。
5. 発生はSecondary、承認だけPrimary・確定報酬。非承認は承認イベントを新規送信しない。承認後取り消しは元order_idを使うretraction、報酬変更はrestatementを検討し、現行方式の対応条件を確認して処理する。新しい別成果として再投入しない。
6. 初回は実広告クリックに紐づく正規成果1件を原本と照合し、Data Managerのプレビュー・受信結果・広告側反映を確認する。偽のGCLIDや架空成果をアップロードしない。

`offline-ledger-template.csv` は非公開実データ台帳用の空テンプレート。実GCLID・成果明細・認証情報はGitへ保存しない。

公式確認（2026-10-15）:
- [オフラインコンバージョンのインポート](https://support.google.com/google-ads/answer/2998031?hl=ja): 新規アップロードはData Manager/APIを優先。2026年1〜6月に対象要求を送っていないAds API開発者トークンは従来APIの許可対象外。
- [Data Managerのデータ列](https://support.google.com/google-ads-data-manager/answer/14184381): 日時・GCLID・GBRAID・WBRAID・order_id・値などを照合。
- [GCLID設定](https://support.google.com/google-ads/answer/7012522)
- [成果調整](https://support.google.com/google-ads/answer/7686280?hl=en)

## ソクガクとの比較

既存GA4プロパティ557942591は読み取り参照のみ。既存本番配信ブランチのlp-measurement.jsはGA4/Google広告へgtagで送る構成。専用Worker/D1の配信コードや送信先は同配信ブランチに見当たらず、独自行動分析基盤の稼働を示す証拠にはならない。過去仕様にもWorker/D1は未デプロイと記載。今回、ヒートマップ等の独自基盤は導入済みとしない。

## 検証

- `node --test tests/measurement.test.cjs`: MCV除外、連続クリック、取消済みクリック、JS再読込、スクロール重複、CTA可視率、パラメータ混入防止。
- `node tools/audit.cjs`: 内部リンク・アンカー・既存LP構造。
- `node tools/build-pages.cjs <別出力ディレクトリ>`: ドメイン直下と指定サブパス双方を出力。
- ブラウザ: debugで7ページ、FAQ、診断、CTA、スクロール、PC/スマホ、GTM Preview、GA4 DebugView/リアルタイムを確認。実ASPリンクがない会社のMCV外部遷移は未完了とする。

最終の実測・公開結果は別途作業結果記録へ追記する。コード・設定・Google受信・ASP成果突合は別の完了状態。
