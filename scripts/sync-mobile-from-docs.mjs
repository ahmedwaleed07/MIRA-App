// MIRA native packaging: docs/ is the SINGLE approved web UI source.
// Run before every Capacitor add/sync/build; never ship the retired www/ prototype.
import {cpSync,mkdirSync,readFileSync,readdirSync,statSync} from 'node:fs';
import {join,resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const src=join(root,'docs'),dst=join(root,'www');
mkdirSync(dst,{recursive:true});
cpSync(src,dst,{recursive:true,force:true});
const home=readFileSync(join(src,'home.html'),'utf8');
const nativeHome=readFileSync(join(dst,'home.html'),'utf8');
const entry=readFileSync(join(dst,'index.html'),'utf8');
if(home!==nativeHome||!entry.includes('welcome.html')||!nativeHome.includes('mira-footer-language.js')){
 throw Error('MIRA mobile/web source parity check failed');
}
const required=['home.html','business.html','admin.html','friday-market.html','car-direct.html','mira-footer-language.js','mira-cloud.js','notifications.html','delete-account.html'];
for(const name of required){
 if(!readdirSync(dst).includes(name)||!statSync(join(dst,name)).isFile())throw Error('Native asset missing: '+name);
}
console.log('MIRA native web parity PASS ('+required.length+' critical pages, docs/ synced into www/)');
