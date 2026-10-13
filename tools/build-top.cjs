/* 比較TOP・調査概要の生成部分を tools/data/companies.json から作り直す：node tools/build-top.cjs
   HTML内の <!--@名前:start--> 〜 <!--@名前:end--> の間だけを書き換える（それ以外は手書き部分）。
   生成する部分：best3 / records / compare / matrix / ranking（比較TOP）、scores（調査概要） */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'companies.json'), 'utf8'));
const { axes, companies: C } = data;

const total = c => axes.reduce((s, a) => s + c.marks[a.key], 0);
const score = c => (Math.round(total(c) / axes.length * 10) / 10).toFixed(1);
const maru = v => (v >= 5 ? '◎' : v >= 4 ? '○' : '△');
const stars = c => `<span class="kt-stars" style="--p:${(score(c) / 5 * 100).toFixed(0)}%" aria-hidden="true">★★★★★</span><span class="kt-score"><small>編集部評価</small>${score(c)}</span>`;
// 地域名は都道府県のあとでだけ改行する（例：東京都／世田谷区）
const pref = s => s.replace(/^(.{2,3}?[都道府県])/, '$1<wbr>');
const logo = (c, w, h, alt = c.name) => `<img src="${c.logo.src}" alt="${alt}" width="${w}" height="${h}">`;
// place：ボタンの場所（計測用。kitte.js がクリック時に dataLayer へ cta_place として送る）
const aff = (c, cls, label, pendingHref, pendingLabel, place) =>
  `<a class="${cls}" href="${c.aff}" data-aff="${c.id}" data-place="${place}" data-pending-href="${pendingHref}" data-pending-label="${pendingLabel}" rel="nofollow sponsored noopener" target="_blank">${label}</a>`;
const official = (c, label = '公式サイトで条件を確認する') =>
  `<a class="yk-btn yk-btn--sub kt-offlink" href="${c.official}" data-place="rank-${c.id}-official" rel="nofollow noopener" target="_blank">${label}<small>（外部サイト・広告リンクではありません）</small></a>`;
const medal = r => `yk-medal${r === 2 ? ' yk-medal--2' : r === 3 ? ' yk-medal--3' : r > 3 ? ' yk-medal--n' : ''}`;
const radar = c => `<div class="kt-radarbox"><p class="kt-radarbox__ttl">${c.name}の編集部評価 ${stars(c)}</p>
        <div class="yk-radar" data-name="${c.name}" data-labels="${axes.map(a => a.radar).join(',')}" data-scores="${axes.map(a => c.marks[a.key]).join(',')}" data-min="2"></div>
        <ul class="kt-radarlist">${axes.map(a => `<li><span>${a.short}</span><b class="kt-m${c.marks[a.key]}">${maru(c.marks[a.key])}</b><small>${c.ev[a.key]}</small></li>`).join('')}</ul>
        <p class="yk-small yk-radar__note">※◎＝5点・○＝4点・△＝3点。各社公式サイトの記載をもとにした編集部の採点です（<a href="methodology/index.html#radar">採点基準</a>）</p></div>`;

// ---------- BEST3 ----------
function best3() {
  return `<section class="yk-best3" id="best3"><h2 class="yk-best3__ttl"><em>切手買取</em>おすすめ<em>BEST3</em></h2>
<ol class="yk-best3__list">
${C.slice(0, 3).map(c => {
  const btn = c.aff ? aff(c, 'yk-btn yk-btn--sm', '公式サイト', `#rank-${c.id}`, '詳しく見る', `best3-${c.id}`) : `<a class="yk-btn yk-btn--sm is-pending" href="#rank-${c.id}" data-place="best3-${c.id}">詳しく見る</a>`;
  return `  <li class="yk-best3__item"><span class="yk-best3__crown">${c.rank}</span><span class="yk-best3__logo">${logo(c, 102, 30)}</span><p class="kt-best3__score">${stars(c)}</p><p class="yk-best3__text"><span class="yk-red">${c.best3.red}</span><br><span class="yk-mark">${c.best3.mark}</span>${c.best3.text}</p><p class="yk-best3__note kt-note-pos">${c.best3.note}</p>
    <p class="yk-catch">${c.best3.catch}</p>${btn}</li>`;
}).join('\n')}
</ol>
<p class="kt-best3__foot">${C.filter(c => c.featureNote).slice(0, 2).map(c => c.featureNote).join('<br>')}</p></section>`;
}

// ---------- 買取実績（ウリエル）：高額の例と身近な金額の例を交互に並べ、利用者の声を直下に置く ----------
function records() {
  const u = C[0];
  return `<h2 class="yk-sec-ttl" id="records"><em>${u.name}</em>の<br>切手買取実績</h2>
<p class="kt-lead kt-lead--c">20万円の中国切手から<br><span class="yk-mark">1万円台の切手コレクション</span>まで。<br>実家から出てきた切手も、<br>まずはそのまま見てもらえます。</p>
<p class="yk-hint">横にスクロールできます</p>
<div class="yk-hscroll">
${u.topRecords.map((r, i) => `  <div class="yk-jobcard"><h3 class="yk-jobcard__ttl">${r.tag}</h3><img class="kt-recphoto" src="${r.img}" alt="${r.title}（${u.name}公式サイト掲載の実績写真）" width="600" height="463" loading="lazy"><p class="yk-jobcard__pay">買取価格<b>${r.price}</b>円${r.note ? `<small>※${r.note}（公式記載）</small>` : ''}</p><table class="yk-kv"><tr><th>品目</th><td>${r.title}</td></tr><tr><th>買取日</th><td>${r.date}</td></tr><tr><th>地域</th><td>${r.area}・出張買取</td></tr></table>
    <p class="yk-catch">${u.cta.catch}</p>${aff(u, 'yk-btn yk-btn--sm', `${u.name}で無料査定`, u.detail, `${u.name}の詳細を見る`, `records-${i + 1}`)}</div>`).join('\n')}
</div>
<p class="kt-src">写真・実績：<a href="${u.recordSrc}" rel="nofollow noopener" target="_blank">${u.recordSrcName}</a>（2026年10月13日確認）。複数点をまとめた過去の買取例で、同じ切手でも状態や時期により査定額は変わります。</p>
<h3 class="yk-voice__ttl">家族の切手を売った方の声</h3>
<ul class="yk-voice">
${u.topVoices.map(v => `  <li><div class="yk-voice__who"><span class="yk-voice__face"><img src="${v.face}" alt="" width="60" height="60"></span>${v.who}<b>${pref(v.where)}</b></div><p><b>${v.ttl}</b><br>${v.text}</p></li>`).join('\n')}
</ul>
<p class="yk-small">※公式LP掲載の利用者の声を編集部が要旨として紹介（文面の転載はしていません）。個人の感想です。出典：<a href="${u.topVoiceSrc}" rel="nofollow noopener" target="_blank">${u.name}公式LP</a></p>`;
}

// ---------- 比較表（タブ＋もっと見る） ----------
function compare() {
  const row = (c, cells) => `<tr${c.rank === 1 ? ' class="is-pick"' : ''}>${cells}</tr>`;
  const head = c => `<td><span class="yk-cmp__rank">${c.rank}</span><span class="yk-cmp__logo">${logo(c, 90, 22)}</span><a class="yk-cmp__name" href="${c.detail || '#rank-' + c.id}">${c.name}</a></td>`;
  const cell = (c, k) => `<td><span class="yk-maru kt-m${c.marks[k]}">${maru(c.marks[k])}</span><small>${c.ev[k]}</small></td>`;
  const btn = c => c.aff ? `<p class="yk-catch">${c.cta.short || c.cta.catch}</p>${aff(c, 'yk-btn yk-btn--sm', '公式', `#rank-${c.id}`, '詳細', `compare-${c.id}`)}` : `<a class="yk-btn yk-btn--sm is-pending" href="#rank-${c.id}" data-place="compare-${c.id}">詳細</a>`;
  return `<div class="yk-tabs">
  <input type="radio" name="cmp1" id="cmp1-1" checked><input type="radio" name="cmp1" id="cmp1-2"><input type="radio" name="cmp1" id="cmp1-3">
  <div class="yk-tabs__labels"><label for="cmp1-1">総合<br>評価</label><label for="cmp1-2">状態・量の<br>対応</label><label for="cmp1-3">出張の<br>頼みやすさ</label></div>
  <div class="yk-tabs__panels">
    <div><div class="yk-fold"><input type="checkbox" id="cmp1-more"><div class="yk-fold__body">
      <table class="yk-cmp"><colgroup><col class="c1"><col class="c2"><col><col class="c4"></colgroup>
        <tr><th>サービス</th><th>編集部<br>評価</th><th>得意なこと</th><th>公式</th></tr>
${C.map(c => '        ' + row(c, `${head(c)}<td>${stars(c)}</td><td class="is-left">${c.tagline}<ul class="yk-chips">${axes.filter(a => c.marks[a.key] >= 5).slice(0, 3).map((a, i) => `<li${i === 0 ? ' class="is-pink"' : ''}>${a.short}</li>`).join('')}</ul></td><td>${btn(c)}</td>`)).join('\n')}
      </table></div><label class="yk-fold__btn" for="cmp1-more">4位〜6位も見る</label></div></div>
    <div><table class="yk-cmp"><colgroup><col class="c1"><col><col></colgroup><tr><th>サービス</th><th>状態の悪い切手</th><th>大量・アルバムのまま</th></tr>
${C.map(c => '      ' + row(c, `${head(c)}${cell(c, 'joutai')}${cell(c, 'tairyou')}`)).join('\n')}
    </table></div>
    <div><table class="yk-cmp"><colgroup><col class="c1"><col><col><col></colgroup><tr><th>サービス</th><th>訪問の早さ・現金</th><th>費用</th><th>受付</th></tr>
${C.map(c => '      ' + row(c, `${head(c)}${cell(c, 'houmon')}${cell(c, 'hiyou')}${cell(c, 'uketsuke')}`)).join('\n')}
    </table></div>
  </div>
</div>
<p class="kt-cmp-note">※◎＝5点・○＝4点・△＝3点。各社公式サイトの記載（2026年10月13日確認）をもとにした編集部の採点で、編集部評価は6項目の平均です（<a href="methodology/index.html#radar">採点基準</a>）。</p>`;
}

// ---------- 2軸の早見表 ----------
function matrix() {
  const X = c => c.marks.joutai + c.marks.tairyou;            // 状態・量を問わず相談しやすい（6〜10）
  const Y = c => c.marks.uketsuke + c.marks.hiyou + c.marks.houmon; // 自宅で手軽に頼みやすい（9〜15）
  const used = {};
  // 横：X=10→82%、9→56%、8→30%（ロゴ枠25%幅が重ならない間隔）。縦：Y=14→53%、13→71%、12以下→86%。1位は上段に吹き出し枠で表示
  const pos = c => {
    let x = 82 - (10 - X(c)) * 26, y = Y(c) >= 14 ? 53 : Y(c) === 13 ? 71 : 86;
    const k = X(c) + ':' + Y(c); const n = used[k] = (used[k] || 0) + 1;
    if (n > 1) x -= (n - 1) * 26; // 同じ評価は左にずらす
    return [Math.max(16, Math.min(84, x)), y];
  };
  const items = C.map(c => {
    if (c.rank === 1) return `  <div class="yk-matrix__item is-pick" style="--x:64%;--y:21%">${logo(c, 90, 22)}<ul><li>✔ 状態不良・大量もそのまま</li><li>✔ 最短翌日・24時間受付</li></ul></div>`;
    const [x, y] = pos(c);
    return `  <span class="yk-matrix__item kt-has-cap" style="--x:${x}%;--y:${y}%">${logo(c, 90, 20)}<small>${c.rank}位 ${score(c)}</small></span>`;
  });
  return `<div class="yk-matrix" role="img" aria-label="横軸：状態・量を問わず相談しやすい、縦軸：自宅で手軽に頼みやすい。右上ほど両方の評価が高い。${C.map(c => `${c.name}（${X(c)}点・${Y(c)}点）`).join('、')}">
  <span class="yk-matrix__ax yk-matrix__ax--t">自宅で手軽に頼める</span><span class="yk-matrix__ax yk-matrix__ax--b">条件の確認が必要</span><span class="yk-matrix__ax yk-matrix__ax--l">状態・量 要確認</span><span class="yk-matrix__ax yk-matrix__ax--r">状態・量を問わない</span>
${items.join('\n')}
</div>
<p class="yk-small">※横軸＝「状態の悪い切手」＋「大量・アルバムのまま」、縦軸＝「24時間受付」＋「費用0円」＋「訪問の早さ」の採点合計で配置（同じ点数の会社は重ならないよう左右にずらして表示）。<a href="methodology/index.html#matrix">配置の基準</a></p>`;
}

// ---------- ランキング ----------
function rankBlock(c) {
  const n = c.rank;
  const head = `<h3 class="yk-rankhead"><span class="${medal(n)}">${n}</span>${c.name}<span class="kt-rankscore">${stars(c)}</span></h3>
  <p class="yk-rankcatch">${c.rankcatch}</p>`;
  const features = `<div class="yk-features"><p class="yk-features__ttl">特徴</p><ul>
${c.features.map(f => `          <li><span>${f}</span>${n <= 3 ? '<small>※公式</small>' : ''}</li>`).join('\n')}
        </ul></div>`;
  if (n >= 4) {
    // 4位以下：コンパクト表示（公式の通常リンクのみ。ASP提携なし）
    return `<div class="yk-rankarea kt-rankarea--compact" id="rank-${c.id}">
  ${head}
  <span class="kt-svclogo">${logo(c, 160, 40)}</span>
  ${features}
  ${radar(c)}
  <table class="yk-info"><tr>${c.info.map(i => `<th>${i[0]}</th>`).join('')}</tr><tr>${c.info.map(i => `<td class="is-left">${i[1]}</td>`).join('')}</tr></table>
  <p class="kt-src">出典：<a href="${c.official}" rel="nofollow noopener" target="_blank">${c.name}公式 切手買取ページ</a>（2026年10月13日確認）</p>
  ${official(c)}
</div>`;
  }
  const infoRows = [];
  for (let i = 0; i < c.info.length; i += 2) infoRows.push(`<tr><th>${c.info[i][0]}</th><th>${c.info[i + 1][0]}</th></tr><tr><td class="is-left">${c.info[i][1]}</td><td class="is-left">${c.info[i + 1][1]}</td></tr>`);
  const tab1img = c.banner
    ? `<img class="kt-banner" src="${c.banner.src}" alt="${c.banner.alt}" width="${c.banner.w}" height="${c.banner.h}" loading="lazy">`
    : `<span class="kt-svclogo">${logo(c, 160, 40)}</span><img class="kt-banner" src="${c.records[0].img}" alt="${c.records[0].title}（${c.name}公式サイト掲載の実績写真）" width="370" height="240" loading="lazy">`;
  const tab1btn = c.aff
    ? `<p class="yk-catch">${c.cta.catch}</p>${aff(c, 'yk-btn', c.cta.label, c.detail, c.cta.pending, `rank-${c.id}-top`)}`
    : `<!-- __${c.id.toUpperCase()}_AFF_LINK__：ASP条件取得後に公式申込ボタンへ変更 -->\n        <a class="yk-btn is-pending" href="${c.detail}" data-place="rank-${c.id}-top">${c.name}の確認ポイントを見る</a>`;
  const right = c.aff
    ? `<p class="yk-catch">${c.cta.catch}</p>${aff(c, 'yk-btn', c.cta.label, c.detail, c.cta.pending, `rank-${c.id}-bottom`)}`
    : `<p class="yk-catch">ほかの会社とも比べる</p><a class="yk-btn is-pending" href="#finder" data-place="rank-${c.id}-bottom">自分に合う業者を<br>診断で確認する</a>`;
  return `<div class="yk-rankarea" id="rank-${c.id}">
  ${head}
  <div class="yk-tabs">
    <input type="radio" name="rk${n}" id="rk${n}-1" checked><input type="radio" name="rk${n}" id="rk${n}-2"><input type="radio" name="rk${n}" id="rk${n}-3">
    <div class="yk-tabs__labels"><label for="rk${n}-1">イチオシ<br>ポイント</label><label for="rk${n}-2">評価・<br>基本情報</label><label for="rk${n}-3">買取<br>実績</label></div>
    <div class="yk-tabs__panels kt-rankpanel">
      <div>
        ${tab1img}
        ${tab1btn}
        ${c.campaign ? `<div class="kt-campaign kt-campaign--mini" data-campaign-end="${c.campaign.end}"><img src="${c.campaign.img}" alt="${c.campaign.alt}" width="${c.campaign.w}" height="${c.campaign.h}" loading="lazy"><p class="kt-campaign__terms">${c.campaign.terms}<a href="${c.campaign.src}" rel="nofollow noopener" target="_blank">公式のキャンペーン詳細</a></p></div>` : ''}
        ${features}
        ${c.featureNote ? `<p class="yk-small">${c.featureNote}</p>` : ''}
      </div>
      <div>
        ${radar(c)}
        <table class="yk-info">${infoRows.join('')}</table>
        <p class="kt-src">出典：<a href="${c.official}" rel="nofollow noopener" target="_blank">${c.name}公式 切手買取ページ</a>${c.id === 'uriel' ? '・<a href="https://www.uriel-cuore.co.jp/lp/af/stamp/16525/" rel="nofollow noopener" target="_blank">公式LP</a>' : ''}（2026年10月13日確認）</p>
      </div>
      <div>
        <p class="yk-hint">横にスクロールできます</p><div class="yk-hscroll">
${c.records.map((r, i) => `          <div class="yk-jobex"><p class="yk-jobex__ttl">買取実績${i + 1}</p><img class="kt-recphoto" src="${r.img}" alt="${r.title}（${c.name}公式サイト掲載の実績写真）" width="370" height="240" loading="lazy"><ul class="yk-tags yk-tags--green"><li>${r.area}</li><li>${r.tag}</li></ul><table class="yk-kv"><tr><th>品目</th><td>${r.title}</td></tr><tr><th>買取価格</th><td><b class="kt-price">${r.price}</b>円</td></tr><tr><th>買取日</th><td>${r.date}</td></tr>${r.note ? `<tr><th>備考</th><td>${r.note}</td></tr>` : ''}</table><span class="yk-jobex__logo">${logo(c, 120, 24)}</span></div>`).join('\n')}
        </div>
        <p class="kt-src">写真・実績：<a href="${c.recordSrc}" rel="nofollow noopener" target="_blank">${c.recordSrcName}</a>（2026年10月13日確認）。過去の買取例で、査定額は状態や時期により変わります。</p>
      </div>
    </div>
  </div>
  <div class="yk-editor"><p class="yk-editor__ttl">編集部の<em>イチオシ</em>ポイント</p><img class="yk-editor__chara" src="assets/img/illust/editor.svg" alt="" width="52" height="64">
    <div class="yk-editor__body"><p>${c.editor}</p></div></div>
  <h4 class="yk-voice__ttl">${c.name}の利用者の声（公式掲載）</h4>
  <ul class="yk-voice">
    <li><div class="yk-voice__who"><span class="yk-voice__face"><img src="${c.voice.face}" alt="" width="60" height="60"></span>${c.voice.who}<b>${pref(c.voice.where)}</b></div><p>${c.voice.text}</p></li>
  </ul>
  <p class="yk-small">※公式サイト掲載の利用者の声を編集部が要旨として紹介（文面の転載はしていません）。個人の感想です。出典：<a href="${c.voice.src}" rel="nofollow noopener" target="_blank">${c.voice.srcName}</a></p>
  <div class="yk-btnpair"><a class="yk-btn yk-btn--sub" href="${c.detail}" data-place="rank-${c.id}-detail">詳細<br>ページへ</a><div>${right}</div></div>
</div>`;
}
function ranking() {
  return `${C.slice(0, 2).map(rankBlock).join('\n\n')}

<div class="yk-fold kt-rankfold"><input type="checkbox" id="rank-more"><div class="yk-fold__body">
<p class="kt-rankfold__lead">3位〜6位</p>
${C.slice(2).map(rankBlock).join('\n\n')}
</div><label class="yk-fold__btn" for="rank-more">3位〜6位をもっと見る</label></div>`;
}

// ---------- 調査概要の採点表 ----------
function scores() {
  return `<div class="kt-x"><table class="kt-table">
  <tr><th>項目</th><th>◎（5点）</th><th>○（4点）</th><th>△（3点）</th></tr>
${axes.map(a => `  <tr><td><b>${a.short}</b><br><small>${a.full}</small></td><td>${a.c5}</td><td>${a.c4}</td><td>${a.c3}</td></tr>`).join('\n')}
</table></div>
<div class="kt-x"><table class="kt-table kt-table--marks">
  <tr><th>順位</th><th>サービス</th>${axes.map(a => `<th>${a.short}</th>`).join('')}<th>編集部評価</th></tr>
${C.map(c => `  <tr><td class="is-c">${c.rank}</td><td>${c.name}</td>${axes.map(a => `<td class="is-c" title="${c.ev[a.key].replace(/<[^>]+>/g, '')}">${maru(c.marks[a.key])}</td>`).join('')}<td class="is-c">${score(c)}</td></tr>`).join('\n')}
</table></div>
<div class="kt-x"><table class="kt-table kt-table--fit">
  <tr><th>サービス</th><th>採点の根拠（公式サイトの記載・要約）</th></tr>
${C.map(c => `  <tr><td>${c.name}</td><td>${axes.map(a => `<b>${a.short}</b>：${c.ev[a.key]}`).join('<br>')}<br><small>出典：<a href="${c.official}" rel="nofollow noopener" target="_blank">${c.official}</a></small></td></tr>`).join('\n')}
</table></div>`;
}

// ---------- 差し込み ----------
const GEN = { best3, records, compare, matrix, ranking, scores };
function fill(file) {
  const p = path.join(root, file);
  let h = fs.readFileSync(p, 'utf8');
  let n = 0;
  h = h.replace(/(<!--@(\w+):start-->)[\s\S]*?(<!--@\2:end-->)/g, (m, a, name, b) => {
    if (!GEN[name]) throw new Error('unknown block ' + name);
    n++;
    let out = GEN[name]();
    if (file.includes('methodology/')) out = out.replace(/href="methodology\/index\.html/g, 'href="index.html');
    return `${a}\n${out}\n${b}`;
  });
  fs.writeFileSync(p, h);
  console.log(`${file}: ${n} blocks`);
}
fill('kitte-kaitori/index.html');
fill('kitte-kaitori/methodology/index.html');
console.log('scores:', C.map(c => `${c.rank}.${c.name} ${score(c)}`).join(' / '));
