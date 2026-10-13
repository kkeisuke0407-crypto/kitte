"""Safari（WebKit）で改行を確認する：xvfb-run -a python3 tools/check-wrap-webkit.py http://127.0.0.1:8765/ 375,390,414 2 [shots]
必要なもの（Ubuntu）：apt-get install webkit2gtk-driver xvfb fonts-noto-cjk ／ pip install selenium
サイトのルート（kitte-kaitori/）を http で配信し、同じオリジンに iframe#f を1つだけ置いたページを用意して FRAME_URL で指定する（file:// では iframe の中を調べられない）。
結果：「途中改行」＝文節単位の要素で語の途中で折れた所、「短い最終行」＝最後の行が指定文字数以下の所。スクショは OUT（既定 /tmp/kitte-wrap-check）に保存。"""
import sys, time, json
from selenium import webdriver
from selenium.webdriver.webkitgtk.options import Options
from selenium.webdriver.webkitgtk.service import Service
import os
W=os.environ.get('OUT', '/tmp/kitte-wrap-check'); os.makedirs(W, exist_ok=True)
HERE=os.path.dirname(os.path.abspath(__file__))
base=sys.argv[1]; widths=[int(x) for x in sys.argv[2].split(',')]; MAX=int(sys.argv[3]); shots=len(sys.argv)>4
pages=['index.html','uriel/index.html','buysell/index.html','fukuchan/index.html','methodology/index.html','about/index.html','privacy/index.html']
o=Options(); o.binary_location='/usr/lib/x86_64-linux-gnu/webkit2gtk-4.1/MiniBrowser'; o.add_argument('--automation')
d=webdriver.WebKitGTK(options=o, service=Service(executable_path='/usr/bin/WebKitWebDriver'))
det=open(os.path.join(HERE,'wrap-detect.js')).read()
res=[]
try:
    d.set_window_size(1000,1900)
    d.get(os.environ.get('FRAME_URL', base+'__frame.html'))
    for w in widths:
        for pg in pages:
            d.execute_script("var f=document.getElementById('f'); f.width=arguments[0]; f.height=1800; f.src=arguments[1];", w, base+pg)
            time.sleep(1.8)
            if shots and w==widths[0]:
                H=d.execute_script("var f=document.getElementById('f');var h=f.contentDocument.documentElement.scrollHeight; f.contentDocument.querySelectorAll('img').forEach(function(i){i.loading='eager'}); return h;")
                time.sleep(1)
                k=0; y=0
                while y<H:
                    d.execute_script("document.getElementById('f').contentWindow.scrollTo(0,arguments[0])", y); time.sleep(0.4)
                    d.find_element('id','f').screenshot(f"{W}/s_{pg.split('/')[0].replace('.html','')}_{k:02d}.png"); k+=1; y+=1700
            r=d.execute_script(det, MAX)
            for x in r: x['w']=w; x['pg']=pg; res.append(x)
finally:
    d.quit()
json.dump(res, open(W+'/res.json','w'), ensure_ascii=False, indent=0)
from collections import OrderedDict
g=OrderedDict()
for x in res:
    key=(x['pg'],x['k'],x['where'],x['text']); g.setdefault(key,[]).append(f"{x['w']}:{x['at']}")
for (pg,k,wh,t),v in g.items(): print(pg.split('/')[0][:8],k,wh,'|',t,'|',' '.join(v[:2]))
print('TOTAL',len(g))
