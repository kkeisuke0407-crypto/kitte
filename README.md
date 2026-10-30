# 切手買取 比較LP（kitte-kaitori）

切手買取6社（1位ウリエル・2位バイセル・3位福ちゃん・4位買取大吉・5位日晃堂・6位なんぼや）の出張買取比較LP。静的HTML／CSS／JS。

- 順位・編集部評価は `tools/data/companies.json` の6項目採点（◎5・○4・△3、公式サイトの記載が根拠）から生成。基準は調査概要ページで公開
- 配信地域を絞る前提のため、ウリエルの出張エリア制限を強調する表現は使わない（2026-10-13 ユーザー指示）

- 台本：hozon `案件_切手買取/03_LP全29パーツ台本_v3_20261013.md`
- パーツ原本：hozon `LPパーツ集_薬剤師比較ランキング型/`（`parts.css` は原本そのまま。sha256 `42b4a915…f257d`、hozon commit `d895052`）
- 会話・吹き出し・FAQ は体験談パーツ集（hozon `operations/parts`）の `mt-talk` / `mt-say` / `mt-faq` を `kitte.css` に必要分だけ移植
- 事実情報：各社公式サイト（2026-10-13確認。出典は調査概要ページ）

## ページ

| パス | 内容 |
|---|---|
| `/kitte-kaitori/` | 比較TOP（6社） |
| `/kitte-kaitori/uriel/` | ウリエル詳細 |
| `/kitte-kaitori/buysell/` | バイセル詳細 |
| `/kitte-kaitori/fukuchan/` | 福ちゃん詳細 |
| `/kitte-kaitori/methodology/` | ランキング調査概要 |
| `/kitte-kaitori/about/` | 運営者情報（HAKOBU MEDIA。ほかの運営サイトと同じ表記） |
| `/kitte-kaitori/privacy/` | プライバシーポリシー |
| `/_production/kitte-kaitori/imgslot-preview.html` | 制作用・非公開：image-1（画像指示枠）で全画像の仕様・取得元・権利を管理 |

全ページ `noindex, nofollow`（公開判断時に外す）。`robots.txt` で `/_production/` `/tools/` `/docs/` を除外。

## ローカルで見る

### A. HTMLファイルをダブルクリック（いちばん簡単）

- **`standalone/index.html`**：CSS・JS・画像をすべて1ファイルに埋め込んだ単体版。このファイルだけで表示でき、同じフォルダの `uriel.html` `buysell.html` `fukuchan.html` `methodology.html` などへリンクで移動できます。メール添付や共有にも使えます（生成物：`node tools/build-standalone.cjs`）
- **`kitte-kaitori/index.html`**：本番と同じ構成のファイル。ダブルクリックで開いても、全ページ間を移動できます（リンクは `uriel/index.html` のようにファイル名まで指定）

### B. ローカルサーバーで見る（本番に近い確認）

Node.js（v16以上）があれば追加インストール不要。

- **Windows**：`start-local.bat` をダブルクリック → ブラウザで比較TOPが開く
- **Mac / Linux**：`./start-local.sh`（または `npm start`）
- URL：<http://localhost:8080/kitte-kaitori/>（使用中なら 8081… に自動でずれる）。止めるときは `Ctrl + C`

## ファイル

```
kitte-kaitori/
  index.html, uriel/ buysell/ fukuchan/ methodology/ about/ privacy/
  assets/css/parts.css   … パーツ原本（編集しない）
  assets/css/kitte.css   … 切手用の調整＋mt-*の移植分
  assets/js/kitte.js     … ASPリンク未設定時の内部導線切替／CTAクリック計測の準備／レーダー描画／診断フォーム
  assets/img/            … photo/ logo/ banner/ official/ illust/ favicon.svg
_production/kitte-kaitori/imgslot-preview.html … 生成物（tools/build-preview.cjs）
docs/画像素材一覧.md      … 生成物（tools/assets.json が正本）
docs/パーツ使用表.md
tools/data/companies.json … 6社の評価・根拠・実績・文言（比較TOPの生成元）
tools/build-top.cjs       … companies.json → 比較TOP（BEST3・実績・比較表・早見表・ランキング）と調査概要の採点表を差し込み
tools/assets.json         … 画像台帳
tools/build-preview.cjs   … 台帳 → 画像一覧md＋image-1プレビュー
tools/audit.cjs           … 静的監査（29パーツ・禁止語・alt/width/height・リンク・プレースホルダ）
tools/check.cjs           … ブラウザ動作チェック（Playwright）
tools/serve.cjs           … ローカル確認サーバー（依存なし）
tools/build-standalone.cjs … 単体HTML版（standalone/）の生成
standalone/               … 生成物：埋め込み済みの単体HTML 7ページ
start-local.bat / start-local.sh / package.json … 起動用
```

## ASPリンクの入れ方

HTML 内の文字列を一括置換する。未置換の間は `kitte.js` がボタンを青い内部導線（`data-pending-href` / `data-pending-label`）に切り替えるので、壊れたリンクは表示されない。

| 置換文字列 | 対象 | 箇所 |
|---|---|---|
| （設定済み）`https://t.felmat.net/fmcl?ak=D107130.1.E149890F.L1419226` | ウリエル（felmat 特単リンク、プロモーションID 10713・サイト141922。2026-10-29差し替え） | 比較TOP・uriel/・kitte.js（診断結果）・companies.json の `aff`。MCVの対象は `measurement-init.js` の `approvedAffiliateUrls` |
| `__BUYSELL_AFF_LINK__` | バイセル（プロモーションID 10523） | 比較TOP 6・buysell/ 4・kitte.js 1（診断結果） |
| （設定済み）`https://px.a8.net/svt/ejp?a8mat=4BEMLP+7DJH7M+35HU+BZ0Z6` | 福ちゃん（A8テキストリンク。2026-10-28設定。表示計測の1×1画像を比較TOP・fukuchan/ に1つずつ） | 比較TOP（companies.json の `aff`・`cta`）・fukuchan/ 3・kitte.js（診断結果）。MCVの対象は `approvedAffiliateUrls` |
| （買取大吉・日晃堂・なんぼや） | ASP提携なし | 公式サイトへの通常リンク（外部・広告リンクではない旨を表示）のみ |

ボタン上のひとこと（`yk-catch`）はASPの対象条件が未取得のため、公式サイトで確認できた事実（「出張は対象エリアのみ」など）にしている。ASP条件を取得したら合わせて見直す。

## 広告グループ別のLP（ヒーロー画像だけ差し替え）

`tools/build-variants.cjs` が、比較TOP（`kitte-kaitori/index.html`）をコピーし、ヒーロー画像と見出し（読み上げ用）だけを差し替えたページを同じフォルダに作る（`npm run build` の最後に実行。生成物なので直接編集しない）。

| ファイル | 広告グループ | ヒーロー画像 | GA4の lp_id |
|---|---|---|---|
| `furui.html`（`https://kitte.navolio.net/furui.html`） | CP② 切手買取「古い切手・日本旧切手」 | `assets/img/photo/hero-furui.webp`（hero-top3 の1行目を「古い切手を高く売りたい方へ！」に差し替え） | `kitte_top_furui` |

## 日本語の改行

スマホ（特にSafari）で言葉の途中で改行しないよう、`tools/wrap-ja.cjs` が BudouX で文節の切れ目に `<wbr>` を入れ、CSS の `word-break: keep-all` と組み合わせている。HTMLやデータを直したら `npm run build`（または `node tools/wrap-ja.cjs`）を実行する。複合語や切手の名前（見返り美人・月に雁など）は `tools/wrap-ja.cjs` の `KEEP` に入れると途中で改行しない。改行させたくない語は `<span class="kt-nw">` で囲む。

### Safari（WebKit）での確認

Chrome と Safari は改行の仕組みが違う（Chrome だけの auto-phrase、Safari 26 の text-wrap: pretty は段落全体の行の長さを変える など）ため、改行は `tools/check-wrap-webkit.py` で WebKit（Safari と同じエンジン）を動かして確認する。準備と使い方はファイル先頭に記載。

## CTAの場所別計測

すべての申込ボタン・詳細ボタンに `data-place`（ボタンの場所）を付けている。例：`best3-uriel`（BEST3）、`campaign`、`records-1`〜`6`、`compare-uriel`、`fit-check`（こんな方は、まずウリエルへ）、`combo-uriel` / `combo-buysell`、`rank-uriel-top` / `-bottom`、`summary`（結論）、`pickup-uriel`、`finder-uriel`（診断結果）、個別ページは `uriel-u-2` など。
GA4やGTMを入れて `window.dataLayer` があれば、クリック時に `{ event: 'cta_click', cta_place, cta_company, cta_pending }` を送る（kitte.js）。計測タグを入れるまでは何も送信しない。比較TOPの生成部分の場所名は `tools/build-top.cjs` の `aff()` の最後の引数で決める。

## 確認コマンド

```
npm install                     # 初回のみ（文節分割の BudouX を入れる）
npm run build                   # 下の生成をまとめて実行（build-top → wrap-ja → stamp-assets → build-preview → build-standalone）
node tools/stamp-assets.cjs     # CSS・JS の読み込みに内容のハッシュ（?v=）を付け、古いCSSが使われ続けるのを防ぐ
node tools/build-top.cjs        # companies.json を直したら比較TOP・調査概要を再生成
node tools/wrap-ja.cjs          # 日本語の改行位置を文節単位にそろえる（HTMLを直したら必ず実行）
node tools/audit.cjs            # 静的監査（エラー0で終了コード0）
node tools/check.cjs [出力先]   # 375/390/1280px の動作チェック（引数でスクショ保存）
node tools/build-preview.cjs    # 画像台帳を更新したら再生成
node tools/build-standalone.cjs # ページを直したら単体HTML版を再生成
```

## LP行動分析・MCV計測（2026-10-15）

ソウガクのGA4行動計測を参考に、共通スクリプト `kitte-kaitori/assets/js/kitte.js` に、
`lp_page_view`、`lp_scroll`、`lp_section_view`、`lp_cta_view`、`lp_active_read`、
`lp_faq_open`、`lp_finder_start`、`lp_finder_complete`、`cta_click` を実装しました。

`kitte_mcv` は設定済みASP成果リンクで外部へ遷移するクリックのみで発火し、
未設定ASPリンクから内部詳細ページへ誘導される場合はMCV計上しません。
`?measurement_mode=debug` はテスト用モードで、GTM/GA4側でも除外設定が必要です。

現時点で各イベントは `window.dataLayer` に積まれるだけです。
GA4・GTM・Google Adsタグ、MCC子アカウント、オフライン成果インポートは未接続/未作成です。
詳細は `docs/切手買取LP計測仕様_ソウガク準拠_20261015.md` を参照。
