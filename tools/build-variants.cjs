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
  // 地域版（CP③ 地域の都府県別の広告グループ。2026-10-30）：画像の1行目を「〇〇で切手を高く売りたい方へ！」に差し替え＋導入会話
  ...[
    ['tokyo', '東京'], ['osaka', '大阪'], ['aichi', '愛知'], ['kanagawa', '神奈川'], ['saitama', '埼玉'], ['hyogo', '兵庫'],
    ['chiba', '千葉'], ['tochigi', '栃木'], ['ibaraki', '茨城'], ['mie', '三重'], ['kyoto', '京都'], ['okayama', '岡山'],
    ['shizuoka', '静岡'], ['gifu', '岐阜'], ['shiga', '滋賀'], ['nara', '奈良'], ['wakayama', '和歌山'],
  ].map(([id, area]) => ({
    file: `${id}.html`,
    h1: `${area}で<wbr>切手を<wbr>高く<wbr>売りたい方へ！<wbr>おすすめ切手買取店TOP<wbr>3｜出張買取6⁠社⁠を⁠比⁠較`,
    img: `assets/img/photo/hero-${id}.webp`,
    alt: `${area}で切手を高く売りたい方へ！おすすめ買取店TOP3`,
    talk: talk(area),
  })),
];

// 地域版の導入会話（体験談パーツ mt-talk）。PR表記のすぐ下に入れる
function talk(area) {
  const row = (who, icon, text, right) =>
    `  <div class="mt-talk__row${right ? ' mt-talk__row--r' : ''}"><div class="mt-talk__who"><span class="mt-talk__icon"><img src="assets/img/illust/${icon}" alt="" width="56" height="56"></span><span class="mt-talk__name">${who}</span></div><div class="mt-talk__b">${text}</div></div>`;
  return [
    `<!-- ===== 導入会話（体験談パーツ mt-talk）：地域版 ${area}（案B 2026-10-30 採用） ===== -->`,
    '<div class="mt-talk">',
    row('相談者', 'consultant-photo.webp', `${area}で、切手を売れるお店を探しているんです。`, true),
    row('編集部', 'editor-photo.webp', 'お店に持ち込む方法もありますが、<span class="yk-mark">自宅まで来てもらえる出張買取</span>も便利ですよ。', false),
    row('相談者', 'consultant-photo.webp', '出張だと、費用がかかりませんか？', true),
    row('編集部', 'editor-photo.webp', 'ここで紹介する3社は、<span class="yk-red">出張料・査定料・キャンセル料がすべて無料</span>です。金額に納得できなければ、そのまま断れます。', false),
    row('編集部', 'editor-photo.webp', `${area}で頼めるおすすめの3社を、ランキングで紹介しますね。`, false),
    '</div>',
    '',
  ].join('\n');
}

for (const v of VARIANTS) {
  let html = src;
  const swap = (re, to, label) => {
    if (!re.test(html)) throw new Error(`${v.file}: ${label} が見つからない`);
    html = html.replace(re, to);
  };
  swap(/(<header class="yk-hero kt-hero--banner">\s*<h1 class="kt-sr">)[\s\S]*?(<\/h1>)/, `$1${v.h1}$2`, '見出し');
  swap(/<img class="kt-hero__banner" src="[^"]+" alt="[^"]*"/, `<img class="kt-hero__banner" src="${v.img}" alt="${v.alt}"`, 'ヒーロー画像');
  if (v.talk) swap(/(<p class="yk-pr">[\s\S]*?<\/p>\n)/, `$1\n${v.talk}`, 'PR表記');
  html = html.replace('<!DOCTYPE html>', `<!DOCTYPE html>\n<!-- 生成物：tools/build-variants.cjs（index.html のコピー。直接編集しない） -->`);
  fs.writeFileSync(path.join(dir, v.file), html);
  console.log('variant:', v.file);
}
