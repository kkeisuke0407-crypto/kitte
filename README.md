# 切手買取 比較LP（kitte-kaitori）

切手買取3社（1位ウリエル・2位バイセル・3位福ちゃん／順位はユーザー指定の掲載順）の比較LP。静的HTML／CSS／JS。

- 台本：hozon `案件_切手買取/03_LP全29パーツ台本_v3_20261013.md`
- パーツ原本：hozon `LPパーツ集_薬剤師比較ランキング型/`（`parts.css` は原本そのまま。sha256 `42b4a915…f257d`、hozon commit `d895052`）
- 会話・吹き出し・FAQ は体験談パーツ集（hozon `operations/parts`）の `mt-talk` / `mt-say` / `mt-faq` を `kitte.css` に必要分だけ移植
- 事実情報：各社公式サイト（2026-10-13確認。出典は調査概要ページ）

## ページ

| パス | 内容 |
|---|---|
| `/kitte-kaitori/` | 比較TOP |
| `/kitte-kaitori/uriel/` | ウリエル詳細 |
| `/kitte-kaitori/buysell/` | バイセル詳細 |
| `/kitte-kaitori/fukuchan/` | 福ちゃん詳細 |
| `/kitte-kaitori/methodology/` | ランキング調査概要 |
| `/kitte-kaitori/about/` | 運営者情報（運営者名などは未記入のプレースホルダ） |
| `/kitte-kaitori/privacy/` | プライバシーポリシー |
| `/_production/kitte-kaitori/imgslot-preview.html` | 制作用・非公開：image-1（画像指示枠）で全画像の仕様・取得元・権利を管理 |

全ページ `noindex, nofollow`（公開判断時に外す）。`robots.txt` で `/_production/` `/tools/` `/docs/` を除外。

## ローカルで見る

Node.js（v16以上）が入っていれば追加インストールは不要です。

- **Windows**：`start-local.bat` をダブルクリック → ブラウザで比較TOPが開きます
- **Mac / Linux**：`./start-local.sh`（または `npm start` / `node tools/serve.cjs`）
- 開くURL：<http://localhost:8080/kitte-kaitori/>（8080が使用中なら 8081… に自動でずれます。表示されたURLを使う）
- 止めるとき：起動した画面で `Ctrl + C`

`index.html` をダブルクリックで直接開く（file://）と、ページ間リンクが `uriel/` などのフォルダ指定のため個別ページへ移動できません。必ず上の方法で開いてください。

## ファイル

```
kitte-kaitori/
  index.html, uriel/ buysell/ fukuchan/ methodology/ about/ privacy/
  assets/css/parts.css   … パーツ原本（編集しない）
  assets/css/kitte.css   … 切手用の調整＋mt-*の移植分
  assets/js/kitte.js     … ASPリンク未設定時の内部導線切替／レーダー描画／診断フォーム
  assets/img/            … photo/ logo/ banner/ official/ illust/ favicon.svg
_production/kitte-kaitori/imgslot-preview.html … 生成物（tools/build-preview.cjs）
docs/画像素材一覧.md      … 生成物（tools/assets.json が正本）
docs/パーツ使用表.md
tools/assets.json         … 画像台帳
tools/build-preview.cjs   … 台帳 → 画像一覧md＋image-1プレビュー
tools/audit.cjs           … 静的監査（29パーツ・禁止語・alt/width/height・リンク・プレースホルダ）
tools/check.cjs           … ブラウザ動作チェック（Playwright）
tools/serve.cjs           … ローカル確認サーバー（依存なし）
start-local.bat / start-local.sh / package.json … 起動用
```

## ASPリンクの入れ方

HTML 内の文字列を一括置換する。未置換の間は `kitte.js` がボタンを青い内部導線（`data-pending-href` / `data-pending-label`）に切り替えるので、壊れたリンクは表示されない。

| 置換文字列 | 対象 | 箇所 |
|---|---|---|
| `__URIEL_AFF_LINK__` | ウリエル（プロモーションID 10713） | 比較TOP 5（BEST3・2社併用・ランキングタブ・2ボタン・迷ったら）・uriel/ 4・kitte.js 1（診断結果） |
| `__BUYSELL_AFF_LINK__` | バイセル（プロモーションID 10523） | 比較TOP 5（同上）・buysell/ 4・kitte.js 1（診断結果） |
| `__FUKUCHAN_AFF_LINK__` | 福ちゃん（ASP未取得） | コメントのみ。成果リンクのボタンは置いていない。取得後に該当コメント位置のボタンを `<a class="yk-btn" href="…" data-aff="fukuchan" …>` に変更 |

ボタン上のひとこと（`yk-catch`）はASPの対象条件が未取得のため、公式サイトで確認できた事実（「出張は対象エリアのみ」など）にしている。ASP条件を取得したら合わせて見直す。

## 確認コマンド

```
node tools/audit.cjs            # 静的監査（エラー0で終了コード0）
node tools/check.cjs [出力先]   # 375/390/1280px の動作チェック（引数でスクショ保存）
node tools/build-preview.cjs    # 画像台帳を更新したら再生成
```
