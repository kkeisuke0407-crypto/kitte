/* 元買取業者インタビュー版LP（interview.html）を比較TOPから作る：node tools/build-interview.cjs
   台本：案件_切手買取/15_監修版LP_台本_20261106.md（2026-11-06 ユーザー指示でインタビュー記事に変更）
   比較TOP（index.html）は変えない。build-top の直後・wrap-ja の前に動かす。interview.html を手で直さない。
   見つからない箇所があれば止める（index.html の構造が変わったときに、黙って崩れないように）。 */
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'kitte-kaitori');
let html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');

// 文字のあいだに <wbr>・U+2060 が入っていても一致させる
const loose = s => [...s].map(c => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('(?:<wbr>|\\u2060)*');
const swap = (re, to, label) => {
  if (!re.test(html)) throw new Error(`interview: ${label} が見つからない`);
  html = html.replace(re, to);
};
const URIEL = 'https://t.felmat.net/fmcl?ak=D107130.1.E149890F.L1419226';
const BUYSELL = 'https://buysell-kaitori.com/stamp/';
const btnUriel = place => `<a class="yk-btn" href="${URIEL}" data-aff="uriel" data-place="${place}" data-pending-href="uriel/index.html" data-pending-label="ウリエルの詳細を見る" rel="nofollow sponsored noopener" target="_blank">無料査定してみる</a>`;
// 本文の「ウリエル」「バイセル」のテキストリンク（{U}・{B} を置き換える）
let nU = 0, nB = 0;
const linkU = () => `<a href="${URIEL}" data-aff="uriel" data-place="text-uriel-${++nU}" data-pending-href="uriel/index.html" data-pending-label="ウリエル" rel="nofollow sponsored noopener" target="_blank">ウリエル</a>`;
const linkB = () => `<a href="${BUYSELL}" data-aff="buysell" data-place="text-buysell-${++nB}" data-pending-href="buysell/index.html" data-pending-label="バイセル" rel="nofollow noopener" target="_blank">バイセル</a>`;

/* ---------- 1. ヒーロー：インタビュー版の画像に差し替え（ユーザー支給 2026-11-06） ---------- */
swap(/(<header class="yk-hero kt-hero--banner">\s*<h1 class="kt-sr">)[\s\S]*?(<\/h1>)/, '$1元買取業者に聞いた。切手買取店の選び方と高く売るコツ$2', 'H1');
swap(/<title>[\s\S]*?<\/title>/, '<title>元買取業者に聞いた｜切手買取店の選び方と高く売るコツ</title>', 'title');
swap(/<img class="kt-hero__banner" src="[^"]+" alt="[^"]*" width="\d+" height="\d+"/, '<img class="kt-hero__banner" src="assets/img/photo/hero-interview-20261106.webp" alt="元買取業者に聞いた。買取店の選び方と高く売るコツ" width="1672" height="941"', 'ヒーロー画像');

/* ---------- 2. ロゴの横流しを外し、ヒーロー直下を導入会話にする（編集部と相談者） ---------- */
const talkRow = (who, text) => {
  const person = who === 'c'
    ? '<span class="mt-talk__icon"><img src="assets/img/illust/consultant-photo.webp" alt="" width="56" height="56"></span><span class="mt-talk__name">相談者</span>'
    : '<span class="mt-talk__icon"><img src="assets/img/illust/editor-photo.webp" alt="" width="56" height="56"></span><span class="mt-talk__name">編集部</span>';
  return `  <div class="mt-talk__row${who === 'c' ? ' mt-talk__row--r' : ''}"><div class="mt-talk__who">${person}</div><div class="mt-talk__b">${text}</div></div>`;
};
const talk = [
  '<!-- ===== 導入会話（体験談パーツ text-8 mt-talk）：インタビュー版 ===== -->',
  '<div class="mt-talk kt-talk--six">',
  talkRow('c', '切手を売りたいのですが、どこに頼めばいいのか分からなくて…'),
  talkRow('e', '買取店はたくさんありますし、根拠がよく分からない情報も多いですよね。'),
  talkRow('c', 'そうなんです。何を信じていいのか…'),
  talkRow('e', 'そこで、買取業界に8年いた元買取業者の方に、今おすすめの業者と、<span class="yk-mark">1円でも高く売るコツ</span>を聞いてきました。'),
  talkRow('c', 'ぜひ教えてください！'),
  talkRow('e', '順番にご紹介しますね。まずはおすすめのBEST3からです。'),
  '</div>',
  '',
].join('\n');
swap(/<!-- ===== fv-2 ロゴの横流し[\s\S]*?<!--@regional-intro-->/, talk, 'ロゴ〜導入会話');

/* ---------- 魔法の言葉の会話（導入会話と同じ mt-talk。査定士とあなた） ---------- */
const sayRow = (who, text) => {
  const person = who === 'you'
    ? '<span class="mt-talk__icon"><img src="assets/img/illust/consultant-photo.webp" alt="" width="56" height="56"></span><span class="mt-talk__name">あなた</span>'
    : '<span class="mt-talk__icon"><img src="assets/img/illust/appraiser-photo.webp" alt="" width="56" height="56"></span><span class="mt-talk__name">査定士</span>';
  return `  <div class="mt-talk__row${who === 'you' ? ' mt-talk__row--r' : ''}"><div class="mt-talk__who">${person}</div><div class="mt-talk__b">${text}</div></div>`;
};
const magic = [
  '<div class="mt-talk">',
  sayRow('s', '今日決めていただけるなら、ここまでお出しします。いかがでしょうか？'),
  sayRow('you', 'ありがとうございます。ただ、家族（親、子供、旦那など）と最終的に決めることになっているので、今日は決められないんです。'),
  sayRow('you', '今週末までに相談して、ご連絡します。'),
  sayRow('s', '分かりました。ご連絡をお待ちしています。'),
  '</div>',
].join('\n');

/* ---------- 6〜8. 額面・出張・3つのポイントを消し、お話を聞いた方・1位の理由・コツを入れる ---------- */
const body = `<!-- ===== お話を聞いた方（体験談パーツ frame-5 mt-author）：肩書きのみ ===== -->
<div class="mt-author" id="interviewee"><span class="mt-author__icon"><img src="assets/img/illust/interviewee-hattori.webp" alt="" width="64" height="64"></span><div>
  <p class="mt-author__name">元大手買取専門店スタッフ<br>服部さん（仮名）35歳<small>今回お話を聞いた方</small></p>
  <p class="mt-author__txt">大手買取専門店に約8年勤務。ブランド品・貴金属・時計・切手・古銭・骨董品など、幅広い品目の査定と買取を担当。</p>
  <p class="mt-author__txt">店頭査定から出張買取、査定額の説明、買取価格の交渉まで、買取の仕事を一通り経験。</p>
  <p class="mt-author__txt">なお、このページで紹介している会社に勤務していたことはありません。</p>
  <p class="mt-author__txt">今回は現場の経験をもとに、買取価格が決まる仕組み、査定額に差が出る理由、後悔しない店の選び方を聞きました。</p>
</div></div>

<!-- ===== ウリエルが1位の理由（台本7節） ===== -->
<h2 class="kt-h2 kt-1l" id="reason" style="--n:20">元買取業者に聞いた、ウリエルが1位の理由</h2>
<p class="kt-lead">ここからは、お話をそのままご紹介します。</p>
<p class="kt-lead">正直に言うと、切手の査定は、買取店にとって<span class="yk-mark">かなり手間のかかる仕事</span>です。</p>
<p class="kt-lead">アルバム数冊や大量のバラ切手を、発行年代・額面・状態・希少性に分けて確認するからです。査定士によって、切手が得意な人とそうでない人もいます。</p>
<p class="kt-lead">手間がかかる分、店を間違えると査定が雑になることがあります。</p>

<h3 class="mt-h4" id="reason-1">理由1：切手をきちんと見て、<em>金額の理由</em>まで説明してくれる</h3>
<figure class="mt-img"><img src="assets/img/photo/stamp-loupe-check.webp" alt="ルーペで切手の細部と状態を確認しているイメージ" width="960" height="540" loading="lazy"></figure>
<p class="kt-lead">良い店かどうかは、表の図柄以外も見てくれるかで分かります。</p>
<div class="mt-check"><p class="mt-check__ttl">査定士が見るところ</p><ul><li>裏糊</li><li>日焼け</li><li>シミ・カビ</li><li>目打ちの欠け</li></ul></div>
<p class="kt-lead">もうひとつは、金額の理由を説明してくれるかです。</p>
<p class="kt-lead">{U}は「状態や査定額の根拠を丁寧に説明」すると公式で案内していて、見積明細にも内訳を記載するとしています。<span class="yk-mark">ここまでやる店は、なかなかありません。</span></p>

<h3 class="mt-h4" id="reason-2">理由2：切手を<em>欲しがる買い手</em>を持っている</h3>
<p class="kt-lead">査定額は、店の在庫や、売れる見込みでも変わります。欲しがる買い手を持っている店と持っていない店では、同じ切手でも金額が変わります。</p>
<p class="kt-lead">{U}は「国内外の切手コレクターが集まる独自の流通網」があると公式で案内しています。</p>

<h3 class="mt-h4" id="reason-3">理由3：<em>無店舗経営</em>で、コストを買取価格に回している</h3>
<p class="kt-lead">{U}は出張買取に特化した、無店舗経営の買取専門店です。コストを抑える仕組みは3つあります。</p>
<div class="mt-check"><ul><li>無店舗経営で、固定費を大きく抑える</li><li>出張エリアを絞って、移動のコストを抑える</li><li>独自の販売ルートで、買い取った品物を流通させる</li></ul></div>
<p class="kt-lead">店舗が多い大手、特にフランチャイズ（直営ではない）のところは、店によって価格に大きく差が出る可能性があります。</p>
<p class="kt-lead">要するに、他店でかかる経営コストを大きく下げて、その分を買取価格に回せる仕組みがあるということです。</p>

<div class="mt-conclusion"><p class="mt-conclusion__ttl">【結論】今月ならウリエル</p>
  <p>{U}は<span data-current-ym>2026年11月</span>現時点では、切手を買取強化ジャンルに挙げていて、買取金額7倍キャンペーンも今月末まで実施しています。そのため、切手に力を入れている今は、高額買取も期待できます。</p>
  <p>だから「今月」査定を頼むなら、<span class="yk-mark">ウリエルが一番だと私は思っています。</span>来月以降はどうなるかわかりません。今なら、{U}です。</p>
</div>
<p class="yk-catch">金額を聞いてから決められる</p>${btnUriel('reason-uriel')}

<!-- ===== 高く売るコツ：相見積もり（台本8節） ===== -->
<h2 class="kt-h2 kt-1l" id="tips" style="--n:23">元買取業者に聞いた、切手を1円でも高く売るコツ</h2>
<div class="mt-conclusion"><p class="mt-conclusion__ttl">【結論】相見積もりは必ず取りましょう</p>
  <p>業者側としてはあまり教えたくない話ですが、この手順なら、<span class="yk-mark">安く買いたたかれる心配はぐっと減ります。</span></p>
</div>

<h3 class="mt-h4" id="tips-visit">まずは<em>出張買取</em>で頼む（理由は2つ）</h3>
<p class="kt-lead"><b>1. 切手を持ち歩かず、家で待つだけで比べられる</b><br>店頭で相見積もりを取るには、重いアルバムや箱を持って何軒も回ることになります。持ち込まなかった切手は見てもらえません。</p>
<p class="kt-lead">出張なら、家で待っているだけで各社の金額を比べられます。査定の途中で見つけた切手も、「これもお願いします」とその場で出せます。</p>
<p class="kt-lead">{U}は、出張料も査定料もかからず、金額に納得できなければキャンセル料なしで断れると公式で案内しています。</p>
<p class="kt-lead"><b>2. 業者にも「手ぶらで帰りたくない」事情がある</b><br>訪問には時間がかかるので、手ぶらで帰りたくないのが本音です。私がいた店では、出張の粗利が大事な営業目標でした。少しでも買って帰りたいので、店頭より必死になります。必死になるため、店頭では出さないような価格が出る可能性があります。出張だとこのような事情があります。</p>

<h3 class="mt-h4" id="tips-steps"><em>4つの手順</em>で進める</h3>
<ol class="mt-timeline">
  <li><span class="mt-timeline__when">STEP1</span><span class="mt-timeline__what"><b>出張査定を予約する（電話・Web）</b><br>条件が良ければ売るつもりで申し込みます。即決しない雰囲気は出さないでください。「決める気はない」なども言いません。即決しないと分かると、査定士のやる気がなくなることがあります。</span></li>
  <li><span class="mt-timeline__when">STEP2</span><span class="mt-timeline__what"><b>査定してもらう</b><br>まずは普通に査定してもらいます。金額が出ると、売ってもらうためにいろいろ話してくれます。営業なので、聞いてあげてください。金額に納得できて、いい人だと思ったら、その場で売ってもかまいません。</span></li>
</ol>
<p class="kt-lead">ここで魔法の言葉です。<span class="yk-mark">「自分に決定権がないことを伝える」</span></p>
${magic}
<p class="kt-lead">大事なのは、期限を決めてあげることです。金額は見積書でもらいましょう。</p>
<p class="kt-lead">これで業者は、いったんあきらめるしかありません。「今日だけです」と言われることもありますが、たいていは後日もその金額で対応してくれます。</p>
<ol class="mt-timeline">
  <li><span class="mt-timeline__when">STEP3</span><span class="mt-timeline__what"><b>2社目にも査定してもらう</b><br>同じ流れで、1社目に伝えた期限までに済ませます。2社目は{B}がおすすめです。東証上場企業が運営していて、シミ・汚れ・台紙貼りの切手も買取保証の対象です（出張・店頭、重大な損傷は除く）。</span></li>
  <li class="is-goal"><span class="mt-timeline__when">STEP4</span><span class="mt-timeline__what"><b>高かった方に連絡する</b><br>「他の業者ではこの金額だったのですが、どうでしょうか？」と聞くだけです。難しいと言われたら、そのまま高い方へ。もっと出してくれるなら、そこに売ります。</span></li>
</ol>
<p class="kt-lead">私の経験では、この流れで最初の金額より高く売れることが多いです。</p>
<div class="mt-caution"><p class="mt-caution__ttl">強く交渉しすぎに注意</p><p>上の流れくらいがちょうどいいです。求めすぎると、どちらにも買ってもらえずに終わることもあります。</p></div>
<p class="yk-catch">まず1社目はウリエルから</p>${btnUriel('tips-uriel')}

`.replace(/\{U\}/g, linkU).replace(/\{B\}/g, linkB);
swap(/<!-- ===== 理由説明：額面だけで判断しない[\s\S]*?(<!-- ===== compare-1 タブ切替)/, () => body + '<!-- ===== compare-1 タブ切替', '額面〜3つのポイント');

/* ---------- 買取実績と声を、コツの下・比較表の上へ移す（2026-11-07 ユーザー指示）。声の見出しから「家族の」を外す ---------- */
const recordsMatch = html.match(/<!-- ===== top-2 買取実績カード[\s\S]*?<!--@records:end-->\s*/);
if (!recordsMatch) throw new Error('interview: 買取実績のブロックが見つからない');
html = html.replace(recordsMatch[0], '');
const recordsBlock = recordsMatch[0].replace(new RegExp(loose('家族の切手を売った方の声')), '切手を売った方の声');
if (recordsBlock === recordsMatch[0]) throw new Error('interview: 声の見出しが見つからない');
swap(/<!-- ===== compare-1 タブ切替/, () => recordsBlock + '<!-- ===== compare-1 タブ切替', '比較表の前');

/* ---------- 9. 比較表・ランキングのウリエルを、1位の理由にそろえる（他社の行は変えない） ---------- */
swap(new RegExp(loose('3つのポイントを6項目に分けて採点しました')), '6項目で採点しました', '比較表の見出し');
swap(new RegExp(loose('汚れ・破れ・大量のバラ・切手アルバムもそのまま')), '査定額の根拠まで説明。無店舗経営と独自の販路で買取価格に還元', '比較表の得意なこと');
swap(/(<!-- ===== 比較表の下：こんな方は[\s\S]*?<ul>)[\s\S]*?(<\/ul>)/, `$1
  <li><span>昔集めた切手や、親が集めた切手の<b>価値をきちんと見てほしい</b></span></li>
  <li><span><b>査定額の理由まで</b>説明してほしい</span></li>
  <li><span>切手アルバムや大量のバラ切手を、<b>仕分けずそのまま</b>自宅で見てほしい</span></li>
  <li><span><b>知らない人を家に上げるのは不安</b>（玄関先での査定もできます）</span></li>
$2`, 'こんな方は');

const a = html.indexOf('id="rank-uriel"'), b = html.indexOf('id="rank-buysell"');
if (a < 0 || b < a) throw new Error('interview: ランキングのウリエルが見つからない');
let rank = html.slice(a, b);
const swapRank = (re, to, label) => {
  if (!re.test(rank)) throw new Error(`interview: ランキング ${label} が見つからない`);
  rank = rank.replace(re, to);
};
swapRank(/(<p class="yk-rankcatch">)[\s\S]*?(<\/p>)/, '$1査定額の根拠まで説明！<br>無店舗経営と独自の販路で、コストを買取価格に還元$2', '赤キャッチ');
const feats = ['<span class="yk-mark">査定額の根拠まで</span>丁寧に説明', '国内外のコレクターが集まる<span class="yk-mark">独自の流通網</span>', '<span class="yk-red">無店舗経営</span>でコストを買取価格に還元', '切手は<span class="yk-red">買取強化ジャンル</span>', '最短翌日に自宅で査定、その場で現金払い', '出張料・査定料・キャンセル料<span class="yk-red">0円</span>'];
swapRank(/(<p class="yk-features__ttl">特徴<\/p><ul>)[\s\S]*?(<\/ul>)/, `$1\n${feats.map(f => `          <li><span>${f}</span></li>`).join('\n')}\n        $2`, '特徴');
rank = rank.replace(/<p class="[^"]*">(?:(?!<\/p>)[\s\S])*※1(?:<wbr>|⁠)*\s*自社調べ[\s\S]*?<\/p>/, ''); // 満足度を特徴から外すので、その注記も外す
swapRank(/(<div class="yk-editor__body"><p>)[\s\S]*?(<\/p><\/div>)/, '$1元買取業者の話のとおり、切手の査定は手間がかかるので、店選びで差が出ます。ウリエルは<span class="yk-mark">査定額の根拠まで説明</span>してくれて、独自の流通網で欲しがる買い手も持っています。無店舗経営で抑えたコストを買取価格に回しているので、切手を買取強化している今は、<span class="yk-red">最初に相談してほしい1社</span>です。$2', 'イチオシ欄の本文');
swapRank(new RegExp(loose('出張・店舗')), '出張買取が中心（店頭は予約制）', '買取方法');
html = html.slice(0, a) + rank + html.slice(b);

/* ---------- 10. 注釈を最低限にする（2026-11-06 ユーザー指示「写真はイメージですは消して。注釈最低限にしてよ」） ---------- */
const plain = s => s.replace(/<[^>]+>/g, '').replace(/⁠/g, '').trim();
const noteHits = {};
const VOICE_NOTE = '※公式サイト掲載の声を、一部省略して掲載しています。個人の感想です。';
const RECORD_NOTE = '※過去の買取例です。査定額は状態や時期により変わります。';
const rewrite = (cls, rule) => {
  html = html.replace(new RegExp(`\\s*<p class="${cls}"[^>]*>([\\s\\S]*?)</p>`, 'g'), (whole, inner) => {
    const lead = whole.match(/^\s*/)[0];
    const r = rule(plain(inner));
    if (r === undefined) return whole;
    noteHits[r.label] = (noteHits[r.label] || 0) + 1;
    return r.to ? `${lead}<p class="${cls}">${r.to}</p>` : '';
  });
};
rewrite('yk-small yk-radar__note', () => ({ label: 'レーダー注記' }));
rewrite('kt-src', t => {
  if (t.startsWith('出典')) return { label: '出典' };
  if (t.startsWith('写真・実績')) return { label: '実績注記', to: RECORD_NOTE };
  if (t.startsWith('※写真はイメージ')) return { label: '流れの写真注記' };
});
rewrite('yk-small', t => {
  if (t.startsWith('※各社の公式サイトに掲載')) return { label: '声の注記', to: VOICE_NOTE };
  if (t.startsWith('※横軸')) return { label: '分布図の注記' };
  if (t.startsWith('※2社とも')) return { label: 'キャンセル注記' };
});
const noteWant = { 'レーダー注記': 6, '出典': 6, '実績注記': 4, '流れの写真注記': 1, '声の注記': 4, '分布図の注記': 1, 'キャンセル注記': 1 };
for (const [k, n] of Object.entries(noteWant)) if (noteHits[k] !== n) throw new Error(`interview: 注釈 ${k} が ${noteHits[k] || 0} 件（想定 ${n} 件）`);
if (/写真は(?:<wbr>|⁠)*イメージ/.test(html)) throw new Error('interview: 「写真はイメージ」が残っている');

/* ---------- KW別ページ（2026-11-12 ユーザー指示「キーワード、広告文、LPの冒頭に橋を架けたい」「ヒーロー画像にキーワードをうまく追加してほしい」） ----------
   interview.html を丸ごと複製し、ヒーロー画像（2段目をKW入りに差し替えた画像）・H1・alt・導入会話の最初の2行だけを差し替える。
   CP② 切手買取の広告グループ別。案：案件_切手買取/24_KW橋渡し案_20261112.md。画像：25_ヒーロー画像_KW別/make_hero.py
   ファイル名は英小文字だけにする（kitte.js の lp_id・wrap-ja・stamp-assets がファイル名 [a-z]+.html で拾うため）。 */
const HERO_RE = /<img class="kt-hero__banner" src="assets\/img\/photo\/hero-interview-20261106\.webp" alt="[^"]*" width="1672" height="941"/;
const H1_RE = /(<header class="yk-hero kt-hero--banner">\s*<h1 class="kt-sr">)[\s\S]*?(<\/h1>)/;
const TALK_C = talkRow('c', '切手を売りたいのですが、どこに頼めばいいのか分からなくて…');
const TALK_E = talkRow('e', '買取店はたくさんありますし、根拠がよく分からない情報も多いですよね。');
const KW_PAGES = [
  { file: 'ivfurui.html', kw: '古い切手', img: 'hero-iv-furui.webp', c: '家にある古い切手を売りたいのですが、どこに頼めばいいのか分からなくて…', e: '古い切手は、発行年代や状態で金額が大きく変わりますよね。根拠がよく分からない情報も多いですし。' },
  { file: 'ivmukashi.html', kw: '昔の切手', img: 'hero-iv-mukashi.webp', c: '昔の切手を売りたいのですが、どこに頼めばいいのか分からなくて…', e: '昔の切手は、発行年代や状態で金額が大きく変わりますよね。根拠がよく分からない情報も多いですし。' },
  { file: 'ivkinen.html', kw: '記念切手', img: 'hero-iv-kinen.webp', c: '記念切手を売りたいのですが、どこに頼めばいいのか分からなくて…', e: '記念切手は種類が多くて、店によって査定が違いますよね。根拠がよく分からない情報も多いですし。' },
  { file: 'ivsheet.html', kw: '切手シート', img: 'hero-iv-sheet.webp', c: '切手シートを売りたいのですが、どこに頼めばいいのか分からなくて…', e: '切手シートは、シートのままかバラかでも金額が変わりますよね。根拠がよく分からない情報も多いですし。' },
  { file: 'ivshushu.html', kw: '集めた切手', img: 'hero-iv-shushu.webp', c: '昔集めた切手をまとめて売りたいのですが、どこに頼めばいいのか分からなくて…', e: '量が多いと、持ち込むのも大変ですよね。根拠がよく分からない情報も多いですし。' },
];
const pages = [{ file: 'interview.html', html }];
for (const v of KW_PAGES) {
  let h = html;
  const must = (re, to, label) => { const n = (h.match(new RegExp(re.source, 'g')) || []).length; if (n !== 1) throw new Error(`${v.file}: ${label} が ${n} 件`); h = h.replace(re, to); };
  const title = `元買取業者に聞いた。${v.kw}の売り先と高く売るコツ`;
  must(HERO_RE, `<img class="kt-hero__banner" src="assets/img/photo/${v.img}" alt="${title}" width="1672" height="941"`, 'ヒーロー画像');
  must(H1_RE, `$1${title}$2`, 'H1');
  if (h.split(TALK_C).length !== 2 || h.split(TALK_E).length !== 2) throw new Error(`${v.file}: 導入会話の最初の2行が見つからない`);
  h = h.replace(TALK_C, talkRow('c', v.c)).replace(TALK_E, talkRow('e', v.e));
  pages.push({ file: v.file, html: h });
}

/* ---------- スマホの折り返し（2026-11-10 ユーザー指示「会話とかちゃんと適切なところで折り返す」「変なところで折り返さない」） ----------
   ・本文も文節（wrap-ja.cjs が入れる <wbr>）でだけ折り返す（CSS の .kt-phrase）
   ・会話の吹き出しは、文の終わり（。！？）で改行する */
for (const pg of pages) {
let html = pg.html;
const bodyTags = html.match(/<body>/g) || [];
if (bodyTags.length !== 1) throw new Error('interview: <body> が1つではない');
html = html.replace('<body>', '<body class="kt-phrase">');
let talkBreaks = 0;
html = html.replace(/(<div class="mt-talk__b">)([\s\S]*?)(<\/div>)/g, (all, open, inner, close) => {
  let out = inner.replace(/([。！？])(?=[^\s<」』）])/g, (m, p) => { talkBreaks++; return p + '<br>'; });
  // 文の途中でも、理由・前置きの区切り（〜ので、〜けど、〜から、）のあとで改行する
  out = out.replace(/(ので|けど|けれど|から)、(?=[^\s<」』）])/g, '$1、<br>');
  return open + out + close;
});
if (!talkBreaks) throw new Error('interview: 会話の改行を入れる文が見つからない');
html = html.replace('<!DOCTYPE html>', '<!DOCTYPE html>\n<!-- 生成物：tools/build-interview.cjs（index.html から作るインタビュー版。直接編集しない） -->');
fs.writeFileSync(path.join(dir, pg.file), html);
console.log('variant: ' + pg.file);
}
