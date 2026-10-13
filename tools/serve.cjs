/* ローカル確認用サーバー（追加インストール不要）
   実行：node tools/serve.cjs [ポート]   → ブラウザで http://localhost:8080/kitte-kaitori/ が開く
   止めるとき：このウィンドウで Ctrl + C
   ※ページ間リンクが「uriel/」のようなフォルダ指定なので、index.html をダブルクリックで直接開く（file://）と
     個別ページへ移動できない。必ずこのサーバー経由で見る。 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const root = path.join(__dirname, '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.md': 'text/plain; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
  if (p === '/') { res.writeHead(302, { Location: '/kitte-kaitori/' }); return res.end(); }
  let f = path.normalize(path.join(root, p));
  if (!f.startsWith(root)) { res.writeHead(403); return res.end('403'); }
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) {
    if (!p.endsWith('/')) { res.writeHead(301, { Location: p + '/' }); return res.end(); }
    f = path.join(f, 'index.html');
  }
  fs.readFile(f, (e, b) => {
    if (e) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('404 Not Found: ' + p); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(b);
  });
});

let port = +(process.argv[2] || process.env.PORT || 8080);
server.on('error', e => {
  if (e.code === 'EADDRINUSE' && port < 8100) { port++; server.listen(port); } else { console.error(e.message); process.exit(1); }
});
server.on('listening', () => {
  const url = `http://localhost:${port}/kitte-kaitori/`;
  console.log('\n切手買取LP ローカル確認サーバーを起動しました');
  console.log(`  比較TOP     ${url}`);
  console.log(`  ウリエル     ${url}uriel/`);
  console.log(`  バイセル     ${url}buysell/`);
  console.log(`  福ちゃん     ${url}fukuchan/`);
  console.log(`  調査概要     ${url}methodology/`);
  console.log(`  制作用（画像指示枠） http://localhost:${port}/_production/kitte-kaitori/imgslot-preview.html`);
  console.log('\n止めるときは Ctrl + C\n');
  if (!process.env.NO_OPEN) {
    const cmd = process.platform === 'win32' ? `start "" "${url}"` : process.platform === 'darwin' ? `open "${url}"` : `xdg-open "${url}"`;
    exec(cmd, () => {});
  }
});
server.listen(port);
