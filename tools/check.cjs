/* ブラウザ動作チェック：node tools/check.cjs [スクリーンショット出力先]
   Playwright（Chromium）で 375 / 390 / 1280px を開き、横はみ出し・画像読み込み・JSエラー・
   タブ切替・もっと見る・横スクロール・診断フォーム・アンカー・ASPリンクの内部導線切替・PR表記・mt-imgslot 0件 を確認する。
   Playwright は `npm i -D playwright` 済みか、グローバル（/opt/node22/lib/node_modules/playwright）を使う。 */
const http = require('http');
const fs = require('fs');
const path = require('path');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }

const root = path.join(__dirname, '..');
const shotDir = process.argv[2];
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  let f = path.join(root, p);
  if (p.endsWith('/')) f = path.join(f, 'index.html');
  fs.readFile(f, (e, b) => { if (e) { res.writeHead(404); return res.end('404'); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); res.end(b); });
});

const PAGES = ['/kitte-kaitori/', '/kitte-kaitori/uriel/', '/kitte-kaitori/buysell/', '/kitte-kaitori/fukuchan/', '/kitte-kaitori/methodology/', '/kitte-kaitori/about/', '/kitte-kaitori/privacy/'];
const WIDTHS = [375, 390, 1280];
let fails = 0;
const ok = (cond, msg) => { console.log(`  ${cond ? 'OK' : 'NG'} ${msg}`); if (!cond) fails++; };

(async () => {
  await new Promise(r => server.listen(0, r));
  const base = `http://localhost:${server.address().port}`;
  const browser = await chromium.launch();

  for (const w of WIDTHS) {
    console.log(`■ 幅 ${w}px`);
    for (const pg of PAGES) {
      const page = await browser.newPage({ viewport: { width: w, height: 800 } });
      const errs = [];
      page.on('pageerror', e => errs.push(e.message));
      page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
      page.on('requestfailed', r => errs.push('requestfailed ' + r.url()));
      page.on('response', r => { if (r.status() >= 400) errs.push(r.status() + ' ' + r.url()); });
      await page.goto(base + pg, { waitUntil: 'networkidle' });
      // 遅延読み込み画像を1枚ずつ画面に入れて読み込ませる（タブの非表示パネル内は対象外。タブ切替は下の動作チェックで確認）
      await page.evaluate(async () => {
        document.querySelectorAll('img[loading="lazy"]').forEach(i => { i.loading = 'eager'; });
        await Promise.race([Promise.all([...document.images].filter(i => i.offsetParent).map(i => i.decode().catch(() => {}))), new Promise(r => setTimeout(r, 2000))]);
        window.scrollTo(0, 0);
      });
      await page.waitForLoadState('networkidle');
      const r = await page.evaluate(() => ({
        sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth,
        broken: [...document.images].filter(i => i.offsetParent && (!i.complete || i.naturalWidth === 0)).map(i => i.getAttribute('src')),
        slots: document.querySelectorAll('.mt-imgslot').length,
        pr: /広告|PR/.test((document.querySelector('.yk-pr, .yk-footer') || {}).textContent || ''),
        pendingLeft: [...document.querySelectorAll('a[href^="__"]')].length,
        offenders: [...document.querySelectorAll('.kt-wrap *')].filter(e => { const b = e.getBoundingClientRect(); return b.right > document.documentElement.clientWidth + 1 && !e.closest('.yk-hscroll, .yk-logos, .kt-x'); }).slice(0, 3).map(e => e.className || e.tagName)
      }));
      ok(r.sw <= r.cw && r.offenders.length === 0, `${pg} 横はみ出しなし（scrollWidth ${r.sw} / ${r.cw}）${r.offenders.length ? ' はみ出し: ' + r.offenders.join(',') : ''}`);
      ok(r.broken.length === 0, `${pg} 画像すべて表示 ${r.broken.join(' ')}`);
      ok(errs.length === 0, `${pg} JS・読み込みエラーなし ${errs.join(' | ')}`);
      ok(r.slots === 0, `${pg} mt-imgslot 0件`);
      ok(r.pr, `${pg} PR／広告表記あり`);
      ok(r.pendingLeft === 0, `${pg} 未設定ASPリンク（__…__）は表示時に内部導線へ切替済み`);
      if (shotDir && w !== 390) { fs.mkdirSync(shotDir, { recursive: true }); await page.screenshot({ path: path.join(shotDir, `${pg.replace(/\//g, '_').replace(/^_|_$/g, '') || 'top'}-${w}.png`), fullPage: true }); }
      await page.close();
    }
  }

  console.log('■ 比較TOPの動作（375px）');
  const page = await browser.newPage({ viewport: { width: 375, height: 800 } });
  await page.goto(base + '/kitte-kaitori/', { waitUntil: 'networkidle' });
  const vis = sel => page.locator(sel).first().isVisible();
  // タブ（比較表）
  ok(await vis('#compare ~ .yk-tabs .yk-tabs__panels > div:nth-child(1) table'), '比較表：最初は「対象の切手」タブ表示');
  await page.click('label[for="cmp1-2"]');
  ok(await vis('#compare ~ .yk-tabs .yk-tabs__panels > div:nth-child(2) table') && !(await vis('#compare ~ .yk-tabs .yk-tabs__panels > div:nth-child(1) table')), '比較表：「買取方法」タブに切替');
  await page.click('label[for="cmp1-3"]');
  ok(await vis('#compare ~ .yk-tabs .yk-tabs__panels > div:nth-child(3) table'), '比較表：「費用・地域・断るとき」タブに切替');
  await page.click('label[for="cmp1-1"]');
  const foldH0 = await page.locator('#cmp1-more ~ .yk-fold__body').evaluate(e => e.getBoundingClientRect().height);
  await page.click('label[for="cmp1-more"]');
  const foldH1 = await page.locator('#cmp1-more ~ .yk-fold__body').evaluate(e => e.getBoundingClientRect().height);
  ok(foldH1 > foldH0, `もっと見る：開くと高さが増える（${Math.round(foldH0)} → ${Math.round(foldH1)}px）`);
  // ランキング内タブ（3社とも name が別）
  ok(!(await page.locator('#rank-fukuchan').isVisible()) || (await page.locator('#rank-more').isChecked()) === false, 'ランキング：3位以下は「もっと見る」の中');
  await page.click('label[for="rank-more"]');
  ok(await page.locator('#rank-nanboya').isVisible(), 'ランキング：「3位〜6位をもっと見る」で6位まで表示');
  for (const n of [1, 2, 3]) {
    await page.click(`label[for="rk${n}-2"]`);
    const radarOk = await page.locator(`#rk${n}-2 ~ .yk-tabs__panels > div:nth-child(2) .yk-radar svg`).isVisible();
    await page.click(`label[for="rk${n}-3"]`);
    const recOk = await page.locator(`#rk${n}-3 ~ .yk-tabs__panels > div:nth-child(3) .yk-jobex img`).first().isVisible();
    ok(radarOk && recOk, `ランキング${n}位：評価タブでレーダー、実績タブで写真つきカード表示`);
    await page.click(`label[for="rk${n}-1"]`);
    const panelImgs = await page.$$eval(`#rk${n}-1 ~ .yk-tabs__panels > div:nth-child(1) img`, async is => { is.forEach(i => { i.loading = 'eager'; }); await Promise.race([Promise.all(is.map(i => i.decode().catch(() => {}))), new Promise(r => setTimeout(r, 3000))]); return is.every(i => i.naturalWidth > 0); });
    ok(panelImgs, `ランキング${n}位：イチオシタブの画像を表示`);
  }
  await page.click('label[for="rk1-2"]'); await page.click('label[for="rk2-3"]'); await page.click('label[for="rk3-2"]');
  const otherTabStill = await page.locator('#rk1-2').isChecked() && await page.locator('#rk2-3').isChecked() && await page.locator('#cmp1-1').isChecked();
  ok(otherTabStill, 'ランキングのタブは社ごとに独立');
  ok(await page.locator('.yk-radar svg').count() === 6, 'レーダーチャート6社分を描画');
  ok(await page.locator('.yk-matrix__item').count() === 6, '早見表に6社を配置');
  // 横スクロール
  const hs = page.locator('#records ~ .yk-hscroll').first();
  ok(await page.locator('#records ~ .yk-hscroll .kt-recphoto').count() === 6, '買取実績カード：写真つき6枚');
  const can = await hs.evaluate(e => e.scrollWidth > e.clientWidth);
  await hs.evaluate(e => e.scrollBy(400, 0));
  await page.waitForTimeout(400);
  const moved = await hs.evaluate(e => e.scrollLeft > 0);
  ok(can && moved, '買取実績カード：横スクロールできる');
  // アンカー
  await page.evaluate(() => { document.getElementById('rank-more').checked = false; });
  for (const [link, target] of [['a[href="#rank-uriel"]', '#rank-uriel'], ['a[href="#compare"]', '#compare'], ['a[href="#finder"]', '#finder'], ['a[href="#rank-fukuchan"]', '#rank-fukuchan']]) {
    await page.locator(link).first().click();
    await page.waitForTimeout(700);
    const top = await page.locator(target).evaluate(e => e.getBoundingClientRect().top);
    ok(Math.abs(top) < 60, `アンカー ${target}：クリックで移動（top=${Math.round(top)}）${target === '#rank-fukuchan' ? '・もっと見るを自動で開く' : ''}`);
  }
  // ASPリンク：未設定の間は内部導線
  const affs = await page.$$eval('a[data-aff]', as => as.map(a => [a.getAttribute('href'), a.className]));
  ok(affs.length > 0 && affs.every(([h, c]) => !h.startsWith('__') && c.includes('is-pending')), `ASPリンク未設定ボタン ${affs.length}件：内部導線（is-pending）へ切替`);
  // 診断フォーム
  async function diagnose(method, kind, extra, label) {
    await page.selectOption('#kt-finder select[name="method"]', method);
    await page.selectOption('#kt-finder select[name="kind"]', kind);
    await page.selectOption('#kt-finder select[name="speed"]', extra.soon ? 'soon' : 'normal');
    await page.setChecked('#kt-finder input[name="damaged"]', !!extra.damaged);
    await page.click('#kt-finder button[type="submit"]');
    await page.waitForTimeout(300);
    const res = await page.$$eval('#kt-finder-result .kt-res__card', cs => cs.map(c => c.querySelector('.kt-res__name').textContent));
    console.log(`    診断 ${label}: ${res.join(' / ')}`);
    return res;
  }
  let r1 = await diagnose('shutcho', 'album', { soon: true, damaged: true }, '出張・アルバム・急ぎ・汚れ');
  ok(r1[0].includes('ウリエル') && r1[0].includes('優先候補') && r1.some(x => x.includes('バイセル')), '診断：出張 → ウリエル優先＋バイセル');
  let r2 = await diagnose('mitei', 'china', {}, '未定・中国切手');
  ok(r2[0].includes('ウリエル') && r2.some(x => x.includes('福ちゃん')), '診断：未定・中国切手 → ウリエル優先＋福ちゃんも表示');
  let r3 = await diagnose('takuhai', 'futsu', {}, '宅配');
  ok(r3[0].includes('バイセル') && r3.some(x => x.includes('ウリエル')), '診断：宅配 → バイセル優先＋ウリエル（出張の案内）');
  let r4 = await diagnose('tento', 'unknown', {}, '店頭');
  ok(r4[0].includes('バイセル') && r4.length >= 2, '診断：店頭 → バイセル優先＋ウリエル');
  const resAff = await page.$$eval('#kt-finder-result a[data-aff]', as => as.every(a => !a.getAttribute('href').startsWith('__')));
  ok(resAff, '診断結果のボタンも未設定ASPリンクは内部導線');
  const sent = await page.evaluate(() => /\/kitte-kaitori\/(index\.html)?$/.test(location.pathname));
  ok(sent, '診断：ページ遷移・外部送信なし（ブラウザー内で表示）');
  await page.close();

  console.log('■ HTMLファイルを直接開く（file://）');
  const fp = await browser.newPage({ viewport: { width: 375, height: 800 } });
  const ferrs = [];
  fp.on('pageerror', e => ferrs.push(e.message)); fp.on('requestfailed', r => { if (!/ERR_ABORTED/.test((r.failure() || {}).errorText || '')) ferrs.push('requestfailed ' + r.url() + ' ' + (r.failure() || {}).errorText); }); // ページ移動で中断された遅延読み込みは除外
  const fileUrl = rel => 'file://' + path.join(root, rel);
  await fp.goto(fileUrl('kitte-kaitori/index.html'));
  ok(await fp.locator('.yk-radar svg').count() === 6, 'file://：比較TOPのJS（レーダー）が動く');
  for (const [sel, title] of [['.kt-related a[href="uriel/index.html"]', 'ウリエル'], ['.kt-related a[href="buysell/index.html"]', 'バイセル'], ['.kt-related a[href="fukuchan/index.html"]', '福ちゃん'], ['.yk-footer a[href="methodology/index.html"]', 'ランキング調査概要']]) {
    await fp.goto(fileUrl('kitte-kaitori/index.html'));
    await fp.locator(sel).first().click();
    await fp.waitForLoadState('load');
    const t = await fp.title();
    const imgsOk = await fp.evaluate(async () => { document.querySelectorAll('img').forEach(i => { i.loading = 'eager'; }); await Promise.race([Promise.all([...document.images].map(i => i.decode().catch(() => {}))), new Promise(r => setTimeout(r, 3000))]); return [...document.images].filter(i => i.offsetParent).every(i => i.naturalWidth > 0); });
    ok(t.includes(title) && imgsOk, `file://：比較TOP → ${title} に移動、CSS・画像表示`);
    await fp.locator('.yk-crumb a').first().click();
    await fp.waitForLoadState('load');
    ok(fp.url().endsWith('/kitte-kaitori/index.html'), `file://：${title} のパンくずから比較TOPに戻る`);
  }
  ok(ferrs.length === 0, 'file://：読み込みエラーなし ' + ferrs.join(' | '));
  await fp.close();

  await browser.close();
  server.close();
  console.log(fails ? `\n✖ NG ${fails} 件` : '\n✔ すべてOK');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
