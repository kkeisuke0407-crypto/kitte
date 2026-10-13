/* ============================================================
   切手買取 比較LP 共通スクリプト（ページ末尾で1回だけ読み込む）
   1. ASPリンク未設定ボタンの内部導線切替
   2. レーダーチャート描画（パーツ集 rank-7 の描画スクリプトを踏襲）
   3. 診断フォーム（close-2）…ブラウザー内だけで判定し、外部送信しない
   ============================================================ */
(function () {
  'use strict';

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
      var catchEl = a.previousElementSibling;
      if (catchEl && catchEl.classList.contains('yk-catch') && catchEl.dataset.pendingCatch) catchEl.textContent = catchEl.dataset.pendingCatch;
    });
  }
  settleAffLinks(document);

  /* ------------------------------------------------------------
     2. yk-radar：data-labels（カンマ区切り）と data-scores（同じ数）からレーダーチャートを描く
     今回の点数は「公式サイト上で確認できたか（5）／今回未確認（0）」だけ。満足度や査定額の評価ではない
     ------------------------------------------------------------ */
  document.querySelectorAll('.yk-radar[data-labels]').forEach(function (el) {
    var L = el.dataset.labels.split(','), S = el.dataset.scores.split(',').map(Number), M = +(el.dataset.max || 5), n = L.length, cx = 160, cy = 150, R = 100;
    function p(i, r) { var a = -Math.PI / 2 + i * 2 * Math.PI / n; return [(cx + r * Math.cos(a)).toFixed(1), (cy + r * Math.sin(a)).toFixed(1)]; }
    var s = '<svg viewBox="0 0 320 300" role="img" aria-label="' + (el.dataset.name || '') + 'の公式情報の確認状況：' + L.map(function (l, i) { return l + ' ' + (S[i] >= M ? '確認' : '今回未確認'); }).join('、') + '">';
    for (var k = 1; k <= M; k++) s += '<polygon points="' + L.map(function (_, i) { return p(i, R * k / M).join(','); }).join(' ') + '" fill="none" stroke="#c9d3e3"/>';
    L.forEach(function (l, i) { var a = p(i, R), b = p(i, R + 24); s += '<line x1="' + cx + '" y1="' + cy + '" x2="' + a[0] + '" y2="' + a[1] + '" stroke="#c9d3e3"/><text x="' + b[0] + '" y="' + b[1] + '" text-anchor="middle" dominant-baseline="middle" font-size="12" font-weight="700" fill="' + (S[i] >= M ? '#444' : '#9aa4b1') + '">' + l + '</text>'; });
    s += '<polygon points="' + S.map(function (v, i) { return p(i, R * v / M).join(','); }).join(' ') + '" fill="rgba(47,103,184,.18)" stroke="#2f67b8" stroke-width="2.5"/></svg>';
    el.innerHTML = s;
  });

  /* ------------------------------------------------------------
     3. 診断フォーム
     判定に使うのは各社公式サイトで確認できた条件だけ（2026-10-13確認・出典は調査概要）。
     ------------------------------------------------------------ */
  var form = document.getElementById('kt-finder');
  if (!form) return;
  var out = document.getElementById('kt-finder-result');

  // ウリエル公式「切手買取」ページ掲載の出張対象（17都府県）。対象内でも市区町村により対象外の地域あり
  var URIEL_AREA = ['茨城県', '栃木県', '埼玉県', '千葉県', '東京都', '神奈川県', '岐阜県', '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県', '岡山県'];
  var REMOTE_ISLAND_NOTE = '離島は出張対象外です（バイセル公式）。';

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
    pair.appendChild(el('a', { 'class': 'yk-btn yk-btn--sub', href: s.detail }, '詳細<br>ページへ'));
    var right = el('div');
    if (s.aff) {
      right.appendChild(el('a', { 'class': 'yk-btn yk-btn--sm', href: s.aff, 'data-aff': key, 'data-pending-href': s.detail, 'data-pending-label': s.pendingLabel, rel: 'nofollow sponsored noopener', target: '_blank' }, s.name + 'の公式サイトで<br>無料査定を申し込む'));
    } else {
      // 福ちゃん：ASP条件未取得のため成果リンクは置かない（公式サイトへの通常リンクも出さず、詳細ページで出典を案内）
      right.appendChild(el('a', { 'class': 'yk-btn yk-btn--sm is-pending', href: s.detail }, '福ちゃんの<br>確認ポイントを見る'));
    }
    pair.appendChild(right);
    c.appendChild(pair);
    return c;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var pref = form.elements.pref.value, method = form.elements.method.value, kind = form.elements.kind.value, amount = form.elements.amount.value;
    var damaged = form.elements.damaged.checked;
    var inUriel = URIEL_AREA.indexOf(pref) !== -1;
    var picks = []; // [key, role, reasons[]]
    var notes = [];

    if (method === 'takuhai') {
      picks.push(['buysell', '優先候補', ['宅配買取を公式サイトで案内しています。', damaged ? '<span class="yk-red">状態の悪い切手の「買取保証」は出張・店頭限定で、宅配は対象外</span>です。' : '中国切手以外の海外切手は買取対象外です。']]);
      picks.push(['fukuchan', '比較候補', ['宅配買取を公式サイトで案内しています（宅配キットあり）。', '査定額に納得できない場合は断れ、キャンセル料・査定料はかからないと案内しています。']]);
      notes.push('ウリエルは今回、切手の宅配買取の公式案内を確認できなかったため候補から外しています。');
    } else if (method === 'tento') {
      picks.push(['buysell', '比較候補', ['店頭買取を公式サイトで案内しています。最寄り店舗は公式の店舗一覧で確認してください。']]);
      picks.push(['fukuchan', '比較候補', ['店舗買取を公式サイトで案内しています。一部店舗は来店予約が必要です。']]);
      picks.push(['uriel', '比較候補', ['店舗買取・催事買取を公式サイトで案内しています。開催場所・店舗は公式で確認してください。']]);
      notes.push('店頭・店舗の場所や予約の要否は各社公式サイトで確認してください。');
    } else {
      // 出張 or 未定
      if (pref && inUriel) {
        picks.push(['uriel', '優先候補', ['お住まいの' + pref + 'は、ウリエル公式の出張対象エリアに掲載されています（市区町村によって対象外の地域あり）。', '出張料・査定料は無料、納得できなければ断ることができます。']]);
        picks.push(['buysell', '比較候補', ['離島を除く全国で出張買取を案内。2社で見積りと条件を比べられます。']]);
      } else {
        picks.push(['buysell', '優先候補', [(pref ? pref + 'は' : '') + 'バイセルの出張対象（離島を除く全国）です。' + (pref ? '' : '都道府県を選ぶとウリエルの対象かも判定します。'), REMOTE_ISLAND_NOTE]]);
        picks.push(['fukuchan', '比較候補', ['出張・宅配・店舗の3つの方法を案内。出張の対応地域は申込時に公式で確認してください。']]);
        if (pref) notes.push(pref + 'はウリエル公式の出張対象エリア（17都府県）に掲載されていません。');
      }
      if (method === 'mitei') notes.push('方法が決まっていない場合は、自宅で見てもらえる出張から検討し、来てもらうのが不安なら宅配・店頭も比べましょう。');
    }

    // 切手の種類・量による補足（価格の約束はしない）
    if (kind === 'china' || kind === 'kinen') {
      if (!picks.some(function (p) { return p[0] === 'fukuchan'; })) picks.push(['fukuchan', '比較候補', []]);
      picks.forEach(function (p) { if (p[0] === 'fukuchan') p[2].push('記念切手・中国切手などの過去の買取実例を公式サイトで公開しています。'); });
    }
    if (kind === 'album' || amount === 'many') {
      picks.forEach(function (p) {
        if (p[0] === 'uriel') p[2].push('バラ・台紙貼り（アルバム）・価値の分からない切手も相談対象と公式に記載。アルバムのまま相談できます。');
        if (p[0] === 'buysell') p[2].push('整理されていない切手・台紙貼り・バラもそのまま査定できると公式FAQに記載。');
      });
    }
    if (damaged && method !== 'takuhai') notes.push('汚れ・破れがある切手：バイセルは出張・店頭なら「買取保証」の対象と案内（重大な損傷・偽造品などは対象外）。福ちゃんは状態により買取できない場合ありと案内。');

    out.innerHTML = '';
    var box = el('div', { 'class': 'kt-res', tabindex: '-1' });
    box.appendChild(el('p', { 'class': 'kt-res__ttl' }, '診断結果：まず確認したい切手買取'));
    picks.forEach(function (p) { box.appendChild(card(p[0], p[1], p[2])); });
    notes.forEach(function (n) { box.appendChild(el('p', { 'class': 'kt-res__note' }, '※' + n)); });
    box.appendChild(el('p', { 'class': 'kt-res__note' }, '※この診断は各社公式サイトの掲載内容（2026年10月13日確認）だけで候補を出しています。査定額・買取の可否・申込の受付を保証するものではありません。入力内容はどこにも送信されません。'));
    out.appendChild(box);
    settleAffLinks(out);
    box.focus({ preventScroll: true });
    box.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  });
})();
