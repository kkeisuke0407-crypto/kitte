/* ============================================================
   切手買取 比較LP 共通スクリプト（ページ末尾で1回だけ読み込む）
   1. ASPリンク未設定ボタンの内部導線切替
   1b. CTAクリックの計測準備（data-place ＝ ボタンの場所）
   2. 「もっと見る」の中へのアンカーリンクで、自動的に開く
   3. レーダーチャート描画（パーツ集 rank-7 の描画スクリプトを踏襲。点数を軸名の下に表示）
   4. 診断フォーム（close-2）…ブラウザー内だけで判定し、外部送信しない
   ============================================================ */
(function () {
  'use strict';
  if (window.__kitteBehaviorInstalled) return;
  window.__kitteBehaviorInstalled = true;

  /* 専用GA4に送る計測イベントの共通属性。 */
  window.dataLayer = window.dataLayer || [];
  var lpPath = location.pathname.replace(/\/index\.html$/, '/');
  var lpCode = /\/uriel\/?$/.test(lpPath) ? 'kitte_uriel'
    : /\/buysell\/?$/.test(lpPath) ? 'kitte_buysell'
    : /\/fukuchan\/?$/.test(lpPath) ? 'kitte_fukuchan'
    : /\/methodology\/?$/.test(lpPath) ? 'kitte_methodology'
    : /\/about\/?$/.test(lpPath) ? 'kitte_about'
    : /\/privacy\/?$/.test(lpPath) ? 'kitte_privacy' : 'kitte_top';
  var measurementMode = window.__kitteMeasurement ? window.__kitteMeasurement.mode : (new URLSearchParams(location.search).get('measurement_mode') === 'debug' ? 'debug' : 'normal');
  var debugLog;
  if (measurementMode === 'debug') {
    var debugPanel = document.createElement('details');
    debugPanel.id = 'kitte-measurement-debug';
    debugPanel.style.cssText = 'position:fixed;bottom:0;left:0;z-index:99999;max-width:100%;max-height:35vh;overflow:auto;background:white;color:#222;font:11px monospace;border:1px solid #999';
    var debugTitle = document.createElement('summary'); debugTitle.textContent = '切手 計測テスト（広告MCV送信なし）';
    debugLog = document.createElement('pre');
    debugPanel.appendChild(debugTitle); debugPanel.appendChild(debugLog); document.body.appendChild(debugPanel);
  }
  function trackLP(name, params) {
    var record = { event: name, lp_id: lpCode, lp_path:lpPath, measurement_mode: measurementMode,
      cta_company:null,cta_place:null,cta_pending:null,cta_external:null,cta_text:null,conversion_stage:null,
      scroll_percent:null,section_id:null,active_seconds:null,faq_label:null,
      event_id: (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : Date.now()+'-'+Math.random().toString(36).slice(2) };
    if (measurementMode === 'debug') record.debug_mode = true;
    var attribution = window.__kitteMeasurement && window.__kitteMeasurement.attribution || {};
    Object.keys(attribution).forEach(function (key) { record[key] = attribution[key]; });
    Object.keys(params || {}).forEach(function (key) { record[key] = params[key]; });
    window.dataLayer.push(record);
    /* GTM owns the dedicated Google tag. Send behavior through its gtag queue only;
       do not install a second GA4 custom-event trigger for these dataLayer records. */
    if (window.gtag) {
      var gaParams = {send_to:'G-NWC1Z8NMEJ'};
      Object.keys(record).forEach(function (key) { if(key!=='event' && key.indexOf('gtm.')!==0 && record[key]!=null) gaParams[key]=record[key]; });
      window.gtag('event',name,gaParams);
    }
    if(debugLog) debugLog.textContent = (debugLog.textContent+'\n'+JSON.stringify(record)).split('\n').slice(-100).join('\n');
  }


  /* ------------------------------------------------------------
     1. ASPリンク
     HTMLの href に直接 ASP のクリックURLを書く運用（置換対象の文字列は下記）。
       ウリエル   : __URIEL_AFF_LINK__
       バイセル   : __BUYSELL_AFF_LINK__
       福ちゃん   : ASP条件未取得のため、成果リンクのボタン自体を置いていない（__FUKUCHAN_AFF_LINK__ はコメントのみ）
     置換されていない（"__" で始まる）ボタンは、data-pending-href / data-pending-label の内部導線に切り替える。
     ------------------------------------------------------------ */
  function settleAffLinks(root) {
    (root || document).querySelectorAll('a[data-aff]').forEach(function (a) {
      var href = a.getAttribute('href') || '';
      if (href.indexOf('__') !== 0) return;
      a.classList.add('is-pending');
      a.setAttribute('href', a.dataset.pendingHref || '#ranking');
      a.removeAttribute('target');
      a.setAttribute('rel', 'nofollow');
      if (a.dataset.pendingLabel) a.innerHTML = a.dataset.pendingLabel;
    });
  }
  settleAffLinks(document);

  /* ------------------------------------------------------------
     1b. CTAクリック：GA4 / GTM を入れたときに場所別のクリック数を比べられるよう、
     window.dataLayer があれば { event: 'cta_click', cta_place, cta_company, cta_pending } を送る。
     計測タグが無いあいだは何もしない（外部送信なし）。
     ------------------------------------------------------------ */
  var lastMcv = new WeakMap();
  function onCtaClick(e) {
    if (e.type === 'auxclick' && e.button !== 1) return;
    var a = e.target.closest && e.target.closest('a[data-place]');
    if (!a) return;
    var pending = a.classList.contains('is-pending');
    var externalAff = false;
    try {
      var url = new URL(a.getAttribute('href'), location.href);
      var approved = window.__kitteMeasurement && window.__kitteMeasurement.approvedAffiliateUrls || {};
      var approvedUrls = approved[a.dataset.aff] || [];
      externalAff = !!a.dataset.aff && !pending && /^https?:$/.test(url.protocol)
        && url.host !== location.host && a.getAttribute('href').indexOf('__') !== 0
        && approvedUrls.indexOf(url.href) !== -1;
    } catch (_) { /* malformed/unset affiliate URL: do not count */ }
    trackLP('cta_click', {
      cta_place: a.dataset.place || '',
      cta_company: a.dataset.aff || '',
      cta_text: (a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80),
      cta_pending: pending,
      cta_external: externalAff
    });
    /* MCVは成果リンクへの実遷移のみ。未設定ASPリンク→内部詳細ページは含めない。 */
    if (externalAff && !e.defaultPrevented && (e.type !== 'click' || e.button === 0) && Date.now()-(lastMcv.get(a)||0)>1500) {
      lastMcv.set(a,Date.now());
      trackLP('kitte_mcv', {
      cta_company: a.dataset.aff,
      cta_place: a.dataset.place || '',
      conversion_stage: 'affiliate_outbound',
      cta_pending: false
      });
      var adsDestination = window.__kitteMeasurement && window.__kitteMeasurement.adsMcvDestination;
      if (measurementMode === 'normal' && adsDestination && window.gtag) {
        window.gtag('event','conversion',{send_to:adsDestination,value:0,currency:'JPY',transport_type:'beacon'});
      }
    }
  }
  document.addEventListener('click', onCtaClick);
  document.addEventListener('auxclick', onCtaClick);


  /* ============================================================
     ソウガクのGA4計測に合わせたLP行動イベント
     専用GA4へ送り、dataLayerにも記録する。
     個人情報・診断回答内容・URLの広告クリックIDはイベントには含めない。
     ============================================================ */
  trackLP('lp_page_view', { lp_path: lpPath });

  /* スクロール到達：同一ページ表示内で各割合1回のみ */
  var scrollMarks = [25, 50, 75, 90, 100], sentScroll = {};
  var scrolling = false;
  function measureScroll() {
    scrolling = false;
    var doc = document.documentElement;
    var range = Math.max(1, doc.scrollHeight - window.innerHeight);
    var pct = Math.min(100, Math.round(window.scrollY * 100 / range));
    scrollMarks.forEach(function (mark) {
      if (pct >= mark && !sentScroll[mark]) {
        sentScroll[mark] = true;
        trackLP('lp_scroll', { scroll_percent: mark });
      }
    });
  }
  window.addEventListener('scroll', function () {
    if (!scrolling) {
      scrolling = true;
      window.requestAnimationFrame(measureScroll);
    }
  }, { passive: true });

  /* 見出し・CTAが見えた回数（初回だけ） */
  if ('IntersectionObserver' in window) {
    var seenSections = {}, sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting || entry.intersectionRatio < 0.35) return;
        var section = entry.target.dataset.measurementSection || entry.target.id;
        if (!section || seenSections[section]) return;
        seenSections[section] = true;
        trackLP('lp_section_view', { section_id: section });
        sectionObserver.unobserve(entry.target);
      });
    }, { threshold: 0.35 });
    /* Long sections may never occupy 35% of the viewport: observe their heading. */
    document.querySelectorAll('section[id],h2[id],h3[id]').forEach(function (el) {
      var target = el.tagName === 'SECTION' ? el.querySelector('h2,h3') : el;
      if (!target) target = el;
      target.dataset.measurementSection = el.id;
      sectionObserver.observe(target);
    });

    var seenCtas = new WeakSet();
    var ctaObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting || entry.intersectionRatio < 0.5 || seenCtas.has(entry.target)) return;
        seenCtas.add(entry.target);
        trackLP('lp_cta_view', {
          cta_place: entry.target.dataset.place || '',
          cta_company: entry.target.dataset.aff || '',
          cta_pending: entry.target.classList.contains('is-pending')
        });
        ctaObserver.unobserve(entry.target);
      });
    }, { threshold: 0.5 });
    function observeCtas(root) { root.querySelectorAll('a[data-place]').forEach(function (el) { ctaObserver.observe(el); }); }
    observeCtas(document);
    if ('MutationObserver' in window) new MutationObserver(function(entries) { entries.forEach(function(entry) { entry.addedNodes.forEach(function(node) { if(node.nodeType===1) { if(node.matches('a[data-place]')) ctaObserver.observe(node); observeCtas(node); } }); }); }).observe(document.body,{childList:true,subtree:true});
  }

  /* FAQ開封、診断利用（選択した内容そのものは取得しない） */
  document.addEventListener('toggle', function (e) {
    var detail = e.target;
    if (!detail || detail.tagName !== 'DETAILS' || !detail.open || detail.id === 'kitte-measurement-debug') return;
    var summary = detail.querySelector('summary');
    trackLP('lp_faq_open', { faq_label: (summary && summary.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 90) });
  }, true);

  var finderStarted = false;
  document.addEventListener('change', function (e) {
    if (finderStarted || !e.target.closest || !e.target.closest('#kt-finder')) return;
    finderStarted = true;
    trackLP('lp_finder_start', {});
  });
  document.addEventListener('submit', function (e) {
    if (e.target && e.target.id === 'kt-finder') trackLP('lp_finder_complete', {});
  }, true);

  /* アクティブ閲覧時間：30 / 60 / 120秒到達時に1回だけ */
  var activeSeconds = 0, lastActiveTime = Date.now(), sentActive = {};
  function tickRead() {
    var now = Date.now();
    if (!document.hidden && document.hasFocus()) activeSeconds += Math.min(6, (now - lastActiveTime) / 1000);
    lastActiveTime = now;
    [30, 60, 120].forEach(function (seconds) {
      if (activeSeconds >= seconds && !sentActive[seconds]) {
        sentActive[seconds] = true;
        trackLP('lp_active_read', { active_seconds: seconds });
      }
    });
  }
  window.setInterval(tickRead, 5000);
  document.addEventListener('visibilitychange', function () { lastActiveTime = Date.now(); });

  /* ヘッダーの日付：毎日、日本時間の今日の日付を表示する（JSが動かない場合はHTMLに書いた日付のまま） */
  var jst = new Date(Date.now() + 9 * 3600 * 1000);
  document.querySelectorAll('[data-today]').forEach(function (t) {
    t.textContent = jst.getUTCFullYear() + '年' + (jst.getUTCMonth() + 1) + '月' + jst.getUTCDate() + '日';
    t.setAttribute('datetime', jst.toISOString().slice(0, 10));
  });

  /* キャンペーン枠：data-campaign-end（日本時間のその日の終わり）を過ぎたら非表示にする */
  var today = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
  document.querySelectorAll('[data-campaign-end]').forEach(function (el) {
    if (today > el.dataset.campaignEnd) el.hidden = true;
  });

  /* ------------------------------------------------------------
     2. 「もっと見る」（yk-fold）の中にある要素へのリンクは、先に開いてから移動する
     ------------------------------------------------------------ */
  function openFoldFor(id) {
    var el = id && document.getElementById(id);
    var body = el && el.closest('.yk-fold__body');
    if (!body) return;
    var box = body.parentNode.querySelector('input[type="checkbox"]');
    if (box && !box.checked) box.checked = true;
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (a) openFoldFor(decodeURIComponent(a.getAttribute('href').slice(1)));
  });
  if (location.hash) openFoldFor(decodeURIComponent(location.hash.slice(1)));

  /* ------------------------------------------------------------
     3. yk-radar：data-labels（カンマ区切り）と data-scores（同じ数）からレーダーチャートを描く
     data-min（既定0）＝中心の点数、data-max（既定5）＝外周の点数。軸名の下に点数を表示する
     ------------------------------------------------------------ */
  document.querySelectorAll('.yk-radar[data-labels]').forEach(function (el) {
    var L = el.dataset.labels.split(','), S = el.dataset.scores.split(',').map(Number), M = +(el.dataset.max || 5), m = +(el.dataset.min || 0), n = L.length, cx = 160, cy = 155, R = 90;
    function p(i, r) { var a = -Math.PI / 2 + i * 2 * Math.PI / n; return [+(cx + r * Math.cos(a)).toFixed(1), +(cy + r * Math.sin(a)).toFixed(1)]; }
    function rr(v) { return R * Math.max(0, v - m) / (M - m); }
    var s = '<svg viewBox="0 0 320 310" role="img" aria-label="' + (el.dataset.name || '') + 'の編集部評価：' + L.map(function (l, i) { return l + ' ' + S[i] + '点'; }).join('、') + '">';
    for (var k = m + 1; k <= M; k++) s += '<polygon points="' + L.map(function (_, i) { return p(i, rr(k)).join(','); }).join(' ') + '" fill="' + (k === M ? '#f4f7fc' : 'none') + '" stroke="#c9d3e3"/>';
    L.forEach(function (l, i) {
      var a = p(i, R), b = p(i, R + 30);
      s += '<line x1="' + cx + '" y1="' + cy + '" x2="' + a[0] + '" y2="' + a[1] + '" stroke="#c9d3e3"/>';
      s += '<text x="' + b[0] + '" y="' + (b[1] - 6) + '" text-anchor="middle" font-size="12" font-weight="700" fill="#444">' + l + '</text>';
      s += '<text x="' + b[0] + '" y="' + (b[1] + 10) + '" text-anchor="middle" font-size="13" font-weight="900" fill="' + (S[i] >= M ? '#d6282b' : '#2f67b8') + '">' + S[i] + '点</text>';
    });
    s += '<polygon points="' + S.map(function (v, i) { return p(i, rr(v)).join(','); }).join(' ') + '" fill="rgba(255,90,31,.2)" stroke="#ff5a1f" stroke-width="2.5"/>';
    S.forEach(function (v, i) { var q = p(i, rr(v)); s += '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="3.5" fill="#ff5a1f"/>'; });
    el.innerHTML = s + '</svg>';
  });

  /* ------------------------------------------------------------
     4. 診断フォーム
     判定に使うのは各社公式サイトで確認できた条件だけ（2026-10-13確認・出典は調査概要）。
     ------------------------------------------------------------ */
  var form = document.getElementById('kt-finder');
  if (!form) return;
  var out = document.getElementById('kt-finder-result');

  var SVC = {
    uriel: { name: 'ウリエル', logo: 'assets/img/logo/uriel.svg', detail: 'uriel/index.html', aff: '__URIEL_AFF_LINK__', pendingLabel: 'ウリエルの詳細を見る' },
    buysell: { name: 'バイセル', logo: 'assets/img/logo/buysell.svg', detail: 'buysell/index.html', aff: '__BUYSELL_AFF_LINK__', pendingLabel: 'バイセルの詳細を見る' },
    fukuchan: { name: '福ちゃん', logo: 'assets/img/logo/fukuchan.svg', detail: 'fukuchan/index.html', aff: null }
  };

  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (html != null) e.innerHTML = html;
    return e;
  }

  function card(key, role, reasons) {
    var s = SVC[key];
    var c = el('div', { 'class': 'kt-res__card' });
    c.appendChild(el('p', { 'class': 'kt-res__name' }, '<img src="' + s.logo + '" alt="' + s.name + '" width="90" height="24"><span>' + s.name + '</span><span class="kt-res__tag' + (role === '比較候補' ? ' is-sub' : '') + '">' + role + '</span>'));
    var ul = el('ul');
    reasons.forEach(function (r) { ul.appendChild(el('li', null, r)); });
    c.appendChild(ul);
    var pair = el('div', { 'class': 'yk-btnpair' });
    pair.appendChild(el('a', { 'class': 'yk-btn yk-btn--sub', href: s.detail, 'data-place': 'finder-' + key + '-detail' }, '詳細<br>ページへ'));
    var right = el('div');
    if (s.aff) {
      right.appendChild(el('a', { 'class': 'yk-btn yk-btn--sm', href: s.aff, 'data-aff': key, 'data-place': 'finder-' + key, 'data-pending-href': s.detail, 'data-pending-label': s.pendingLabel, rel: 'nofollow sponsored noopener', target: '_blank' }, s.name + 'で無料査定を<br>申し込む（公式）'));
    } else {
      // 福ちゃん：ASP条件未取得のため成果リンクは置かない
      right.appendChild(el('a', { 'class': 'yk-btn yk-btn--sm is-pending', href: s.detail, 'data-place': 'finder-' + key }, '福ちゃんの<br>確認ポイントを見る'));
    }
    pair.appendChild(right);
    c.appendChild(pair);
    return c;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = form.elements;
    var method = f.method.value, kind = f.kind.value, amount = f.amount.value, soon = f.speed.value === 'soon';
    var damaged = f.damaged.checked, compare = f.compare.checked;
    var big = amount === 'many' || amount === 'mid' || kind === 'album';
    var picks = [], notes = [];

    var uriel = ['アルバムや箱に入ったまま、<b>仕分けずに自宅で査定</b>してもらえます。'];
    uriel.push(soon ? '<b>最短翌日</b>に査定（予約状況・訪問先による）、その場で現金払い。24時間受付です。' : '出張料・査定料・キャンセル料は<b>0円</b>。その場で現金払いです。');
    if (big) uriel.push('記念・特殊・中国・戦前切手など<b>19品目</b>を案内。その場での追加もOK。');
    if (damaged) uriel.push('汚れや破損で<b>他店に断られた切手でも買取できる場合あり</b>と公式に記載。');
    var buysell = ['<b>東証上場企業</b>が運営。仕分け不要でそのまま査定。'];
    buysell.push(damaged ? (method === 'takuhai' ? '<b>宅配は買取保証の対象外</b>。状態の悪い切手は出張・店頭がおすすめです。' : 'シミ・汚れ・台紙貼りも、出張・店頭なら<b>買取保証</b>の対象（重大な損傷は除く）。') : '24時間365日受付。査定料・キャンセル料など各種無料。');

    if (method === 'tento') {
      picks.push(['buysell', '優先候補', ['<b>店頭買取</b>に対応。店舗でその場で査定・現金化できます。'].concat(buysell)]);
      picks.push(['uriel', '比較候補', ['店舗買取も案内。<b>運ぶのが大変な量なら、自宅に来てもらう出張</b>が手軽です。', uriel[0]]]);
    } else if (method === 'takuhai') {
      picks.push(['buysell', '優先候補', ['<b>宅配買取</b>に対応（成立すれば銀行振込）。'].concat(buysell)]);
      notes.push('宅配で金額に納得できなかった場合、返送料は着払い（利用者負担）です。');
      picks.push(['uriel', '比較候補', ['箱詰めや発送の手間なく、<b>最短翌日に自宅で</b>見てもらう方法もあります。', uriel[1]]]);
    } else {
      picks.push(['uriel', '優先候補', uriel]);
      picks.push(['buysell', '比較候補', buysell]);
    }
    if (kind === 'china' || kind === 'kinen') picks.push(['fukuchan', '比較候補', ['記念切手・中国切手などの<b>買取実例</b>を写真・日付つきで公開しています。']]);
    if (compare) notes.push('2社に申し込んで見積りを比べるのがおすすめです。どちらも査定後のキャンセル料はかかりません。');

    out.innerHTML = '';
    var box = el('div', { 'class': 'kt-res', tabindex: '-1' });
    box.appendChild(el('p', { 'class': 'kt-res__ttl' }, '診断結果：あなたにおすすめの切手買取'));
    picks.forEach(function (p) { box.appendChild(card(p[0], p[1], p[2])); });
    notes.forEach(function (n) { box.appendChild(el('p', { 'class': 'kt-res__note' }, '※' + n)); });
    box.appendChild(el('p', { 'class': 'kt-res__note' }, '※各社公式サイトの掲載内容（2026年10月13日確認）をもとにした候補で、査定額を保証するものではありません。入力内容はどこにも送信されません。'));
    out.appendChild(box);
    settleAffLinks(out);
    box.focus({ preventScroll: true });
    box.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  });
})();
