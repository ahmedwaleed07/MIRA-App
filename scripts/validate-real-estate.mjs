import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync('docs/taxonomy.js','utf8');
const required=['developer','broker','direct-sale'];
function runTaxonomy(cache=null){
 const store=new Map(cache?[['mira_taxonomy',JSON.stringify(cache)]]:[]);
 const listeners={};
 const ctx={
  window:{addEventListener:(name,fn)=>(listeners[name]=fn)},
  localStorage:{getItem:key=>store.get(key)||null,setItem:(key,val)=>store.set(key,String(val))},
  console
 };
 vm.runInNewContext(source,ctx);
 return {tax:ctx.window.MIRA_TAXONOMY,label:ctx.window.MIRA_TAXONOMY_LABEL,
  typeLabel:ctx.window.MIRA_TAXONOMY_TYPE_LABEL,listeners,ctx,store};
}
const fresh=runTaxonomy();
assert.equal(fresh.tax.length,20);
const estate=fresh.tax.find(x=>x.slug==='real-estate');
assert.ok(estate);
assert.deepEqual(Array.from(estate.subs,x=>x.slug),required);
for(const language of ['ar','en','es','ru','tr']){
 assert.ok(fresh.label(estate,language).trim());
 for(const branch of estate.subs){
  assert.ok(fresh.label(branch,language).trim(),language+' '+branch.slug);
  assert.ok(fresh.typeLabel(branch.types[0],language).trim(),language+' type');
 }
}
for(const branch of estate.subs){
 assert.equal(branch.types.length,1);
 const attrs=branch.types[0][3];
 assert.ok(attrs.some(x=>x.key==='area_sqm'));
 assert.ok(attrs.some(x=>x.key==='property_type'));
 assert.ok(attrs.some(x=>x.key==='location'));
}
// Existing customers who have cached an older taxonomy still see the new category.
const cached=runTaxonomy([{slug:'clothing',ar:'الملابس',en:'Clothing',subs:[]},{slug:'restaurants',ar:'مطاعم',en:'Restaurants',subs:[]}]);
assert.equal(cached.tax.filter(x=>x.slug==='real-estate').length,1);
assert.equal(cached.tax.filter(x=>x.slug==='travel-tourism').length,1);
// A remote catalog sync must not erase the real-estate fallback or duplicate it.
cached.ctx.window.MIRA_TAXONOMY=[{slug:'clothing',ar:'الملابس',en:'Clothing',subs:[]},{slug:'restaurants',ar:'مطاعم',en:'Restaurants',subs:[]}];
cached.listeners['mira-taxonomy-synced']();
cached.listeners['mira-taxonomy-synced']();
assert.equal(cached.ctx.window.MIRA_TAXONOMY.filter(x=>x.slug==='real-estate').length,1);
assert.equal(cached.ctx.window.MIRA_TAXONOMY.filter(x=>x.slug==='travel-tourism').length,1);
for(const p of ['docs/categories.html','docs/home.html','docs/interests.html','docs/category.html']){
 const html=readFileSync(p,'utf8');
 assert.ok(html.includes('real-estate'),p+' missing real estate image or category');
}
assert.match(readFileSync('docs/category.html','utf8'),/real-estate-branches/);
assert.match(readFileSync('docs/mira-card-photos.js','utf8'),/real-estate/);
assert.equal(readFileSync('docs/assets/categories/real-estate.webp').subarray(0,4).toString('ascii'),'RIFF');
console.log('PASS Real Estate: 3 branches, 5 languages, photos, legacy cache and re-sync resilience');
