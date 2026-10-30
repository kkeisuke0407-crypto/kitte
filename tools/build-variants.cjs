/* 広告グループ別のLP（比較TOPのコピーで、ヒーロー画像と見出しだけ差し替え）：node tools/build-variants.cjs
   比較TOP（kitte-kaitori/index.html）を直したら、npm run build の最後でこのファイルが作り直す。手で直さない。
   同じフォルダに置くので、相対パス（assets/・uriel/・#ページ内リンク）はそのまま使える。 */
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'kitte-kaitori');
const src = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');

const VARIANTS = [
  {
    file: 'furui.html', // 広告：CP② 切手買取「古い切手・日本旧切手」（2026-10-30）
    h1: '古い切手を<wbr>高く<wbr>売りたい方へ！<wbr>おすすめ切手買取店TOP<wbr>3｜出張買取6⁠社⁠を⁠比⁠較',
    img: 'assets/img/photo/hero-furui.webp',
    alt: '古い切手を高く売りたい方へ！おすすめ買取店TOP3',
  },
];

for (const v of VARIANTS) {
  let html = src;
  const swap = (re, to, label) => {
    if (!re.test(html)) throw new Error(`${v.file}: ${label} が見つからない`);
    html = html.replace(re, to);
  };
  swap(/(<header class="yk-hero kt-hero--banner">\s*<h1 class="kt-sr">)[\s\S]*?(<\/h1>)/, `$1${v.h1}$2`, '見出し');
  swap(/<img class="kt-hero__banner" src="[^"]+" alt="[^"]*"/, `<img class="kt-hero__banner" src="${v.img}" alt="${v.alt}"`, 'ヒーロー画像');
  html = html.replace('<!DOCTYPE html>', `<!DOCTYPE html>\n<!-- 生成物：tools/build-variants.cjs（index.html のコピー。直接編集しない） -->`);
  fs.writeFileSync(path.join(dir, v.file), html);
  console.log('variant:', v.file);
}
