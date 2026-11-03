// MIRA mobile packaging: docs/ is the ONLY approved source for BOTH iOS and Android.
// Always delete the previous native web bundle, so retired pages cannot survive.
import {cpSync,existsSync,mkdirSync,readFileSync,readdirSync,rmSync,statSync} from 'node:fs';
import {join,resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const src=join(root,'docs'),dst=join(root,'www');
if(!existsSync(join(src,'index.html'))||!existsSync(join(src,'home.html'))||!existsSync(join(src,'welcome.html'))){
 throw Error('Refusing to replace www/: approved docs/ entry pages are missing');
}
rmSync(dst,{recursive:true,force:true});
mkdirSync(dst,{recursive:true});
cpSync(src,dst,{recursive:true,force:true});
const home=readFileSync(join(src,'home.html'),'utf8');
const nativeHome=readFileSync(join(dst,'home.html'),'utf8');
const entry=readFileSync(join(dst,'index.html'),'utf8');
if(home!==nativeHome||!entry.includes('welcome.html')||!nativeHome.includes('mira-footer-language.js')){
 throw Error('MIRA mobile/web source parity check failed');
}
const required=[
 'index.html','welcome.html','home.html','market.html','city.html','interests.html',
 'categories.html','category.html','business.html','admin.html',
 'friday-market.html','car-direct.html','mira-footer-language.js','mira-cloud.js',
 'notifications.html','delete-account.html','taxonomy.js',
 'mira-category-visuals.css','assets/categories/real-estate.webp'
];
for(const name of required){
 if(!existsSync(join(dst,name))||!statSync(join(dst,name)).isFile())throw Error('Native asset missing: '+name);
}
console.log('MIRA native web parity prepared: '+required.length+' essential files; docs/ copied into fresh www/ for iOS and Android');
