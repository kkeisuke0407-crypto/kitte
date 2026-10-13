// tools/check-wrap-webkit.py が WebKit の中で実行する改行チェック（iframe#f の中の文書を調べる）
// arguments[0]=MAX  文書: iframe内
var doc = document.getElementById('f').contentDocument, win = doc.defaultView, MAX = arguments[0];
var st = doc.createElement('style'); st.textContent = '.yk-tabs__panels > div{display:block!important}.yk-fold__body{max-height:none!important}.yk-fold__body::after{display:none!important}'; doc.head.appendChild(st);
function isInline(el){ var d = win.getComputedStyle(el).display; return d === 'inline' || d === 'contents'; }
function path(el){ var a=[]; while(el && el !== doc.body && a.length<3){ a.unshift(el.tagName.toLowerCase()+(el.id?'#'+el.id:'')+(el.classList.length?'.'+el.classList[0]:'')); el=el.parentElement; } return a.join('>'); }
var out=[], cont=new Set(), tw=doc.createTreeWalker(doc.body,4), n;
while((n=tw.nextNode())){ if(!n.textContent.trim())continue; var c=n.parentElement; while(c&&isInline(c))c=c.parentElement; if(c&&!/SCRIPT|STYLE|OPTION|SELECT/.test(c.tagName))cont.add(c); }
var ja=/[぀-ヿ㐀-鿿]/, punct=/[、。・）」』！？…ー\/／]/;
cont.forEach(function(c){
  if(!c.getClientRects().length) return;
  var segs=[[]];
  (function walk(el){ for (var k=0;k<el.childNodes.length;k++){ var ch=el.childNodes[k];
    if(ch.nodeType===3){ var t=ch.textContent; for(var i=0;i<t.length;i++){ var sg=segs[segs.length-1]; if(/\s/.test(t[i])){sg.sp=sg.length;continue;} if(t[i]==='⁠'||t[i]==='​')continue; var r=doc.createRange(); r.setStart(ch,i); r.setEnd(ch,i+1); var rs=r.getClientRects(), q=null; for(var j=0;j<rs.length;j++){ if(rs[j].width>0){ q=rs[j]; } } if(!q)continue; sg.push({c:t[i],x:q.left,y:q.top,h:q.height,ok:sg.wbr===sg.length||sg.sp===sg.length}); } }
    else if(ch.nodeType===1){ if(ch.tagName==='BR')segs.push([]); else if(ch.tagName==='WBR')segs[segs.length-1].wbr=segs[segs.length-1].length; else if(isInline(ch))walk(ch); }
  } })(c);
  segs.forEach(function(s){
    if(s.length<3)return; var lines=[[s[0]]];
    for(var i=1;i<s.length;i++){ var pr=s[i-1],cu=s[i]; if(cu.x<pr.x-4&&cu.y>pr.y+Math.min(pr.h,cu.h)*0.5)lines.push([cu]); else lines[lines.length-1].push(cu); }
    if(lines.length<2)return;
    var txt=s.map(function(o){return o.c}).join('');
    for(var li=1;li<lines.length;li++){ var f=lines[li][0], pl=lines[li-1], pc=pl[pl.length-1].c;
      if(win.getComputedStyle(c).wordBreak==='keep-all'&&!f.ok&&ja.test(f.c)&&ja.test(pc)&&!punct.test(pc)) out.push({k:'途中改行', where:path(c), at:pl.map(function(o){return o.c}).join('').slice(-8)+'｜'+lines[li].map(function(o){return o.c}).join('').slice(0,8), text:txt.slice(0,30)}); }
    var last=lines[lines.length-1].map(function(o){return o.c}).join('');
    if(last.length<=MAX) out.push({k:'短い最終行', where:path(c), at:lines[lines.length-2].map(function(o){return o.c}).join('').slice(-10)+'｜'+last, text:txt.slice(0,30)});
  });
});
return out;
