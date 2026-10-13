/* 日本語の改行位置を文節単位にそろえる：node tools/wrap-ja.cjs
   BudouX（Google の文節分割）で本文の文節の切れ目に <wbr> を入れ、CSS の word-break: keep-all と組み合わせて
   「言葉の途中で改行しない」表示にする。Safari・Chrome どちらでも同じ動きになる（auto-phrase は Safari 非対応のため）。
   ・build-top.cjs で生成し直したあとに必ず実行する（何度実行しても結果は同じ）
   ・<script> <style> <title> <textarea> <select> の中、属性、HTMLコメント、& を含む文字列は変更しない */
const fs = require('fs');
const path = require('path');
const { loadDefaultJapaneseParser } = require('budoux');
const parser = loadDefaultJapaneseParser();
const root = path.join(__dirname, '..', 'kitte-kaitori');
const files = ['index.html', 'uriel/index.html', 'buysell/index.html', 'fukuchan/index.html', 'methodology/index.html', 'about/index.html', 'privacy/index.html'];
const SKIP = /^<(script|style|title|textarea|select|option)\b/i;
const JA = /[぀-ヿ㐀-鿿！-｠]/;

// 地名は都道府県のあとでも区切る（例：東京都｜世田谷区）
const splitPlace = ph => ph.replace(/(北海道|東京都|京都府|大阪府|[^\s・、]{2,3}県)(?=[^\s・、]{1,5}?[市区町村郡])/g, '$1\u0000').split('\u0000').filter(Boolean);
// 長い文節は、かっこの前・「・」のあと・数字の前でも区切れるようにする（狭い表のセルで言葉の途中で折れないように）
const splitLong = ph => {
  let s = ph.replace(/(.)（/g, '$1\u0000（');
  if (ph.length >= 6) s = s.replace(/・(?=.)/g, '・\u0000');
  if (ph.length >= 7) s = s.replace(/([^\d,.〜~\u0000（]{2})(?=\d[^\u0000]{3,})/g, '$1\u0000');
  if (ph.length >= 7) s = s.replace(/(.{2})(?=など|すべて|無料|なし|各種)/g, '$1\u0000');
  if (ph.length >= 8) s = s.replace(/([\u3400-\u9fff]{2})(?=切手)/g, '$1\u0000');
  if (ph.length >= 8) s = s.replace(/([\u3400-\u9fff々]{2})(?=[\u30a1-\u30fa\u30fc]{4})/g, '$1\u0000');
  return s.split('\u0000').filter(Boolean);
};

const KEEP = ['見返り美人', '月に雁', '持ち運び', '持ち込', '持ち帰', '申し込', '申込み', '問い合わせ', '問合せ', '買い取', '取り扱', '受け取', '書き損じ', '見積り', '見積もり', 'という', '仕分け', '片付け', '台紙貼り', '切手趣味週間', '立太子礼', '赤猿', '竜文切手', '毛沢東', '日焼け', '貼った', '貼って', '出張買取', '店頭買取', '宅配買取', '催事買取', 'クーリング・オフ', 'キャンセル料', '年末年始', '最短翌日', '玄関先'];

// 文字列（太字・色付きなどのタグをまたいだ1続きの文）の中で、改行してよい位置（文字数）を返す
function breakPoints(full) {
  const pts = new Set();
  let pos = 0;
  for (const seg of full.split(/(\s+)/)) {
    if (seg && !/\s/.test(seg) && JA.test(seg)) {
      let at = pos;
      const parts = parser.parse(seg).flatMap(splitPlace).flatMap(splitLong);
      parts.forEach((ph, k) => { if (k > 0) pts.add(at); at += ph.length; });
    }
    pos += seg.length;
  }
  // かっこで始まる部分は、直前（リンクの後など）でも改行できるようにする
  for (let k = 1; k < full.length; k++) if (full[k] === '（' && !/\s/.test(full[k - 1])) pts.add(k);
  // ひとまとまりの語（切手の名前・複合語）の途中では改行しない
  for (const w of KEEP) for (let at = full.indexOf(w); at >= 0; at = full.indexOf(w, at + 1)) for (let k = at + 1; k < at + w.length; k++) pts.delete(k);
  // 注記の「※」は前の語から離さない
  for (let k = 1; k < full.length; k++) if (full[k] === '※') pts.delete(k);
  return pts;
}

// 文の途中にあっても文を区切らないタグ（これ以外のタグ・画像・改行で文が区切れる）
const INLINE = /^<\/?(a|span|b|strong|em|i|small|mark|time|abbr|sup|sub|u|s|q|cite|code)\b/i;

for (const f of files) {
  const p = path.join(root, f);
  const src = fs.readFileSync(p, 'utf8');
  const bodyAt = src.indexOf('<body');
  const head = src.slice(0, bodyAt);
  // 文節分割をやり直すため、<wbr> をいったん外す（手で区切りたい所は kt-nw などで指定する）
  const tokens = src.slice(bodyAt).replace(/<wbr>|\u2060/g, '').split(/(<!--[\s\S]*?-->|<[^>]+>)/);
  let skip = null, run = [], n = 0;
  const flush = () => {
    const texts = run.filter(k => !tokens[k].startsWith('<'));
    run = [];
    if (!texts.length) return;
    const full = texts.map(k => tokens[k]).join('');
    if (!JA.test(full) || full.includes('&')) return;
    const pts = breakPoints(full);
    let start = 0;
    texts.forEach((k, idx) => {
      const t = tokens[k], end = start + t.length;
      let o = '';
      for (let c = 0; c < t.length; c++) { if (c > 0 && pts.has(start + c)) o += '<wbr>'; o += t[c]; }
      // タグの境目にある区切りは、前の文字列の最後に置く
      if (idx < texts.length - 1 && pts.has(end)) o += '<wbr>';
      if (o !== t) n++;
      // 「※」の前は改行させない（見えない WORD JOINER を入れる）
      o = o.replace(/※/g, '\u2060※');
      tokens[k] = o;
      start = end;
    });
  };
  let keep = null, depth = 0;
  tokens.forEach((tok, k) => {
    if (!tok) return;
    if (tok.startsWith('<')) {
      if (skip) { if (new RegExp('^</' + skip + '\\b', 'i').test(tok)) skip = null; return; }
      // 改行させない要素（kt-nw など）の中には区切りを入れない（<wbr> は nowrap の中でも改行されるため）
      if (keep) {
        if (new RegExp('^<' + keep + '\\b', 'i').test(tok)) depth++;
        else if (new RegExp('^</' + keep + '\\b', 'i').test(tok) && --depth === 0) keep = null;
        return;
      }
      const kp = tok.match(/^<(\w+)[^>]*class="[^"]*\b(kt-nw|kt-stars|kt-table--marks|kt-update)\b/);
      if (kp) { flush(); keep = kp[1]; depth = 1; return; }
      const sk = tok.match(SKIP);
      if (sk && !tok.endsWith('/>')) { flush(); skip = sk[1]; return; }
      if (tok.startsWith('<!--') || !INLINE.test(tok)) { flush(); return; }
      run.push(k);
      return;
    }
    if (!skip && !keep) run.push(k);
  });
  flush();
  fs.writeFileSync(p, head + tokens.join(''));
  console.log(`${f}: ${n} text nodes`);
}
