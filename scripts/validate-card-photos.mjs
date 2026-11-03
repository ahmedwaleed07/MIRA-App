import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {Script,createContext} from 'node:vm';

const read=path=>readFileSync(path,'utf8');
const lib=read('docs/mira-card-photos.js');
const context=createContext({window:{}});
new Script(lib,{filename:'mira-card-photos.js'}).runInContext(context);
const photos=context.window.MiraCardPhotos;
assert.ok(photos&&typeof photos.resolve==='function');

const matrix=[
 [{category:'Restaurants & Cafés'},'restaurants-cafes.webp'],
 [{categorySlug:'automotive'},'automotive.webp'],
 [{category:'Fashion & Clothing'},'clothing.webp'],
 [{categorySlug:'electronics'},'electronics.webp'],
 [{category:'Perfumes'},'perfumes.webp'],
 [{category:'Services'},'category-hero.webp'],
 [{categorySlug:'sports'},'sports.webp'],
 [{categorySlug:'travel-tourism'},'travel-tourism.webp'],
 [{categorySlug:'real-estate'},'real-estate.webp'],
 [{category:'العقارات'},'real-estate.webp']
];
for(const [record,expected] of matrix){
 const photo=photos.resolve(record);
 assert.ok(photo.endsWith('/'+expected),'Wrong photo for '+JSON.stringify(record)+': '+photo);
 assert.ok(existsSync('docs/'+photo),'Missing local card asset: '+photo);
}
assert.equal(photos.resolve({image:'https://example.com/product.webp',categorySlug:'clothing'}),'https://example.com/product.webp');
assert.equal(photos.resolve({image:'',categorySlug:'automotive'}),photos.forCategory('automotive'));

// All referenced category photos must really exist in the native/web source.
for(const id of ['clothing','shoes','perfumes','accessories','bags','watches','beauty','electronics','home-appliances','home','sports','toys-kids','jewelry','eyewear','automotive','stationery-office','gifts','restaurants','travel-tourism','real-estate','services']){
 const photo=photos.forCategory(id);
 assert.ok(existsSync('docs/'+photo),'Missing category scene '+id+': '+photo);
}
for(const asset of ['docs/assets/categories/automotive-direct.webp','docs/assets/heritage-markets/market-mira-bazaar.jpg'])
 assert.ok(existsSync(asset),'Missing personal listing scene: '+asset);

const pages=['home','category','store','offer','business','search','saved','cart','section'];
for(const page of pages){
 const file='docs/'+page+'.html',html=read(file);
 assert.match(html,/mira-card-photos\.js/,page+' missing common photo mapping');
 assert.match(html,/mira-card-photo-fallbacks\.css/,page+' missing shared photo styles');
 for(const script of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)){
  if(script[1].trim())new Script(script[1],{filename:file});
 }
}
assert.match(read('docs/business.html'),/mira-business-thumb/);
assert.match(read('docs/business.html'),/previewImage\.classList\.add\('mira-default-photo'\)/);
assert.match(read('docs/search.html'),/mark mira-catalog-photo/);
assert.match(read('docs/saved.html'),/visual mira-catalog-photo/);
assert.match(read('docs/store.html'),/mira-store-photo \.cover:after/);
assert.match(read('docs/friday-market.html'),/صورة توضيحية للسوق/);
assert.match(read('docs/car-direct.html'),/assets\/categories\/automotive-direct\.webp/);
const skin=read('docs/mira-platform-visuals.css');
for(let i=1;i<=6;i++)assert.ok(skin.includes('nth-child('+i+')'),'Business tile '+i+' needs its photo');
console.log('MIRA photo fallback validation PASS: 9 page types, 6 Business tiles, 21 photo categories');
