/* 静的監査：node tools/audit.cjs
   1. 全29パーツが比較TOP・個別・制作工程のどこかで使われているか（パーツ原本のCSS classで判定）
   2. 個別3ページに detail-1〜7 が全部あるか
   3. 公開ページに mt-imgslot・パーツ集のダミー文言・旧薬剤師文言が残っていないか
   4. img の alt / width / height
   5. 内部リンク・アンカーの存在
   6. 未置換プレースホルダ（ASPリンク・運営者情報）の一覧
   終了コード：1〜5でエラーがあれば 1 */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const pub = path.join(root, 'kitte-kaitori');

const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const pages = walk(pub).filter(f => f.endsWith('.html'));
const prodPages = fs.existsSync(path.join(root, '_production')) ? walk(path.join(root, '_production')).filter(f => f.endsWith('.html')) : [];
const rel = f => path.relative(root, f);
const strip = h => h.replace(/<!--[\s\S]*?-->/g, '');
const read = f => fs.readFileSync(f, 'utf8');
let errors = 0;
const err = m => { errors++; console.log('  NG ' + m); };

// 1. パーツ → 判定（原本 index.html の各パーツの class）
const PARTS = {
  'fv-1': /class="yk-hero[" ]/, 'fv-2': /class="yk-logos"/, 'fv-3': /class="yk-pr"/,
  'top-1': /class="yk-best3"/, 'top-2': /class="yk-jobcard"/,
  'compare-1': /name="cmp1"[\s\S]*class="yk-fold"[\s\S]*class="yk-cmp"/, 'compare-2': /class="yk-matrix"/, 'compare-3': /class="yk-combo"/,
  'rank-1': /class="yk-rankhead"[\s\S]*class="yk-rankcatch"/, 'rank-2': /class="yk-rankarea"[\s\S]*?name="rk\d"/, 'rank-3': /class="yk-features"/,
  'rank-4': /class="yk-editor"/, 'rank-5': /class="yk-voice"/, 'rank-6': /class="yk-btnpair"/, 'rank-7': /class="yk-radar"/,
  'rank-8': /class="yk-info"/, 'rank-9': /class="yk-jobex"/,
  'close-1': /class="yk-pickup"/, 'close-2': /class="yk-finder"/, 'close-3': /class="yk-footer"/,
  'detail-1': /class="yk-crumb"/, 'detail-2': /class="yk-svchead__name"[\s\S]*class="yk-svchead__grid"/, 'detail-3': /class="yk-shot"/,
  'detail-4': /class="yk-order"/, 'detail-5': /class="yk-numh"/, 'detail-6': /class="yk-listbox"/, 'detail-7': /class="yk-catch"[^>]*>[^<]*<\/p><a class="yk-btn[" ]/,
  'image-1': /class="mt-imgslot/, 'image-2': /class="mt-img"/
};
console.log('■ 1. 全29パーツの使用状況');
const usage = {};
[...pages, ...prodPages].forEach(f => { const h = strip(read(f)); Object.entries(PARTS).forEach(([id, re]) => { if (re.test(h)) (usage[id] = usage[id] || []).push(rel(f)); }); });
Object.keys(PARTS).forEach(id => { if (!usage[id]) err(`${id} がどのページにもない`); else console.log(`  OK ${id.padEnd(9)} ${usage[id].join(', ')}`); });
console.log(`  → ${Object.keys(usage).length}/29 パーツ使用`);

console.log('■ 2. 個別ページの detail-1〜7');
['uriel', 'buysell', 'fukuchan'].forEach(s => {
  const h = strip(read(path.join(pub, s, 'index.html')));
  const miss = ['detail-1', 'detail-2', 'detail-3', 'detail-4', 'detail-5', 'detail-6', 'detail-7'].filter(id => !PARTS[id].test(h));
  if (miss.length) err(`${s}: ${miss.join(', ')} がない`); else console.log(`  OK ${s}: detail-1〜7 すべてあり`);
  // 目次と番号見出しの文言一致
  const toc = [...h.matchAll(/<li><span>(確認\d)<\/span><a href="#([\w-]+)">([^<]+)<\/a><\/li>/g)];
  toc.forEach(([, n, id, t]) => { const re = new RegExp(`<h2 class="yk-numh" id="${id}"><span>${n}</span>${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</h2>`); if (!re.test(h)) err(`${s}: 目次「${n} ${t}」と見出しが一致しない`); });
  if (toc.length) console.log(`  OK ${s}: 目次${toc.length}件と番号見出しが一致`);
});

console.log('■ 3. 公開ページの残りもの（mt-imgslot・ダミー・旧薬剤師文言）');
const BAD = [/mt-imgslot/, /薬剤師/, /転職/, /求人/, /正社員/, /年収/, /サービス[A-F]/, /◯/, /#sample/, /class="yk-ph/, /総合評価/, /yk-stars/, /高価買取保証/, /No\.?1/i, /業界(初|一|最)/];
pages.forEach(f => { const h = strip(read(f)); BAD.forEach(re => { const m = h.match(re); if (m) err(`${rel(f)}: 「${m[0]}」が残っている`); }); });
if (!errors) console.log('  OK 該当なし');

console.log('■ 4. img の alt / width / height');
let imgs = 0;
pages.forEach(f => { const h = strip(read(f)); [...h.matchAll(/<img\b[^>]*>/g)].forEach(([tag]) => { imgs++; ['alt', 'width', 'height'].forEach(a => { if (!new RegExp(`\\s${a}="`).test(tag)) err(`${rel(f)}: ${a} なし ${tag.slice(0, 80)}`); }); const src = (tag.match(/src="([^"]+)"/) || [])[1]; if (src && !/^https?:/.test(src) && !fs.existsSync(path.resolve(path.dirname(f), src))) err(`${rel(f)}: 画像ファイルがない ${src}`); }); });
console.log(`  ${imgs} 枚を確認`);

console.log('■ 5. 内部リンク・アンカー');
let links = 0;
const idsOf = f => new Set([...strip(read(f)).matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));
pages.forEach(f => { const h = strip(read(f)); [...h.matchAll(/\s(?:href|data-pending-href)="([^"]+)"/g)].forEach(([, href]) => {
  if (/^(https?:|mailto:|__)/.test(href)) return; links++;
  const [p, hash] = href.split('#');
  let target = p ? path.resolve(path.dirname(f), p) : f;
  if (p && (p.endsWith('/') || !path.extname(p))) target = path.join(target, 'index.html');
  if (!fs.existsSync(target)) return err(`${rel(f)}: リンク先なし ${href}`);
  if (hash && target.endsWith('.html') && !idsOf(target).has(hash)) err(`${rel(f)}: アンカーなし ${href}`);
}); });
// JS が使う内部パス
console.log(`  ${links} 件を確認`);

console.log('■ 6. 未置換プレースホルダ（公開前に置換・確認が必要）');
const ph = {};
[...pages, path.join(pub, 'assets/js/kitte.js')].forEach(f => { read(f).split('\n').forEach((line, i) => { [...line.matchAll(/__[A-Z_]+__/g)].forEach(([m]) => { (ph[m] = ph[m] || []).push(`${rel(f)}:${i + 1}`); }); }); });
Object.entries(ph).forEach(([k, v]) => console.log(`  ${k}（${v.length}箇所）\n    ${v.join('\n    ')}`));

console.log(errors ? `\n✖ エラー ${errors} 件` : '\n✔ エラーなし');
process.exit(errors ? 1 : 0);
