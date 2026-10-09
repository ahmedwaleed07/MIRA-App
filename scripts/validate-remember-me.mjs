import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const cloudSource=readFileSync('docs/mira-cloud.js','utf8');
const read=file=>readFileSync('docs/'+file,'utf8');
function storage(){
 const m=new Map();
 return {
  getItem:k=>m.has(k)?m.get(k):null,
  setItem:(k,v)=>m.set(k,String(v)),
  removeItem:k=>m.delete(k),
  clear:()=>m.clear()
 };
}
const makeJWT=(exp=Math.floor(Date.now()/1000)+3600)=>{
 const encode=o=>Buffer.from(JSON.stringify(o)).toString('base64url');
 return encode({alg:'HS256'})+'.'+encode({role:'authenticated',sub:'test-customer',exp})+'.signature';
};
const validToken=makeJWT(),goodSession={access_token:validToken,refresh_token:'refresh-me',user:{id:'test-customer'},expires_at:Math.floor(Date.now()/1000)+3600};
const response=(status,data)=>({status,ok:status>=200&&status<300,text:async()=>JSON.stringify(data),json:async()=>data});
function browser(path,localStorage=storage(),sessionStorage=storage(),fetcher=async url=>{
 if(url.includes('/rest/v1/'))return response(200,[]);
 if(url.endsWith('/auth/v1/user'))return response(200,{id:'test-customer'});
 throw Error('Unexpected request: '+url);
}){
 const ctx={window:null,localStorage,sessionStorage,location:{pathname:'/MIRA-App/'+path},console,JSON,Math,Date,fetch:fetcher,
  atob:input=>Buffer.from(input,'base64').toString('binary'),escape:globalThis.escape,
  CustomEvent:class{},URL};
 ctx.window=ctx;
 vm.createContext(ctx);vm.runInContext(cloudSource,ctx,{filename:'mira-cloud.js'});
 return ctx;
}
const local=storage(),firstSession=storage();
const one=browser('signin.html',local,firstSession);
assert.equal(one.MiraCloud.rememberMe(),true,'Remember Me must default to enabled for MIRA customers');
one.MiraCloud.acceptSession(goodSession);
assert.ok(local.getItem('mira_customer_session'),'Remember Me must survive browser restarts');
assert.equal(firstSession.getItem('mira_customer_session'),null,'customer token should not be duplicated between stores');
const reopened=browser('home.html',local,storage());
assert.equal(reopened.MiraCloud.payload().sub,'test-customer');
assert.equal((await reopened.MiraCloud.getCurrentUser()).id,'test-customer');
console.log('PASS default Remember Me restores customer session after reopening on a new tab');

reopened.MiraCloud.setRememberMe(false);
assert.equal(local.getItem('mira_customer_remember_me'),'false');
assert.equal(local.getItem('mira_customer_session'),null,'unchecked Remember Me must remove browser-persistent token');
const inTab=storage();
inTab.setItem('mira_customer_session',reopened.sessionStorage.getItem('mira_customer_session'));
const refreshedTab=browser('orders.html',local,inTab);
assert.equal(refreshedTab.MiraCloud.payload().sub,'test-customer','session-only auth must survive page refresh/tab navigation');
const separateTab=browser('home.html',local,storage());
assert.equal(separateTab.MiraCloud.session,null,'session-only auth must not survive browser tab close');
console.log('PASS unchecked Remember Me uses tab-only storage without losing same-tab navigation');

refreshedTab.MiraCloud.setRememberMe(true);
assert.ok(local.getItem('mira_customer_session'),'re-enabling must migrate token to local storage');
assert.equal(inTab.getItem('mira_customer_session'),null);
const again=browser('notifications.html',local,storage());
assert.equal(again.MiraCloud.payload().sub,'test-customer');
again.MiraCloud.signOut();
assert.equal(local.getItem('mira_customer_session'),null,'sign out clears persistent token');
assert.equal(again.sessionStorage.getItem('mira_customer_session'),null,'sign out clears tab-only token');
assert.equal(local.getItem('mira_customer_remember_me'),'true','sign out should keep preference');
console.log('PASS changing Remember Me storage and signing out clears credentials from both stores');

const ls=storage(),ss=storage();
ls.setItem('mira_customer_remember_me','false');
ls.setItem('mira_customer_session',JSON.stringify(goodSession));
const noRemember=browser('signin.html',ls,ss);
assert.equal(noRemember.MiraCloud.session,null);
assert.equal(ls.getItem('mira_customer_session'),null,'opting out must reject any old remembered token');
console.log('PASS stale persistent sessions are not restored when customer opts out');

const mLocal=storage(),merchant=browser('business.html',mLocal,storage());
assert.equal(merchant.MiraCloud.rememberMe(),true);
merchant.MiraCloud.setRememberMe(false);
assert.equal(mLocal.getItem('mira_merchant_remember_me'),'false');
assert.equal(mLocal.getItem('mira_customer_remember_me'),null);
const admin=browser('admin.html',mLocal,storage());
admin.MiraCloud.setRememberMe(false);
assert.equal(admin.MiraCloud.rememberMe(),true,'Admin login storage behavior must remain unchanged');
console.log('PASS existing merchant Remember Me and Admin sessions remain separate from customer settings');

let refreshCount=0;
const concurrent=browser('signin.html',storage(),storage(),async url=>{
 if(url.includes('/rest/v1/'))return response(200,[]);
 if(url.includes('grant_type=refresh_token')){refreshCount++;await Promise.resolve();return response(200,goodSession)}
 if(url.endsWith('/auth/v1/user'))return response(200,{id:'test-customer'});
 throw Error('Unexpected network request '+url);
});
concurrent.MiraCloud.acceptSession({...goodSession,access_token:makeJWT(Math.floor(Date.now()/1000)+35)});
const verified=async()=>{await concurrent.MiraCloud.ensureFreshSession();return concurrent.MiraCloud.getCurrentUser()};
const [customer1,customer2]=await Promise.all([verified(),verified()]);
assert.equal(customer1.id,'test-customer');
assert.equal(customer2.id,'test-customer');
assert.equal(refreshCount,1,'concurrent session users must share one refresh-token exchange');
assert.equal(concurrent.MiraCloud.payload().sub,'test-customer');
console.log('PASS concurrent session checks rotate refresh tokens only once and retain the customer login');


{
 const shared=storage(),first=storage(),second=storage();
 const expired={...goodSession,access_token:makeJWT(Math.floor(Date.now()/1000)-50),refresh_token:'before-rotation'};
 shared.setItem('mira_customer_session',JSON.stringify(expired));
 let exchanges=0;const trace=[];
 const rotated={...goodSession,refresh_token:'after-rotation'};
 const fetcher=async url=>{
  if(url.includes('/rest/v1/'))return response(200,[]);
  if(url.includes('grant_type=refresh_token')){exchanges++;trace.push('api refresh:'+exchanges);await Promise.resolve();return response(200,rotated)}
  if(url.endsWith('/auth/v1/user'))return response(200,{id:'test-customer'});
  throw Error('Unexpected '+url);
 };
 const a=browser('home.html',shared,first,fetcher);
 const b=browser('notifications.html',shared,second,fetcher);
 let last=Promise.resolve();
 const locks={request:(name,settings,handler)=>{
  assert.ok(name.includes('mira_customer_session'),'customer locks must be account-scoped');
  trace.push('queue '+name);
  const result=last.then(async()=>{trace.push('lock start');const r=await handler();trace.push('lock end');return r});
  last=result.then(()=>{},()=>{});
  return result;
 }};
 a.navigator={locks};b.navigator={locks};
 await Promise.all([a.MiraCloud.ensureFreshSession(),b.MiraCloud.ensureFreshSession()]);
 assert.equal(exchanges,1,'two tabs must share one Supabase refresh-token rotation: '+JSON.stringify({trace,stored:JSON.parse(shared.getItem('mira_customer_session'))?.refresh_token,first:a.MiraCloud.session?.refresh_token,second:b.MiraCloud.session?.refresh_token,navA:vm.runInContext('typeof navigator',a),navB:vm.runInContext('typeof navigator',b),lockA:vm.runInContext('typeof navigator.locks?.request',a),rememberA:a.MiraCloud.rememberMe(),rememberB:b.MiraCloud.rememberMe(),keyA:a.MiraCloud.sessionKey()}));
 assert.equal(a.MiraCloud.session.refresh_token,'after-rotation');
 assert.equal(b.MiraCloud.session.refresh_token,'after-rotation');
 assert.equal(JSON.parse(shared.getItem('mira_customer_session')).refresh_token,'after-rotation');
 console.log('PASS Web Locks serialize token renewal across two open MIRA customer tabs');
}
{
 const shared=storage(),expired={...goodSession,access_token:makeJWT(Math.floor(Date.now()/1000)-70),refresh_token:'stale'};
 shared.setItem('mira_customer_session',JSON.stringify(expired));
 let failedResolve;
 const blocked=new Promise(resolve=>{failedResolve=resolve});
 const loser=browser('home.html',shared,storage(),async url=>{
  if(url.includes('/rest/v1/'))return response(200,[]);
  if(url.includes('grant_type=refresh_token')){await blocked;return response(400,{msg:'refresh token already used'})}
  throw Error('Unexpected '+url);
 });
 const winner=browser('checkout.html',shared,storage(),async url=>{
  if(url.includes('/rest/v1/'))return response(200,[]);
  if(url.includes('grant_type=refresh_token'))return response(200,{...goodSession,refresh_token:'fresh-token'});
  throw Error('Unexpected '+url);
 });
 const pending=loser.MiraCloud.ensureFreshSession();
 await Promise.resolve();
 await winner.MiraCloud.ensureFreshSession();
 failedResolve();
 await pending;
 assert.equal(loser.MiraCloud.session.refresh_token,'fresh-token');
 assert.ok(shared.getItem('mira_customer_session'),'stale refresh denial must never erase another tabs newer login');
 console.log('PASS rejected stale refresh safely adopts a newer remembered session without logging out');
}
{
 const index=read('index.html'),welcome=read('welcome.html');
 assert.ok(index.includes('mira-cloud.js')&&index.includes("location.replace('home.html')"),'MIRA launcher must skip repeated login when a valid local session exists');
 assert.ok(welcome.includes('mira-cloud.js')&&welcome.includes("location.replace('home.html')"),'bookmarked welcome should open Home for returning customers');
 const persisted=storage();
 persisted.setItem('mira_customer_session',JSON.stringify(goodSession));
 const visit=browser('index.html',persisted,storage());
 visit.location.replace=dest=>{visit.location.redirectedTo=dest};
 const embedded=[...index.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(x=>x[1]).filter(Boolean).at(-1);
 vm.runInContext(embedded,visit,{filename:'index.html'});
 assert.equal(visit.location.redirectedTo,'home.html');
 const guest=browser('index.html',storage(),storage());
 guest.location.replace=dest=>{guest.location.redirectedTo=dest};
 vm.runInContext(embedded,guest,{filename:'index.html'});
 assert.ok(guest.location.redirectedTo.startsWith('welcome.html?lang='));
 console.log('PASS MIRA launcher opens Home for remembered customers and welcome for guests');
}

for(const page of ['signin','signup']){
 const html=read(page+'.html');
 assert.ok(html.includes('id="customerRememberMe" checked'),page+' missing default checked toggle');
 assert.ok(html.includes('mira-customer-remember.css?v='),page+' missing branded checkbox style');
 assert.ok(html.includes('customerRememberMe.addEventListener('),page+' must save toggled preference');
 for(const translated of ['Remember Me','تذكرني','Recordarme','Запомнить меня','Beni hatırla'])
  assert.ok(html.includes(translated),page+' missing localization '+translated);
 assert.ok(html.includes('mira-cloud.js?v=20261009-customer-remember-2'),page+' must not use stale session implementation');
}
const profile=read('profile.html');
assert.ok(profile.includes('customerSignOutBtn')&&profile.includes('MiraCloud.signOut()'),'remembered accounts require sign out');
const css=read('mira-customer-remember.css');
const palette=new Set((css.match(/#[\da-f]{6}/gi)||[]).map(c=>c.toUpperCase()));
for(const color of palette)assert.ok(['#800020','#FC618F','#FFFFFF'].includes(color),'unknown MIRA brand color: '+color);
console.log('PASS shopper UI localizations, sign out and three-color identity are unchanged');
