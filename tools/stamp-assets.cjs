/* CSS・JS の読み込みに内容のハッシュを付ける：node tools/stamp-assets.cjs
   例：assets/css/kitte.css?v=1a2b3c4d。ファイルを直すと値が変わるので、スマホ（特にSafari）が古いCSS・JSを使い続けるのを防ぐ */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const root = path.join(__dirname, '..', 'kitte-kaitori');
const files = ['index.html', 'uriel/index.html', 'buysell/index.html', 'fukuchan/index.html', 'methodology/index.html', 'about/index.html', 'privacy/index.html'].concat(
  // 広告グループ別LP（tools/build-variants.cjs が作る furui.html・tokyo.html など）
  require('fs').readdirSync(require('path').join(__dirname, '..', 'kitte-kaitori')).filter(f => /^[a-z]+\.html$/.test(f) && f !== 'index.html'));
const hash = f => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, f))).digest('hex').slice(0, 8);
for (const f of files) {
  const p = path.join(root, f);
  const h = fs.readFileSync(p, 'utf8').replace(/((?:\.\.\/)?(assets\/(?:css|js)\/[\w.-]+\.(?:css|js)))(?:\?v=[0-9a-f]+)?"/g, (m, ref, rel) => `${ref}?v=${hash(rel)}"`);
  fs.writeFileSync(p, h);
}
console.log('stamped:', ['assets/css/parts.css', 'assets/css/kitte.css', 'assets/js/kitte.js'].map(r => r.split('/').pop() + '=' + hash(r)).join(' '));
