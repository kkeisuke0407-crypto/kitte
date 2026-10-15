/* Dedicated Kitte measurement. No ASP parameter rewriting. */
(function () {
  'use strict';
  if (window.__kitteMeasurement) return;
  var query = new URLSearchParams(location.search), mode = 'normal';
  try {
    if (query.get('measurement_mode') === 'debug') sessionStorage.setItem('kitte_measurement_mode', 'debug');
    if (query.get('measurement_mode') === 'normal') sessionStorage.removeItem('kitte_measurement_mode');
    mode = sessionStorage.getItem('kitte_measurement_mode') === 'debug' ? 'debug' : 'normal';
  } catch (_) { mode = query.get('measurement_mode') === 'debug' ? 'debug' : 'normal'; }
  var attribution = {}, keys = ['ad_campaign_id','ad_group_id','ad_keyword','ad_matchtype'];
  try { attribution = JSON.parse(sessionStorage.getItem('kitte_attribution') || '{}'); } catch (_) {}
  keys.forEach(function (key) { var value = query.get(key); if (value) attribution[key] = value.slice(0,200); });
  try { sessionStorage.setItem('kitte_attribution', JSON.stringify(attribution)); } catch (_) {}
  /* Click IDs stay on this origin; disabled in debug and never sent as GA4 parameters. */
  if (mode === 'normal') {
    try {
      var now = Date.now(), previous = JSON.parse(localStorage.getItem('kitte_ads_click') || 'null');
      if (previous && now - previous.captured_at > 90*86400000) localStorage.removeItem('kitte_ads_click');
      var click = { captured_at: now }, hasId = false;
      ['gclid','gbraid','wbraid'].forEach(function (key) { var value=query.get(key); if(value && /^[a-zA-Z0-9_.~-]{1,512}$/.test(value)) { click[key]=value; hasId=true; } });
      if(hasId) localStorage.setItem('kitte_ads_click', JSON.stringify(click));
    } catch (_) {}
  }
  window.__kitteMeasurement = { mode: mode, attribution: attribution };
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('js',new Date());
  var safePage = new URL(location.origin + location.pathname);
  ['utm_source','utm_medium','utm_campaign','utm_id','utm_content','utm_term','gclid','gbraid','wbraid'].concat(keys).forEach(function(key){
    var value=query.get(key); if(value && value.length<=512) safePage.searchParams.set(key,value);
  });
  var safeRef = ''; try { var ref = new URL(document.referrer); safeRef=ref.origin+ref.pathname; } catch (_) {}
  var shared = {measurement_mode:mode,allow_google_signals:false,allow_ad_personalization_signals:false,page_location:safePage.href,page_referrer:safeRef};
  if(mode==='debug') shared.debug_mode=true;
  window.gtag('set',shared);
  window.dataLayer.push({'gtm.start': Date.now(),event:'gtm.js'});
  var s=document.createElement('script'); s.async=true;
  s.src='https://www.googletagmanager.com/gtm.js?id=GTM-P5BDV4FC';
  document.head.appendChild(s);
})();
