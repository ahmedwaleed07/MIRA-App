import {readFileSync} from 'node:fs';
const read=(name)=>readFileSync('docs/'+name+'.html','utf8');
const files=['welcome','signin','signup','otp'];
for(const name of files){
 const html=read(name);
 for(const asset of ['mira-auth-v3.css','assets/mira_icon.svg','assets/mira_wordmark.svg','assets/asas_footer.svg']){
  if(!html.includes(asset))throw new Error(name+' missing '+asset);
 }
 console.log('PASS '+name+' linked to responsive layout and repository branding');
}
const otp=read('otp');
const inputs=(otp.match(/<input maxlength="1" inputmode="numeric"/g)||[]).length;
if(inputs!==6)throw new Error('Expected exactly 6 OTP fields, found '+inputs);
if(!otp.includes('if(c.length!==6)')||!otp.includes('MiraCloud.verifyOtp'))throw new Error('OTP verification handler missing');
for(const target of ['signin.html','signup.html','market.html'])if(!read('welcome').includes('href="'+target+'"'))throw new Error('Welcome target missing: '+target);
console.log('PASS six OTP fields, live verification, and welcome actions');
