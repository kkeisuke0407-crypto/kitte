/* 画像素材台帳（tools/assets.json）から
   - docs/画像素材一覧.md
   - _production/kitte-kaitori/imgslot-preview.html（パーツ image-1 の画像指示枠と、差し替え後 image-2 の並べ表示。非公開の制作用）
   を生成する。実行：node tools/build-preview.cjs */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'assets.json'), 'utf8'));
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const slotClass = { have: 'mt-imgslot mt-imgslot--have', ad: 'mt-imgslot mt-imgslot--ad', make: 'mt-imgslot', css: 'mt-imgslot mt-imgslot--have' };

let md = '# 画像素材一覧（切手買取LP）\n\n生成元：`tools/assets.json`（`node tools/build-preview.cjs` で再生成）。取得日：2026-10-13。置き場所：`kitte-kaitori/assets/img/`。\n\n';
md += '| ID | 種類 | 役割 | ファイル | 取得元 | 使用箇所 | alt | 権利・注意 |\n|---|---|---|---|---|---|---|---|\n';
data.items.forEach(i => { md += `| ${i.id} | ${i.label} | ${i.role} | ${i.files.map(f => '`' + f + '`').join('<br>') || '—'} | ${i.orig} | ${i.where} | ${i.alt} | ${i.rights} |\n`; });
md += '\n## 取得したが使っていない画像\n\n| ファイル | 理由 |\n|---|---|\n';
data.unused.forEach(u => { md += `| ${u.file} | ${u.why} |\n`; });
fs.writeFileSync(path.join(root, 'docs', '画像素材一覧.md'), md);

const asset = f => '../../kitte-kaitori/assets/img/' + f;
let rows = data.items.map(i => {
  const slot = `<figure class="${slotClass[i.kind]}"><figcaption class="mt-imgslot__head"><span class="mt-imgslot__id">${esc(i.id)}</span><span class="mt-imgslot__kind">${esc(i.label)}</span><span>${esc(i.ratio)}</span><span class="mt-imgslot__todo">${i.files.length ? '差し替え済み（image-2）' : 'CSS・HTMLで代替済み'}</span></figcaption><div class="mt-imgslot__box">${esc(i.role)}</div><dl class="mt-imgslot__spec"><dt>置き場所</dt><dd>${esc(i.where)}</dd><dt>画像内の文字</dt><dd>${esc(i.text)}</dd><dt>alt</dt><dd>${esc(i.alt)}</dd><dt>取得元</dt><dd>${esc(i.orig)}</dd><dt>権利</dt><dd>${esc(i.rights)}</dd></dl></figure>`;
  const done = i.files.map(f => `<figure class="mt-img"><img src="${asset(f)}" alt="${esc(i.alt)}" loading="lazy"><figcaption class="mt-img__note">${esc(f)}</figcaption></figure>`).join('');
  return `<section class="pv-row"><h2>${esc(i.id)}：${esc(i.role)}</h2>${slot}<p class="pv-arrow">↓ 公開ページでは image-2（mt-img など）に置換済み</p>${done || '<p class="yk-small">画像なし（CSS実装）</p>'}</section>`;
}).join('\n');
const html = `<!DOCTYPE html>
<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow">
<title>【制作用・非公開】切手買取LP 画像指示枠プレビュー</title>
<link rel="stylesheet" href="../../kitte-kaitori/assets/css/parts.css"><link rel="stylesheet" href="../../kitte-kaitori/assets/css/kitte.css">
<style>.pv-row{margin:0 0 2em;padding-bottom:1em;border-bottom:3px double #ccd}.pv-row h2{font-size:16px;margin:1em 0 .4em}.pv-arrow{text-align:center;font-weight:700;color:#7b1fa2;margin:.4em 0!important}.mt-img img{max-height:260px;width:auto;max-width:100%}</style></head>
<body><div class="kt-wrap yk-body">
<!-- 生成物：tools/build-preview.cjs。直接編集しない。公開ディレクトリ（kitte-kaitori/）の外に置き、robots.txt で除外。 -->
<div class="kt-site">制作用プレビュー（非公開）</div>
<p class="kt-caution"><b>制作用：</b>パーツ image-1（画像指示枠 mt-imgslot）で全画像の仕様・取得元・権利を管理するページです。公開ページ（/kitte-kaitori/ 以下）には mt-imgslot を置かず、すべて image-2 に置換しています。</p>
${rows}
</div></body></html>
`;
fs.mkdirSync(path.join(root, '_production', 'kitte-kaitori'), { recursive: true });
fs.writeFileSync(path.join(root, '_production', 'kitte-kaitori', 'imgslot-preview.html'), html);
console.log('written: docs/画像素材一覧.md, _production/kitte-kaitori/imgslot-preview.html');
