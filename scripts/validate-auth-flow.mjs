import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const read=path=>readFileSync(path,'utf8');
const helper=read('docs/mira-auth-flow.js');
const cloud=read('docs/mira-cloud.js');
const htmlPages=['welcome','signin','signup','otp','auth-callback'];
for(const page of htmlPages){
 const html=read('docs/'+page+'.html');
 for(const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)){
  if(match[1].trim())new vm.Script(match[1],{filename:page+'.html'});
 }
}
console.log('PASS all entry/callback inline scripts parse as JavaScript');

function storage(){
 const map=new Map();
 return {
  getItem:key=>map.has(key)?map.get(key):null,
  setItem:(key,val)=>map.set(key,String(val)),
  removeItem:key=>map.delete(key),
  clear:()=>map.clear()
 };
}
function makeJWT(exp=Math.floor(Date.now()/1000)+3600,role='authenticated',sub='member-1'){
 const encode=o=>Buffer.from(JSON.stringify(o)).toString('base64url');
 return encode({alg:'HS256',typ:'JWT'})+'.'+encode({role,sub,exp})+'.signature';
}
function response(status,body){return {ok:status>=200&&status<300,status,json:async()=>body,text:async()=>JSON.stringify(body)}}
function fakeContext(fetcher=async url=>{
 if(url.includes('/rest/v1'))return response(200,[]);
 if(url.endsWith('/auth/v1/user'))return response(200,{id:'member-1'});
 return response(400,{error:'unsupported test endpoint'});
},url='https://ahmedwaleed07.github.io/MIRA-App/signin.html'){
 const ls=storage(),ss=storage();
 const loc=new URL(url);
 loc.replace=function(destination){this.lastRedirect=destination};
 const ctx={window:null,localStorage:ls,sessionStorage:ss,location:loc,fetch:fetcher,URL,URLSearchParams,Date,JSON,Math,console,
  atob:value=>Buffer.from(value,'base64').toString('binary'),escape:globalThis.escape,
  CustomEvent:class CustomEvent{constructor(type,options){this.type=type;this.detail=options?.detail}}
 };
 ctx.window=ctx;
 vm.createContext(ctx);
 vm.runInContext(cloud,ctx,{filename:'mira-cloud.js'});
 vm.runInContext(helper,ctx,{filename:'mira-auth-flow.js'});
 return ctx;
}
const current=makeJWT();
const fresh={access_token:current,refresh_token:'refresh-good',user:{id:'member-1'},expires_at:Math.floor(Date.now()/1000)+3600};
function plain(x){return JSON.parse(JSON.stringify(x))}
{
 const c=fakeContext(),h=c.MiraAuthFlow;
 assert.equal(h.safeReturn('checkout.html?from=cart'),'checkout.html?from=cart');
 assert.equal(h.safeReturn('/MIRA-App/orders.html'),'orders.html');
 for(const unsafe of ['https://evil.example/checkout.html','//evil.example/checkout.html','javascript:alert(1)','../admin.html','admin.html','business.html','https://ahmedwaleed07.github.io/other/checkout.html','%2e%2e/checkout.html',String.fromCharCode(92)+'checkout.html'])
  assert.equal(h.safeReturn(unsafe),'home.html',unsafe);
 assert.equal(h.validEmail('  User@Example.COM '),'user@example.com');
 assert.equal(h.validEmail('not-an-email'),'');
 assert.equal(h.normalizePhone('+964','0770 123 4567'),'+9647701234567');
 assert.equal(h.normalizePhone('+1','555-0100'),'');
 assert.equal(h.normalizePhone('+000','7000000000'),'');
 h.setReturn('checkout.html');
 assert.equal(h.getReturn(),'checkout.html');
 const pending=h.setPending({via:'phone',mode:'signup',target:'+9647701234567',profile:{full_name:'Test'}});
 assert.equal(h.getPending().createdAt,pending.createdAt);
 assert.equal(h.getPending().target,'+9647701234567');
 assert.equal(h.finish('', 'market.html'),'checkout.html');
 assert.equal(h.getPending(),null);
 assert.equal(c.localStorage.getItem('mira_auth_return'),null);
 c.sessionStorage.setItem('mira_pending_otp',JSON.stringify({...pending,createdAt:Date.now()-20*60*1000}));
 assert.equal(h.getPending(),null);
 console.log('PASS validated email/E164 phone, safe same-app returns, pending OTP expiry, state cleanup');
}
{
 const calls=[];
 const c=fakeContext(async (url,options={})=>{
  calls.push({url,options});
  if(url.includes('/rest/v1'))return response(200,[]);
  if(url.endsWith('/auth/v1/otp'))return response(200,{});
  if(url.endsWith('/auth/v1/verify'))return response(200,fresh);
  if(url.endsWith('/auth/v1/user'))return response(200,{id:'member-1'});
  throw Error('Unexpected endpoint '+url);
 });
 await c.MiraCloud.startOtp({phone:'+9647701234567',createUser:true,data:{full_name:'Test'}});
 const otpRequest=calls.find(x=>x.url.endsWith('/auth/v1/otp'));
 assert.equal(JSON.parse(otpRequest.options.body).create_user,true);
 assert.equal(JSON.parse(otpRequest.options.body).phone,'+9647701234567');
 await c.MiraCloud.verifyOtp({phone:'+9647701234567',token:'123456'});
 const verifyRequest=calls.find(x=>x.url.endsWith('/auth/v1/verify'));
 assert.deepEqual(plain(JSON.parse(verifyRequest.options.body)),{phone:'+9647701234567',token:'123456',type:'sms'});
 assert.equal(c.MiraCloud.session.user.id,'member-1');
 assert.ok(c.localStorage.getItem('mira_customer_session'));
 assert.equal((await c.MiraAuthFlow.getVerifiedCustomer()).id,'member-1');
 console.log('PASS mocked Supabase SMS send, six-digit verification, persisted customer session and remote identity check');
}
{
 const expired={...fresh,access_token:makeJWT(Math.floor(Date.now()/1000)-100)};
 let refreshCount=0,authCheckCount=0;
 const c=fakeContext(async (url,options={})=>{
  if(url.includes('/rest/v1'))return response(200,[]);
  if(url.includes('grant_type=refresh_token')){refreshCount++;return response(200,fresh)}
  if(url.endsWith('/auth/v1/user')){authCheckCount++;return response(200,{id:'member-1'})}
  throw Error('Unexpected endpoint '+url);
 });
 c.MiraCloud.session=expired;c.MiraCloud.saveSession();
 const user=await c.MiraAuthFlow.getVerifiedCustomer();
 assert.equal(user.id,'member-1');
 assert.equal(refreshCount,1);
 assert.equal(authCheckCount,1);
 assert.equal(c.MiraCloud.session.access_token,current);
 console.log('PASS expired session silently refreshed once before revalidating the customer');
}
{
 const c=fakeContext(async url=>{
  if(url.includes('/rest/v1'))return response(200,[]);
  if(url.endsWith('/auth/v1/user'))return response(401,{msg:'revoked'});
  throw Error('Unexpected '+url);
 });
 c.MiraCloud.session=fresh;c.MiraCloud.saveSession();
 assert.equal(await c.MiraAuthFlow.getVerifiedCustomer(),null);
 assert.equal(c.localStorage.getItem('mira_customer_session'),null);
 console.log('PASS server-revoked customer session is cleared rather than trusted');
}
{
 const c=fakeContext(async url=>{
  if(url.includes('/rest/v1'))return response(200,[]);
  if(url.endsWith('/auth/v1/verify'))return response(400,{msg:'Invalid token'});
  throw Error('Unexpected '+url);
 });
 await assert.rejects(c.MiraCloud.verifyOtp({phone:'+9647701234567',token:'000000'}));
 assert.equal(c.localStorage.getItem('mira_customer_session'),null);
 console.log('PASS invalid OTP never creates a persisted login');
}
const signin=read('docs/signin.html'),signup=read('docs/signup.html'),otp=read('docs/otp.html'),callback=read('docs/auth-callback.html');
for(const [page,html] of [['signin',signin],['signup',signup],['otp',otp],['callback',callback]]){
 assert.ok(html.includes('mira-auth-flow.js'),page+' must load guarded auth flow');
}
assert.ok(signin.indexOf('await MiraCloud.startOtp(')<signin.indexOf('MiraAuthFlow.setPending('));
assert.ok(signup.indexOf('await MiraCloud.startOtp(')<signup.indexOf('MiraAuthFlow.setPending('));
assert.equal((otp.match(/<input maxlength="(?:1|6)" inputmode="numeric"/g)||[]).length,6);
assert.ok(otp.includes("if(c.length!==6"));
assert.ok(otp.includes("Date.now()-lastResendAt")||otp.includes("now-lastResendAt"));
assert.ok(callback.includes('MiraAuthFlow.safeReturn('));
assert.ok(callback.includes("location.replace(destination)"));
assert.ok(callback.includes("history.replaceState(null,'',location.pathname)"));
console.log('PASS flow wiring, OTP state only after send, six-digit UI, resend rate guard and sanitized email callback');
for(const protectedPage of ['checkout','orders']){
 const html=read('docs/'+protectedPage+'.html');
 assert.ok(html.includes('mira-auth-flow.js'),protectedPage+' must load shared guarded auth flow');
 assert.ok(html.includes('await MiraAuthFlow.getVerifiedCustomer()'),protectedPage+' must verify stored session remotely');
 assert.ok(html.includes("MiraAuthFlow.setReturn('"+protectedPage+".html')"),protectedPage+' must preserve deep-link destination');
}
console.log('PASS orders/checkout reject guest sessions and recover requested destination');



async function simulateCallback(path,responseHandler){
 const c=fakeContext(responseHandler,path);
 c.history={replaceState:()=>{c.history.cleared=true}};
 c.msg={textContent:''};
 const html=read('docs/auth-callback.html');
 const source=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(x=>x[1]).filter(Boolean).at(-1);
 vm.runInContext(source,c,{filename:'auth-callback-inline.js'});
 await new Promise(resolve=>setImmediate(resolve));
 return c;
}
{
 const path='https://ahmedwaleed07.github.io/MIRA-App/auth-callback.html?next=orders.html#access_token='+encodeURIComponent(current)+'&refresh_token=refresh-good&expires_in=3600';
 const c=await simulateCallback(path,async url=>{
  if(url.includes('/rest/v1'))return response(200,[]);
  if(url.endsWith('/auth/v1/user'))return response(200,{id:'member-1'});
  throw Error('Unexpected endpoint '+url);
 });
 assert.equal(c.location.lastRedirect,'orders.html');
 assert.equal(c.history.cleared,true);
 assert.ok(c.localStorage.getItem('mira_customer_session'));
 console.log('PASS email fragment link verifies Supabase identity, clears browser tokens and returns to requested MIRA page');
}
{
 const url='https://ahmedwaleed07.github.io/MIRA-App/auth-callback.html?next=https%3A%2F%2Fevil.example%2Fsteal&token_hash=valid-hash&type=magiclink';
 let request=null;
 const c=await simulateCallback(url,async (path,options={})=>{
  if(path.includes('/rest/v1'))return response(200,[]);
  if(path.endsWith('/auth/v1/verify')){request=options;return response(200,fresh)}
  if(path.endsWith('/auth/v1/user'))return response(200,{id:'member-1'});
  throw Error('Unexpected endpoint '+path);
 });
 assert.deepEqual(plain(JSON.parse(request.body)),{token_hash:'valid-hash',type:'magiclink'});
 assert.equal(c.location.lastRedirect,'home.html');
 assert.equal(c.history.cleared,true);
 console.log('PASS hashed email link verifies and unsafe external return destinations are blocked');
}
{
 const path='https://ahmedwaleed07.github.io/MIRA-App/auth-callback.html?token_hash=invalid&type=magiclink';
 const c=await simulateCallback(path,async url=>{
  if(url.includes('/rest/v1'))return response(200,[]);
  if(url.endsWith('/auth/v1/verify'))return response(403,{msg:'Expired'});
  throw Error('Unexpected endpoint '+url);
 });
 assert.equal(c.location.lastRedirect,undefined);
 assert.equal(c.localStorage.getItem('mira_customer_session'),null);
 assert.ok(c.msg.textContent.includes('request a new'));
 console.log('PASS expired magic links display an error without creating a login session');
}
