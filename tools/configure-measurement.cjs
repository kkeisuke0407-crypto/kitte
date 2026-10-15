const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const src = path.join(root, 'kitte-kaitori');
for (const page of ['index.html','uriel/index.html','buysell/index.html','fukuchan/index.html','methodology/index.html','about/index.html','privacy/index.html']) {
  const f=path.join(src,page); let html=fs.readFileSync(f,'utf8');
  const prefix=page==='index.html'?'':'../';
  html=html.replace(/\n<script src="[^"]*measurement-init\.js(?:\?v=[0-9a-f]+)?"><\/script>/g,'');
  html=html.replace(/(<meta charset="utf-8">)/i,'$1\n<script src="'+prefix+'assets/js/measurement-init.js"></script>');
  fs.writeFileSync(f,html);
}
console.log('Updated seven page bootstrap references.');
