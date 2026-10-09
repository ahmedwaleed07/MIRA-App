import {readFileSync} from 'node:fs';
const read=(name)=>readFileSync('docs/'+name+'.html','utf8');
const files=['welcome','signin','signup','otp'];
for(const name of files){
 const html=read(name);
 for(const asset of ['mira-auth-v3.css','assets/mira_icon_frameless.svg','assets/mira_wordmark.svg','assets/asas360_master_vector.svg']){
  if(!html.includes(asset))throw new Error(name+' missing '+asset);
 }
 console.log('PASS '+name+' linked to responsive layout and repository branding');
}
const otp=read('otp');
const inputs=(otp.match(/<input maxlength="(?:1|6)" inputmode="numeric"/g)||[]).length;
if(inputs!==6)throw new Error('Expected exactly 6 OTP fields, found '+inputs);
if(!otp.includes('if(c.length!==6')||!otp.includes('MiraCloud.verifyOtp'))throw new Error('OTP verification handler missing');
for(const target of ['signin.html','signup.html','market.html'])if(!read('welcome').includes('href="'+target+'"'))throw new Error('Welcome target missing: '+target);
console.log('PASS six OTP fields, live verification, and welcome actions');

const style=readFileSync('docs/mira-auth-v3.css','utf8');
if(!style.includes('#welcomeSignin.btn.btn-white')||!style.includes('color:#800020!important'))throw new Error('White sign-in button must retain burgundy lettering');
const brand=readFileSync('docs/assets/asas360_master_vector.svg','utf8');
if(!brand.includes('id="b"')||!brand.includes('fill="#800020"')||(brand.match(/<use /g)||[]).length!==7)throw new Error('Official ASAS vector asset is missing shield or wordmark elements');
console.log('PASS welcome text contrast and exact vector ASAS footer');

if(!otp.includes('maxlength="6" inputmode="numeric" autocomplete="one-time-code"'))throw new Error('First OTP input must accept whole iOS SMS autofill');
if(!otp.includes("distributeOtp(i,digits)")||!otp.includes("addEventListener('paste'"))throw new Error('OTP digits must distribute on SMS autofill and paste');
if(!otp.includes("setLang((new URLSearchParams(location.search).get('lang')||getLang()))"))throw new Error('OTP query language must be stored for validation prompts');
console.log('PASS iPhone SMS autofill, paste distribution and OTP language persistence');

const gift=readFileSync('docs/assets/mira_icon_frameless.svg','utf8');
const originalGift=readFileSync('docs/assets/mira_icon.svg','utf8');
const originalData=originalGift.match(/data:image\/webp;base64,[^\"]+/)?.[0];
if(!originalData||!gift.includes(originalData))throw new Error('Gift must retain exact original MIRA pixels');
if(!gift.includes('mira-gift-contour'))throw new Error('MIRA bitmap frame not masked');
const fullLogo=readFileSync('docs/assets/asas360_master_vector.svg','utf8');
if(!fullLogo.includes('viewBox="-4 -7 282 82"'))throw new Error('ASAS shield safe area missing');
console.log('PASS MIRA original mark pixels preserved with extraneous frame masked, and complete ASAS vector with bleed');

/* Narrow-scope style regression checks for country choices, sign-up chevrons and eagle. */
const marketHtml=readFileSync('docs/market.html','utf8');
if(!marketHtml.includes('mira-country-readability-v1')||!marketHtml.includes('#countryGrid .country .country-name')||!marketHtml.includes('color:#FFFFFF!important'))throw new Error('Country names must be white on burgundy');
if(!marketHtml.includes('<svg class="search-icon"')||!marketHtml.includes('.search-wrap:focus-within'))throw new Error('Country search must keep its clean magnifier and focus treatment');
if(!style.includes('select:is(#gender,#dobDay,#dobMonth,#dobYear)')||!style.includes("stroke='%23FFFFFF'"))throw new Error('Birth date and gender selectors must have white chevrons');
if(!brand.includes('translate(-35 -25) scale(.215)'))throw new Error('Official ASAS eagle group visibility correction missing');
console.log('PASS country name contrast, polished search, white sign-up chevrons and complete ASAS shield size');

const interestsHtml=readFileSync('docs/interests.html','utf8');
const homeHtml=readFileSync('docs/home.html','utf8');
const homeStyles=readFileSync('docs/home-elegance.css','utf8');
if(interestsHtml.includes('<span class="check">✓</span>'))throw new Error('Redundant interest selection circles must remain removed');
if(!interestsHtml.includes("selected.has(id)?' selected':''"))throw new Error('Selected interest card highlighting must remain active');
if(!homeHtml.includes('home-elegance.css')||!homeHtml.includes('homeEditorialKicker')||!homeHtml.includes('HOME_EDITORIAL'))throw new Error('Home editorial refinement or localization missing');
if(!homeStyles.includes('.flash-visual,.soft-visual,.map-visual')||!homeStyles.includes('background-image:none!important'))throw new Error('Home fallback cards must not mix pink and burgundy backgrounds');
const exactLogo=readFileSync('docs/assets/asas360_master_vector.svg','utf8');
const originalEagle=exactLogo.split('transform="matrix(1 0 0 -1 401.3701 213.82483)" d="')[1]?.split('"')[0];
const originalShield=exactLogo.split('transform="matrix(1 0 0 -1 400.2676 278.33753)" d="')[1]?.split('"')[0];
if(originalEagle?.length!==3739||originalShield?.length!==872)throw new Error('ASAS original Illustrator eagle or shield vector was truncated');
console.log('PASS card selection clarity, Home scoped elegance, and original ASAS Illustrator vector geometry');

/* UI regression coverage: unique category icons and unboxed favourites. */
const glyphSource=readFileSync('docs/mira-category-glyphs.js','utf8');
const shapesJSON=glyphSource.split('const shapes=')[1]?.split(';\nwindow.MIRACategoryIcon')[0];
if(!shapesJSON)throw new Error('MIRA category icon library missing');
const glyphs=JSON.parse(shapesJSON);
const taxonomySource=readFileSync('docs/taxonomy.js','utf8');
const taxonomySlugs=[...taxonomySource.matchAll(/^  \{slug:'([^']+)'/gm)].map(x=>x[1]);
if(taxonomySlugs.length!==18||taxonomySlugs.some(slug=>!glyphs[slug])||new Set(Object.values(glyphs)).size!==18)
  throw new Error('Each of 18 top-level categories must have a distinct icon');
for(const page of ['home','categories','interests','category']){
 const html=readFileSync('docs/'+page+'.html','utf8');
 if(!html.includes('mira-category-glyphs.js')||!html.includes('window.MIRACategoryIcon('))
   throw new Error(page+' must use the shared unique icons');
}
const heartCSS=readFileSync('docs/mira-favorite-heart.css','utf8');
const heartScript=readFileSync('docs/mira-favorites.js','utf8');
if(!heartCSS.includes('background:transparent!important')||!heartCSS.includes('stroke:#FFFFFF!important')||!heartCSS.includes('stroke:#FC618F!important'))
  throw new Error('Favourite hearts must be unboxed, white then pink');
if(!heartCSS.includes('top:13px!important')||!heartCSS.includes('bottom:auto!important'))
  throw new Error('Favourite button must not be clipped at offer corner');
if(!heartScript.includes('localStorage.setItem')||!heartScript.includes('mira-favorites-changed')||!heartScript.includes('is-saved'))
  throw new Error('Favourite save/unsave persistence must stay wired');
for(const page of ['home','store','offer','category','search','section']){
 if(!readFileSync('docs/'+page+'.html','utf8').includes('mira-favorite-heart.css'))
  throw new Error(page+' missing unboxed favourite styles');
}
if(!readFileSync('docs/offer.html','utf8').includes('<section class="hero"><button class="save" id="saveBtn"'))
  throw new Error('Offer favourite heart must be positioned over offer image');
const codeStyles=readFileSync('docs/mira-auth-v3.css','utf8');
if(!codeStyles.includes('body.mira-auth-v3 select#code')||!codeStyles.includes('%23FFFFFF'))
  throw new Error('Country calling-code selector arrow must be white');
console.log('PASS 18 unique icons, functional unboxed hearts, no clipped corner, and white calling-code arrows');
