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
  {
    file: 'tokyo.html', // 広告：CP③ 地域「東京」（2026-10-30。地域版の試作1本目）
    h1: '東京で<wbr>切手を<wbr>高く<wbr>売りたい方へ！<wbr>おすすめ切手買取店TOP<wbr>3｜出張買取6⁠社⁠を⁠比⁠較',
    img: 'assets/img/photo/hero-tokyo.webp',
    alt: '東京で切手を高く売りたい方へ！おすすめ買取店TOP3',
    talk: talk('東京'),
  },
];

// 地域版の導入会話（体験談パーツ mt-talk）。PR表記のすぐ下に入れる
function talk(area) {
  const row = (who, icon, text, right) =>
    `  <div class="mt-talk__row${right ? ' mt-talk__row--r' : ''}"><div class="mt-talk__who"><span class="mt-talk__icon"><img src="assets/img/illust/${icon}" alt="" width="56" height="56"></span><span class="mt-talk__name">${who}</span></div><div class="mt-talk__b">${text}</div></div>`;
  return [
    `<!-- ===== 導入会話（体験談パーツ mt-talk）：地域版 ${area} ===== -->`,
    '<div class="mt-talk">',
    row('相談者', 'consultant-photo.webp', `${area}で、切手を売れるいいお店がないか探してるんだよね。`, true),
    row('編集部', 'editor-photo.webp', 'お店に持って行ってみるのもいいけど、<span class="yk-mark">出張買取がめっちゃいいよ</span>。', false),
    row('相談者', 'consultant-photo.webp', 'えー、でもお金がかかりそう……', true),
    row('編集部', 'editor-photo.webp', '<span class="yk-red">出張料も査定料もキャンセル料も、全部無料</span>。お店に行く必要もないから、めっちゃ楽だよ。おすすめのお店を教えてあげるね。', false),
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
