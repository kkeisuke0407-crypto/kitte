/* Deterministic Pages output: current root URLs plus the requested /kitte-kaitori/. */
const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..'),src=path.join(root,'kitte-kaitori'),out=path.resolve(process.argv[2]||path.join(root,'.pages-output'));
if(out===root || out===src) throw Error('Output must be a separate directory');
fs.mkdirSync(out,{recursive:true});
fs.cpSync(src,path.join(out,'kitte-kaitori'),{recursive:true});
fs.cpSync(src,out,{recursive:true});
fs.writeFileSync(path.join(out,'CNAME'),'kitte.navolio.net\n');
fs.writeFileSync(path.join(out,'.nojekyll'),'');
fs.copyFileSync(path.join(root,'robots.txt'),path.join(out,'robots.txt'));
console.log(out);
