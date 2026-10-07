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
];
