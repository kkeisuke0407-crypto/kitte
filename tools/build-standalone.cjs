/* 単体HTML版の生成：node tools/build-standalone.cjs
   kitte-kaitori/ の各ページを、CSS・JS・画像をすべて埋め込んだ1ファイルのHTMLにして standalone/ に書き出す。
   メール添付・チャットでの共有・アプリのプレビューなど、フォルダごと渡せない場面で確認するための生成物（直接編集しない）。
   ページ間リンクは standalone/ 内の同じフォルダのファイル名（index.html / uriel.html …）に書き換える。 */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const src = path.join(root, 'kitte-kaitori');
const out = path.join(root, 'standalone');

const PAGES = { 'index.html': 'index.html', 'uriel/index.html': 'uriel.html', 'buysell/index.html': 'buysell.html', 'fukuchan/index.html': 'fukuchan.html', 'methodology/index.html': 'methodology.html', 'about/index.html': 'about.html', 'privacy/index.html': 'privacy.html' };
const MIME = { '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg' };
const dataUri = f => `data:${MIME[path.extname(f)]};base64,${fs.readFileSync(f).toString('base64')}`;
const cache = {};
const uriOf = f => (cache[f] = cache[f] || dataUri(f));

fs.mkdirSync(out, { recursive: true });
Object.entries(PAGES).forEach(([relPage, outName]) => {
  const pageFile = path.join(src, relPage);
  const dir = path.dirname(pageFile);
  let h = fs.readFileSync(pageFile, 'utf8');
  // 画像・favicon
  h = h.replace(/(<img\b[^>]*\ssrc=|<link rel="icon" href=)"([^"]+)"/g, (m, pre, s) => /^(https?:|data:)/.test(s) ? m : `${pre}"${uriOf(path.resolve(dir, s))}"`);
  // ページ間リンク
  h = h.replace(/\b(href|data-pending-href)="([^"#][^"]*?)(#[^"]*)?"/g, (m, attr, p, hash) => {
    if (/^(https?:|mailto:|__|data:)/.test(p)) return m;
    const target = path.relative(src, path.resolve(dir, p)).split(path.sep).join('/');
    return PAGES[target] ? `${attr}="${PAGES[target]}${hash || ''}"` : m;
  });
  // CSS・JS は画像・リンクの置換後に埋め込む（JS内の文字列を誤って置換しないため）
  // CSS
  h = h.replace(/<link rel="stylesheet" href="([^"]+)">/g, (_, href) => `<style>\n${fs.readFileSync(path.resolve(dir, href), 'utf8')}\n</style>`);
  // JS（診断結果のロゴ・詳細リンクも単体版用に置換）
  h = h.replace(/<script src="([^"]+)" defer><\/script>/g, (_, s) => {
    let js = fs.readFileSync(path.resolve(dir, s), 'utf8');
    js = js.replace(/'assets\/img\/logo\/(\w+)\.svg'/g, (m, n) => `'${uriOf(path.join(src, 'assets/img/logo', n + '.svg'))}'`);
    js = js.replace(/'(uriel|buysell|fukuchan)\/index\.html'/g, "'$1.html'");
    return `<script>\n${js.replace(/<\/script/g, '<\\/script')}\n</script>`;
  });
  h = h.replace('<head>', '<head>\n<!-- 生成物：tools/build-standalone.cjs（CSS・JS・画像を埋め込んだ単体HTML版）。直接編集しない -->');
  fs.writeFileSync(path.join(out, outName), h);
  console.log(`standalone/${outName}  ${(Buffer.byteLength(h) / 1024).toFixed(0)}KB`);
});
