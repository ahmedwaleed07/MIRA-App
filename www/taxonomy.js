// MIRA product taxonomy seed/fallback.
// Mirrors the Supabase taxonomy and keeps the prototype usable before API wiring.
window.MIRA_TAXONOMY = [
  {slug:'clothing',ar:'الملابس',en:'Clothing',subs:[
    {slug:'men',ar:'رجالي',en:'Men',types:[['tshirts','تيشيرتات','T-Shirts'],['shirts','قمصان','Shirts'],['pants','بناطيل','Pants'],['jeans','جينز','Jeans'],['suits','بدلات','Suits'],['jackets','جاكيتات ومعاطف','Jackets & Coats'],['sportswear','ملابس رياضية','Sportswear'],['underwear','ملابس داخلية','Underwear'],['sleepwear','ملابس نوم','Sleepwear']]},
    {slug:'women',ar:'نسائي',en:'Women',types:[['dresses','فساتين','Dresses'],['tops','بلوزات وقمصان','Tops & Shirts'],['pants','بناطيل','Pants'],['jeans','جينز','Jeans'],['skirts','تنانير','Skirts'],['abayas','عبايات','Abayas'],['jackets','جاكيتات ومعاطف','Jackets & Coats'],['sportswear','ملابس رياضية','Sportswear'],['underwear','ملابس داخلية','Underwear'],['sleepwear','ملابس نوم','Sleepwear']]},
    {slug:'boys',ar:'ولادي',en:'Boys',types:[['tshirts','تيشيرتات','T-Shirts'],['shirts','قمصان','Shirts'],['pants','بناطيل','Pants'],['jeans','جينز','Jeans'],['sets','أطقم','Sets'],['jackets','جاكيتات','Jackets'],['sportswear','ملابس رياضية','Sportswear'],['sleepwear','ملابس نوم','Sleepwear']]},
    {slug:'girls',ar:'بناتي',en:'Girls',types:[['dresses','فساتين','Dresses'],['tops','تيشيرتات وبلوزات','T-Shirts & Tops'],['pants','بناطيل','Pants'],['jeans','جينز','Jeans'],['skirts','تنانير','Skirts'],['sets','أطقم','Sets'],['jackets','جاكيتات','Jackets'],['sleepwear','ملابس نوم','Sleepwear']]},
    {slug:'kids',ar:'أطفال',en:'Kids',types:[['newborn','ملابس مواليد','Newborn Clothing'],['bodysuits','بودي','Bodysuits'],['sets','أطقم','Sets'],['sleepwear','ملابس نوم','Sleepwear'],['outerwear','ملابس خارجية','Outerwear']]}
  ]},
  {slug:'shoes',ar:'الأحذية',en:'Shoes',subs:[
    {slug:'men',ar:'رجالي',en:'Men',types:[['sports','رياضية','Sports'],['casual','كاجوال','Casual'],['formal','رسمية','Formal'],['loafers','لوفر','Loafers'],['boots','بوت','Boots'],['sandals','صنادل وشباشب','Sandals & Slippers']]},
    {slug:'women',ar:'نسائي',en:'Women',types:[['heels','كعب','Heels'],['sports','رياضية','Sports'],['casual','كاجوال','Casual'],['flats','فلات','Flats'],['boots','بوت','Boots'],['sandals','صنادل وشباشب','Sandals & Slippers']]},
    {slug:'boys',ar:'ولادي',en:'Boys',types:[['sports','رياضية','Sports'],['casual','كاجوال','Casual'],['school','مدرسية','School'],['boots','بوت','Boots'],['sandals','صنادل وشباشب','Sandals & Slippers']]},
    {slug:'girls',ar:'بناتي',en:'Girls',types:[['sports','رياضية','Sports'],['casual','كاجوال','Casual'],['school','مدرسية','School'],['flats','فلات','Flats'],['boots','بوت','Boots'],['sandals','صنادل وشباشب','Sandals & Slippers']]},
    {slug:'kids',ar:'أطفال',en:'Kids',types:[['newborn','أحذية مواليد','Newborn Shoes'],['first-steps','أحذية مشي','First Steps'],['sports','رياضية','Sports'],['sandals','صنادل','Sandals']]}
  ]},
  {slug:'perfumes',ar:'العطور',en:'Perfumes',subs:[
    {slug:'men',ar:'رجالي',en:'Men',types:[['perfume','عطور','Perfumes'],['sets','أطقم عطور','Perfume Sets'],['body-spray','بودي سبراي','Body Spray'],['pocket','عطور جيب','Pocket Perfume']]},
    {slug:'women',ar:'نسائي',en:'Women',types:[['perfume','عطور','Perfumes'],['sets','أطقم عطور','Perfume Sets'],['body-mist','بودي ميست','Body Mist'],['pocket','عطور جيب','Pocket Perfume']]},
    {slug:'unisex',ar:'للجنسين',en:'Unisex',types:[['perfume','عطور','Perfumes'],['sets','أطقم عطور','Perfume Sets']]}
  ]},
  {slug:'accessories',ar:'الإكسسوارات',en:'Accessories',subs:[
    {slug:'men',ar:'رجالي',en:'Men',types:[['wallets','محافظ','Wallets'],['belts','أحزمة','Belts'],['caps','قبعات','Caps'],['bracelets','أساور','Bracelets'],['rings','خواتم','Rings'],['chains','سلاسل','Chains'],['ties','ربطات عنق','Ties']]},
    {slug:'women',ar:'نسائي',en:'Women',types:[['wallets','محافظ','Wallets'],['scarves','أوشحة','Scarves'],['caps','قبعات','Caps'],['belts','أحزمة','Belts'],['bracelets','أساور','Bracelets'],['rings','خواتم','Rings'],['chains','سلاسل','Chains'],['hair','إكسسوارات شعر','Hair Accessories']]}
  ]},
  {slug:'bags',ar:'الحقائب',en:'Bags',subs:[
    {slug:'men',ar:'رجالي',en:'Men',types:[['hand','حقائب يد','Hand Bags'],['backpacks','ظهر','Backpacks'],['work','عمل','Work Bags'],['travel','سفر','Travel Bags'],['waist','خصر','Waist Bags']]},
    {slug:'women',ar:'نسائي',en:'Women',types:[['hand','حقائب يد','Handbags'],['shoulder','كتف','Shoulder Bags'],['crossbody','كروس بودي','Crossbody'],['backpacks','ظهر','Backpacks'],['travel','سفر','Travel Bags'],['wallets','محافظ','Wallets']]},
    {slug:'boys',ar:'ولادي',en:'Boys',types:[['school','مدرسية','School Bags'],['backpacks','ظهر','Backpacks'],['sports','رياضية','Sports Bags']]},
    {slug:'girls',ar:'بناتي',en:'Girls',types:[['school','مدرسية','School Bags'],['backpacks','ظهر','Backpacks'],['small','صغيرة','Small Bags']]}
  ]},
  {slug:'watches',ar:'الساعات',en:'Watches',subs:[
    {slug:'men',ar:'رجالي',en:'Men',types:[['classic','كلاسيكية','Classic'],['sports','رياضية','Sports'],['smart','ذكية','Smart']]},
    {slug:'women',ar:'نسائي',en:'Women',types:[['classic','كلاسيكية','Classic'],['fashion','فاشن','Fashion'],['sports','رياضية','Sports'],['smart','ذكية','Smart']]},
    {slug:'kids',ar:'أطفال',en:'Kids',types:[['regular','عادية','Regular'],['educational','تعليمية','Educational'],['smart','ذكية','Smart']]}
  ]}
,
  {slug:'beauty',ar:'الجمال والعناية',en:'Beauty & Care',subs:[
    {slug:'makeup',ar:'المكياج',en:'Makeup',types:[['face','الوجه','Face'],['eyes','العيون','Eyes'],['lips','الشفاه','Lips'],['nails','الأظافر','Nails'],['tools','أدوات المكياج','Makeup Tools']]},
    {slug:'skincare',ar:'العناية بالبشرة',en:'Skincare',types:[['cleansing','التنظيف','Cleansing'],['moisturizing','الترطيب','Moisturizing'],['serums','السيرومات','Serums'],['sunscreen','واقي الشمس','Sunscreen'],['masks','الأقنعة','Masks']]},
    {slug:'haircare',ar:'العناية بالشعر',en:'Haircare',types:[['shampoo','شامبو','Shampoo'],['conditioner','بلسم','Conditioner'],['oils','زيوت','Oils'],['treatments','علاجات','Treatments'],['dyes','صبغات','Hair Dyes'],['styling','تصفيف','Styling']]},
    {slug:'personal-care',ar:'العناية الشخصية',en:'Personal Care',types:[['bath','الاستحمام','Bath'],['deodorants','مزيلات العرق','Deodorants'],['oral','العناية بالفم','Oral Care'],['tools','أدوات شخصية','Personal Tools']]}
  ]},
  {slug:'electronics',ar:'الإلكترونيات',en:'Electronics',subs:[
    {slug:'mobiles',ar:'الموبايلات',en:'Mobiles',types:[['smartphones','هواتف ذكية','Smartphones'],['feature-phones','هواتف عادية','Feature Phones']]},
    {slug:'computers',ar:'الكمبيوتر والتابلت',en:'Computers & Tablets',types:[['laptops','لابتوبات','Laptops'],['desktops','أجهزة مكتبية','Desktops'],['tablets','تابلت','Tablets'],['monitors','شاشات كمبيوتر','Monitors']]},
    {slug:'accessories',ar:'الإكسسوارات',en:'Accessories',types:[['chargers','شواحن','Chargers'],['cables','كيبلات','Cables'],['cases','كفرات','Cases'],['powerbanks','باور بانك','Power Banks']]},
    {slug:'gaming',ar:'الألعاب',en:'Gaming',types:[['consoles','أجهزة ألعاب','Consoles'],['games','ألعاب','Games'],['controllers','يد تحكم','Controllers'],['gaming-accessories','إكسسوارات ألعاب','Gaming Accessories']]},
    {slug:'audio-video',ar:'الصوت والصورة',en:'Audio & Video',types:[['tvs','تلفزيونات','TVs'],['speakers','سماعات','Speakers'],['headphones','سماعات رأس','Headphones'],['cameras','كاميرات','Cameras']]}
  ]},
  {slug:'home-appliances',ar:'الأجهزة المنزلية',en:'Home Appliances',subs:[
    {slug:'kitchen',ar:'المطبخ',en:'Kitchen',types:[['refrigerators','ثلاجات','Refrigerators'],['ovens','أفران','Ovens'],['microwaves','مايكروويف','Microwaves'],['small-appliances','أجهزة صغيرة','Small Appliances']]},
    {slug:'laundry-cleaning',ar:'الغسيل والتنظيف',en:'Laundry & Cleaning',types:[['washers','غسالات','Washing Machines'],['dryers','مجففات','Dryers'],['vacuums','مكانس','Vacuum Cleaners']]},
    {slug:'cooling-heating',ar:'التبريد والتدفئة',en:'Cooling & Heating',types:[['air-conditioners','مكيفات','Air Conditioners'],['fans','مراوح','Fans'],['heaters','مدافئ','Heaters']]}
  ]},
  {slug:'home',ar:'المنزل والأثاث',en:'Home & Furniture',subs:[
    {slug:'furniture',ar:'الأثاث',en:'Furniture',types:[['living-room','غرف المعيشة','Living Room'],['bedroom','غرف النوم','Bedroom'],['office','أثاث مكتبي','Office Furniture']]},
    {slug:'decor',ar:'الديكور',en:'Decor',types:[['wall-decor','ديكور الجدران','Wall Decor'],['ornaments','تحف','Ornaments'],['mirrors','مرايا','Mirrors']]},
    {slug:'furnishings',ar:'المفروشات',en:'Furnishings',types:[['bedding','مفروشات سرير','Bedding'],['curtains','ستائر','Curtains'],['rugs','سجاد','Rugs']]},
    {slug:'kitchen-dining',ar:'المطبخ والسفرة',en:'Kitchen & Dining',types:[['cookware','أواني طبخ','Cookware'],['tableware','أدوات سفرة','Tableware'],['storage','حفظ وتنظيم','Storage']]},
    {slug:'lighting',ar:'الإضاءة',en:'Lighting',types:[['ceiling','سقفية','Ceiling Lights'],['lamps','مصابيح','Lamps'],['outdoor','خارجية','Outdoor Lighting']]}
  ]},
  {slug:'sports',ar:'الرياضة',en:'Sports',subs:[
    {slug:'men',ar:'رجالي',en:'Men',types:[['clothing','ملابس','Clothing'],['shoes','أحذية','Shoes'],['accessories','إكسسوارات','Accessories']]},
    {slug:'women',ar:'نسائي',en:'Women',types:[['clothing','ملابس','Clothing'],['shoes','أحذية','Shoes'],['accessories','إكسسوارات','Accessories']]},
    {slug:'kids',ar:'أطفال',en:'Kids',types:[['clothing','ملابس','Clothing'],['shoes','أحذية','Shoes'],['accessories','إكسسوارات','Accessories']]},
    {slug:'equipment',ar:'المعدات الرياضية',en:'Sports Equipment',types:[['fitness','لياقة','Fitness'],['football','كرة قدم','Football'],['racket','رياضات المضرب','Racket Sports'],['outdoor','رياضات خارجية','Outdoor Sports']]}
  ]},
  {slug:'toys-kids',ar:'الألعاب والأطفال',en:'Toys & Kids',subs:[
    {slug:'age',ar:'حسب العمر',en:'By Age',types:[['baby','0-2 سنة','0-2 Years'],['preschool','3-5 سنوات','3-5 Years'],['kids','6-9 سنوات','6-9 Years'],['preteen','10+ سنوات','10+ Years']]},
    {slug:'toys',ar:'الألعاب',en:'Toys',types:[['educational','تعليمية','Educational'],['dolls','دمى','Dolls'],['vehicles','سيارات ومركبات','Vehicles'],['outdoor','ألعاب خارجية','Outdoor Toys']]},
    {slug:'baby-supplies',ar:'مستلزمات البيبي',en:'Baby Supplies',types:[['feeding','رضاعة وطعام','Feeding'],['diapers','حفاضات','Diapers'],['strollers','عربات','Strollers'],['nursery','غرفة الطفل','Nursery']]}
  ]},
  {slug:'jewelry',ar:'المجوهرات',en:'Jewelry',subs:[
    {slug:'women',ar:'نسائي',en:'Women',types:[['necklaces','قلادات','Necklaces'],['rings','خواتم','Rings'],['bracelets','أساور','Bracelets'],['earrings','أقراط','Earrings']]},
    {slug:'men',ar:'رجالي',en:'Men',types:[['rings','خواتم','Rings'],['bracelets','أساور','Bracelets'],['chains','سلاسل','Chains']]}
  ]},
  {slug:'eyewear',ar:'النظارات',en:'Eyewear',subs:[
    {slug:'men',ar:'رجالي',en:'Men',types:[['sunglasses','شمسية','Sunglasses'],['optical','طبية','Optical']]},
    {slug:'women',ar:'نسائي',en:'Women',types:[['sunglasses','شمسية','Sunglasses'],['optical','طبية','Optical']]},
    {slug:'kids',ar:'أطفال',en:'Kids',types:[['sunglasses','شمسية','Sunglasses'],['optical','طبية','Optical']]}
  ]},
  {slug:'automotive',ar:'السيارات',en:'Automotive',subs:[
    {slug:'accessories',ar:'إكسسوارات السيارات',en:'Car Accessories',types:[['interior','داخلية','Interior'],['exterior','خارجية','Exterior'],['care','العناية بالسيارة','Car Care']]},
    {slug:'electronics',ar:'إلكترونيات السيارات',en:'Car Electronics',types:[['audio','صوتيات','Audio'],['cameras','كاميرات','Cameras'],['chargers','شواحن','Chargers']]},
    {slug:'parts-supplies',ar:'قطع ومستلزمات',en:'Parts & Supplies',types:[['batteries','بطاريات','Batteries'],['tires','إطارات','Tires'],['oils','زيوت','Oils & Fluids']]}
  ]},
  {slug:'stationery-office',ar:'القرطاسية والمكتب',en:'Stationery & Office',subs:[
    {slug:'school',ar:'مدرسية',en:'School',types:[['notebooks','دفاتر','Notebooks'],['pens','أقلام','Pens'],['school-supplies','مستلزمات مدرسية','School Supplies']]},
    {slug:'office',ar:'مكتبية',en:'Office',types:[['paper','ورق','Paper'],['filing','حفظ وتنظيم','Filing'],['desk','أدوات مكتب','Desk Accessories']]}
  ]},
  {slug:'gifts',ar:'الهدايا',en:'Gifts',subs:[
    {slug:'occasion',ar:'حسب المناسبة',en:'By Occasion',types:[['birthday','عيد ميلاد','Birthday'],['wedding','زواج','Wedding'],['graduation','تخرج','Graduation'],['newborn','مولود','Newborn']]},
    {slug:'type',ar:'حسب النوع',en:'By Type',types:[['gift-sets','بوكسات هدايا','Gift Sets'],['flowers','زهور','Flowers'],['personalized','هدايا مخصصة','Personalized Gifts']]}
  ]}
,
  {slug:'restaurants',ar:'المطاعم والمقاهي',en:'Restaurants & Cafes',subs:[
    {slug:'restaurants',ar:'مطاعم',en:'Restaurants',types:[['fast-food','وجبات سريعة','Fast Food'],['grills','مشويات','Grills'],['international','مطابخ عالمية','International Cuisine'],['local','مطبخ محلي','Local Cuisine']]},
    {slug:'cafes',ar:'مقاهي',en:'Cafes',types:[['coffee','قهوة','Coffee'],['desserts','حلويات','Desserts'],['breakfast','فطور','Breakfast'],['drinks','مشروبات','Drinks']]},
    {slug:'sweets-bakeries',ar:'حلويات ومخابز',en:'Sweets & Bakeries',types:[['cakes','كيك','Cakes'],['pastries','معجنات','Pastries'],['sweets','حلويات','Sweets'],['bread','خبز','Bread']]}
  ]}
];

/* Default product attributes used by merchant forms and customer filters. */
(function(){
  const all=window.MIRA_TAXONOMY||[];
  const A=(key,label,input_type='text',options=[])=>({key,label,input_type,options,is_filterable:true});
  const sizeClothing=A('size','Size','select',['XS','S','M','L','XL','XXL']);
  const sizeShoes=A('size','Size','select',['24','25','26','27','28','29','30','31','32','33','34','35','36','37','38','39','40','41','42','43','44','45','46','47','48']);
  const color=A('color','Color','select',['Black','White','Blue','Red','Green','Beige','Brown','Grey','Pink','Other']);
  const material=A('material','Material','text');
  const brand=A('brand','Brand','text');
  const model=A('model','Model','text');
  const volume=A('volume','Volume','select',['30 ml','50 ml','75 ml','100 ml','125 ml','150 ml','200 ml']);
  const concentration=A('concentration','Concentration','select',['EDT','EDP','Parfum','Extrait']);
  const storage=A('storage','Storage','select',['64 GB','128 GB','256 GB','512 GB','1 TB','2 TB']);
  const condition=A('condition','Condition','select',['New','Like New','Used']);
  const map={
    clothing:[sizeClothing,color,material],
    shoes:[sizeShoes,color,material],
    perfumes:[volume,concentration],
    accessories:[color,material],
    bags:[color,material],
    watches:[color,material],
    beauty:[brand],
    electronics:[brand,model,storage,condition,color],
    'home-appliances':[brand,model,color],
    home:[color,material],
    sports:[sizeClothing,color,brand],
    'toys-kids':[brand],
    jewelry:[material,color],
    eyewear:[brand,color],
    automotive:[brand,model],
    'stationery-office':[brand,color],
    gifts:[color],
    restaurants:[]
  };
  all.forEach(cat=>cat.subs.forEach(sub=>sub.types.forEach(t=>{
    if(!t[3]||!t[3].length)t[3]=(map[cat.slug]||[]).map(x=>({...x,options:[...(x.options||[])]}));
  })));
  window.MIRA_DEFAULT_ATTRIBUTES=true;
})();
