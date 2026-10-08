import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source=readFileSync('docs/mira-cloud.js','utf8');
const html=readFileSync('docs/business.html','utf8');
const assert=(condition,message)=>{if(!condition)throw Error(message)};
const makeStorage=(map=new Map())=>({
  getItem:(key)=>map.has(key)?map.get(key):null,
  setItem:(key,value)=>map.set(key,String(value)),
  removeItem:(key)=>map.delete(key),
});
const sharedLocal=makeStorage(),sharedTab=makeStorage();
const jwt=(exp)=>'header.'+Buffer.from(JSON.stringify({
  sub:'merchant-test',role:'authenticated',exp
})).toString('base64url')+'.signature';
let refreshResult={ok:true,status:200};
function environment(path,local=sharedLocal,tab=sharedTab){
  const win={MIRA_TAXONOMY:[],addEventListener:()=>{},dispatchEvent:()=>{}};
  const mockFetch=async(url,options={})=>{
    if(url.includes('grant_type=password'))return {ok:true,status:200,
      json:async()=>({access_token:jwt(Math.floor(Date.now()/1000)+3600),
        refresh_token:'refresh-test',user:{id:'merchant-test',email:'merchant@example.test'}})};
    if(url.includes('grant_type=refresh_token'))return {...refreshResult,
      text:async()=>'',json:async()=>({access_token:jwt(Math.floor(Date.now()/1000)+3600),
        refresh_token:'refresh-next',user:{id:'merchant-test',email:'merchant@example.test'}})};
    return {ok:true,status:200,text:async()=> '[]'};
  };
  vm.runInNewContext(source,{
    window:win,location:{pathname:path},localStorage:local,sessionStorage:tab,
    fetch:mockFetch,console,Date,JSON,decodeURIComponent,
    atob:(input)=>Buffer.from(input,'base64').toString('binary'),
    escape:globalThis.escape,
  });
  return win.MiraCloud;
}
async function run(){
  let merchant=environment('/MIRA-App/business.html');
  assert(merchant.rememberMe()===true,'Remember Me should be enabled by default');
  await merchant.signIn('merchant@example.test','password-test');
  assert(!!sharedLocal.getItem('mira_merchant_session'),'remembered login must use localStorage');
  assert(!sharedTab.getItem('mira_merchant_session'),'remembered login must not use sessionStorage');
  merchant=environment('/MIRA-App/business.html');
  assert(!!merchant.session?.access_token,'refresh should restore remembered login');
  console.log('PASS merchant remembered session survives reload');

  merchant.setRememberMe(false);
  assert(sharedLocal.getItem('mira_merchant_remember_me')==='false','remember selection should persist');
  assert(!sharedLocal.getItem('mira_merchant_session'),'unchecked mode must not persist session');
  assert(!!sharedTab.getItem('mira_merchant_session'),'unchecked mode should survive refresh in tab');
  merchant=environment('/MIRA-App/business.html');
  assert(!!merchant.session?.access_token,'session-only login must survive refresh');
  const anotherTab=environment('/MIRA-App/business.html',sharedLocal,makeStorage());
  assert(!anotherTab.session,'session-only login must not follow a new tab');
  console.log('PASS unchecked Remember Me uses tab-scoped storage');

  merchant.setRememberMe(true);
  assert(!!sharedLocal.getItem('mira_merchant_session'),'rechecking should restore persistent storage');
  assert(!sharedTab.getItem('mira_merchant_session'),'rechecking should clear tab copy');
  await merchant.refreshSession();
  assert(JSON.parse(sharedLocal.getItem('mira_merchant_session')).refresh_token==='refresh-next','refreshed token must persist');
  console.log('PASS refreshed credentials are stored in selected scope');

  refreshResult={ok:false,status:503};
  await merchant.refreshSession().then(()=>{throw Error('outage must fail')},()=>{});
  assert(!!sharedLocal.getItem('mira_merchant_session'),'transient server failure must not forget login');
  refreshResult={ok:false,status:401};
  await merchant.refreshSession().then(()=>{throw Error('unauthorized refresh must fail')},()=>{});
  assert(!merchant.session&&!sharedLocal.getItem('mira_merchant_session'),'invalid refresh token must clear login');
  refreshResult={ok:true,status:200};
  await merchant.signIn('merchant@example.test','password-test');
  merchant.signOut();
  assert(!sharedLocal.getItem('mira_merchant_session')&&!sharedTab.getItem('mira_merchant_session'),'Sign Out must remove both stores');
  console.log('PASS outages preserve login; invalid tokens and Sign Out clear it');

  const admin=environment('/MIRA-App/admin.html');
  await admin.signIn('admin@example.test','password-test');
  assert(!!sharedLocal.getItem('mira_admin_session'),'admin storage behavior must remain unchanged');
  admin.signOut();
  console.log('PASS Admin session storage remains unaffected');

  assert(html.includes('id="rememberMe" type="checkbox" checked'),'missing default-checked login control');
  assert(html.includes('MiraCloud.setRememberMe(rememberMe.checked)'),'login control not wired');
  assert(html.includes('await MiraCloud.ensureFreshSession()'),'reload must refresh expired credentials');
  assert(html.includes('restoreMerchantSession();'),'reload restore not invoked');
  assert(html.includes('mira-cloud.js?v=20261008-remember-1'),'merchant must request current session script');
  console.log('PASS Merchant login checkbox and reload wiring verified');
}
run().catch(e=>{console.error(e);process.exitCode=1});
