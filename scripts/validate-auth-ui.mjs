import {readFileSync} from 'node:fs';
const read=(name)=>readFileSync('docs/'+name+'.html','utf8');
const files=['welcome','signin','signup','otp'];
for(const name of files){
 const html=read(name);
 for(const asset of ['mira-auth-v3.css','assets/mira_icon.svg','assets/mira_wordmark.svg','assets/asas360_master_vector.svg']){
  if(!html.includes(asset))throw new Error(name+' missing '+asset);
 }
 console.log('PASS '+name+' linked to responsive layout and repository branding');
}
const otp=read('otp');
const inputs=(otp.match(/<input maxlength="(?:1|6)" inputmode="numeric"/g)||[]).length;
if(inputs!==6)throw new Error('Expected exactly 6 OTP fields, found '+inputs);
if(!otp.includes('if(c.length!==6)')||!otp.includes('MiraCloud.verifyOtp'))throw new Error('OTP verification handler missing');
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
