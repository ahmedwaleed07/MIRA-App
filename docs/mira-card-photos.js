/* MIRA: category-specific photography for cards with no merchant image.
 * Assets are local, verified WebP photos. Actual merchant uploads always win.
 * Decorative fallbacks are NOT representations of the exact sale item.
 */
(function(){
 'use strict';
 const base='assets/categories/';
 const names={
  clothing:'clothing',fashion:'clothing',apparel:'clothing',
  shoes:'shoes',footwear:'shoes',perfumes:'perfumes',fragrance:'perfumes',
  accessories:'accessories',bags:'bags',watches:'watches',beauty:'beauty',
  electronics:'electronics',computers:'electronics','home-appliances':'home-appliances',
  appliances:'home-appliances',home:'home',furniture:'home',sports:'sports',
  'toys-kids':'toys-kids',kids:'toys-kids',toys:'toys-kids',jewelry:'jewelry',
  jewellery:'jewelry',eyewear:'eyewear',glasses:'eyewear',automotive:'automotive',
  cars:'automotive',vehicles:'automotive','real-estate':'real-estate',realestate:'real-estate',property:'real-estate',properties:'real-estate','stationery-office':'stationery-office',
  office:'stationery-office',gifts:'gifts',restaurants:'restaurants-cafes',
  food:'restaurants-cafes',cafes:'restaurants-cafes','restaurants-cafes':'restaurants-cafes',
  'travel-tourism':'travel-tourism',travel:'travel-tourism',tourism:'travel-tourism',
  services:'category-hero',service:'category-hero'
 };
 const aliases=[
  [/ملابس|fashion|clothes|clothing|garments|apparel/i,'clothing'],
  [/أحذية|shoes|footwear|boots/i,'shoes'],
  [/عطور|perfumes|fragrance/i,'perfumes'],
  [/حقائب|bags|backpack/i,'bags'],
  [/إكسسوارات|accessories/i,'accessories'],
  [/ساعات|watches/i,'watches'],
  [/جمال|مكياج|beauty|makeup|skin.?care/i,'beauty'],
  [/إلكترون|electronic|mobile|computers?/i,'electronics'],
  [/أجهزة منزل|appliance/i,'home-appliances'],
  [/مفروشات|أثاث|furniture|home.?decor/i,'home'],
  [/رياضة|sports?|fitness/i,'sports'],
  [/ألعاب|أطفال|toys?|children|kids/i,'toys-kids'],
  [/مجوهرات|jewelry|jewellery/i,'jewelry'],
  [/نظارات|eyewear|glasses/i,'eyewear'],
  [/سيارات|automotive|vehicles?|cars/i,'automotive'],
  [/عقار|عقارات|real[ -]?estate|properties|property|inmuebles|недвижимость|gayrimenkul/i,'real-estate'],
  [/مكتب|قرطاسية|stationery|office/i,'stationery-office'],
  [/هدايا|gifts?/i,'gifts'],
  [/مطاعم|مقاهي|كافيه|restaurants?|caf[eé]s?|food|شاورما|shawarma/i,'restaurants-cafes'],
  [/سفر|سياحة|tourism|travel/i,'travel-tourism']
 ];
 const isImage=value=>typeof value==='string'&&/^(https?:\/\/|data:image\/|blob:|assets\/)/i.test(value.trim());
 function category(record,secondary,defaultSlug=''){
  for(const v of [record?.categorySlug,record?.taxonomy?.category,record?.category,record?.slug,
   secondary?.categorySlug,secondary?.taxonomy?.category,secondary?.category,defaultSlug]){
   const raw=String(v||'').trim();
   if(!raw)continue;
   const normalized=raw.toLowerCase().replace(/[_ ]+/g,'-');
   if(names[normalized])return names[normalized];
   for(const [regexp,target] of aliases)if(regexp.test(raw))return target;
  }
  return 'category-hero';
 }
 function forCategory(categorySlug){return base+category(null,null,categorySlug)+'.webp'}
 function fallback(record,secondary,defaultSlug){return base+category(record,secondary,defaultSlug)+'.webp'}
 function resolve(record,secondary,defaultSlug){
  for(const item of [record?.image,record?.cover,secondary?.cover,secondary?.image]){
   if(isImage(item))return item.trim();
  }
  return fallback(record,secondary,defaultSlug);
 }
 function style(value){
  // Use only safe local paths or registered image/storage URLs as CSS image sources.
  if(!isImage(value))return '';
  const clean=String(value).replace(/[<>"'\\\n\r()]/g,ch=>'%'+ch.charCodeAt(0).toString(16).toUpperCase().padStart(2,'0'));
  return ' style="background-image:url(\''+clean+'\')"';
 }
 window.MiraCardPhotos=Object.freeze({forCategory,category,fallback,resolve,style});
})();
