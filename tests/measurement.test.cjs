const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync(require.resolve('../kitte-kaitori/assets/js/kitte.js'),'utf8');
function setup(){
  const listeners={},records=[],observers=[];
  const document={querySelectorAll:()=>[],getElementById:()=>null,addEventListener:(type,fn)=>(listeners[type]??=[]).push(fn),hidden:false,hasFocus:()=>true,documentElement:{scrollHeight:2000}};
  const window={dataLayer:records,innerHeight:1000,scrollY:0,addEventListener:(type,fn)=>(listeners[type]??=[]).push(fn),requestAnimationFrame:fn=>fn(),setInterval:()=>{},__kitteMeasurement:{mode:'normal',attribution:{ad_campaign_id:'123'}}};
  function IntersectionObserver(cb){this.cb=cb;this.observe=()=>{};this.unobserve=()=>{};observers.push(this);}
  window.IntersectionObserver=IntersectionObserver;
  const ctx=vm.createContext({window,document,location:{pathname:'/kitte-kaitori/',search:'',host:'kitte.navolio.net',href:'https://kitte.navolio.net/kitte-kaitori/'},URL,URLSearchParams,Date,Math,WeakSet,WeakMap,IntersectionObserver});
  vm.runInContext(source,ctx);
  const dispatch=(type,e)=>(listeners[type]||[]).forEach(fn=>fn({type,button:0,defaultPrevented:false,...e}));
  function link(href,{aff='uriel',pending=false}={}) {return {dataset:{aff,place:'test'},textContent:'査定',classList:{contains:()=>pending},getAttribute:()=>href};}
  const click=(a,extra={})=>dispatch('click',{target:{closest:selector=>selector==='a[data-place]'?a:null},...extra});
  return {records,ctx,window,observers,link,click,dispatch};
}
test('internal, unset, pending, non-affiliate and unsafe links never count as MCV',()=>{
 const s=setup();
 for(const [href,options] of [['/kitte-kaitori/uriel/',{}],['#compare',{}],['__URIEL_AFF_LINK__',{}],['https://example.org/',{pending:true}],['https://example.org/',{aff:''}],['javascript:void(0)',{}]])s.click(s.link(href,options));
 assert.equal(s.records.filter(x=>x.event==='kitte_mcv').length,0);
 assert.equal(s.records.filter(x=>x.event==='cta_click').length,6);
});
test('external affiliate click emits one MCV; rapid repeat and cancelled navigation do not',()=>{
 const s=setup(),a=s.link('https://t.felmat.net/fmcl?ak=TEST');
 s.click(a);s.click(a);s.click(s.link('https://t.felmat.net/fmcl?ak=TEST'),{defaultPrevented:true});
 const m=s.records.filter(x=>x.event==='kitte_mcv');assert.equal(m.length,1);assert.equal(m[0].cta_company,'uriel');assert.equal(m[0].cta_place,'test');assert.equal(m[0].cta_pending,false);
});
test('script reload and scroll milestones are idempotent',()=>{
 const s=setup();vm.runInContext(source,s.ctx);s.window.scrollY=1000;s.dispatch('scroll',{});s.dispatch('scroll',{});
 assert.equal(s.records.filter(x=>x.event==='lp_page_view').length,1);
 assert.deepEqual(s.records.filter(x=>x.event==='lp_scroll').map(x=>x.scroll_percent),[25,50,75,90,100]);
});
test('CTA impressions require 50 percent visibility and only fire once',()=>{
 const s=setup(),a=s.link('/uriel/');const o=s.observers[1];
 o.cb([{target:a,isIntersecting:true,intersectionRatio:0.1}]);assert.equal(s.records.filter(x=>x.event==='lp_cta_view').length,0);
 o.cb([{target:a,isIntersecting:true,intersectionRatio:0.6}]);o.cb([{target:a,isIntersecting:true,intersectionRatio:0.8}]);assert.equal(s.records.filter(x=>x.event==='lp_cta_view').length,1);
});
test('ad dimensions persist without click IDs or stale CTA fields in later events',()=>{
 const s=setup();s.click(s.link('/uriel/'));s.window.scrollY=1000;s.dispatch('scroll',{});
 const scroll=s.records.find(x=>x.event==='lp_scroll');assert.equal(scroll.cta_place,null);assert.equal(scroll.ad_campaign_id,'123');assert.equal(scroll.gclid,undefined);
});
