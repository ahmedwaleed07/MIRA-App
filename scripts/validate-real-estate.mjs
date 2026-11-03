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
 assert.deepEqual(Array.from(branch.types,x=>x[0]),['sale','rent']);
 for(const type of branch.types){
  const attrs=type[3];
  assert.ok(attrs.some(x=>x.key==='area_sqm'));
  assert.ok(attrs.some(x=>x.key==='property_type'));
  assert.ok(attrs.some(x=>x.key==='location'));
  for(const lang of ['ar','en','es','ru','tr'])assert.ok(fresh.typeLabel(type,lang).trim(),lang+' '+branch.slug+' '+type[0]);
 }
}
const car=fresh.tax.find(x=>x.slug==='automotive');
const showrooms=car.subs.find(x=>x.slug==='showrooms');
assert.ok(showrooms,'Car showrooms must exist separately from personal car sales');
assert.deepEqual(Array.from(showrooms.types,x=>x[0]),['sale','rent']);
for(const lang of ['ar','en','es','ru','tr'])
 for(const type of showrooms.types)assert.ok(fresh.typeLabel(type,lang).trim());
assert.ok(car.subs.some(x=>x.slug==='parts-supplies'),'Automotive accessories and parts must remain intact');
// Existing customers who have cached an older taxonomy still see the new category.
const cached=runTaxonomy([{slug:'clothing',ar:'الملابس',en:'Clothing',subs:[]},{slug:'restaurants',ar:'مطاعم',en:'Restaurants',subs:[]}]);
assert.equal(cached.tax.filter(x=>x.slug==='real-estate').length,1);
assert.equal(cached.tax.filter(x=>x.slug==='travel-tourism').length,1);
assert.equal(cached.tax.filter(x=>x.slug==='automotive').length,0);
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


// Previous real estate classifications used a generic 'property' type.
// All three routes must now be upgraded to two transaction types across saved/remote data.
const oldEstate={
 slug:'real-estate',ar:'العقارات',en:'Real Estate',
 subs:['developer','broker','direct-sale'].map(slug=>({slug,ar:slug,en:slug,types:[['property','عرض عقاري','Property listing',[]]]}))
};
const oldCars={
 slug:'automotive',ar:'السيارات',en:'Automotive',
 subs:[{slug:'accessories',ar:'إكسسوارات',en:'Accessories',types:[['care','عناية','Care']]}]
};
const upgraded=runTaxonomy([oldEstate,oldCars]);
for(const sub of upgraded.tax.find(x=>x.slug==='real-estate').subs)
 assert.deepEqual(Array.from(sub.types,t=>t[0]),['sale','rent'],'legacy '+sub.slug);
assert.deepEqual(Array.from(upgraded.tax.find(x=>x.slug==='automotive').subs.find(x=>x.slug==='showrooms').types,t=>t[0]),['sale','rent']);
upgraded.ctx.window.MIRA_TAXONOMY=[JSON.parse(JSON.stringify(oldEstate)),JSON.parse(JSON.stringify(oldCars))];
upgraded.listeners['mira-taxonomy-synced']();
upgraded.listeners['mira-taxonomy-synced']();
const reloaded=upgraded.ctx.window.MIRA_TAXONOMY;
assert.deepEqual(Array.from(reloaded.find(x=>x.slug==='real-estate').subs[0].types,t=>t[0]),['sale','rent']);
assert.equal(reloaded.find(x=>x.slug==='automotive').subs.filter(x=>x.slug==='showrooms').length,1);
const catHTML=readFileSync('docs/category.html','utf8');
for(const token of ['id="transactionChoices"','renderTransactionChoices()',"['sale','rent']","selectedSub='showrooms'","params.set('branch','showrooms')"])
 assert.ok(catHTML.includes(token),'Missing rental/sale navigation: '+token);
const css=readFileSync('docs/mira-category-visuals.css','utf8');
assert.ok(css.includes('mira-transaction-choice.active'),'Missing sale/rent style');
console.log('PASS sale/rent in 3 real estate routes and car showrooms, including legacy cached catalogs');
